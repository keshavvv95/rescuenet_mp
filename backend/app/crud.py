import json
import uuid
from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import func, text
from app import models, schemas, auth
from app.ai.priority_engine import calculate_priority_score
from app.ai.authenticity import evaluate_photo_authenticity

# 1. User CRUD
def get_user_by_email(db: Session, email: str):
    if not email:
        return None
    clean_email = email.strip().lower()
    return db.query(models.User).filter(models.User.email == clean_email).first()

def create_user(db: Session, user: schemas.UserCreate):
    clean_email = user.email.strip().lower()
    hashed_password = auth.get_password_hash(user.password)
    
    zone_id = getattr(user, "zone_id", None)
    if not zone_id:
        first_zone = db.query(models.CommunityZone).first()
        zone_id = first_zone.id if first_zone else None

    db_user = models.User(
        email=clean_email,
        password_hash=hashed_password,
        full_name=user.full_name,
        phone_number=user.phone_number,
        role=user.role or "citizen",
        zone_id=zone_id
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    zone_name = "Mumbai Zone"
    if db_user.zone_id:
        cz = db.query(models.CommunityZone).filter(models.CommunityZone.id == db_user.zone_id).first()
        if cz:
            zone_name = cz.zone_name

    create_notification(
        db, 
        user_id=db_user.id, 
        title="Welcome to RescueNet Mumbai", 
        message=f"Account created successfully as {db_user.role}. Assigned to {zone_name}.",
        notif_type="info"
    )

    if db_user.role == "volunteer":
        v = models.Volunteer(
            user_id=db_user.id,
            name=db_user.full_name,
            status="Available",
            skill_tags="First Aid, Animal Rescue",
            current_zone=zone_name
        )
        db.add(v)
        db.commit()

    return db_user

# 2. Complaint CRUD
def create_complaint(db: Session, report: schemas.ComplaintCreate, citizen_id: Optional[int] = None):
    p_res = calculate_priority_score(
        detection_confidence=report.detection_confidence or 0.0,
        description=report.description or "",
        visual_distress_score=report.distress_score or 0.0,
        detected_animal_type=report.confirmed_animal_type or report.detected_animal_type or "Dog"
    )
    priority_level = p_res["priority"]
    score = p_res["score"]
    reasoning = p_res["reasoning"]
    requires_human_review = p_res["requires_human_review"]

    auth_result = evaluate_photo_authenticity(report.photo_url)
    is_ai = bool(getattr(report, "is_ai_generated", False) or auth_result.get("is_ai_generated", False))
    is_web = bool(getattr(report, "is_web_image", False) or auth_result.get("is_web_image", False))

    if is_ai:
        auth_status = "AI-GENERATED IMAGE DETECTED"
    elif is_web:
        auth_status = "WEB / STOCK IMAGE DETECTED (NOT A LIVE FIELD PHOTO)"
    else:
        auth_status = getattr(report, "authenticity_status", None) or auth_result.get("status_text", "AUTHENTIC FIELD PHOTO VERIFIED")

    is_flagged = is_ai or is_web or auth_result.get("is_suspicious", False)
    is_authentic_flag = not is_flagged

    # If it's an SOS report with an AI or Web image, elevate requires_human_review = True
    # and annotate reasoning with an EVIDENCE ALERT for Super Admin in KDMC Triage
    is_sos_report = bool(report.is_sos)
    if is_sos_report and (is_ai or is_web):
        requires_human_review = True
        flag_label = "AI-Generated Image" if is_ai else "Web/Stock Image"
        reasoning = f"{reasoning} | ⚠️ EVIDENCE ALERT: SOS Report flagged with {flag_label}. Super Admin live field verification required."
    elif is_flagged:
        requires_human_review = True

    tracking_code = f"RN-{uuid.uuid4().hex[:6].upper()}"
    embedding_json = json.dumps(report.image_embedding) if report.image_embedding else None

    db_report = models.Complaint(
        tracking_code=tracking_code,
        citizen_id=citizen_id,
        photo_url=report.photo_url,
        latitude=report.latitude,
        longitude=report.longitude,
        address=report.address or "Captured Location",
        detected_animal_type=report.detected_animal_type or "Dog",
        detection_confidence=report.detection_confidence or 0.0,
        confirmed_animal_type=report.confirmed_animal_type or report.detected_animal_type or "Dog",
        description=report.description,
        priority=priority_level,
        priority_score=score,
        priority_reasoning=reasoning,
        requires_human_review=requires_human_review,
        image_embedding=embedding_json,
        reporter_count=1,
        status="New",
        fft_score=auth_result.get("fft_score", 0.95),
        clip_score=auth_result.get("classifier_score", 0.92),
        exif_score=0.95 if auth_result.get("exif_consistent", False) else 0.50,
        is_authentic_flag=is_authentic_flag,
        is_ai_generated=is_ai,
        is_web_image=is_web,
        authenticity_status=auth_status,
        is_sos=is_sos_report
    )
    db.add(db_report)
    db.commit()
    db.refresh(db_report)

    zones = db.query(models.CommunityZone).all()
    if zones:
        import math
        def haversine(lat1, lon1, lat2, lon2):
            R = 6371.0
            dlat = math.radians(lat2 - lat1)
            dlon = math.radians(lon2 - lon1)
            a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
            c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
            return R * c * 1000.0
        nearest_zone = min(zones, key=lambda z: haversine(z.center_latitude, z.center_longitude, report.latitude, report.longitude))
    else:
        nearest_zone = None

    zone_id = nearest_zone.id if nearest_zone else None

    author_name = "Citizen Reporter"
    if citizen_id:
        user = db.query(models.User).filter(models.User.id == citizen_id).first()
        if user and user.full_name:
            author_name = user.full_name

    sighting = models.ZoneSighting(
        complaint_id=db_report.id,
        zone_id=zone_id,
        author_id=citizen_id,
        author_name=author_name,
        animal_type=db_report.confirmed_animal_type,
        location=db_report.address,
        notes=db_report.description,
        photo_url=db_report.photo_url,
        corroboration_count=1
    )
    db.add(sighting)
    db.commit()

    return db_report

def get_complaints(db: Session, citizen_id: Optional[int] = None, status_filter: Optional[str] = None):
    query = db.query(models.Complaint)
    if citizen_id:
        query = query.filter(models.Complaint.citizen_id == citizen_id)
    if status_filter and status_filter != "All":
        query = query.filter(models.Complaint.status == status_filter)
    return query.order_by(models.Complaint.created_at.desc()).all()

def get_zone_sightings(db: Session, zone_code: Optional[str] = None):
    # Exclude sightings of cases that have been resolved
    resolved_subquery = db.query(models.Complaint.id).filter(models.Complaint.status == "Resolved").subquery()
    query = db.query(models.ZoneSighting).filter(
        (models.ZoneSighting.complaint_id.is_(None)) |
        (~models.ZoneSighting.complaint_id.in_(resolved_subquery))
    )
    if zone_code and zone_code.strip() and zone_code.lower() not in ("all", "all cases", "all zones", "mumbai region", "none"):
        z = db.query(models.CommunityZone).filter(
            (models.CommunityZone.code.ilike(f"%{zone_code.strip()}%")) |
            (models.CommunityZone.zone_name.ilike(f"%{zone_code.strip()}%"))
        ).first()
        if z:
            query = query.filter(models.ZoneSighting.zone_id == z.id)
    return query.order_by(models.ZoneSighting.created_at.desc()).all()

def create_sighting(db: Session, sighting_in: schemas.SightingCreate, author_id: Optional[int] = None, author_name: Optional[str] = "Citizen"):
    first_zone = db.query(models.CommunityZone).first()
    sighting = models.ZoneSighting(
        complaint_id=sighting_in.complaint_id,
        zone_id=first_zone.id if first_zone else None,
        author_id=author_id,
        author_name=author_name,
        animal_type=sighting_in.animal_type,
        location=sighting_in.location,
        notes=sighting_in.notes,
        photo_url=sighting_in.photo_url or "/static/uploads/reports/default.jpg",
        corroboration_count=1
    )
    db.add(sighting)
    db.commit()
    db.refresh(sighting)
    return sighting

def corroborate_sighting(db: Session, sighting_id: int, user_id: Optional[int] = None):
    sighting = db.query(models.ZoneSighting).filter(models.ZoneSighting.id == sighting_id).first()
    if not sighting:
        return None

    user_ref_id = user_id or 1
    existing = db.query(models.SightingUpvote).filter(
        models.SightingUpvote.sighting_id == sighting_id,
        models.SightingUpvote.user_id == user_ref_id
    ).first()

    if existing:
        db.delete(existing)
        sighting.corroboration_count = max(1, sighting.corroboration_count - 1)
        db.commit()
        return {"success": True, "new_count": sighting.corroboration_count, "has_upvoted": False}
    else:
        upvote = models.SightingUpvote(sighting_id=sighting_id, user_id=user_ref_id)
        db.add(upvote)
        sighting.corroboration_count += 1
        db.commit()
        return {"success": True, "new_count": sighting.corroboration_count, "has_upvoted": True}

# 4. Adoption CRUD
def get_adoption_listings(db: Session):
    return db.query(models.AdoptionListing).filter(models.AdoptionListing.is_active == True).all()

def create_adoption_application(db: Session, app_in: schemas.AdoptionApplyRequest, applicant_id: Optional[int] = None):
    try:
        listing_id = int(app_in.adoption_id)
    except Exception:
        listing_id = 1

    app_obj = models.AdoptionApplication(
        listing_id=listing_id,
        applicant_id=applicant_id,
        applicant_name=app_in.applicant_name,
        phone=app_in.phone,
        housing_type=app_in.housing_type,
        experience_years=app_in.experience_years,
        reason=app_in.reason,
        status="Applied",
        notes="Application received. Pending NGO document review."
    )
    db.add(app_obj)
    db.commit()
    db.refresh(app_obj)
    return app_obj

def get_user_adoption_applications(db: Session, applicant_id: Optional[int] = None):
    query = db.query(models.AdoptionApplication)
    if applicant_id:
        query = query.filter(models.AdoptionApplication.applicant_id == applicant_id)
    return query.order_by(models.AdoptionApplication.created_at.desc()).all()

# 5. Cruelty Reports & SOS CRUD
def create_cruelty_report(db: Session, req: schemas.CrueltyReportRequest, reporter_id: Optional[int] = None):
    report = models.CrueltyReport(
        reporter_id=reporter_id,
        incident_type=req.incident_type,
        location=req.location,
        latitude=req.latitude,
        longitude=req.longitude,
        description=req.description,
        evidence_photo_url=req.evidence_image or "/static/uploads/reports/default.jpg",
        status="Escalated to NGO Legal Desk"
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return report

def trigger_sos_complaint(db: Session, req: schemas.SOSRequest, citizen_id: Optional[int] = None):
    report_in = schemas.ComplaintCreate(
        photo_url=req.photo_url or "/static/uploads/reports/sos_default.jpg",
        latitude=req.latitude,
        longitude=req.longitude,
        address="Emergency SOS Location",
        detected_animal_type="Injured Stray Animal",
        detection_confidence=0.99,
        confirmed_animal_type="Dog",
        description=f"CRITICAL SOS EMERGENCY ALERT: {req.note or 'Immediate rescue required'}",
        urgency="Emergency",
        is_sos=True,
        is_ai_generated=getattr(req, "is_ai_generated", False) or False,
        is_web_image=getattr(req, "is_web_image", False) or False,
        authenticity_status=getattr(req, "authenticity_status", None)
    )
    return create_complaint(db, report_in, citizen_id)

# 6. Donations & Ledger CRUD
def create_donation(db: Session, req: schemas.DonationCheckoutRequest):
    tx_id = f"TXN-{uuid.uuid4().hex[:6].upper()}"
    donation = models.Donation(
        tx_id=tx_id,
        donor_name=req.donor_name or "Anonymous Citizen",
        ngo_id=req.ngo_id,
        case_id=req.case_id,
        amount=req.amount,
        currency=req.currency or "INR",
        payment_method=req.payment_method or "UPI",
        status="SUCCESS"
    )
    db.add(donation)
    db.commit()
    db.refresh(donation)
    return donation

def get_donation_ledger(db: Session):
    return db.query(models.Donation).order_by(models.Donation.created_at.desc()).all()

# 7. Notifications CRUD
def create_notification(db: Session, user_id: int, title: str, message: str, notif_type: str = "info"):
    n = models.Notification(
        user_id=user_id,
        title=title,
        message=message,
        type=notif_type,
        is_read=False
    )
    db.add(n)
    db.commit()
    db.refresh(n)
    return n

def get_user_notifications(db: Session, user_id: int):
    return db.query(models.Notification).filter(models.Notification.user_id == user_id).order_by(models.Notification.created_at.desc()).all()

def mark_notification_as_read(db: Session, notification_id: int, user_id: Optional[int] = None):
    n = db.query(models.Notification).filter(models.Notification.id == notification_id).first()
    if n:
        n.is_read = True
        db.commit()
    return n

# 8. Volunteer Tasks CRUD
def create_volunteer_task(db: Session, complaint_id: int, volunteer_id: Optional[int], instructions: str = "Locate and provide immediate aid"):
    comp = db.query(models.Complaint).filter(models.Complaint.id == complaint_id).first()
    if not comp:
        return None

    task_code = f"TASK-{uuid.uuid4().hex[:6].upper()}"
    task = models.VolunteerTask(
        complaint_id=comp.id,
        volunteer_id=volunteer_id,
        task_code=task_code,
        animal_type=comp.confirmed_animal_type or comp.detected_animal_type or "Stray Animal",
        priority=comp.priority,
        address=comp.address or "Recorded Coordinates",
        latitude=comp.latitude,
        longitude=comp.longitude,
        status="Assigned",
        instructions=instructions
    )
    db.add(task)
    comp.status = "Assigned"
    db.commit()
    db.refresh(task)
    return task

def get_volunteer_tasks(db: Session, volunteer_id: Optional[int] = None):
    query = db.query(models.VolunteerTask)
    if volunteer_id:
        query = query.filter(models.VolunteerTask.volunteer_id == volunteer_id)
    return query.order_by(models.VolunteerTask.assigned_at.desc()).all()

def complete_volunteer_task(db: Session, task_id_str: str, photo_url: Optional[str] = None, notes: Optional[str] = None):
    clean_code = task_id_str.replace("TASK-", "")
    task = db.query(models.VolunteerTask).filter(
        (models.VolunteerTask.task_code == task_id_str) | (models.VolunteerTask.id == (int(clean_code) if clean_code.isdigit() else -1))
    ).first()

    if task:
        task.status = "Resolved"
        task.completion_photo = photo_url
        task.resolution_notes = notes
        task.completed_at = func.now()
        
        comp = db.query(models.Complaint).filter(models.Complaint.id == task.complaint_id).first()
        if comp:
            comp.status = "Resolved"
            # Delete related sightings and upvotes from live feed
            sightings = db.query(models.ZoneSighting).filter(
                (models.ZoneSighting.complaint_id == comp.id) |
                (models.ZoneSighting.notes.ilike(f"%{comp.tracking_code}%"))
            ).all()
            sighting_ids = [s.id for s in sightings]
            if sighting_ids:
                db.query(models.SightingUpvote).filter(
                    models.SightingUpvote.sighting_id.in_(sighting_ids)
                ).delete(synchronize_session=False)
                db.query(models.ZoneSighting).filter(
                    models.ZoneSighting.id.in_(sighting_ids)
                ).delete(synchronize_session=False)
        db.commit()
        db.refresh(task)
        return task
    return None

# 9. Dynamic Production Analytics Overview CRUD
def get_analytics_overview(db: Session):
    total_reports = db.query(models.Complaint).count()
    resolved_cases = db.query(models.Complaint).filter(models.Complaint.status == "Resolved").count()
    emergency_reports = db.query(models.Complaint).filter(models.Complaint.priority == "Emergency").count()

    emergency_ratio = round((emergency_reports / total_reports * 100), 1) if total_reports > 0 else 0.0

    avg_res_stmt = text("""
        SELECT AVG(EXTRACT(EPOCH FROM (completed_at - assigned_at)) / 3600.0)
        FROM volunteer_tasks
        WHERE completed_at IS NOT NULL AND assigned_at IS NOT NULL;
    """)
    avg_hours_raw = db.execute(avg_res_stmt).scalar()
    avg_resolution_time = round(float(avg_hours_raw), 1) if avg_hours_raw is not None else 0.0

    zones = db.query(models.CommunityZone).order_by(models.CommunityZone.id.asc()).all()
    palette = ["#3b82f6", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6", "#06b6d4", "#84cc16", "#a855f7", "#6366f1", "#14b8a6", "#f97316", "#e11d48"]
    
    import math
    def haversine(lat1, lon1, lat2, lon2):
        R = 6371.0
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return R * c * 1000.0

    all_complaints = db.query(models.Complaint).all()
    
    # Map each complaint to its nearest zone so zone counts cleanly partition all complaints
    zone_count_map = {z.id: 0 for z in zones}
    for c in all_complaints:
        if zones and c.latitude is not None and c.longitude is not None:
            nearest_z = min(zones, key=lambda z: haversine(z.center_latitude, z.center_longitude, c.latitude, c.longitude))
            zone_count_map[nearest_z.id] += 1

    zone_counts = []
    for idx, z in enumerate(zones):
        zone_counts.append({
            "zone": z.zone_name,
            "code": z.code,
            "latitude": z.center_latitude,
            "longitude": z.center_longitude,
            "lat": z.center_latitude,
            "lng": z.center_longitude,
            "count": zone_count_map.get(z.id, 0),
            "color": palette[idx % len(palette)]
        })

    return {
        "total_reports": total_reports,
        "total_complaints": total_reports,
        "resolved_cases": resolved_cases,
        "avg_resolution_time_hrs": avg_resolution_time,
        "emergency_ratio_percent": emergency_ratio,
        "complaints_by_zone": zone_counts
    }

