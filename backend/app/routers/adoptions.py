from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel
from app.database import get_db
from app import schemas, crud, models, auth

router = APIRouter(prefix="/api/adoptions", tags=["Adoption & Fostering"])

class CreateAdoptionListingRequest(BaseModel):
    name: str
    species: str
    breed: Optional[str] = None
    age: Optional[str] = None
    gender: Optional[str] = None
    health_status: Optional[str] = None
    temperament_tags: Optional[str] = None
    description: Optional[str] = None
    photo_url: str

@router.get("")
def get_adoptions(db: Session = Depends(get_db)):
    """Returns active real adoption listings from database."""
    listings = crud.get_adoption_listings(db)
    result = []
    for l in listings:
        ngo_name = "Shelter Care Center"
        if l.ngo_id:
            ngo_user = db.query(models.User).filter(models.User.id == l.ngo_id).first()
            if ngo_user:
                ngo_name = ngo_user.full_name

        result.append({
            "id": l.id,
            "name": l.name,
            "species": l.species,
            "breed": l.breed or "Stray Mix",
            "age": l.age or "1 Year",
            "gender": l.gender or "Unknown",
            "health_status": l.health_status or "Vaccinated",
            "temperament_tags": [t.strip() for t in (l.temperament_tags or "Friendly,Rescue").split(",") if t.strip()],
            "ngo_name": ngo_name,
            "location": "Shelter Care Hub",
            "description": l.description or "Looking for a loving forever home!",
            "photo_url": l.photo_url
        })
    return result

@router.post("/create", status_code=status.HTTP_201_CREATED)
def create_listing(
    req: CreateAdoptionListingRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(auth.require_role(["ngo_admin", "officer", "super_admin"]))
):
    """Creates a new real adoption listing in database for authorized NGOs & officers."""
    ngo_id = current_user["user_id"]
    listing = models.AdoptionListing(
        ngo_id=ngo_id,
        name=req.name,
        species=req.species,
        breed=req.breed,
        age=req.age,
        gender=req.gender,
        health_status=req.health_status,
        temperament_tags=req.temperament_tags,
        description=req.description,
        photo_url=req.photo_url,
        is_active=True
    )
    db.add(listing)
    db.commit()
    db.refresh(listing)
    return listing

@router.post("/apply", status_code=status.HTTP_201_CREATED)
def apply_adoption(
    req: schemas.AdoptionApplyRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(auth.get_required_current_user)
):
    """Submits a real adoption application in database tied to authenticated applicant."""
    applicant_id = current_user["user_id"]
    app_obj = crud.create_adoption_application(db, req, applicant_id=applicant_id)
    return {
        "id": f"APP-{app_obj.id}",
        "animal_name": req.adoption_id,
        "applied_date": str(app_obj.created_at),
        "status": app_obj.status,
        "notes": app_obj.notes
    }

@router.get("/my-applications")
def get_my_applications(
    db: Session = Depends(get_db),
    current_user: dict = Depends(auth.get_required_current_user)
):
    """Retrieves authenticated user's real adoption applications from database."""
    applicant_id = current_user["user_id"]
    apps = db.query(models.AdoptionApplication).filter(models.AdoptionApplication.applicant_id == applicant_id).order_by(models.AdoptionApplication.created_at.desc()).all()
    return [
        {
            "id": f"APP-{a.id}",
            "animal_name": f"Listing #{a.listing_id}",
            "applied_date": str(a.created_at),
            "status": a.status,
            "notes": a.notes
        }
        for a in apps
    ]
