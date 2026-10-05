import os
import sys
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import SessionLocal, engine, Base
from app import models

def init_db():
    print("Ensuring database tables and municipal zones exist without any seeded demo users...")
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    try:
        if db.query(models.CommunityZone).count() == 0:
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

        print("Database schema & Dombivli Municipal Zones initialized with zero demo data.")
    except Exception as e:
        print("Error initializing database:", e)
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    init_db()
