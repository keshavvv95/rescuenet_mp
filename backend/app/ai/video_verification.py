import logging
import base64
import os
import json
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
import numpy as np
from PIL import Image

from app.database import SessionLocal
from app import models
from app.ai.detector import detect_animal, mobilenet_classifier, mobilenet_transforms

logger = logging.getLogger(__name__)

SPECIES_FAMILIES = {
    "cow": "bovine",
    "cattle": "bovine",
    "bull": "bovine",
    "calf": "bovine",
    "buffalo": "bovine",
    "water buffalo": "bovine",
    "ox": "bovine",
    "bison": "bovine",
    "dog": "canine",
    "puppy": "canine",
    "hound": "canine",
    "canine": "canine",
    "cat": "feline",
    "kitten": "feline",
    "feline": "feline",
    "horse": "equine",
    "pony": "equine",
    "donkey": "equine",
    "mule": "equine",
    "zebra": "equine",
    "sheep": "caprine",
    "goat": "caprine",
    "lamb": "caprine",
    "ram": "caprine",
    "bird": "avian",
    "duck": "avian",
    "hen": "avian",
    "chicken": "avian",
    "pigeon": "avian",
    "crow": "avian",
    "eagle": "avian",
    "hawk": "avian"
}

def are_species_compatible(species1: str, species2: str) -> bool:
    s1 = (species1 or "").lower().strip()
    s2 = (species2 or "").lower().strip()
    if s1 in ("animal", "stray animal", "unknown", "") or s2 in ("animal", "stray animal", "unknown", ""):
        return True
    if s1 == s2:
        return True
    fam1 = SPECIES_FAMILIES.get(s1)
    fam2 = SPECIES_FAMILIES.get(s2)
    if fam1 and fam2 and fam1 == fam2:
        return True
    return False

def extract_deep_visual_embedding(img_path: str) -> Optional[np.ndarray]:
    """Extracts deep visual representation from MobileNet or zero-centered patch features."""
    if not os.path.exists(img_path):
        return None
    try:
        if mobilenet_classifier is not None and mobilenet_transforms is not None:
            import torch
            img = Image.open(img_path).convert("RGB")
            tensor = mobilenet_transforms(img).unsqueeze(0)
            with torch.no_grad():
                feat = mobilenet_classifier.features(tensor)
                feat = mobilenet_classifier.avgpool(feat)
                vec = torch.flatten(feat, 1)[0].numpy()
                return vec
    except Exception as e:
        logger.warning(f"MobileNet visual embedding extraction exception: {e}")

    try:
        img = Image.open(img_path).convert("RGB").resize((128, 128))
        arr = np.array(img, dtype=np.float32) / 255.0
        patches = []
        for i in range(4):
            for j in range(4):
                p = arr[i*32:(i+1)*32, j*32:(j+1)*32]
                patches.extend(np.mean(p, axis=(0, 1)))
                patches.extend(np.std(p, axis=(0, 1)))
        return np.array(patches, dtype=np.float32)
    except Exception as e:
        logger.error(f"Fallback visual feature extraction error: {e}")
        return None

def compute_biometric_correlation(vec1: np.ndarray, vec2: np.ndarray) -> float:
    """Computes zero-centered Pearson correlation between visual feature vectors."""
    try:
        v1 = vec1 - np.mean(vec1)
        v2 = vec2 - np.mean(vec2)
        norm1 = np.linalg.norm(v1)
        norm2 = np.linalg.norm(v2)
        if norm1 == 0 or norm2 == 0:
            return 0.0
        return float(np.dot(v1, v2) / (norm1 * norm2))
    except Exception:
        return 0.0

