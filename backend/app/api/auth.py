"""Authentication API Endpoints (Register, Login, Google OAuth, Me, Password Reset, Guest Auth)."""

import uuid
import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr

from app.core.database import get_db
from app.core.security import get_password_hash, verify_password, create_access_token, decode_access_token
from app.core.config import settings
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["auth"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)


# ---------------------------------------------------------------------------
# Pydantic Schemas
# ---------------------------------------------------------------------------

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
    credential: str  # Real Google ID Token (JWT) — required for proper OAuth


class PasswordResetSchema(BaseModel):
    email: EmailStr
    new_password: str


# ---------------------------------------------------------------------------
# Google Token Verification
# ---------------------------------------------------------------------------

def verify_google_id_token(credential: str) -> dict:
    """
    Verifies a Google ID Token (JWT) using Google's public certificates.

    Returns the decoded payload dict on success, raises HTTPException on failure.
    Requires GOOGLE_CLIENT_ID to be set in the environment.
    """
    client_id = settings.GOOGLE_CLIENT_ID
    if not client_id:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "Google authentication is not configured on this server. "
                "Set GOOGLE_CLIENT_ID in the backend .env file."
            ),
        )

    try:
        from google.oauth2 import id_token
        from google.auth.transport import requests as google_requests

        request = google_requests.Request()
        payload = id_token.verify_oauth2_token(
            credential,
            request,
            client_id,
            clock_skew_in_seconds=10,  # Allow slight clock drift
        )

        # Verify issuer
        if payload.get("iss") not in ("accounts.google.com", "https://accounts.google.com"):
            raise ValueError("Invalid token issuer.")

        return payload

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid Google token: {str(exc)}",
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Google token verification failed: {str(exc)}",
        )


# ---------------------------------------------------------------------------
# Guest User Helper
# ---------------------------------------------------------------------------

def create_unique_guest_user(db: Session) -> User:
    """Creates a unique isolated guest user."""
    guest_suffix = str(uuid.uuid4())[:8]
    guest = User(
        email=f"guest_{guest_suffix}@chatgpt.platform",
        full_name="Guest User",
        auth_provider="guest",
    )
    db.add(guest)
    db.commit()
    db.refresh(guest)
    return guest


# ---------------------------------------------------------------------------
# Auth Dependency
# ---------------------------------------------------------------------------

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


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

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
        auth_provider="email",
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
            detail="Incorrect email or password",
        )

    token = create_access_token(subject=user.id)
    return {"access_token": token, "token_type": "bearer", "user": user}


@router.post("/google", response_model=TokenSchema)
def google_oauth(data: GoogleOAuthSchema, db: Session = Depends(get_db)):
    """
    Handles Google OAuth 2.0 sign-in.

    Expects a real Google ID Token (credential) from the Google Sign-In for Web SDK.
    The token is cryptographically verified against Google's public keys before any account
    creation or lookup occurs.
    """
    # Cryptographically verify the Google ID token — raises HTTPException on failure
    payload = verify_google_id_token(data.credential)

    email: str = payload.get("email", "")
    name: str = payload.get("name") or payload.get("given_name") or email.split("@")[0].capitalize()
    picture: Optional[str] = payload.get("picture")
    google_id: str = payload.get("sub", "")
    email_verified: bool = payload.get("email_verified", False)

    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google account does not have an associated email address.",
        )

    if not email_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google account email is not verified. Please verify your Google account first.",
        )

    # Look up or create user
    user = db.query(User).filter(User.email == email).first()
    if not user:
        # New user — create from Google profile
        user = User(
            email=email,
            full_name=name,
            avatar_url=picture,
            auth_provider="google",
            google_id=google_id,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        # Existing user — update profile with latest Google metadata
        updated = False
        if picture and user.avatar_url != picture:
            user.avatar_url = picture
            updated = True
        if name and (not user.full_name or user.full_name == "Guest User"):
            user.full_name = name
            updated = True
        if google_id and not user.google_id:
            user.google_id = google_id
            updated = True
        if user.auth_provider in ("guest", "email"):
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

