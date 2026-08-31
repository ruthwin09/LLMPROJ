"""Authentication API Endpoints (Register, Login, Google OAuth, Me, Password Reset, Guest Auth)."""

import uuid
import json
import base64
import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr

from app.core.database import get_db
from app.core.security import get_password_hash, verify_password, create_access_token, decode_access_token
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["auth"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)


# Pydantic Schemas
class UserRegisterSchema(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None


class UserResponseSchema(BaseModel):
    id: str
    email: str
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    preferred_model: str
    auth_provider: str

    class Config:
        from_attributes = True


class TokenSchema(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponseSchema


class GoogleOAuthSchema(BaseModel):
    credential: Optional[str] = None
    email: Optional[EmailStr] = None
    name: Optional[str] = None
    picture: Optional[str] = None


class PasswordResetSchema(BaseModel):
    email: EmailStr
    new_password: str


def decode_google_credential(credential: str) -> dict:
    """Safely decodes Google OAuth ID token payload."""
    try:
        parts = credential.split(".")
        if len(parts) >= 2:
            payload_b64 = parts[1]
            # Add padding if needed
            rem = len(payload_b64) % 4
            if rem > 0:
                payload_b64 += "=" * (4 - rem)
            decoded_bytes = base64.urlsafe_b64decode(payload_b64)
            return json.loads(decoded_bytes.decode("utf-8"))
    except Exception:
        pass
    return {}


def create_unique_guest_user(db: Session) -> User:
    """Creates a unique isolated guest user."""
    guest_suffix = str(uuid.uuid4())[:8]
    guest = User(
        email=f"guest_{guest_suffix}@chatgpt.platform",
        full_name="Guest User",
        auth_provider="guest"
    )
    db.add(guest)
    db.commit()
    db.refresh(guest)
    return guest


def get_current_user(token: Optional[str] = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    """Dependency for resolving authenticated user with seamless private guest fallback."""
    if not token:
        return create_unique_guest_user(db)
    
    user_id = decode_access_token(token)
    if not user_id:
        return create_unique_guest_user(db)

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return create_unique_guest_user(db)
        
    return user


@router.post("/guest", response_model=TokenSchema)
def guest_auth(db: Session = Depends(get_db)):
    """Creates a fresh, isolated guest authentication token."""
    guest = create_unique_guest_user(db)
    token = create_access_token(subject=guest.id)
    return {"access_token": token, "token_type": "bearer", "user": guest}


@router.post("/register", response_model=TokenSchema)
def register(user_data: UserRegisterSchema, db: Session = Depends(get_db)):
    """Registers a new user account."""
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="User with this email already exists")

    hashed_pw = get_password_hash(user_data.password)
    new_user = User(
        email=user_data.email,
        hashed_password=hashed_pw,
        full_name=user_data.full_name or user_data.email.split("@")[0].capitalize(),
        auth_provider="email"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token = create_access_token(subject=new_user.id)
    return {"access_token": token, "token_type": "bearer", "user": new_user}


@router.post("/login", response_model=TokenSchema)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Authenticates user email and password."""
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not user.hashed_password or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )

    token = create_access_token(subject=user.id)
    return {"access_token": token, "token_type": "bearer", "user": user}


@router.post("/google", response_model=TokenSchema)
def google_oauth(data: GoogleOAuthSchema, db: Session = Depends(get_db)):
    """Handles Google OAuth authentication, token decoding, and account sync."""
    email = data.email
    name = data.name
    picture = data.picture
    google_id = None

    # If Google JWT ID token credential is provided, decode payload
    if data.credential:
        payload = decode_google_credential(data.credential)
        if payload:
            email = payload.get("email") or email
            name = payload.get("name") or payload.get("given_name") or name
            picture = payload.get("picture") or picture
            google_id = payload.get("sub")

    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Valid email address is required for Google authentication."
        )

    user = db.query(User).filter(User.email == email).first()
    if not user:
        user = User(
            email=email,
            full_name=name or email.split("@")[0].capitalize(),
            avatar_url=picture,
            auth_provider="google",
            google_id=google_id
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        # Update user profile with latest Google metadata if available
        updated = False
        if picture and (not user.avatar_url or user.avatar_url != picture):
            user.avatar_url = picture
            updated = True
        if name and (not user.full_name or user.full_name == "Guest User"):
            user.full_name = name
            updated = True
        if google_id and not user.google_id:
            user.google_id = google_id
            updated = True
        if user.auth_provider != "google" and user.auth_provider == "guest":
            user.auth_provider = "google"
            updated = True
        if updated:
            db.commit()
            db.refresh(user)

    token = create_access_token(subject=user.id)
    return {"access_token": token, "token_type": "bearer", "user": user}


@router.get("/me", response_model=UserResponseSchema)
def get_me(current_user: User = Depends(get_current_user)):
    """Returns currently authenticated user profile."""
    return current_user


@router.post("/password-reset")
def password_reset(data: PasswordResetSchema, db: Session = Depends(get_db)):
    """Resets user password."""
    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Account with this email does not exist")
    
    user.hashed_password = get_password_hash(data.new_password)
    db.commit()
    return {"message": "Password reset successfully. Please log in with your new password."}
