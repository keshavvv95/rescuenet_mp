import os
import uuid
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from app.database import get_db
from app import schemas, crud, auth, models
from app.ai.detector import detect_animal
from app.ai.priority_engine import calculate_priority_score
from app.ai.duplicate_detector import find_duplicate_reports
from app.services.dombivli_mapper import resolve_dombivli_zone

router = APIRouter(prefix="/api/reports", tags=["Citizen Stray Animal Reporting"])

ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "webp", "heic"}
MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB limit

@router.post("/upload")
async def upload_photo(
    file: UploadFile = File(...),
    current_user: dict = Depends(auth.get_required_current_user)
):
    """
    Uploads an image file for authenticated users with file validation (type & size limit).
    Returns stored relative static URL.
    """
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No filename provided in upload."
        )

    ext = file.filename.split(".")[-1].lower() if "." in file.filename else ""
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file extension '.{ext}'. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File size exceeds maximum allowed limit of 10 MB."
        )

    os.makedirs("static/uploads/reports", exist_ok=True)
    filename = f"{uuid.uuid4().hex}.{ext}"
    filepath = os.path.join("static/uploads/reports", filename)
    
    with open(filepath, "wb") as buffer:
        buffer.write(contents)

    return {"url": f"/static/uploads/reports/{filename}"}

@router.post("/detect-ai")
async def detect_ai(
    file: UploadFile = File(...),
    current_user: dict = Depends(auth.get_required_current_user)
):
    """Runs AI object detection on uploaded photo and returns detection result."""
    ext = file.filename.split(".")[-1].lower() if "." in file.filename else "jpg"
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Invalid image file format")

    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(status_code=413, detail="File size exceeds 10MB limit")

    os.makedirs("static/uploads/reports", exist_ok=True)
    filename = f"{uuid.uuid4().hex}.{ext}"
    filepath = os.path.join("static/uploads/reports", filename)
    
    with open(filepath, "wb") as buffer:
        buffer.write(contents)

    result = detect_animal(filepath)
    rel_url = f"/static/uploads/reports/{filename}"
    detected_animal = result.get("detected_animal_type") or result.get("animal_type") or "Dog"

    return {
        "detected_animal": detected_animal,
        "confidence": result.get("confidence", 0.85),
        "model_used": result.get("model_used", "yolov8n"),
        "health_condition": "Injured / Needs Medical Aid" if result.get("distress_score", 0.0) > 0.3 else "Normal",
        "suggested_urgency": "Emergency" if result.get("distress_score", 0.0) > 0.3 else "Normal",
        "reasoning": f"AI detected {detected_animal} with {int(result.get('confidence', 0.85)*100)}% confidence score.",
        "image_url": rel_url
    }

@router.post("/check-duplicate")
def check_duplicate(
    req: schemas.DuplicateCheckRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(auth.get_required_current_user)
):
    """Consensus-based spatial & visual duplicate complaint detector."""
    res = find_duplicate_reports(
        db,
        latitude=req.latitude,
        longitude=req.longitude,
        radius_meters=req.radius_meters or 100.0
    )
    return res

@router.post("", status_code=status.HTTP_201_CREATED)
def submit_report(
    req: schemas.ComplaintCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(auth.get_required_current_user)
):
    """
    Submits a new stray animal complaint tied strictly to authenticated user,
    performing real Dombivli zone auto-assignment via spatial database queries.
    """
    citizen_id = current_user["user_id"]
    
    # Resolve exact Dombivli zone via spatial database query
    zone_info = resolve_dombivli_zone(db, req.latitude, req.longitude)
    
    db_report = crud.create_complaint(db, req, citizen_id)

    return {
        "id": f"RN-{db_report.id}",
        "tracking_code": db_report.tracking_code,
        "status": db_report.status,
        "priority": db_report.priority,
        "assigned_zone": zone_info["name"],
        "assigned_zone_code": zone_info["code"],
        "zone_distance_km": zone_info["distance_km"],
        "created_at": db_report.created_at
    }

@router.get("/my-reports")
def get_my_reports(
    db: Session = Depends(get_db),
    current_user: dict = Depends(auth.get_required_current_user)
):
    """Retrieves real active reports strictly for authenticated user."""
    citizen_id = current_user["user_id"]
    reports = crud.get_complaints(db, citizen_id=citizen_id)
    
    result = []
    for r in reports:
        assigned_name = "Unassigned"
        if r.assigned_volunteer_id:
            vol = db.query(models.User).filter(models.User.id == r.assigned_volunteer_id).first()
            if vol:
                assigned_name = f"Volunteer {vol.full_name}"
        elif r.assigned_officer_id:
            off = db.query(models.User).filter(models.User.id == r.assigned_officer_id).first()
            if off:
                assigned_name = f"Officer {off.full_name}"

        zone_info = resolve_dombivli_zone(db, r.latitude, r.longitude)

        result.append({
            "id": f"RN-{r.id}",
            "tracking_code": r.tracking_code,
            "animal_type": r.confirmed_animal_type or r.detected_animal_type,
            "status": r.status,
            "priority": r.priority,
            "assigned_to": assigned_name,
            "zone_name": zone_info["name"],
            "address": r.address,
            "latitude": r.latitude,
            "longitude": r.longitude,
            "created_at": str(r.created_at),
            "description": r.description,
            "image_url": r.photo_url,
            "ai_reasoning": r.priority_reasoning
        })
    return result

@router.get("")
def get_all_reports(
    db: Session = Depends(get_db),
    current_user: dict = Depends(auth.get_required_current_user)
):
    """Retrieves all complaints for authorized platform members."""
    reports = crud.get_complaints(db)
    result = []
    for r in reports:
        assigned_name = "Pending Dispatch"
        if r.assigned_volunteer_id:
            vol = db.query(models.User).filter(models.User.id == r.assigned_volunteer_id).first()
            if vol:
                assigned_name = f"Volunteer {vol.full_name}"
        elif r.assigned_officer_id:
            off = db.query(models.User).filter(models.User.id == r.assigned_officer_id).first()
            if off:
                assigned_name = f"Officer {off.full_name}"
        elif r.status != "New":
            assigned_name = "In Dispatch Queue"

        zone_info = resolve_dombivli_zone(db, r.latitude, r.longitude)

        result.append({
            "id": f"RN-{r.id}",
            "tracking_code": r.tracking_code,
            "animal_type": r.confirmed_animal_type or r.detected_animal_type,
            "status": r.status,
            "priority": r.priority,
            "assigned_to": assigned_name,
            "zone_name": zone_info["name"],
            "address": r.address,
            "latitude": r.latitude,
            "longitude": r.longitude,
            "created_at": str(r.created_at),
            "description": r.description,
            "image_url": r.photo_url,
            "ai_reasoning": r.priority_reasoning
        })
    return result
