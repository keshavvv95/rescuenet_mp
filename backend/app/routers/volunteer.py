from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from app.database import get_db
from app import crud, auth, models

router = APIRouter(prefix="/api/volunteer", tags=["Volunteer Dashboard"])

class CompleteTaskRequest(BaseModel):
    task_id: str
    completion_photo: Optional[str] = None
    resolution_notes: Optional[str] = None

@router.get("/tasks")
def get_volunteer_tasks(
    db: Session = Depends(get_db),
    current_user: dict = Depends(auth.require_role(["volunteer", "officer", "ngo_admin", "super_admin"]))
):
    """Retrieves list of real active rescue tasks assigned to volunteer from database."""
    user_id = current_user["user_id"]
    user_role = current_user["role"]

    # Officers/NGO admins see all volunteer tasks; Volunteers see tasks assigned to them or unassigned
    if user_role in ["officer", "ngo_admin", "super_admin"]:
        tasks = crud.get_volunteer_tasks(db)
    else:
        tasks = crud.get_volunteer_tasks(db, volunteer_id=user_id)

    return [
        {
            "id": t.task_code,
            "case_id": f"RN-{t.complaint_id}",
            "animal_type": t.animal_type,
            "priority": t.priority,
            "address": t.address,
            "latitude": t.latitude,
            "longitude": t.longitude,
            "status": t.status,
            "assigned_at": str(t.assigned_at),
            "instructions": t.instructions or "Locate animal and provide rescue assistance."
        }
        for t in tasks
    ]

@router.post("/complete-task")
def complete_task(
    req: CompleteTaskRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(auth.require_role(["volunteer", "officer", "ngo_admin", "super_admin"]))
):
    """Marks volunteer task complete in database with resolution proof photo."""
    task = crud.complete_volunteer_task(db, req.task_id, req.completion_photo, req.resolution_notes)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found or already closed")
    return {"success": True, "task_id": task.task_code, "status": task.status}
