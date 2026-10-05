from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app import crud, auth

router = APIRouter(prefix="/api/notifications", tags=["In-App Notifications"])

@router.get("")
def get_notifications(
    db: Session = Depends(get_db),
    current_user: dict = Depends(auth.get_required_current_user)
):
    """Returns in-app notification feed from database for current user."""
    user_id = current_user["user_id"]
    notifications = crud.get_user_notifications(db, user_id=user_id)
    return [
        {
            "id": str(n.id),
            "title": n.title,
            "message": n.message,
            "type": n.type,
            "time": str(n.created_at),
            "read": n.is_read
        }
        for n in notifications
    ]

@router.post("/{notification_id}/read")
def mark_notification_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(auth.get_required_current_user)
):
    """Marks notification read in database for current authenticated user."""
    user_id = current_user["user_id"]
    n = crud.mark_notification_as_read(db, notification_id=notification_id, user_id=user_id)
    if not n:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"success": True, "id": notification_id, "read": True}
