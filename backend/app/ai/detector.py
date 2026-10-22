import os
import logging
from typing import Tuple, List, Dict, Any
from PIL import Image
import numpy as np

logger = logging.getLogger(__name__)

ai_detector_model = None
model_name_used = "none"

try:
    from ultralytics import YOLO
    
    yolo_path = "yolov8n.pt" # Using relative path to let ultralytics handle download
    ai_detector_model = YOLO(yolo_path)
    model_name_used = "yolov8n"
    logger.info(f"Loaded YOLOv8 animal detector from {yolo_path}")
except Exception as e:
    logger.warning(f"AI Detector model loading exception: {e}")

mobilenet_classifier = None
mobilenet_transforms = None
imagenet_categories = []

try:
    import torch
    from torchvision.models import mobilenet_v3_small, MobileNet_V3_Small_Weights
    _weights = MobileNet_V3_Small_Weights.DEFAULT
    mobilenet_classifier = mobilenet_v3_small(weights=_weights).eval()
    mobilenet_transforms = _weights.transforms()
    imagenet_categories = _weights.meta.get('categories', [])
    logger.info("Loaded MobileNet v3 Small animal species classifier fallback")
except Exception as e:
    logger.warning(f"MobileNet model loading exception: {e}")

ANIMAL_CLASS_MAP = {
    "cat": "Cat",
    "dog": "Dog",
    "cow": "Cow",
    "cattle": "Cow",
    "bull": "Cow",
    "calf": "Cow",
    "horse": "Horse",
    "sheep": "Sheep",
    "goat": "Goat",
    "bird": "Bird",
    "elephant": "Elephant",
    "bear": "Bear",
    "zebra": "Horse",
    "giraffe": "Giraffe"
}

DOG_KEYWORDS = {'dog', 'terrier', 'hound', 'retriever', 'shepherd', 'spaniel', 'poodle', 'collie', 'bulldog', 'pug', 'corgi', 'husky', 'malamute', 'dalmatian', 'dingo', 'dhole', 'mastiff', 'whippet', 'beagle', 'boxer', 'rottweiler', 'chihuahua', 'pinscher', 'kelpie', 'coonhound'}
CAT_KEYWORDS = {'cat', 'tabby', 'persian', 'siamese', 'lynx', 'cougar', 'panther', 'leopard', 'cheetah', 'lion', 'tiger'}
COW_KEYWORDS = {'ox', 'cow', 'bull', 'cattle', 'water buffalo', 'bison'}
HORSE_KEYWORDS = {'horse', 'sorrel', 'zebra', 'pony', 'stallion'}
SHEEP_KEYWORDS = {'sheep', 'ram', 'goat', 'ibex'}
BIRD_KEYWORDS = {'bird', 'duck', 'hen', 'rooster', 'eagle', 'hawk', 'pigeon', 'owl', 'sparrow', 'crane', 'peacock', 'vulture', 'parrot', 'ostrich', 'penguin', 'flamingo'}

def classify_species_fallback(target_path: str) -> Tuple[str, float]:
    """Uses MobileNet v3 to classify animal species when YOLO bounding box confidence is low or uncropped."""
    if mobilenet_classifier is None or mobilenet_transforms is None or not imagenet_categories:
        return "Unknown", 0.0
    try:
        import torch
        img = Image.open(target_path).convert("RGB")
        tensor = mobilenet_transforms(img).unsqueeze(0)
        with torch.no_grad():
            probs = torch.softmax(mobilenet_classifier(tensor), dim=1)[0]
            top_probs, top_indices = torch.topk(probs, 5)
            
            for p, idx in zip(top_probs, top_indices):
                c_name = imagenet_categories[idx.item()].lower()
                prob = float(p.item())
                if any(k in c_name for k in DOG_KEYWORDS):
                    return "Dog", prob
                if any(k in c_name for k in CAT_KEYWORDS):
                    return "Cat", prob
                if any(k in c_name for k in COW_KEYWORDS):
                    return "Cow", prob
                if any(k in c_name for k in HORSE_KEYWORDS):
                    return "Horse", prob
                if any(k in c_name for k in SHEEP_KEYWORDS):
                    return "Sheep / Goat", prob
                if any(k in c_name for k in BIRD_KEYWORDS):
                    return "Bird", prob
    except Exception as e:
        logger.error(f"MobileNet classification fallback error: {e}")
    return "Unknown", 0.0

