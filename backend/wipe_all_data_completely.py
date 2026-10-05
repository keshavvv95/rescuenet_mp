import os
import sys
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import SessionLocal, engine, Base
from app import models

def complete_wipe():
    print("Beginning TOTAL DATABASE WIPE & Dombivli Municipal Zone Initialization...")
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    try:
        tables_to_clear = [
            "report_co_reporters",
            "sighting_upvotes",
            "volunteer_tasks",
            "notifications",
            "donations",
            "cruelty_reports",
            "adoption_applications",
            "zone_sightings",
            "community_posts",
            "adoption_listings",
            "complaints",
            "volunteers",
            "ngos",
            "users",
            "community_zones"
        ]

        with engine.connect() as conn:
            for t in tables_to_clear:
                conn.execute(text(f"DELETE FROM {t}"))
            conn.commit()

        print("All database tables cleared.")

        # Official Dombivli Municipal Zones
        zones = [
            {"code": "ZONE-1", "name": "Dombivli East - Station & Ramnagar", "lat": 19.2183, "lng": 73.0868},
            {"code": "ZONE-2", "name": "Dombivli East - Phadke Road & Manpada", "lat": 19.2140, "lng": 73.0920},
            {"code": "ZONE-3", "name": "Dombivli East - MIDC & Residential", "lat": 19.2080, "lng": 73.0980},
            {"code": "ZONE-4", "name": "Dombivli West - Station & Subhash Road", "lat": 19.2195, "lng": 73.0810},
            {"code": "ZONE-5", "name": "Dombivli West - Garibachawada & Kopar", "lat": 19.2230, "lng": 73.0760},
        ]

        for z in zones:
            cz = models.CommunityZone(
                code=z["code"],
                zone_name=z["name"],
                center_latitude=z["lat"],
                center_longitude=z["lng"],
                radius_km=3.0
            )
            db.add(cz)
        db.commit()

        print("Dombivli Municipal Zones initialized successfully!")

    except Exception as e:
        print("Error setting up Dombivli database:", e)
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    complete_wipe()
