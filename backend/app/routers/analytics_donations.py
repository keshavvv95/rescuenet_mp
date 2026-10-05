from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.database import get_db
from app import schemas, crud, auth

router = APIRouter(tags=["Admin Analytics & Donations"])

@router.get("/api/analytics/overview")
def get_analytics_overview(
    db: Session = Depends(get_db),
    current_user: dict = Depends(auth.require_role(["ngo_admin", "officer", "super_admin"]))
):
    """Returns real analytics overview metrics dynamically aggregated from database."""
    return crud.get_analytics_overview(db)

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
            "target_ngo": "KDMC Dombivli Animal Rescue Fund",
            "case_ref": f"Case #{d.case_id}" if d.case_id else "Dombivli Stray Animal Welfare & Medical Care",
            "amount": d.amount,
            "currency": d.currency,
            "payment_method": getattr(d, "payment_method", "UPI"),
            "timestamp": str(d.created_at)
        }
        for d in donations
    ]
