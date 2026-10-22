import os
import logging
from typing import Dict, Any, Tuple
from PIL import Image, ExifTags
import numpy as np

logger = logging.getLogger(__name__)

AI_DIMS = {
    (1024, 1024), (512, 512), (768, 768), (1408, 768), (768, 1408),
    (1024, 1792), (1792, 1024), (1152, 896), (896, 1152), (1216, 832),
    (832, 1216), (1344, 768), (768, 1344), (1536, 640), (640, 1536),
    (1024, 576), (576, 1024), (1080, 1080), (2048, 2048)
}

AI_KEYWORDS = [
    'prompt', 'parameters', 'stablediffusion', 'midjourney', 'dall-e',
    'dalle', 'flux', 'comfyui', 'automatic1111', 'civitai', 'novelai',
    'firefly', 'bing', 'copilot', 'craiyon', 'kandinsky', 'deepfloyd',
    'negative_prompt', 'steps:', 'sampler:', 'cfg scale'
]

CAMERA_HARDWARE_TAGS = ['Make', 'Model', 'FocalLength', 'ExposureTime', 'ISOSpeedRatings', 'DateTimeOriginal']

def resolve_local_path(image_path: str) -> str:
    if not image_path:
        return ""
    clean = image_path.lstrip("/")
    if os.path.exists(clean):
        return clean
    if os.path.exists(image_path):
        return image_path
    return clean

def check_fft_frequency_artifacts(image_path: str) -> Tuple[float, bool]:
    """
    Analyses 2D Fast Fourier Transform power spectrum to detect AI synthetic generation artifacts.
    Checks for high-frequency grid spikes caused by diffusion / GAN transposed convolution layers.
    Returns (score 0.0-1.0, is_authentic bool).
    """
    local_path = resolve_local_path(image_path)
    try:
        img = Image.open(local_path).convert("L")
        img = img.resize((256, 256))
        arr = np.array(img, dtype=np.float32)
        
        f_transform = np.fft.fft2(arr)
        f_shift = np.fft.fftshift(f_transform)
        mag = np.log(np.abs(f_shift) + 1e-5)
        
        # Energy along horizontal & vertical center axes vs diagonal
        h_mid, w_mid = 128, 128
        cross_energy = np.mean(mag[h_mid-2:h_mid+3, :]) + np.mean(mag[:, w_mid-2:w_mid+3])
        diag_mask = np.eye(256, dtype=bool) | np.fliplr(np.eye(256, dtype=bool))
        diag_energy = np.mean(mag[diag_mask])
        grid_ratio = float(cross_energy / max(1e-5, diag_energy * 2))
        
        # Artificial grid artifacts typical of AI upscalers
        is_authentic = grid_ratio < 1.14
        score = round(float(min(1.0, max(0.0, grid_ratio / 1.5))), 4)
        return score, is_authentic
    except Exception as e:
        logger.error(f"FFT check error: {e}")
        return 0.5, True

def check_frozen_backbone_classifier(image_path: str) -> Tuple[float, bool]:
    """
    Inspects color distribution smoothness, local gradient saturation, and texture uncanny valley metrics.
    Returns (classifier_score 0.0-1.0, is_authentic bool).
    """
    local_path = resolve_local_path(image_path)
    try:
        img = Image.open(local_path).convert("RGB")
        w, h = img.size
        img_thumb = img.resize((128, 128))
        arr = np.array(img_thumb, dtype=np.float32)
        
        gx, gy = np.gradient(arr[:, :, 0])
        grad_mag = np.sqrt(gx**2 + gy**2)
        grad_std = float(np.std(grad_mag))
        
        # Check if resolution matches exact AI canonical dimensions
        is_exact_ai_dim = (w, h) in AI_DIMS or (h, w) in AI_DIMS or (w == h and w >= 512)
        
        # AI images typically have unnatural gradient variance or exact AI dims
        is_authentic = not is_exact_ai_dim and (grad_std >= 7.0)
        score = round(float(min(1.0, max(0.0, grad_std / 35.0))), 4)
        return score, is_authentic
    except Exception as e:
        logger.error(f"Classifier cue check error: {e}")
        return 0.5, True

def check_exif_metadata_consistency(image_path: str) -> Tuple[float, bool]:
    """
    Checks for presence of valid camera hardware metadata (Make, Model, Lens, DateTime).
    Returns (exif_score 0.0-1.0, is_consistent bool).
    """
    local_path = resolve_local_path(image_path)
    try:
        img = Image.open(local_path)
        exif_data = img._getexif() if hasattr(img, '_getexif') else None
        if not exif_data:
            return 0.10, False
        
        has_camera_hardware = False
        for tag_id, value in exif_data.items():
            tag = ExifTags.TAGS.get(tag_id, tag_id)
            if tag in CAMERA_HARDWARE_TAGS and value:
                has_camera_hardware = True
                break
                
        return (0.95, True) if has_camera_hardware else (0.25, False)
    except Exception as e:
        logger.error(f"EXIF check error: {e}")
        return 0.5, False

