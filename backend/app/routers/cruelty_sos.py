from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app import schemas, crud, models, auth

router = APIRouter(tags=["Community, Cruelty & SOS"])

@router.post("/api/cruelty/report", status_code=status.HTTP_201_CREATED)
def report_cruelty(
    req: schemas.CrueltyReportRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(auth.get_required_current_user)
):
    """Submits animal cruelty report to database, routing to NGO Legal Desk."""
    reporter_id = current_user["user_id"]
    report = crud.create_cruelty_report(db, req, reporter_id=reporter_id)
    return {
        "case_id": f"CRUELTY-{report.id}",
        "status": report.status,
        "message": "Incident logged in database. Legal inspection team assigned."
    }

@router.post("/api/sos/trigger", status_code=status.HTTP_201_CREATED)
def trigger_sos(
    req: schemas.SOSRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(auth.get_required_current_user)
):
    """One-tap Emergency SOS trigger creating a real priority complaint in database."""
    citizen_id = current_user["user_id"]
    complaint = crud.trigger_sos_complaint(db, req, citizen_id=citizen_id)
    return {
        "sos_id": complaint.tracking_code,
        "status": "Broadcasted to nearby Vets & Rescuers",
        "latitude": complaint.latitude,
        "longitude": complaint.longitude
    }

@router.get("/api/gamification/leaderboard")
def get_leaderboard(
    db: Session = Depends(get_db),
    current_user: dict = Depends(auth.get_required_current_user)
):
    """Returns real citizen & volunteer rescue leaderboard dynamically computed from database."""
    users = db.query(models.User).limit(10).all()
    if not users:
        return []

    leaderboard = []
    for idx, u in enumerate(users):
        report_count = db.query(models.Complaint).filter(models.Complaint.citizen_id == u.id).count()
        points = (report_count * 150) + 100
        badge = "🥇 Master Rescuer" if idx == 0 else ("🥈 Street Guardian" if idx == 1 else "🥉 Feed Hero")
        leaderboard.append({
            "rank": idx + 1,
            "name": u.full_name,
            "role": u.role.title(),
            "points": points,
            "badge": badge
        })

    leaderboard.sort(key=lambda x: x["points"], reverse=True)
    for idx, item in enumerate(leaderboard):
        item["rank"] = idx + 1
    return leaderboard
