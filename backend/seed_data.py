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
        zones = [
            # Mumbai
            {"code": "ZONE-1", "name": "Mumbai East - Station & Ramnagar", "lat": 19.2183, "lng": 73.0868},
            {"code": "ZONE-2", "name": "Mumbai East - Phadke Road & Manpada", "lat": 19.2140, "lng": 73.0920},
            {"code": "ZONE-3", "name": "Mumbai East - MIDC & Residential", "lat": 19.2080, "lng": 73.0980},
            {"code": "ZONE-4", "name": "Mumbai West - Station & Subhash Road", "lat": 19.2195, "lng": 73.0810},
            {"code": "ZONE-5", "name": "Mumbai West - Garibachawada & Kopar", "lat": 19.2230, "lng": 73.0760},
            # Mumbai
            {"code": "MUM-1", "name": "Mumbai - Andheri & Juhu", "lat": 19.1136, "lng": 72.8697},
            {"code": "MUM-2", "name": "Mumbai - Bandra & Khar", "lat": 19.0596, "lng": 72.8295},
            {"code": "MUM-3", "name": "Mumbai - South Bombay (Colaba & Fort)", "lat": 18.9219, "lng": 72.8346},
            # Navi Mumbai & Thane
            {"code": "NM-1", "name": "Navi Mumbai - Panvel", "lat": 18.9894, "lng": 73.1175},
            {"code": "NM-2", "name": "Navi Mumbai - Belapur & Kharghar", "lat": 19.0187, "lng": 73.0392},
            {"code": "NM-3", "name": "Navi Mumbai - Nerul & Seawoods", "lat": 19.0330, "lng": 73.0180},
            {"code": "NM-4", "name": "Navi Mumbai - Vashi & Sanpada", "lat": 19.0745, "lng": 72.9978},
            {"code": "NM-5", "name": "Navi Mumbai - Koparkhairane & Airoli", "lat": 19.1033, "lng": 72.9996},
            {"code": "TH-1", "name": "Thane - West", "lat": 19.2183, "lng": 72.9781},
            {"code": "TH-2", "name": "Thane - East", "lat": 19.1969, "lng": 72.9806},
            # Panvel to Gateway of India route
            {"code": "ROUTE-1", "name": "Mumbai - Mankhurd & Chembur", "lat": 19.0494, "lng": 72.9234},
            {"code": "ROUTE-2", "name": "Mumbai - Wadala & Sewri", "lat": 19.0163, "lng": 72.8576},
            {"code": "ROUTE-3", "name": "Mumbai - Byculla & Dockyard Road", "lat": 18.9760, "lng": 72.8360},
        ]
        
        for z in zones:
            existing = db.query(models.CommunityZone).filter(models.CommunityZone.code == z["code"]).first()
            if not existing:
                cz = models.CommunityZone(
                    code=z["code"],
                    zone_name=z["name"],
                    center_latitude=z["lat"],
                    center_longitude=z["lng"],
                    radius_km=3.0 if "ZONE" in z["code"] else 5.0
                )
                db.add(cz)
        db.commit()

        print("Database schema & Mumbai Municipal Zones initialized with zero demo data.")
    except Exception as e:
        print("Error initializing database:", e)
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    init_db()
