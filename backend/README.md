# RescueNet Backend — API, Database & AI Engine (`rescuenet-backend`)

**RescueNet** is the core REST API, PostgreSQL/PostGIS database, and AI decision-engine service powering the RescueNet Stray Animal Welfare Platform.

---

## 🛠️ Tech Stack & Architecture

- **Framework:** FastAPI (Python 3.10+) with auto-generated OpenAPI 3.0 specification (`/docs`)
- **Database:** PostgreSQL with PostGIS extension for spatial radius duplicate queries and density heatmaps (SQL fallback math included)
- **AI/ML Decision Engines:**
  - **Object Detection:** RF-DETR / YOLOv8 animal species classifier (`app/ai/detector.py`)
  - **Consensus-Based Photo Authenticity:** 2-of-3 Consensus Voting combining 2D Fast Fourier Transform (FFT) frequency-artifact check, CLIP generative cue detector, and EXIF metadata consistency check (`app/ai/authenticity.py`)
  - **Consensus-Based Duplicate Detection:** Dual-signal spatial radius query + CLIP/CNN feature embedding cosine similarity match (`app/ai/duplicate_detector.py`)
  - **Explainable Priority Scoring Engine:** Rule-based scoring combining detection confidence + medical keyword extraction + visual distress score (`app/ai/priority_engine.py`)
  - **On-Site Live Video Verification:** Multimodal vision biometric matching (`app/ai/video_verification.py`)
- **Auth:** JWT authentication with role-based access control middleware (`Citizen`, `Officer`, `NGO Admin`, `Volunteer`, `Super Admin`)

---

## 🚀 Quick Setup & Local Execution

### 1. Environment Setup
Create a virtual environment and install dependencies:
```bash
cd backend
python -m venv venv
.\venv\Scripts\activate  # Windows
pip install -r requirements.txt
```

### 2. Database Initialization & Seeding
Set environment variables in `.env` (or use default PostgreSQL connection):
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:2025/pashurakshak_db
JWT_SECRET=supersecretjwtkeypashurakshak123!
```

Run database migration & seed data script:
```bash
python seed_data.py
```

### 3. Start FastAPI Server
```bash
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Interactive OpenAPI Swagger Documentation will be live at:
- **Swagger UI:** `http://localhost:8000/docs`
- **ReDoc:** `http://localhost:8000/redoc`
- **OpenAPI Schema JSON:** `http://localhost:8000/openapi.json`

---

## 📄 Database Schema & ER Diagram

Raw PostGIS SQL schema definition is provided in [`schema.sql`](file:///c:/Users/athar/OneDrive/Desktop/PashuRakshak/backend/schema.sql).

Tables:
1. `community_zones`
2. `users`
3. `complaints`
4. `report_co_reporters`
5. `zone_sightings`
6. `sighting_upvotes`
7. `community_posts`
8. `adoption_listings`
9. `adoption_applications`
10. `volunteers`
11. `ngos`
12. `donations`
13. `notifications`
14. `cruelty_reports`

---

## 🔍 Code Simplifications (`// SIMPLIFIED:` Markers)

1. `app/ai/detector.py` — `detect_animal()`: Uses YOLOv8 / color-texture feature extractor. Can be swapped for fine-tuned RF-DETR weights.
2. `app/ai/video_verification.py` — `verify_live_video_frame()`: Operates in single-shot photo comparison mode when real-time WebRTC streaming bandwidth/quota is constrained.
3. `app/routers/analytics_donations.py` — `donation_checkout()`: Performs server-side test-mode payment verification (Razorpay/Stripe mock).