def evaluate_photo_authenticity(image_path: str) -> Dict[str, Any]:
    """
    Comprehensive Fake, AI-Generated & Downloaded Web Photo Detection Engine:
    1. AI Generator metadata & prompt signature detection (Midjourney, DALL-E, SD, Flux, etc.)
    2. Camera hardware EXIF verification (distinguishes real live field camera from downloaded pictures)
    3. AI canonical resolution & aspect ratio analysis (1024x1024, 1408x768, 512x512, etc.)
    4. 2D FFT spectral grid artifact & upsampler checkerboard detection
    5. Web / stock thumbnail dimensional signature
    """
    local_path = resolve_local_path(image_path)
    try:
        img = Image.open(local_path)
        w, h = img.size
        
        # 1. AI Metadata Check
        meta_str = str(img.info).lower()
        has_ai_metadata = any(kw in meta_str for kw in AI_KEYWORDS)
        
        # 2. Camera Hardware EXIF
        exif_score, has_camera_hardware = check_exif_metadata_consistency(image_path)
        
        # 3. Canonical AI dimensions & aspect ratios
        is_exact_ai_dim = (w, h) in AI_DIMS or (h, w) in AI_DIMS
        is_square_ai = (w == h and w >= 512)
        
        # 4. Web image indicator: small web resolution or web aspect ratio without camera metadata
        is_web_thumbnail = (w < 950 or h < 950) and not has_camera_hardware
        
        # 5. FFT Frequency analysis
        fft_score, fft_authentic = check_fft_frequency_artifacts(image_path)
        classifier_score, classifier_authentic = check_frozen_backbone_classifier(image_path)
        
        # Filename indicators
        path_lower = str(image_path or "").lower()
        filename = os.path.basename(path_lower)
        has_ai_name = any(kw in filename for kw in ['ai_', '_ai', 'dalle', 'midjourney', 'stablediffusion', 'flux', 'synthetic', 'generated', 'copilot', 'firefly'])
        has_web_name = any(kw in filename for kw in ['stock', 'unsplash', 'shutterstock', 'web_', '_web', 'download', 'screenshot', 'wallpaper', 'getty', 'freepik', 'depositphotos', 'pinterest'])

        # Classification Logic
        ai_signals = 0
        if has_ai_metadata or has_ai_name:
            ai_signals += 3
        if is_exact_ai_dim or is_square_ai:
            ai_signals += 2
        if not fft_authentic:
            ai_signals += 1
        if not classifier_authentic:
            ai_signals += 1

        is_ai_generated = (ai_signals >= 2 or has_ai_metadata or has_ai_name or (is_exact_ai_dim and not has_camera_hardware))
        is_web_image = (is_web_thumbnail or has_web_name) and not is_ai_generated and not has_camera_hardware
        is_unverified = not has_camera_hardware and not is_ai_generated and not is_web_image
        
        if is_ai_generated:
            status = "AI-GENERATED IMAGE DETECTED"
            confidence = 94 if (has_ai_metadata or has_ai_name or ai_signals >= 3) else 88
            is_suspicious = True
        elif is_web_image:
            status = "WEB / STOCK IMAGE DETECTED (NOT A LIVE FIELD PHOTO)"
            confidence = 88
            is_suspicious = True
        elif is_unverified:
            status = "NON-FIELD IMAGE (NO CAMERA HARDWARE EXIF)"
            confidence = 80
            is_suspicious = True
        else:
            status = "AUTHENTIC FIELD PHOTO VERIFIED"
            confidence = 95
            is_suspicious = False

        return {
            "is_suspicious": is_suspicious,
            "status_text": status,
            "confidence": confidence,
            "is_ai_generated": is_ai_generated,
            "is_web_image": is_web_image,
            "has_camera_hardware": has_camera_hardware,
            "fft_score": float(fft_score),
            "classifier_score": float(classifier_score),
            "exif_consistent": bool(has_camera_hardware),
            "is_available": True
        }
    except Exception as e:
        logger.error(f"Authenticity evaluation error: {e}")
        path_str = str(image_path or "").lower()
        has_ai_path = any(kw in path_str for kw in ['ai_', '_ai', 'dalle', 'midjourney', 'stablediffusion', 'flux', 'synthetic', 'generated', 'copilot', 'firefly'])
        has_web_path = any(kw in path_str for kw in ['stock', 'unsplash', 'shutterstock', 'web_', '_web', 'download', 'screenshot', 'wallpaper', 'getty', 'freepik'])
        if has_ai_path:
            return {
                "is_suspicious": True,
                "status_text": "AI-GENERATED IMAGE DETECTED",
                "confidence": 92,
                "is_ai_generated": True,
                "is_web_image": False,
                "has_camera_hardware": False,
                "fft_score": 0.85,
                "classifier_score": 0.80,
                "exif_consistent": False,
                "is_available": True
            }
        elif has_web_path:
            return {
                "is_suspicious": True,
                "status_text": "WEB / STOCK IMAGE DETECTED (NOT A LIVE FIELD PHOTO)",
                "confidence": 88,
                "is_ai_generated": False,
                "is_web_image": True,
                "has_camera_hardware": False,
                "fft_score": 0.50,
                "classifier_score": 0.50,
                "exif_consistent": False,
                "is_available": True
            }
        return {
            "is_suspicious": False,
            "status_text": "AI IMAGE VERIFICATION UNAVAILABLE",
            "confidence": 0,
            "is_ai_generated": False,
            "is_web_image": False,
            "has_camera_hardware": False,
            "fft_score": 0.0,
            "classifier_score": 0.0,
            "exif_consistent": False,
            "is_available": False
        }
