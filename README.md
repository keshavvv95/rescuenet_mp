# RescueNet — AI-Assisted Stray Animal Welfare & Rescue Platform (Mumbai Metropolitan Region)

RescueNet is a production-grade, full-stack AI-assisted Stray Animal Welfare Management Platform designed for the **Mumbai Metropolitan Region (MMR)** (spanning Brihanmumbai Municipal Corporation / BMC, Navi Mumbai Municipal Corporation / NMMC, Thane Municipal Corporation / TMC, and surrounding civic jurisdictions). It seamlessly connects citizens, municipal veterinary officers, registered animal welfare NGOs, and certified volunteer rescuers to streamline stray animal emergency reporting, duplicate prevention, automated dispatch, adoptions, and live biometric video verification across geocoded civic zones.

---

## 🏙️ Mumbai Metropolitan Region (MMR) Zone Architecture

RescueNet utilizes real geocoded center coordinates resolved through OpenStreetMap Nominatim, backed by Python Haversine spatial distance calculations and fallback zone mappings to accurately route cases to local municipal wards and nearby volunteer squads.

| Zone Code | Region / Locality | Center Lat / Lon | Radius | Municipal Jurisdiction |
|---|---|---|---|---|
| `MUM-1` | Mumbai — Andheri & Juhu | `19.1136, 72.8697` | 5.0 km | BMC (Western Suburbs) |
| `MUM-2` | Mumbai — Bandra & Khar | `19.0596, 72.8295` | 5.0 km | BMC (Western Suburbs) |
| `MUM-3` | Mumbai — South Bombay (Colaba & Fort) | `18.9219, 72.8346` | 5.0 km | BMC (City Division) |
| `ROUTE-1` | Mumbai — Mankhurd & Chembur | `19.0494, 72.9234` | 5.0 km | BMC (Eastern Suburbs) |
| `ROUTE-2` | Mumbai — Wadala & Sewri | `19.0163, 72.8576` | 5.0 km | BMC (Central Suburbs) |
| `ROUTE-3` | Mumbai — Byculla & Dockyard Road | `18.9760, 72.8360` | 5.0 km | BMC (South-Central) |
| `TH-1` | Thane — West (Naupada, Ghodbunder) | `19.2183, 72.9781` | 5.0 km | TMC (Thane West) |
| `TH-2` | Thane — East (Kopri, Anand Nagar) | `19.1969, 72.9806` | 5.0 km | TMC (Thane East) |
| `NM-1` | Navi Mumbai — Panvel & Khandeshwar | `18.9894, 73.1175` | 5.0 km | PMC / CIDCO |
| `NM-2` | Navi Mumbai — Belapur & Kharghar | `19.0187, 73.0392` | 5.0 km | NMMC / CIDCO |
| `NM-3` | Navi Mumbai — Nerul & Seawoods | `19.0330, 73.0180` | 5.0 km | NMMC |
| `NM-4` | Navi Mumbai — Vashi & Sanpada | `19.0745, 72.9978` | 5.0 km | NMMC |
| `NM-5` | Navi Mumbai — Koparkhairane & Airoli | `19.1033, 72.9996` | 5.0 km | NMMC |
| `ZONE-1` | Eastern Hub — Station & Ramnagar | `19.2183, 73.0868` | 3.0 km | Extended Eastern MMR |
| `ZONE-2` | Eastern Hub — Phadke Road & Manpada | `19.2140, 73.0920` | 3.0 km | Extended Eastern MMR |
| `ZONE-3` | Eastern Hub — MIDC & Residential | `19.2080, 73.0980` | 3.0 km | Extended Eastern MMR |
| `ZONE-4` | Western Hub — Station & Subhash Road | `19.2195, 73.0810` | 3.0 km | Extended Western MMR |
| `ZONE-5` | Western Hub — Garibachawada & Kopar | `19.2230, 73.0760` | 3.0 km | Extended Western MMR |

---

## 📍 Multi-Tier Reverse-Geocoding Engine

To guarantee accurate reporting even when GPS addresses are sparse, RescueNet integrates a multi-tier reverse-geocoding service:
1. **Device GPS Auto-Capture**: Captures latitude, longitude, and accuracy via the HTML5 Geolocation API.
2. **OpenStreetMap Nominatim Reverse Geocoding**: Queries OSM with zoom-level 18 for exact road, landmark, suburb, and postal code resolution.
3. **BigDataCloud Fallback**: Secondary external reverse-geocoding API fallback for resilient street/locality lookup.
4. **Local GIS Municipal Zone Fallback**: Guaranteed assignment to the nearest MMR municipal zone using Python Haversine / PostGIS distance metrics.

---

## 🧠 AI & Decision-Making Engines

- **Object & Animal Detection**: Pretrained Ultralytics YOLOv8 (`yolov8n.pt`) detects animal species, bounding boxes, and visual confidence.
- **On-Site Live Video Biometric Verification**:
  - Live WebRTC camera stream analysis matching suspect animal frames with the original reported case.
  - **Species Taxonomy Matching**: Validates species compatibility (e.g., canine, feline, bovine, equine, caprine, avian) and prevents mismatch rejections (e.g., human or cross-species rejections).
  - **Biometric Feature Correlation**: Structural alignment and histogram feature correlation computation.
- **Photo Authenticity Verification**: 2-of-3 Consensus Voting combining 2D Fast Fourier Transform (FFT) frequency spectrum artifact check, frozen-backbone classifier, and EXIF metadata inspection.
- **Consensus-Based Duplicate Detection**: Dual-signal spatial distance consensus query + normalized embedding cosine similarity (threshold `0.95`) to prevent duplicate rescue calls.
- **Explainable Priority Scoring Engine**: Rule-based priority scoring combining AI detection confidence, visual distress evaluation, and medical urgency keyword extraction.

---

## 🛠️ Tech Stack & Architecture

- **Backend**: FastAPI (Python 3.10+) with strict Pydantic schemas, modular routers, and OpenAPI documentation (`/docs`).
- **Database**: PostgreSQL 17 with `cube` + `earthdistance` / PostGIS spatial extensions for spherical radius queries.
- **Frontend**: React 19 (Vite) built as a Progressive Web App (PWA) with Tailwind CSS, custom glassmorphism, Leaflet.js interactive maps, and WebRTC camera streaming.
- **Authentication**: Bcrypt password hashing + JWT access tokens + Server-Side Role-Based Access Control (`citizen`, `officer`, `ngo_admin`, `volunteer`, `super_admin`).

---

## 🚀 Local Execution

### Backend API
```bash
cd backend
.\.venv\Scripts\activate   # Windows
# or: source .venv/bin/activate  # Linux/macOS
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
Interactive OpenAPI Documentation:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

### Frontend App
```bash
cd frontend
npm install
npm run dev
```
Local Application URL: `http://localhost:5173`

### Running Unit Tests
```bash
cd backend
.\.venv\Scripts\activate
python -m unittest tests/test_video_verification.py
```