def extract_image_embedding(image_path: str) -> List[float]:
    """Extracts a 128-dimensional normalized feature embedding for cosine similarity."""
    try:
        clean_path = image_path.lstrip("/")
        target_path = clean_path if os.path.exists(clean_path) else image_path
        
        img = Image.open(target_path).convert("RGB").resize((128, 128))
        arr = np.array(img, dtype=np.float32) / 255.0
        
        means = np.mean(arr, axis=(0, 1))
        stds = np.std(arr, axis=(0, 1))
        mins = np.min(arr, axis=(0, 1))
        maxs = np.max(arr, axis=(0, 1))
        
        grid_feats = []
        h, w, _ = arr.shape
        gh, gw = h // 4, w // 4
        for i in range(4):
            for j in range(4):
                patch = arr[i*gh:(i+1)*gh, j*gw:(j+1)*gw]
                grid_feats.extend(np.mean(patch, axis=(0, 1)))
                grid_feats.extend(np.std(patch, axis=(0, 1)))
                
        raw_embedding = np.concatenate([means, stds, mins, maxs, grid_feats[:116]])
        norm = np.linalg.norm(raw_embedding)
        if norm > 0:
            raw_embedding = raw_embedding / norm
        return [float(x) for x in raw_embedding]
    except Exception as e:
        logger.error(f"Error extracting image embedding: {e}")
        return [0.0] * 128

def extract_visual_distress_cue(image_path: str) -> float:
    """
    EXPERIMENTAL ONLY: Detects concentration of non-specific red chromatic hues.
    WARNING: Red pixels do NOT prove blood, wound, or trauma. This signal is
    strictly non-decisive and flagged as an unvalidated experimental cue.
    """
    try:
        clean_path = image_path.lstrip("/")
        target_path = clean_path if os.path.exists(clean_path) else image_path
        
        img = Image.open(target_path).convert("RGB").resize((100, 100))
        arr = np.array(img, dtype=np.float32)
        r, g, b = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2]
        red_dominance = (r > 100) & (r > (g * 1.05)) & (r > (b * 1.05))
        red_ratio = np.mean(red_dominance)
        
        score = float(min(1.0, red_ratio * 20.0))
        return round(score, 2)
    except Exception as e:
        logger.error(f"Error checking visual distress cues: {e}")
        return 0.0

def detect_animal(image_path: str) -> Dict[str, Any]:
    """
    Runs inference on uploaded image using YOLOv8 object detection
    and MobileNet v3 deep species classification fallback for animals.
    Separates human-only frames, returning 'NO ANIMAL DETECTED' with 0.0 confidence.
    """
    clean_path = image_path.lstrip("/")
    target_path = clean_path if os.path.exists(clean_path) else image_path
    
    embedding = extract_image_embedding(target_path)
    
    best_detect = "Unknown"
    best_conf = 0.0
    detected_model = model_name_used
    person_detected = False
    person_conf = 0.0

    if ai_detector_model is not None and os.path.exists(target_path):
        try:
            results = ai_detector_model(target_path, conf=0.15, verbose=False)
            for r in results:
                for box in r.boxes:
                    cls_id = int(box.cls[0].item())
                    conf = float(box.conf[0].item())
                    class_name = r.names.get(cls_id, "").lower()
                    
                    if class_name == "person":
                        if conf > person_conf:
                            person_conf = conf
                            person_detected = True
                        continue
                        
                    mapped = ANIMAL_CLASS_MAP.get(class_name)
                    if mapped and conf > best_conf:
                        best_conf = conf
                        best_detect = mapped
        except Exception as e:
            logger.error(f"AI Model inference error: {e}")

    # Human-only frame check: If person is detected and NO animal was detected by YOLO,
    # do NOT invoke animal fallback classifier (avoids false-positive breed classification on humans).
    is_human_only = person_detected and best_detect == "Unknown"

    # If YOLO didn't detect an animal and not a human-only frame, invoke MobileNet species classifier
    if not is_human_only and (best_detect == "Unknown" or best_conf < 0.35) and os.path.exists(target_path):
        fallback_animal, fallback_conf = classify_species_fallback(target_path)
        if fallback_animal != "Unknown" and fallback_conf >= 0.25:
            if best_detect == "Unknown" or fallback_conf > best_conf:
                best_detect = fallback_animal
                best_conf = fallback_conf
                detected_model = "yolov8n + mobilenet_v3"

    is_animal_found = (best_detect != "Unknown" and not is_human_only)
    final_animal = best_detect.capitalize() if is_animal_found else "NO ANIMAL DETECTED"
    final_conf = round(best_conf, 2) if is_animal_found else 0.0

    # Experimental visual distress cue (only if an animal is detected)
    distress_score = 0.0
    if is_animal_found:
        distress_score = extract_visual_distress_cue(target_path)

    return {
        "detected_animal_type": final_animal,
        "is_animal_detected": is_animal_found,
        "confidence": final_conf,
        "is_human_only": is_human_only,
        "model_used": detected_model,
        "embedding": embedding,
        "distress_score": distress_score,
        "experimental_distress_signal": distress_score
    }
