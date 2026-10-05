from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional, List
from pydantic import BaseModel
from app.database import get_db
from app import models, auth, crud
from app.services.dombivli_mapper import resolve_dombivli_zone
from app.ai.video_verification import verify_live_video_frame

router = APIRouter(prefix="/api/officer", tags=["Officer & NGO Dashboard"])

class AssignRequest(BaseModel):
    complaint_id: str
    volunteer_name: Optional[str] = None
    volunteer_id: Optional[int] = None
    instructions: Optional[str] = "Locate animal and provide rescue assistance."

class UpdateStatusRequest(BaseModel):
    complaint_id: str
    status: str # Searching, Not Found, Resolved, In Progress, Closed

class VideoFrameRequest(BaseModel):
    frame: str
    case_id: Optional[str] = None

@router.get("/complaints")
def get_officer_complaints(
    db: Session = Depends(get_db),
    current_user: dict = Depends(auth.require_role(["officer", "ngo_admin", "super_admin"]))
):
    """
    Retrieves real complaints from PostgreSQL database for officers and NGO admins,
    enriched with exact Dombivli zone spatial resolution.
    """
    complaints = db.query(models.Complaint).order_by(models.Complaint.created_at.desc()).all()
    result = []
    for c in complaints:
        zone_info = resolve_dombivli_zone(db, c.latitude, c.longitude)
        
        assigned_name = "Unassigned"
        if c.assigned_volunteer_id:
            vol = db.query(models.User).filter(models.User.id == c.assigned_volunteer_id).first()
            if vol:
                assigned_name = f"Volunteer {vol.full_name}"
        elif c.assigned_officer_id:
            off = db.query(models.User).filter(models.User.id == c.assigned_officer_id).first()
            if off:
                assigned_name = f"Officer {off.full_name}"

        result.append({
            "id": f"RN-{c.id}",
            "db_id": c.id,
            "tracking_code": c.tracking_code,
            "animal_type": c.confirmed_animal_type or c.detected_animal_type or "Dog",
            "status": c.status,
            "priority": c.priority,
            "priority_score": c.priority_score,
            "priority_reasoning": c.priority_reasoning,
            "assigned_to": assigned_name,
            "zone_name": zone_info["name"],
            "zone_code": zone_info["code"],
            "address": c.address,
            "latitude": c.latitude,
            "longitude": c.longitude,
            "search_radius_meters": c.search_radius_meters or 100.0,
            "created_at": str(c.created_at),
            "description": c.description,
            "image_url": c.photo_url,
            "is_sos": c.is_sos or False
        })
    return result

@router.get("/volunteers")
def get_volunteers(
    db: Session = Depends(get_db),
    current_user: dict = Depends(auth.require_role(["officer", "ngo_admin", "super_admin"]))
):
    """Retrieves real active volunteers registered in database."""
    volunteers = db.query(models.Volunteer).all()
    if not volunteers:
        user_vols = db.query(models.User).filter(models.User.role == "volunteer").all()
        return [
            {
                "id": u.id,
                "user_id": u.id,
                "name": u.full_name,
                "status": "Available",
                "current_zone": "Dombivli East — Manpada"
            }
            for u in user_vols
        ]
    return [
        {
            "id": v.id,
            "user_id": v.user_id,
            "name": v.name,
            "status": v.status,
            "current_zone": v.current_zone or "Dombivli East — Manpada",
            "skill_tags": v.skill_tags
        }
        for v in volunteers
    ]

@router.post("/assign")
def assign_volunteer(
    req: AssignRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(auth.require_role(["officer", "ngo_admin", "super_admin"]))
):
    """
    Assigns complaint to a volunteer and creates a real task in PostgreSQL database.
    """
    clean_id = req.complaint_id.replace("RN-", "")
    complaint = None
    if clean_id.isdigit():
        complaint = db.query(models.Complaint).filter(models.Complaint.id == int(clean_id)).first()
    if not complaint:
        complaint = db.query(models.Complaint).filter(models.Complaint.tracking_code == req.complaint_id).first()

    if not complaint:
        raise HTTPException(status_code=404, detail=f"Complaint '{req.complaint_id}' not found in database.")

    # Save officer assignment in complaint record
    complaint.assigned_officer_id = current_user["user_id"]
    if req.volunteer_id:
        complaint.assigned_volunteer_id = req.volunteer_id

    vol_name = req.volunteer_name or "Assigned Volunteer"
    if req.volunteer_id and not req.volunteer_name:
        v_user = db.query(models.User).filter(models.User.id == req.volunteer_id).first()
        if v_user:
            vol_name = v_user.full_name

    task = crud.create_volunteer_task(
        db,
        complaint_id=complaint.id,
        volunteer_id=req.volunteer_id,
        instructions=req.instructions or f"Assigned to {vol_name}"
    )

    db.commit()

    return {
        "success": True,
        "status": "Assigned",
        "assigned_to": vol_name,
        "complaint_id": f"RN-{complaint.id}",
        "task_id": task.task_code if task else None
    }

@router.post("/update-status")
def update_status(
    req: UpdateStatusRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(auth.require_role(["officer", "ngo_admin", "super_admin"]))
):
    """
    Updates complaint status in PostgreSQL database.
    Widens search radius by 2.5x if marked 'Not Found'.
    """
    clean_id = req.complaint_id.replace("RN-", "")
    complaint = None
    if clean_id.isdigit():
        complaint = db.query(models.Complaint).filter(models.Complaint.id == int(clean_id)).first()
    if not complaint:
        complaint = db.query(models.Complaint).filter(models.Complaint.tracking_code == req.complaint_id).first()

    if not complaint:
        raise HTTPException(status_code=404, detail=f"Complaint '{req.complaint_id}' not found in database.")

    complaint.status = req.status
    if req.status == "Not Found":
        complaint.search_radius_meters = round((complaint.search_radius_meters or 100.0) * 2.5, 1)
    
    db.commit()

    return {
        "success": True,
        "complaint_id": f"RN-{complaint.id}",
        "new_status": req.status,
        "updated_search_radius_meters": complaint.search_radius_meters
    }

@router.post("/verify-video")
def verify_video(
    req: VideoFrameRequest,
    current_user: dict = Depends(auth.require_role(["officer", "ngo_admin", "super_admin"]))
):
    """Real-Time On-Site Multimodal Live Video Verification Assistant."""
    res = verify_live_video_frame(req.frame, req.case_id)
    return res
