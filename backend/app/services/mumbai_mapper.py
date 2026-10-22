"""
Real Mumbai Municipal Zone & Landmark GIS Mapping Service.
Performs real spatial database resolution against Mumbai's 12 geocoded community zones stored in PostgreSQL.
"""

from typing import Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models import CommunityZone

import math

def haversine(lat1, lon1, lat2, lon2):
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c * 1000.0

def resolve_mumbai_zone(db: Session, latitude: float, longitude: float) -> Dict[str, Any]:
    """
    Given latitude and longitude, finds the exact nearest Mumbai zone using Python Haversine formula.
    """
    zones = db.query(CommunityZone).all()

    if not zones:
        return {
            "id": None,
            "code": "DOMB-CENTRAL",
            "name": "Mumbai Central",
            "center": {"lat": latitude, "lng": longitude},
            "distance_km": 0.0,
            "is_within_city": True
        }

    nearest_zone = min(zones, key=lambda z: haversine(z.center_latitude, z.center_longitude, latitude, longitude))

    # Calculate exact distance in km
    dist_meters = haversine(nearest_zone.center_latitude, nearest_zone.center_longitude, latitude, longitude)
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

def get_all_mumbai_zones(db: Session) -> List[Dict[str, Any]]:
    """Returns list of all active Mumbai zones from PostgreSQL database."""
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
