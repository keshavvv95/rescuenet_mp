# RescueNet — AI-Assisted Stray Animal Welfare & Rescue Platform (Dombivli, Zone-Based)

RescueNet is a production-grade AI-assisted Stray Animal Welfare Management Platform localized for **Dombivli**, Maharashtra (PIN 421201 / 421202). It connects citizens, municipal officers (KDMC), NGOs, and volunteers to streamline stray animal reporting, duplicate detection, rescue dispatch, adoption, and live video verification across 12 geocoded municipal zones.

---

## ⚠️ Known Simplifications & Production Limitations (Explicit Disclosure)

1. **Dombivli Locality Coordinates vs. Official KDMC Ward Polygons**:
   - The current 12 zones for Dombivli (`Manpada`, `Thakurli`, `Tilak Nagar`, `Pendse Nagar`, `MIDC Residential Area`, `Gandhi Nagar`, `Ganesh Nagar`, `Nandivali`, `Vishnu Nagar`, `Gaondevi`, `Navapada`, `Kailas Nagar`) use real geocoded center coordinates resolved via OpenStreetMap Nominatim and user-approved locality proxies with a 1.0 km radius query (`earth_distance`).
   - **Limitation**: Official KDMC (Kalyan-Dombivli Municipal Corporation) ward boundary GeoJSON shapefiles are not currently available in public datasets. For a production deployment, the ideal next step is to obtain official KDMC ward boundary shapefiles via an RTI/civic data request and replace center-point radius queries with exact boundary polygon matches.

---

## 🏙️ Real Dombivli Zone Architecture

| Zone Code | Locality Name & Side | Center Lat / Lon | Radius | Resolution Method |
|---|---|---|---|---|
| `DOMB-E-MANPADA` | Manpada — Dombivli East | `19.196251, 73.093573` | 1.0 km | OpenStreetMap Nominatim (`Manpada Road`) |
| `DOMB-E-THAKURLI` | Thakurli — Dombivli East | `19.226281, 73.098017` | 1.0 km | OpenStreetMap Nominatim (`Thakurli Station Rd`) |
| `DOMB-E-TILAKNAGAR` | Tilak Nagar — Dombivli East | `19.213604, 73.092719` | 1.0 km | OpenStreetMap Nominatim (`Tilak Road`) |
| `DOMB-E-PENDSENAGAR` | Pendse Nagar — Dombivli East | `19.211181, 73.091129` | 1.0 km | Dombivli East center proxy |
| `DOMB-E-MIDCRESIDENTIAL` | MIDC Residential Area — Dombivli East | `19.206089, 73.101744` | 1.0 km | OpenStreetMap Nominatim (`MIDC Road`) |
| `DOMB-E-GANDHINAGAR` | Gandhi Nagar — Dombivli East | `19.203830, 73.093136` | 1.0 km | OpenStreetMap Nominatim (`Gandhi Nagar Internal Rd`) |
| `DOMB-E-GANESHNAGAR` | Ganesh Nagar / Sagarli Gaon — Dombivli East | `19.229008, 73.094032` | 1.0 km | OpenStreetMap Nominatim (`Ganesh Nagar`) |
| `DOMB-E-NANDIVALI` | Nandivali / Ramnagar — Dombivli East | `19.198148, 73.084822` | 1.0 km | OpenStreetMap Nominatim (`Cross Nandivali Road`) |
| `DOMB-W-VISHNUNAGAR` | Vishnu Nagar — Dombivli West | `19.219069, 73.086831` | 1.0 km | OpenStreetMap Nominatim (`Vishnu Nagar Station Rd`) |
| `DOMB-W-GAONDEVI` | Gaondevi — Dombivli West | `19.225711, 73.081731` | 1.0 km | OpenStreetMap Nominatim (`Gaondevi Ground`) |
| `DOMB-W-NAVAPADA` | Navapada — Dombivli West | `19.222182, 73.080927` | 1.0 km | Dombivli West center proxy |
| `DOMB-W-KAILASNAGAR` | Kailas Nagar — Dombivli West | `19.222182, 73.080927` | 1.0 km | Dombivli West center proxy |

---

## 🛠️ Tech Stack & Architecture

- **Backend**: FastAPI (Python 3.10+) with strict Pydantic schema validation & OpenAPI docs (`/docs`).
- **Database**: PostgreSQL 17 with `cube` + `earthdistance` spatial extension for spherical radius queries.
- **Authentication**: Bcrypt password hashing + JWT access tokens with expiration + Server-Side RBAC middleware (`citizen`, `officer`, `ngo_admin`, `volunteer`, `super_admin`).
- **AI/ML Engines**:
  - **Object Detection**: Pretrained Ultralytics YOLOv8 / RT-DETR model (`yolov8n.pt` / `rtdetr-l.pt`).
  - **Duplicate Check**: L2-normalized 128-dim color/grid/texture embedding cosine similarity (Calibrated threshold: `0.95`) + PostgreSQL spatial distance consensus query.
  - **Authenticity Check**: 2-of-3 Consensus Voting (2D Fast Fourier Transform frequency spectrum artifact check, Frozen-backbone classifier, EXIF camera metadata consistency).
  - **Priority Engine**: Rule-based scoring combining detection confidence + medical keyword extraction + visual distress score.

---

## 🚀 Local Execution

### Backend API
```bash
cd backend
.\venv\Scripts\activate
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
Swagger UI: `http://localhost:8000/docs`

### Frontend App
```bash
cd frontend
npm run dev
```
Local App URL: `http://localhost:5173`
