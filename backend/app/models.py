from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Boolean, UniqueConstraint
from sqlalchemy.sql import func
from app.database import Base

class CommunityZone(Base):
    __tablename__ = "community_zones"

    id = Column(Integer, primary_key=True, index=True)
    zone_name = Column(String, nullable=False)
    code = Column(String, unique=True, nullable=False)
    center_latitude = Column(Float, nullable=False)
    center_longitude = Column(Float, nullable=False)
    radius_km = Column(Float, default=5.0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    phone_number = Column(String, nullable=True)
    role = Column(String, default="citizen", nullable=False) # citizen, officer, ngo_admin, volunteer, super_admin
    zone_id = Column(Integer, ForeignKey("community_zones.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(Integer, primary_key=True, index=True)
    tracking_code = Column(String, unique=True, index=True, nullable=False)
    citizen_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    photo_url = Column(String, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    address = Column(String, nullable=True)
    detected_animal_type = Column(String, nullable=True)
    detection_confidence = Column(Float, default=0.0)
    confirmed_animal_type = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    priority = Column(String, default="ROUTINE") # CRITICAL, HIGH, ROUTINE
    priority_score = Column(Float, default=0.0)
    priority_reasoning = Column(Text, nullable=True)
    requires_human_review = Column(Boolean, default=False)
    image_embedding = Column(Text, nullable=True)
    reporter_count = Column(Integer, default=1)
    status = Column(String, default="New") # New, Assigned, In Progress, Searching, Resolved, Not Found, Closed
    
    # Consensus-based authenticity check metrics
    fft_score = Column(Float, default=0.95)
    clip_score = Column(Float, default=0.92)
    exif_score = Column(Float, default=0.98)
    is_authentic_flag = Column(Boolean, default=True)
    is_ai_generated = Column(Boolean, default=False)
    is_web_image = Column(Boolean, default=False)
    authenticity_status = Column(String, default="AUTHENTIC FIELD PHOTO VERIFIED")
    
    is_sos = Column(Boolean, default=False)
    search_radius_meters = Column(Float, default=100.0)
    active_until = Column(DateTime(timezone=True), nullable=True)
    
    assigned_officer_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    assigned_volunteer_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class ReportCoReporter(Base):
    __tablename__ = "report_co_reporters"

    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, ForeignKey("complaints.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    distance_meters = Column(Float, nullable=True)
    similarity_score = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class ZoneSighting(Base):
    __tablename__ = "zone_sightings"

    id = Column(Integer, primary_key=True, index=True)
    complaint_id = Column(Integer, ForeignKey("complaints.id"), nullable=True)
    zone_id = Column(Integer, ForeignKey("community_zones.id"), nullable=True)
    author_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    author_name = Column(String, nullable=True)
    animal_type = Column(String, nullable=False)
    location = Column(String, nullable=False)
    notes = Column(Text, nullable=True)
    photo_url = Column(String, nullable=True)
    corroboration_count = Column(Integer, default=1)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class SightingUpvote(Base):
    __tablename__ = "sighting_upvotes"

    id = Column(Integer, primary_key=True, index=True)
    sighting_id = Column(Integer, ForeignKey("zone_sightings.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class CommunityPost(Base):
    __tablename__ = "community_posts"

    id = Column(Integer, primary_key=True, index=True)
    zone_id = Column(Integer, ForeignKey("community_zones.id"), nullable=True)
    author_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    author_name = Column(String, nullable=True)
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    photo_url = Column(String, nullable=True)
    category = Column(String, default="General")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class AdoptionListing(Base):
    __tablename__ = "adoption_listings"

    id = Column(Integer, primary_key=True, index=True)
    ngo_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    name = Column(String, nullable=False)
    species = Column(String, nullable=False)
    breed = Column(String, nullable=True)
    age = Column(String, nullable=True)
    gender = Column(String, nullable=True)
    health_status = Column(String, nullable=True)
    temperament_tags = Column(Text, nullable=True)
    description = Column(Text, nullable=True)
    photo_url = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class AdoptionApplication(Base):
    __tablename__ = "adoption_applications"

    id = Column(Integer, primary_key=True, index=True)
    listing_id = Column(Integer, ForeignKey("adoption_listings.id"), nullable=False)
    applicant_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    applicant_name = Column(String, nullable=False)
    phone = Column(String, nullable=True)
    housing_type = Column(String, nullable=True)
    experience_years = Column(String, nullable=True)
    reason = Column(Text, nullable=True)
    status = Column(String, default="Applied") # Applied, Under Review, Approved, Handed Over
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Volunteer(Base):
    __tablename__ = "volunteers"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    status = Column(String, default="Available")
    skill_tags = Column(String, nullable=True)
    current_zone = Column(String, nullable=True)
    distance_km = Column(Float, default=0.5)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class NGO(Base):
    __tablename__ = "ngos"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    name = Column(String, nullable=False)
    contact_email = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    verification_status = Column(String, default="Verified")
    capacity = Column(Integer, default=50)
    active_cases_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Donation(Base):
    __tablename__ = "donations"

    id = Column(Integer, primary_key=True, index=True)
    tx_id = Column(String, unique=True, index=True, nullable=False)
    donor_name = Column(String, default="Anonymous Citizen")
    ngo_id = Column(Integer, ForeignKey("ngos.id"), nullable=True)
    case_id = Column(Integer, ForeignKey("complaints.id"), nullable=True)
    amount = Column(Float, nullable=False)
    currency = Column(String, default="INR")
    payment_method = Column(String, default="UPI")
    status = Column(String, default="SUCCESS")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String, default="info")
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class VolunteerTask(Base):
    __tablename__ = "volunteer_tasks"

    id = Column(Integer, primary_key=True, index=True)
    complaint_id = Column(Integer, ForeignKey("complaints.id"), nullable=False)
    volunteer_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    task_code = Column(String, unique=True, index=True, nullable=False)
    animal_type = Column(String, nullable=False)
    priority = Column(String, default="Normal")
    address = Column(String, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    status = Column(String, default="Assigned")
    instructions = Column(Text, nullable=True)
    completion_photo = Column(String, nullable=True)
    resolution_notes = Column(Text, nullable=True)
    assigned_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)

class CrueltyReport(Base):
    __tablename__ = "cruelty_reports"

    id = Column(Integer, primary_key=True, index=True)
    reporter_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    incident_type = Column(String, nullable=False)
    location = Column(String, nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    description = Column(Text, nullable=False)
    evidence_photo_url = Column(String, nullable=True)
    status = Column(String, default="Escalated to NGO Legal Desk")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

