-- RescueNet PostgreSQL + PostGIS Data Model Schema (`schema.sql`)
-- Platform: RescueNet (Stray Animal Welfare Management Platform)

CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. Community Zones Table
CREATE TABLE IF NOT EXISTS community_zones (
    id SERIAL PRIMARY KEY,
    zone_name VARCHAR(100) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    center_latitude DOUBLE PRECISION NOT NULL,
    center_longitude DOUBLE PRECISION NOT NULL,
    radius_km DOUBLE PRECISION DEFAULT 5.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Users Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    phone_number VARCHAR(50),
    role VARCHAR(50) NOT NULL DEFAULT 'citizen', -- citizen, officer, ngo_admin, volunteer, super_admin
    zone_id INTEGER REFERENCES community_zones(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Complaints / Rescue Cases Table
CREATE TABLE IF NOT EXISTS complaints (
    id SERIAL PRIMARY KEY,
    tracking_code VARCHAR(100) UNIQUE NOT NULL,
    citizen_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    photo_url VARCHAR(500) NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    address VARCHAR(255),
    detected_animal_type VARCHAR(100),
    detection_confidence DOUBLE PRECISION DEFAULT 0.0,
    confirmed_animal_type VARCHAR(100),
    description TEXT,
    priority VARCHAR(50) DEFAULT 'Normal', -- Emergency, Normal
    priority_score DOUBLE PRECISION DEFAULT 0.0,
    priority_reasoning TEXT,
    image_embedding TEXT, -- JSON array string
    reporter_count INTEGER DEFAULT 1,
    status VARCHAR(50) DEFAULT 'New', -- New, Assigned, In Progress, Searching, Resolved, Not Found, Closed
    fft_score DOUBLE PRECISION DEFAULT 0.95,
    clip_score DOUBLE PRECISION DEFAULT 0.92,
    exif_score DOUBLE PRECISION DEFAULT 0.98,
    is_authentic_flag BOOLEAN DEFAULT TRUE,
    is_sos BOOLEAN DEFAULT FALSE,
    search_radius_meters DOUBLE PRECISION DEFAULT 100.0,
    active_until TIMESTAMP WITH TIME ZONE,
    assigned_officer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    assigned_volunteer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Report Co-Reporters / Duplicate Links Table
CREATE TABLE IF NOT EXISTS report_co_reporters (
    id SERIAL PRIMARY KEY,
    report_id INTEGER REFERENCES complaints(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    distance_meters DOUBLE PRECISION,
    similarity_score DOUBLE PRECISION,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Zone Sightings Table
CREATE TABLE IF NOT EXISTS zone_sightings (
    id SERIAL PRIMARY KEY,
    complaint_id INTEGER REFERENCES complaints(id) ON DELETE SET NULL,
    zone_id INTEGER REFERENCES community_zones(id) ON DELETE CASCADE,
    author_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    author_name VARCHAR(150),
    animal_type VARCHAR(100) NOT NULL,
    location VARCHAR(255) NOT NULL,
    notes TEXT,
    photo_url VARCHAR(500),
    corroboration_count INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Sighting Upvotes / Corroborations Table
CREATE TABLE IF NOT EXISTS sighting_upvotes (
    id SERIAL PRIMARY KEY,
    sighting_id INTEGER REFERENCES zone_sightings(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_sighting_user UNIQUE(sighting_id, user_id)
);

-- 7. Community Posts Table
CREATE TABLE IF NOT EXISTS community_posts (
    id SERIAL PRIMARY KEY,
    zone_id INTEGER REFERENCES community_zones(id) ON DELETE CASCADE,
    author_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    author_name VARCHAR(150),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    photo_url VARCHAR(500),
    category VARCHAR(100) DEFAULT 'General',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Adoption Listings Table
CREATE TABLE IF NOT EXISTS adoption_listings (
    id SERIAL PRIMARY KEY,
    ngo_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    name VARCHAR(100) NOT NULL,
    species VARCHAR(50) NOT NULL,
    breed VARCHAR(100),
    age VARCHAR(50),
    gender VARCHAR(20),
    health_status VARCHAR(150),
    temperament_tags TEXT, -- Comma-separated or JSON
    description TEXT,
    photo_url VARCHAR(500) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Adoption Applications Table
CREATE TABLE IF NOT EXISTS adoption_applications (
    id SERIAL PRIMARY KEY,
    listing_id INTEGER REFERENCES adoption_listings(id) ON DELETE CASCADE,
    applicant_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    applicant_name VARCHAR(150) NOT NULL,
    phone VARCHAR(50),
    housing_type VARCHAR(100),
    experience_years VARCHAR(50),
    reason TEXT,
    status VARCHAR(50) DEFAULT 'Applied', -- Applied, Under Review, Approved, Handed Over
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. Volunteers Table
CREATE TABLE IF NOT EXISTS volunteers (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    status VARCHAR(50) DEFAULT 'Available', -- Available, On Mission, Offline
    skill_tags VARCHAR(255),
    current_zone VARCHAR(100),
    distance_km DOUBLE PRECISION DEFAULT 0.5,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. NGOs Table
CREATE TABLE IF NOT EXISTS ngos (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    name VARCHAR(200) NOT NULL,
    contact_email VARCHAR(255),
    phone VARCHAR(50),
    verification_status VARCHAR(50) DEFAULT 'Verified',
    capacity INTEGER DEFAULT 50,
    active_cases_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 12. Donations Table
CREATE TABLE IF NOT EXISTS donations (
    id SERIAL PRIMARY KEY,
    tx_id VARCHAR(100) UNIQUE NOT NULL,
    donor_name VARCHAR(150) DEFAULT 'Anonymous Citizen',
    ngo_id INTEGER REFERENCES ngos(id) ON DELETE SET NULL,
    case_id INTEGER REFERENCES complaints(id) ON DELETE SET NULL,
    amount DOUBLE PRECISION NOT NULL,
    currency VARCHAR(10) DEFAULT 'INR',
    status VARCHAR(50) DEFAULT 'SUCCESS',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 13. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info', -- status, emergency, community, adoption
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 15. Volunteer Tasks Table
CREATE TABLE IF NOT EXISTS volunteer_tasks (
    id SERIAL PRIMARY KEY,
    complaint_id INTEGER REFERENCES complaints(id) ON DELETE CASCADE,
    volunteer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    task_code VARCHAR(100) UNIQUE NOT NULL,
    animal_type VARCHAR(100) NOT NULL,
    priority VARCHAR(50) DEFAULT 'Normal',
    address VARCHAR(255) NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    status VARCHAR(50) DEFAULT 'Assigned',
    instructions TEXT,
    completion_photo VARCHAR(500),
    resolution_notes TEXT,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE
);

