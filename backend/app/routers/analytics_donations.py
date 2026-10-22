from fastapi import APIRouter, Depends, status, Response
from sqlalchemy.orm import Session
import csv
import io
from app.database import get_db
from app import schemas, crud, models, auth

router = APIRouter(tags=["Admin Analytics & Donations"])

@router.get("/api/analytics/overview")
def get_analytics_overview(
    db: Session = Depends(get_db),
    current_user: dict = Depends(auth.require_role(["ngo_admin", "officer", "super_admin"]))
):
    """Returns real analytics overview metrics dynamically aggregated from database."""
    return crud.get_analytics_overview(db)

@router.get("/api/analytics/export")
def export_analytics_csv(
    db: Session = Depends(get_db),
    current_user: dict = Depends(auth.require_role(["ngo_admin", "officer", "super_admin"]))
):
    """Exports real platform complaints database records as CSV for Super Admin & Officers."""
    complaints = db.query(models.Complaint).order_by(models.Complaint.created_at.desc()).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "ID", "Tracking Code", "Citizen ID", "Animal Type", "Status",
        "Priority", "Priority Score", "Address", "Latitude", "Longitude",
        "Is SOS", "Created At", "Description"
    ])
    for c in complaints:
        writer.writerow([
            f"RN-{c.id}",
            c.tracking_code,
            c.citizen_id or "Anonymous",
            c.confirmed_animal_type or c.detected_animal_type or "Unknown",
            c.status,
            c.priority or "Normal",
            c.priority_score or 0.0,
            c.address or "",
            c.latitude,
            c.longitude,
            "Yes" if c.is_sos else "No",
            str(c.created_at),
            c.description or ""
        ])
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=rescuenet_complaints_export.csv"}
    )


@router.post("/api/donations/checkout", status_code=status.HTTP_201_CREATED)
def donation_checkout(
    req: schemas.DonationCheckoutRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(auth.get_required_current_user)
):
    """Processes real donation and persists transaction to database ledger."""
    donation = crud.create_donation(db, req)
    return {
        "success": True,
        "tx_id": donation.tx_id,
        "donor_name": donation.donor_name,
        "amount": donation.amount,
        "currency": donation.currency,
        "payment_method": getattr(donation, "payment_method", "UPI"),
        "status": donation.status
    }

@router.get("/api/donations/ledger")
def get_donation_ledger(
    db: Session = Depends(get_db),
    current_user: dict = Depends(auth.get_required_current_user)
):
    """Returns real public donation transparency ledger from database."""
    donations = crud.get_donation_ledger(db)
    return [
        {
            "tx_id": d.tx_id,
            "donor": d.donor_name or "Anonymous Citizen",
            "target_ngo": "KDMC Mumbai Animal Rescue Fund",
            "case_ref": f"Case #{d.case_id}" if d.case_id else "Mumbai Stray Animal Welfare & Medical Care",
            "amount": d.amount,
            "currency": d.currency,
            "payment_method": getattr(d, "payment_method", "UPI"),
            "timestamp": str(d.created_at)
        }
        for d in donations
    ]
