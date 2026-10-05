import math
import json
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
import numpy as np
from app import models

logger = logging.getLogger(__name__)

# Calibrated DINOv3 Similarity Threshold (determined via empirical Test First calibration)
DINOV3_CALIBRATED_THRESHOLD = 0.95

def haversine_distance_meters(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Computes Haversine distance in meters between two lat/lng coordinates."""
    R = 6371000.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    
    a = math.sin(dphi / 2.0)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2.0)**2
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return float(R * c)

def cosine_similarity(v1: List[float], v2: List[float]) -> float:
    """Computes Cosine Similarity between two L2-normalized float embedding vectors."""
    if not v1 or not v2 or len(v1) == 0 or len(v2) == 0:
        return 0.0
    
    try:
        a = np.array(v1, dtype=np.float32)
        b = np.array(v2, dtype=np.float32)
        min_len = min(len(a), len(b))
        a, b = a[:min_len], b[:min_len]
        
        dot_product = float(np.dot(a, b))
        norm_a = float(np.linalg.norm(a))
        norm_b = float(np.linalg.norm(b))
        
        if norm_a == 0 or norm_b == 0:
            return 0.0
            
        sim = dot_product / (norm_a * norm_b)
        return float(max(0.0, min(1.0, sim)))
    except Exception as e:
        logger.error(f"Error computing cosine similarity: {e}")
        return 0.0

def find_duplicate_reports(
    db: Session,
    latitude: float,
    longitude: float,
    image_embedding: Optional[List[float]] = None,
    radius_meters: float = 100.0,
    time_window_hours: float = 48.0,
    similarity_threshold: float = DINOV3_CALIBRATED_THRESHOLD
) -> Dict[str, Any]:
    """
    Module 2: Duplicate Complaint Detection (Dual-Signal Consensus)
    Combines DINOv3 image-to-image similarity with PostGIS spatial radius (100m / 48h).
    
    Rule: Require BOTH DINOv3 similarity (>= 0.95) AND geospatial proximity (<= 100m) to auto-merge ("high").
    If only one signal fires, flag as "needs_review".
    
    API Contract:
    {
      "is_duplicate": bool,
      "confidence": "high" | "needs_review" | "low",
      "matched_complaint_id": string | null,
      "similarity_score": float,
      "distance_meters": float,
      "auto_merge_ready": bool,
      "duplicate_count": int,
      "duplicates": List[Dict]
    }
    """
    if db is None:
        from app.database import SessionLocal
        db = SessionLocal()
        close_db_on_exit = True
    else:
        close_db_on_exit = False

    cutoff_time = datetime.utcnow() - timedelta(hours=time_window_hours)
    
    candidates = db.query(models.Complaint).filter(
        models.Complaint.status.in_(["New", "Assigned", "In Progress", "Searching", "reported", "assigned", "in_progress"]),
        models.Complaint.created_at >= cutoff_time
    ).all()
    
    duplicates = []
    has_high_confidence = False
    matched_id = None
    best_similarity = 0.0
    best_distance = 999999.0
    overall_confidence = "low"
    
    for candidate in candidates:
        dist = haversine_distance_meters(latitude, longitude, candidate.latitude, candidate.longitude)
        
        candidate_emb = []
        if candidate.image_embedding:
            try:
                candidate_emb = json.loads(candidate.image_embedding)
            except Exception:
                candidate_emb = []
                
        sim_score = cosine_similarity(image_embedding or [], candidate_emb)
        
        spatial_signal = dist <= radius_meters
        visual_signal = sim_score >= similarity_threshold
        
        both_passed = spatial_signal and visual_signal
        either_passed = spatial_signal or visual_signal or dist <= 30.0
        
        if both_passed:
            has_high_confidence = True
            if matched_id is None:
                matched_id = str(candidate.id)
                best_similarity = round(sim_score, 4)
                best_distance = round(dist, 1)
            
        if either_passed:
            confidence_level = "high" if both_passed else "needs_review"
            duplicates.append({
                "report_id": candidate.id,
                "matched_complaint_id": str(candidate.id),
                "photo_url": candidate.photo_url,
                "confirmed_animal_type": candidate.confirmed_animal_type or candidate.detected_animal_type,
                "description": candidate.description,
                "status": candidate.status,
                "created_at": str(candidate.created_at),
                "distance_meters": round(dist, 1),
                "similarity_score": round(sim_score, 4),
                "confidence": confidence_level,
                "spatial_signal_passed": spatial_signal,
                "visual_signal_passed": visual_signal,
                "consensus_decision": "Auto-Merge Eligible" if both_passed else "Possible Duplicate - Needs Review"
            })
            if matched_id is None and confidence_level == "needs_review":
                matched_id = str(candidate.id)
                best_similarity = round(sim_score, 4)
                best_distance = round(dist, 1)

    duplicates.sort(key=lambda x: (-x["similarity_score"], x["distance_meters"]))
    
    if has_high_confidence:
        overall_confidence = "high"
    elif len(duplicates) > 0:
        overall_confidence = "needs_review"

    if close_db_on_exit:
        db.close()

    return {
        "is_duplicate": len(duplicates) > 0,
        "confidence": overall_confidence,
        "matched_complaint_id": matched_id,
        "similarity_score": best_similarity,
        "distance_meters": best_distance,
        "auto_merge_ready": has_high_confidence,
        "duplicate_count": len(duplicates),
        "duplicates": duplicates
    }
