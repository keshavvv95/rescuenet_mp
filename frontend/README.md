# RescueNet — Stray Animal Welfare Management Platform

**RescueNet** is a full-stack AI-assisted Stray Animal Welfare Management Platform connecting citizens, municipal officers, NGOs, and volunteers to manage stray animal reporting, rescue, adoption, and community welfare in a single Progressive Web App (PWA).

---

## 🚀 Quick Setup & Local Execution

### Prerequisites
- Node.js (v18+ recommended)
- npm / yarn

### Installation
1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run local development server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

4. Build production bundle:
   ```bash
   npm run build
   ```

---

## 🛠️ Architecture & Tech Stack

- **Framework:** React 19 (Vite) built as a standalone **Progressive Web App (PWA)**
- **Styling:** Modern Tailwind CSS with custom glassmorphism, HSL color tokens, dark mode aesthetics & dynamic micro-animations
- **PWA Features:**
  - `manifest.json` with `display: standalone` & portrait lock
  - Service Worker (`sw.js`) for app shell caching & push notification handling
  - Automatic `beforeinstallprompt` handling for Android/Chrome + visible in-app installation hint modal for iOS Safari users
  - Camera capture flow via `<input type="file" accept="image/*" capture="environment">` and browser WebRTC camera stream
  - Geolocation API for GPS auto-capture with accuracy metadata
  - Dedicated In-App Notification Center with bell badge & drop-down alert history
- **Maps:** Leaflet.js + OpenStreetMap tiles for interactive maps and density heatmap visualizations
- **API Client:** Single configurable `API_BASE_URL` constant (`src/config/api.js`). Connects to real backend endpoints with automatic fallback to static JSON fixtures (`src/services/mockData.js`) when offline or in demo mode.

---

## 📱 Modules Implemented

### 1. PWA Scaffolding & Install Flow
- Service worker registration (`public/sw.js` & `src/sw.js`)
- Install prompt handler (`src/components/PWAInstallBanner.jsx`) for Android & iOS
- In-App Notification Center (`src/components/NotificationCenter.jsx`)

### 2. Auth UI & Role-Based Routing
- Support for 5 distinct roles: **Citizen**, **Municipal Officer / Vet**, **NGO Admin**, **Volunteer**, and **Super Admin**
- Quick Demo 1-Click Role Login buttons & JWT storage in `localStorage`
- Dynamic role switcher dropdown in header for instant demoing

### 3. Citizen Reporting UI
- Camera capture & preview flow
- Auto GPS capture badge ("Location captured ✓") displaying address & coordinates
- AI Detection overlay with species detection, confidence score & explainable reasoning breakdown ("That's not right?" override)
- Nearby duplicate complaint detection alert modal with "Join this report instead" option
- "My Reports" status tracking screen with live polling toggle simulation (New → Assigned → In Progress → Searching → Not Found → Resolved)

### 4. Area-Wise Live Community Feed UI
- Zone-scoped live sighting feed (e.g. Zone 4 - Central Downtown)
- Upvote & corroboration control ("Corroborated by X citizens")
- Quick modal to publish local stray sightings

### 5. Adoption & Fostering UI
- Filterable rescue pet listings (Dog/Cat, age, health status, vaccinated/neutered tags, temperament tags)
- Interactive adoption application form modal
- Citizen adoption application status tracker (Applied → Under Review → Approved → Handed Over)

### 6. Community, Awareness, SOS & Gamification UI
- Public feed of resolved rescue stories with before & after visual photo comparison
- Educational guides (Rabies awareness, first aid, legal rights, do's & don'ts)
- Specialized "Report Cruelty" form routed to NGO Legal Advocates queue
- **One-Tap Prominent Red SOS Button** with emergency dispatch broadcast
- Gamification leaderboard displaying rescue points & badges ("Master Rescuer", "Street Guardian")

### 7. Officer / NGO Dashboard UI
- List & Leaflet map view of assigned complaints, filterable by priority (Emergency vs Normal)
- Volunteer assignment dropdown displaying available rescuers & proximity
- Status updates including new `Searching` and `Not Found` states
- **Live Video Verification Camera Screen** streaming frames to AI biometrics endpoint, displaying confidence score %, feature alignment breakdown & reasoning string

### 8. Volunteer Dashboard UI
- Assigned rescue task cards with instructions and priority badges
- Direct GPS Navigation link opening native Google Maps with pre-filled destination coordinates
- "Mark Complete" modal requiring completion photo upload & resolution notes

### 9. Admin Analytics Dashboard UI
- Visual KPI cards & zone complaint volume breakdown charts
- Leaflet density heatmap layer highlighting high-density complaint clusters
- Export CSV report feature for selected date ranges & municipal zones

### 10. Donations & Public Transparency Ledger UI
- Case funding campaigns with progress bars
- Razorpay / Stripe test checkout modal flow
- Publicly audited real-time donation transaction ledger table

---

## 🔍 Code Simplifications (`// SIMPLIFIED:` Markers)

The following components contain explicit `// SIMPLIFIED:` comments indicating where full server-side AI model integration can be expanded:
1. `src/services/apiClient.js` — `detectAnimal()`: Uses heuristics for species classification confidence score & explainable reasoning. When backend is live, parses YOLOv8 vision model JSON.
2. `src/services/apiClient.js` — `verifyVideoFrame()`: Simulates biometric facial contour & ear notch alignment calculation. Connects to real OpenCV/deep-learning backend when available.
3. `src/pages/AnalyticsDashboard.jsx` — `handleExportCSV()`: Generates client-side CSV blob download for demo; can call backend PDF/CSV export endpoint once wired up.

---

## 📄 API Specification (`mock-api.md`)

Full API request & response contracts for all 10 modules are documented in [mock-api.md](./mock-api.md).
