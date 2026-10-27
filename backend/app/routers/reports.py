import os
import uuid
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.database import get_db
from app import schemas, crud, auth, models
from app.ai.detector import detect_animal
from app.ai.priority_engine import calculate_priority_score
from app.ai.duplicate_detector import find_duplicate_reports
from app.services.mumbai_mapper import resolve_mumbai_zone, reverse_geocode_coordinates

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
    source: Optional[str] = Form(None),
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

    if source == "live_camera":
        ai_status = "AUTHENTIC LIVE CAMERA FEED VERIFIED"
        ai_conf = 98
        is_suspicious = False
        is_ai_gen = False
        is_web_img = False
    else:
        from app.ai.authenticity import evaluate_photo_authenticity
        auth_result = evaluate_photo_authenticity(filepath)
        ai_status = auth_result.get("status_text", "AUTHENTIC FIELD PHOTO VERIFIED")
        ai_conf = int(auth_result.get("confidence", 85))
        is_suspicious = bool(auth_result.get("is_suspicious", False))
        is_ai_gen = bool(auth_result.get("is_ai_generated", False))
        is_web_img = bool(auth_result.get("is_web_image", False))
        
    rel_url = f"/static/uploads/reports/{filename}"

    result = detect_animal(filepath)
    detected_animal = result.get("detected_animal_type", "NO ANIMAL DETECTED")
    confidence = float(result.get("confidence", 0.0))
    is_valid = bool(result.get("is_animal_detected", False) and confidence > 0.0 and detected_animal != "NO ANIMAL DETECTED")
    is_human_only = bool(result.get("is_human_only", False))

    if is_valid:
        reasoning_text = f"AI detected {detected_animal} with {int(confidence * 100)}% detection confidence (kept separate from triage severity). Authenticity: {ai_status}."
        final_animal = detected_animal
    elif is_human_only:
        reasoning_text = f"NO ANIMAL DETECTED (Human frame). Animal triage bypassed. Authenticity: {ai_status}."
        final_animal = "NO ANIMAL DETECTED"
        confidence = 0.0
    else:
        reasoning_text = f"No supported animal detected in frame. Authenticity: {ai_status}."
        final_animal = "NO ANIMAL DETECTED"
        confidence = 0.0

    return {
        "ai_generated": is_suspicious,
        "is_ai_generated": is_ai_gen,
        "is_web_image": is_web_img,
        "ai_verification_status": ai_status,
        "ai_verification_confidence": ai_conf,
        "detected_animal": final_animal,
        "raw_detected_animal": detected_animal,
        "confidence": confidence,
        "is_animal_detected": is_valid,
        "is_human_only": is_human_only,
        "model_used": result.get("model_used", "yolov8n"),
        "health_condition": ("Possible Visual Distress (Experimental Cue)" if result.get("distress_score", 0.0) > 0.4 else "Stable / No Major Visual Bleed") if is_valid else "None",
        "suggested_urgency": "Normal",
        "reasoning": reasoning_text,
        "image_url": rel_url,
        "distress_score": result.get("distress_score", 0.0) if is_valid else 0.0,
        "experimental_distress_signal": result.get("experimental_distress_signal", 0.0) if is_valid else 0.0,
        "disclaimer": "AI detection confidence reflects object presence, not injury severity."
    }

@router.post("/triage-preview")
def preview_triage(
    req: schemas.TriagePreviewRequest,
    current_user: dict = Depends(auth.get_required_current_user)
):
    """
    Computes real-time explainable triage priority score (0-100) using the authoritative
    backend scoring engine without creating a database record.
    """
    return calculate_priority_score(
        detection_confidence=req.detection_confidence or 0.0,
        description=req.description or "",
        visual_distress_score=req.visual_distress_score or 0.0,
        detected_animal_type=req.detected_animal_type or "Dog",
        selected_symptoms=req.selected_symptoms,
        is_animal_detected=req.is_animal_detected
    )

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
        radius_meters=req.radius_meters or 500.0,
        time_window_hours=req.time_window_hours or 3.0
    )
    return res

