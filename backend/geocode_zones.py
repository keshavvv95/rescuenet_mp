import time
import json
import os
import sys
from sqlalchemy import create_engine, text

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:atharva@localhost:2025/pashurakshak_db")

ZONES_CONFIG = [
    {"name": "Manpada — Dombivli East", "code": "DOMB-E-MANPADA", "lat": 19.196251, "lon": 73.093573, "source": "OSM Nominatim (Manpada Road)"},
    {"name": "Thakurli — Dombivli East", "code": "DOMB-E-THAKURLI", "lat": 19.226281, "lon": 73.098017, "source": "OSM Nominatim (Thakurli)"},
    {"name": "Tilak Nagar — Dombivli East", "code": "DOMB-E-TILAKNAGAR", "lat": 19.213604, "lon": 73.092719, "source": "OSM Nominatim (Tilak Nagar)"},
    {"name": "Pendse Nagar — Dombivli East", "code": "DOMB-E-PENDSENAGAR", "lat": 19.211181, "lon": 73.091129, "source": "User approved Dombivli East locality proxy"},
    {"name": "MIDC Residential Area — Dombivli East", "code": "DOMB-E-MIDCRESIDENTIAL", "lat": 19.206089, "lon": 73.101744, "source": "OSM Nominatim (MIDC Road)"},
    {"name": "Gandhi Nagar — Dombivli East", "code": "DOMB-E-GANDHINAGAR", "lat": 19.203830, "lon": 73.093136, "source": "OSM Nominatim (Gandhi Nagar)"},
    {"name": "Ganesh Nagar / Sagarli Gaon — Dombivli East", "code": "DOMB-E-GANESHNAGAR", "lat": 19.229008, "lon": 73.094032, "source": "OSM Nominatim (Ganesh Nagar)"},
    {"name": "Nandivali / Ramnagar — Dombivli East", "code": "DOMB-E-NANDIVALI", "lat": 19.198148, "lon": 73.084822, "source": "OSM Nominatim (Nandivali)"},
    {"name": "Vishnu Nagar — Dombivli West", "code": "DOMB-W-VISHNUNAGAR", "lat": 19.219069, "lon": 73.086831, "source": "OSM Nominatim (Vishnu Nagar)"},
    {"name": "Gaondevi — Dombivli West", "code": "DOMB-W-GAONDEVI", "lat": 19.225711, "lon": 73.081731, "source": "OSM Nominatim (Gaondevi)"},
    {"name": "Navapada — Dombivli West", "code": "DOMB-W-NAVAPADA", "lat": 19.222182, "lon": 73.080927, "source": "User approved Dombivli West locality proxy"},
    {"name": "Kailas Nagar — Dombivli West", "code": "DOMB-W-KAILASNAGAR", "lat": 19.222182, "lon": 73.080927, "source": "User approved Dombivli West locality proxy"},
]

def main():
    print("=== SEEDING REAL DOMBIVLI ZONES INTO POSTGRESQL DATABASE ===", flush=True)
    engine = create_engine(DATABASE_URL)
    with engine.connect() as conn:
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS cube;"))
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS earthdistance;"))
        conn.execute(text("TRUNCATE TABLE community_zones CASCADE;"))
        
        insert_stmt = text("""
            INSERT INTO community_zones (zone_name, code, center_latitude, center_longitude, radius_km)
            VALUES (:zone_name, :code, :center_latitude, :center_longitude, :radius_km)
        """)
        
        for r in ZONES_CONFIG:
            conn.execute(insert_stmt, {
                "zone_name": r["name"],
                "code": r["code"],
                "center_latitude": r["lat"],
                "center_longitude": r["lon"],
                "radius_km": 1.0 # Default 1.0km radius
            })
            print(f"[STORED ZONE] [{r['code']}] {r['name']} -> Lat {r['lat']:.6f}, Lon {r['lon']:.6f} ({r['source']})", flush=True)
            
        conn.commit()
        
        # Verify count
        res = conn.execute(text("SELECT count(*) FROM community_zones;")).scalar()
        print(f"\n[VERIFICATION] Total active zones in PostgreSQL `community_zones`: {res}", flush=True)

if __name__ == "__main__":
    main()
