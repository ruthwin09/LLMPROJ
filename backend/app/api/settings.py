"""User Settings API Endpoints."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, Dict, Any

from app.core.database import get_db
from app.api.auth import get_current_user
from app.models.user import User
from app.services.llm_service import HOSTED_MODELS

router = APIRouter(prefix="/settings", tags=["settings"])


class UserSettingsUpdateSchema(BaseModel):
    full_name: Optional[str] = None
    preferred_model: Optional[str] = None
    user_api_key: Optional[str] = None


@router.get("/models")
def get_available_models():
    """Returns list of supported hosted models."""
    return HOSTED_MODELS


@router.put("/profile")
def update_profile(
    data: UserSettingsUpdateSchema,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Updates user profile settings and preferred model / API keys."""
    if data.full_name is not None:
        current_user.full_name = data.full_name
    if data.preferred_model is not None:
        current_user.preferred_model = data.preferred_model
    if data.user_api_key is not None:
        current_user.user_api_key = data.user_api_key

    db.commit()
    db.refresh(current_user)
    return {
        "message": "Settings updated successfully",
        "user": {
            "id": current_user.id,
            "email": current_user.email,
            "full_name": current_user.full_name,
            "preferred_model": current_user.preferred_model,
            "has_api_key": bool(current_user.user_api_key)
        }
    }