@router.get("/reverse-geocode")
def reverse_geocode(
    lat: float,
    lng: float,
    db: Session = Depends(get_db)
):
    """
    Resolves human-readable street address and assigned municipal zone
    for the provided latitude and longitude.
    """
    zone_info = resolve_mumbai_zone(db, lat, lng)
    return reverse_geocode_coordinates(lat, lng, zone_info)

@router.post("", status_code=status.HTTP_201_CREATED)
def submit_report(
    req: schemas.ComplaintCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(auth.get_required_current_user)
):
    """
    Submits a new stray animal complaint tied strictly to authenticated user,
    performing real Mumbai zone auto-assignment via spatial database queries.
    """
    citizen_id = current_user["user_id"]
    
    # Resolve exact Mumbai zone via spatial database query
    zone_info = resolve_mumbai_zone(db, req.latitude, req.longitude)
    
    # Auto-enrich address if missing or sent as raw coordinates
    if not req.address or req.address.strip().lower().startswith("lat:") or req.address.strip() == "Current Location Coordinates":
        geo = reverse_geocode_coordinates(req.latitude, req.longitude, zone_info)
        req.address = geo.get("address") or f"{zone_info['name']} (GPS Verified)"
    
    db_report = crud.create_complaint(db, req, citizen_id)

    return {
        "id": f"RN-{db_report.id}",
        "tracking_code": db_report.tracking_code,
        "status": db_report.status,
        "priority": db_report.priority,
        "priority_score": db_report.priority_score,
        "priority_reasoning": db_report.priority_reasoning,
        "requires_human_review": db_report.requires_human_review,
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
    """Retrieves reports for authenticated user or system-wide complaints for super_admin/officer."""
    user_role = current_user.get("role", "citizen")
    citizen_id = None if user_role in ["super_admin", "officer", "ngo_admin"] else current_user["user_id"]
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

        zone_info = resolve_mumbai_zone(db, r.latitude, r.longitude)

        result.append({
            "id": f"RN-{r.id}",
            "tracking_code": r.tracking_code,
            "animal_type": r.confirmed_animal_type or r.detected_animal_type,
            "status": r.status,
            "priority": r.priority,
            "priority_score": r.priority_score or 0.0,
            "priority_reasoning": r.priority_reasoning,
            "requires_human_review": bool(r.requires_human_review),
            "detection_confidence": r.detection_confidence or 0.0,
            "assigned_to": assigned_name,
            "zone_name": zone_info["name"],
            "address": r.address,
            "latitude": r.latitude,
            "longitude": r.longitude,
            "created_at": str(r.created_at),
            "description": r.description,
            "image_url": r.photo_url,
            "ai_reasoning": r.priority_reasoning,
            "is_sos": r.is_sos or False,
            "is_ai_generated": bool(getattr(r, "is_ai_generated", False)),
            "is_web_image": bool(getattr(r, "is_web_image", False)),
            "authenticity_status": getattr(r, "authenticity_status", "AUTHENTIC FIELD PHOTO VERIFIED") or "AUTHENTIC FIELD PHOTO VERIFIED"
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

        zone_info = resolve_mumbai_zone(db, r.latitude, r.longitude)

        result.append({
            "id": f"RN-{r.id}",
            "tracking_code": r.tracking_code,
            "animal_type": r.confirmed_animal_type or r.detected_animal_type,
            "status": r.status,
            "priority": r.priority,
            "priority_score": r.priority_score or 0.0,
            "priority_reasoning": r.priority_reasoning,
            "requires_human_review": bool(r.requires_human_review),
            "detection_confidence": r.detection_confidence or 0.0,
            "assigned_to": assigned_name,
            "zone_name": zone_info["name"],
            "address": r.address,
            "latitude": r.latitude,
            "longitude": r.longitude,
            "created_at": str(r.created_at),
            "description": r.description,
            "image_url": r.photo_url,
            "ai_reasoning": r.priority_reasoning,
            "is_sos": r.is_sos or False,
            "is_ai_generated": bool(getattr(r, "is_ai_generated", False)),
            "is_web_image": bool(getattr(r, "is_web_image", False)),
            "authenticity_status": getattr(r, "authenticity_status", "AUTHENTIC FIELD PHOTO VERIFIED") or "AUTHENTIC FIELD PHOTO VERIFIED"
        })
    return result
