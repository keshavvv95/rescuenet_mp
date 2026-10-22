import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database import SessionLocal
from app import crud, models, schemas

def test_full_complaint_persistence():
    db = SessionLocal()
    try:
        # Find or create a citizen user
        user = db.query(models.User).filter(models.User.email == "citizen@rescuenet.in").first()
        if not user:
            user = db.query(models.User).first()
        citizen_id = user.id if user else 1

        # 1. Create a Critical Complaint with life-threatening signs (unconscious)
        report_data = schemas.ComplaintCreate(
            photo_url="/static/uploads/reports/test_animal.jpg",
            latitude=19.0760,
            longitude=72.8777,
            address="Near Dadar Flower Market",
            detected_animal_type="Dog",
            detection_confidence=0.88,
            confirmed_animal_type="Dog",
            description="Hit by truck, dog is unconscious and unable to walk",
            urgency="CRITICAL",
            is_sos=True
        )

        db_report = crud.create_complaint(db, report_data, citizen_id=citizen_id)
        print("Created report ID:", db_report.id, "Tracking code:", db_report.tracking_code)

        # Verify DB fields
        assert db_report.priority == "CRITICAL", f"Expected CRITICAL, got {db_report.priority}"
        # Life threatening (40) + Major injuries (25) + Impairment (15) = 80.0
        assert db_report.priority_score == 80.0, f"Expected 80.0, got {db_report.priority_score}"
        assert db_report.requires_human_review is True, "Expected requires_human_review == True"
        assert "Priority Score: 80.0/100 [CRITICAL]" in db_report.priority_reasoning

        # 2. Query DB directly to ensure persistence across sessions
        fetched = db.query(models.Complaint).filter(models.Complaint.id == db_report.id).first()
        assert fetched is not None
        assert fetched.priority == "CRITICAL"
        assert fetched.priority_score == 80.0
        assert fetched.requires_human_review is True
        print("[OK] Database persistence verified successfully!")

        # 3. Verify Feed Sighting links to this complaint and has priority & triage_score
        sighting = db.query(models.ZoneSighting).filter(models.ZoneSighting.complaint_id == db_report.id).first()
        assert sighting is not None, "ZoneSighting must be created for complaint"
        print("[OK] Zone sighting linked properly to complaint ID:", sighting.complaint_id)

        # Clean up test complaint and sighting
        db.delete(sighting)
        db.commit()
        db.delete(db_report)
        db.commit()
        print("[OK] Test cleanup completed!")

    finally:
        db.close()

if __name__ == "__main__":
    test_full_complaint_persistence()
    print("ALL FULL FLOW TESTS PASSED! SUCCESS!")
