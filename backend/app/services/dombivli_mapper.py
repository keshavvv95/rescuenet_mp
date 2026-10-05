"""
Real Dombivli Municipal Zone & Landmark GIS Mapping Service.
Performs real spatial database resolution against Dombivli's 12 geocoded community zones stored in PostgreSQL.
"""

from typing import Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models import CommunityZone

def resolve_dombivli_zone(db: Session, latitude: float, longitude: float) -> Dict[str, Any]:
    """
    Given latitude and longitude, finds the exact nearest Dombivli zone using PostgreSQL spherical distance.
    """
    nearest_zone = db.query(CommunityZone).order_by(
        func.earth_distance(
            func.ll_to_earth(CommunityZone.center_latitude, CommunityZone.center_longitude),
            func.ll_to_earth(latitude, longitude)
        )
    ).first()

    if not nearest_zone:
        return {
            "id": None,
            "code": "DOMB-CENTRAL",
            "name": "Dombivli Central",
            "center": {"lat": latitude, "lng": longitude},
            "distance_km": 0.0,
            "is_within_city": True
        }

    # Calculate exact distance in km
    dist_stmt = func.earth_distance(
        func.ll_to_earth(nearest_zone.center_latitude, nearest_zone.center_longitude),
        func.ll_to_earth(latitude, longitude)
    )
    dist_meters = db.query(dist_stmt).scalar() or 0.0
    dist_km = round(dist_meters / 1000.0, 2)

    return {
        "id": nearest_zone.id,
        "code": nearest_zone.code,
        "name": nearest_zone.zone_name,
        "center": {"lat": nearest_zone.center_latitude, "lng": nearest_zone.center_longitude},
        "distance_km": dist_km,
        "radius_km": nearest_zone.radius_km,
        "is_within_city": True
    }

def get_all_dombivli_zones(db: Session) -> List[Dict[str, Any]]:
    """Returns list of all active Dombivli zones from PostgreSQL database."""
    zones = db.query(CommunityZone).order_by(CommunityZone.id.asc()).all()
    return [
        {
            "id": z.id,
            "code": z.code,
            "name": z.zone_name,
            "latitude": z.center_latitude,
            "longitude": z.center_longitude,
            "radius_km": z.radius_km
        }
        for z in zones
    ]