def verify_live_video_frame(
    frame_data: str,
    target_complaint_id: Optional[str] = None,
    mode: str = "single_shot"
) -> Dict[str, Any]:
    """
    Module 5: On-Site Live Video Verification Assistant
    Compares officer's live camera frame / photo against target complaint photo using
    YOLOv8 animal/human presence detection, species compatibility filtering, and deep biometric correlation.
    """
    db: Session = SessionLocal()
    mode_label = "Live Stream (Gemini 3.1 Flash Live)" if mode == "live_stream" else "Single-Shot Fallback"

    try:
        # 1. Resolve Target Complaint Case
        if not target_complaint_id:
            comp = db.query(models.Complaint).order_by(models.Complaint.created_at.desc()).first()
        else:
            clean_id = target_complaint_id.replace("RN-", "")
            comp = None
            if clean_id.isdigit():
                comp = db.query(models.Complaint).filter(models.Complaint.id == int(clean_id)).first()
            if not comp:
                comp = db.query(models.Complaint).filter(models.Complaint.tracking_code == target_complaint_id).first()

        if not comp:
            return {
                "match": False,
                "confidence": 0.0,
                "similarity_percentage": 0.0,
                "explanation": "No target complaint case record found for comparison.",
                "mode": mode,
                "target_animal": "Animal"
            }

        target_animal = (comp.confirmed_animal_type or comp.detected_animal_type or "Animal").capitalize()

        # 2. Decode Live Frame
        temp_dir = "static/uploads/temp"
        os.makedirs(temp_dir, exist_ok=True)
        temp_frame_path = os.path.join(temp_dir, "frame_verify_temp.jpg")

        if "," in frame_data:
            frame_bytes = base64.b64decode(frame_data.split(",")[1])
        else:
            try:
                frame_bytes = base64.b64decode(frame_data)
            except Exception:
                frame_bytes = b""

        if not frame_bytes:
            return {
                "match": False,
                "confidence": 0.0,
                "similarity_percentage": 0.0,
                "explanation": "Empty or invalid camera frame received.",
                "mode": mode,
                "target_case_id": f"RN-{comp.id}",
                "target_tracking_code": comp.tracking_code,
                "target_photo_url": comp.photo_url,
                "target_animal": target_animal,
                "target_address": comp.address
            }

        with open(temp_frame_path, "wb") as f:
            f.write(frame_bytes)

        # 3. Detect Animal in Live Frame
        frame_detect = detect_animal(temp_frame_path)
        frame_is_animal = frame_detect.get("is_animal_detected", False)
        frame_animal = frame_detect.get("detected_animal_type", "NO ANIMAL DETECTED")
        frame_is_human_only = frame_detect.get("is_human_only", False)
        frame_conf = frame_detect.get("confidence", 0.0)

        # 4. Check Animal Presence
        if not frame_is_animal or frame_is_human_only or frame_animal == "NO ANIMAL DETECTED":
            if os.path.exists(temp_frame_path):
                try:
                    os.remove(temp_frame_path)
                except Exception:
                    pass

            return {
                "match": False,
                "confidence": 0.0,
                "similarity_percentage": 0.0,
                "explanation": f"NO ANIMAL DETECTED in camera feed ({'Human presence detected' if frame_is_human_only else 'Subject missing'}). Target case {comp.tracking_code} is a {target_animal}. Biometric match rejected.",
                "mode": mode,
                "target_case_id": f"RN-{comp.id}",
                "target_tracking_code": comp.tracking_code,
                "target_photo_url": comp.photo_url,
                "target_animal": target_animal,
                "target_address": comp.address,
                "detected_animal_type": "NO ANIMAL DETECTED",
                "is_animal_detected": False
            }

        # 5. Check Species Compatibility
        if not are_species_compatible(frame_animal, target_animal):
            if os.path.exists(temp_frame_path):
                try:
                    os.remove(temp_frame_path)
                except Exception:
                    pass

            return {
                "match": False,
                "confidence": 0.0,
                "similarity_percentage": 0.0,
                "explanation": f"Species mismatch: Camera detected {frame_animal}, but target case {comp.tracking_code} is a {target_animal}. Biometric match rejected.",
                "mode": mode,
                "target_case_id": f"RN-{comp.id}",
                "target_tracking_code": comp.tracking_code,
                "target_photo_url": comp.photo_url,
                "target_animal": target_animal,
                "target_address": comp.address,
                "detected_animal_type": frame_animal,
                "is_animal_detected": True
            }

        # 6. Both Contain Compatible Animal Species: Run Deep Biometric Verification
        live_embedding = extract_deep_visual_embedding(temp_frame_path)
        if os.path.exists(temp_frame_path):
            try:
                os.remove(temp_frame_path)
            except Exception:
                pass

        target_embedding = None
        local_target_photo = (comp.photo_url or "").lstrip("/")
        if local_target_photo and os.path.exists(local_target_photo):
            target_embedding = extract_deep_visual_embedding(local_target_photo)

        if live_embedding is None or target_embedding is None:
            # Fallback to detection confidence when target photo is missing
            sim_pct = round(float(frame_conf * 60.0), 1)
            matched = False
            return {
                "match": False,
                "confidence": round(float(frame_conf * 0.5), 2),
                "similarity_percentage": sim_pct,
                "explanation": f"Compatible {frame_animal} detected, but target case photo is unavailable for biometric comparison [{mode_label}].",
                "mode": mode,
                "target_case_id": f"RN-{comp.id}",
                "target_tracking_code": comp.tracking_code,
                "target_photo_url": comp.photo_url,
                "target_animal": target_animal,
                "target_address": comp.address,
                "detected_animal_type": frame_animal,
                "is_animal_detected": True
            }

        # Zero-centered Pearson correlation between visual feature vectors
        corr = compute_biometric_correlation(live_embedding, target_embedding)

        # Map correlation to 0-100% similarity:
        # Independent/different animals of same species typically score -0.1 to +0.25 (mapped to 0% - 25%).
        # Highly similar/identical animals score > 0.65 (mapped to 65% - 100%).
        if corr <= 0.15:
            sim_percentage = round(max(0.0, corr) * 40.0, 1)
        else:
            sim_percentage = round(min(100.0, max(0.0, 15.0 + ((corr - 0.15) / 0.85) * 85.0)), 1)

        matched = sim_percentage >= 65.0
        conf_val = round(float(sim_percentage / 100.0), 2)

        if matched:
            explanation_text = (
                f"Likely match for case {comp.tracking_code} ({sim_percentage}%) — "
                f"compatible {target_animal} coat coloration and biometric features confirmed [{mode_label}]."
            )
        else:
            explanation_text = (
                f"Biometric mismatch for case {comp.tracking_code} ({sim_percentage}%) — "
                f"animal coat and visual characteristics differ from target photo [{mode_label}]."
            )

        return {
            "match": bool(matched),
            "confidence": float(conf_val),
            "similarity_percentage": float(sim_percentage),
            "explanation": explanation_text,
            "mode": mode,
            "target_case_id": f"RN-{comp.id}",
            "target_tracking_code": comp.tracking_code,
            "target_photo_url": comp.photo_url,
            "target_animal": target_animal,
            "target_address": comp.address,
            "detected_animal_type": frame_animal,
            "is_animal_detected": True
        }
    except Exception as e:
        logger.error(f"Error during video verification: {e}")
        return {
            "match": False,
            "confidence": 0.0,
            "similarity_percentage": 0.0,
            "explanation": f"Error during verification: {str(e)}",
            "mode": mode
        }
    finally:
        db.close()
