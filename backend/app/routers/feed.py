from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.database import get_db
from app import crud, schemas, auth

router = APIRouter(prefix="/api/feed", tags=["Area Live Community Feed"])

class CorroborateRequest(BaseModel):
    sighting_id: int

@router.get("/sightings")
def get_sightings(zone: Optional[str] = Query(None), db: Session = Depends(get_db)):
    """Returns real zone-scoped live stray animal sightings from database."""
    from app import models
    sightings = crud.get_zone_sightings(db, zone_code=zone)
    result = []
    for s in sightings:
        zone_label = "Live Incident"
        if s.zone_id:
            cz = db.query(models.CommunityZone).filter(models.CommunityZone.id == s.zone_id).first()
            if cz:
                zone_label = cz.zone_name

        priority = "ROUTINE"
        triage_score = None
        requires_human_review = False
        if s.complaint_id:
            comp = db.query(models.Complaint).filter(models.Complaint.id == s.complaint_id).first()
            if comp:
                priority = comp.priority or "ROUTINE"
                triage_score = comp.priority_score
                requires_human_review = bool(comp.requires_human_review)

        result.append({
            "id": s.id,
            "author_name": s.author_name or "Citizen Reporter",
            "animal_type": s.animal_type,
            "location": s.location,
            "zone": zone_label,
            "priority": priority,
            "triage_score": triage_score,
            "requires_human_review": requires_human_review,
            "sighting_time": str(s.created_at),
            "notes": s.notes,
            "corroboration_count": s.corroboration_count,
            "has_upvoted": False,
            "photo_url": s.photo_url
        })
    return result

@router.post("/sighting", status_code=status.HTTP_201_CREATED)
def create_sighting(
    req: schemas.SightingCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(auth.get_required_current_user)
):
    """Posts a new community stray animal sighting to database."""
    author_id = current_user["user_id"]
    author_name = current_user["full_name"]
    sighting = crud.create_sighting(db, req, author_id=author_id, author_name=author_name)
    return sighting

@router.post("/corroborate")
def corroborate_sighting(
    req: CorroborateRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(auth.get_required_current_user)
):
    """Corroborates / upvotes a real community sighting in database."""
    user_id = current_user["user_id"]
    res = crud.corroborate_sighting(db, sighting_id=req.sighting_id, user_id=user_id)
    if not res:
        return {"success": False, "new_count": 0, "has_upvoted": False}
    return res
