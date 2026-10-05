import re
from typing import Tuple, Dict, Any, List

EMERGENCY_KEYWORDS = {
    "bleeding": 25.0,
    "blood": 20.0,
    "injured": 25.0,
    "injury": 20.0,
    "hit": 25.0,
    "accident": 25.0,
    "unconscious": 30.0,
    "dying": 30.0,
    "fracture": 25.0,
    "broken": 20.0,
    "severe": 20.0,
    "critical": 25.0,
    "pain": 15.0,
    "attacked": 25.0,
    "wound": 20.0,
    "vehicle": 15.0,
    "car": 15.0,
    "truck": 15.0,
    "rabid": 25.0,
    "urgent": 20.0,
    "emergency": 25.0
}

def calculate_priority_score(
    detection_confidence: float,
    description: str,
    visual_distress_score: float = 0.0
) -> Dict[str, Any]:
    """
    Module 4: AI Priority Scoring Engine (Rule-Based Auditor with Human-Readable Reasoning)
    Computes an explainable AI priority score (0.0 to 100.0) combining:
    1. Detection confidence (0-30 points)
    2. Emergency keywords in description (0-50 points)
    3. Visual distress heuristic (0-20 points)

    API Contract:
    {
      "priority": "emergency" | "normal",
      "score": float,
      "reasoning": string
    }
    """
    reasons: List[str] = []
    
    # 1. Detection Confidence Component (max 30 pts)
    conf = float(detection_confidence or 0.0)
    conf_points = round(conf * 30.0, 1)
    reasons.append(f"AI Detection Confidence ({int(conf * 100)}%): +{conf_points} pts")
    
    # 2. Emergency Keyword Extraction (max 50 pts)
    text = (description or "").lower()
    keyword_score = 0.0
    matched_words = []
    
    for kw, val in EMERGENCY_KEYWORDS.items():
        if re.search(r'\b' + re.escape(kw) + r'\b', text):
            matched_words.append(kw)
            keyword_score += val

    keyword_points = min(50.0, round(keyword_score, 1))
    if matched_words:
        reasons.append(f"Emergency Keywords matched ({', '.join(matched_words)}): +{keyword_points} pts")
    else:
        reasons.append("No high-risk emergency keywords found in description: +0 pts")

    # 3. Visual Distress Heuristic (max 20 pts)
    distress = float(visual_distress_score or 0.0)
    distress_points = round(distress * 20.0, 1)
    if distress_points > 0:
        reasons.append(f"Visual Distress / Wound Heuristic: +{distress_points} pts")
    else:
        reasons.append("Visual Distress / Wound Heuristic: +0 pts")

    total_score = min(100.0, round(conf_points + keyword_points + distress_points, 1))
    
    # Priority Level Decision Threshold (50.0)
    priority_level = "emergency" if total_score >= 50.0 else "normal"
    
    reasoning_summary = f"Priority Score: {total_score}/100 [{priority_level.upper()}]. " + " | ".join(reasons)
    
    return {
        "priority": priority_level,
        "score": float(total_score),
        "reasoning": reasoning_summary
    }
