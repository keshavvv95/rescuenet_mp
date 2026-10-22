from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

# Auth Schemas
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    phone_number: Optional[str] = None
    role: Optional[str] = "citizen"

class UserLogin(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    name: str
    email: str
    zone: Optional[str] = "Zone 4 - Central Downtown"

class UserOut(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    phone_number: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# Complaint & AI Schemas
class ComplaintCreate(BaseModel):
    photo_url: str
    latitude: float
    longitude: float
    address: Optional[str] = None
    detected_animal_type: Optional[str] = "Dog"
    detection_confidence: Optional[float] = 0.90
    confirmed_animal_type: Optional[str] = "Dog"
    description: Optional[str] = None
    urgency: Optional[str] = "Normal"
    is_sos: Optional[bool] = False
    image_embedding: Optional[List[float]] = None
    distress_score: Optional[float] = 0.0
    is_ai_generated: Optional[bool] = False
    is_web_image: Optional[bool] = False
    authenticity_status: Optional[str] = None

class TriagePreviewRequest(BaseModel):
    detection_confidence: Optional[float] = 0.0
    description: Optional[str] = ""
    visual_distress_score: Optional[float] = 0.0
    detected_animal_type: Optional[str] = "Dog"
    selected_symptoms: Optional[List[str]] = None
    is_animal_detected: Optional[bool] = None

class DuplicateCheckRequest(BaseModel):
    latitude: float
    longitude: float
    animal_type: Optional[str] = "Dog"
    radius_meters: Optional[float] = 500.0
    time_window_hours: Optional[float] = 3.0

class VideoVerificationRequest(BaseModel):
    frame: str # Base64 image frame

class SightingCreate(BaseModel):
    complaint_id: Optional[int] = None
    animal_type: str
    location: str
    notes: Optional[str] = None
    photo_url: Optional[str] = None

class AdoptionApplyRequest(BaseModel):
    adoption_id: str
    applicant_name: str
    phone: Optional[str] = None
    housing_type: Optional[str] = None
    experience_years: Optional[str] = None
    reason: Optional[str] = None

class CrueltyReportRequest(BaseModel):
    incident_type: str
    location: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    description: str
    evidence_image: Optional[str] = None

class SOSRequest(BaseModel):
    latitude: float
    longitude: float
    note: Optional[str] = "Critical Emergency SOS"
    photo_url: Optional[str] = None
    is_ai_generated: Optional[bool] = False
    is_web_image: Optional[bool] = False
    authenticity_status: Optional[str] = None

class DonationCheckoutRequest(BaseModel):
    donor_name: Optional[str] = "Anonymous Citizen"
    ngo_id: Optional[int] = None
    case_id: Optional[int] = None
    amount: float
    currency: Optional[str] = "INR"
    payment_method: Optional[str] = "UPI"
