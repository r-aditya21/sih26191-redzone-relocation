# Integration Report

## Architecture
Frontend (Next.js 14 / React 18 / Tailwind CSS) → Backend (Node.js / Express / TypeScript) → Database (MongoDB Atlas / Mongoose)

- **Frontend**: Next.js 14 client with responsive Tailwind UI, Leaflet mapping, and decoupled API service layer (`lib/api.ts` + `lib/useApi.ts`).
- **Backend**: Express REST API running on port 5000 with CORS enabled (`app.use(cors())`).
- **Database**: MongoDB Atlas with 2dsphere geospatial indexing for Polygon zones and Point habitations.

## Backend APIs
| Method | Endpoint | Purpose | Frontend Usage |
|---|---|---|---|
| `GET` | `/` | Health check probe | `checkHealth()` in `lib/api.ts` |
| `GET` | `/api/zones` | Fetches all hazard polygons and risk levels | `RiskZones.tsx` live zone list and risk classifications |
| `GET` | `/api/habitations` | Fetches habitations with coordinates and populations | Typed service in `lib/api.ts` (`fetchHabitations`) |
| `GET` | `/api/sites` | Safe relocation sites with capacity scores and available land | `Resources.tsx` live site telemetry matching |
| `GET` | `/api/priorities` | Habitations ranked by risk-weighted priority score | `Dashboard.tsx` Priority Habitation rank board |

## Required Environment Variables
| Variable | Purpose | Example |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Base URL for backend Express server | `http://localhost:5000` |
| `PORT` | Backend server listening port | `5000` |
| `MONGODB_URI` | MongoDB connection URI | `mongodb+srv://user:pass@cluster.mongodb.net/` |

## Files Created/Changed
- `lib/api.ts` — Type definitions (`Zone`, `Habitation`, `Site`, `PriorityHabitation`) and typed fetch callers for all backend endpoints.
- `lib/useApi.ts` — Reusable React hook managing request lifecycle (`data`, `loading`, `error`, `refetch`).
- `.env.example` — Frontend environment variable template.
- `app/ui/Resources.tsx` — Integrated with `/api/sites` to display live site parameters (available land, infrastructure score) with non-blocking fallback.
- `app/ui/RiskZones.tsx` — Integrated with `/api/zones` to load live hazard zones and risk ratings.
- `app/ui/Dashboard.tsx` — Integrated with `/api/priorities` to dynamically render ranked habitations.
- `INTEGRATION_REPORT.md` — Integration documentation and architecture map.

## Connection Steps
1. **Backend command**
   ```bash
   cd C:\SIH\sih26191-redzone-relocation\backend
   npm install
   npm run dev
   ```
2. **Frontend command**
   ```bash
   cd c:\SIH-26191-RakshaGrid-Frontend
   npm install
   npm run dev
   ```
3. **Environment setup**
   Create `c:\SIH-26191-RakshaGrid-Frontend\.env.local`:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000
   ```
4. **API connection/test**
   - Verify backend health at `http://localhost:5000/` (returns `{"status":"ok","message":"SIH 26191 backend running"}`).
   - Verify zones at `http://localhost:5000/api/zones`.
   - Open frontend at `http://localhost:3000` to see live data rendered in Dashboard, Risk Zones, and Resources views.

## Missing/Blocked Items
- **Dedicated Resource Inventory Model**: The backend currently implements `Zone`, `Habitation`, and `Site` schemas, but does not provide an endpoint for inventory items (rations, trauma staff, shelter units). In `Resources.tsx`, the assigned safe sites are now enriched with live data from `GET /api/sites`. A dedicated `/api/resources` endpoint is needed for full CRUD on supplies.
- **Write/Mutation Endpoints**: The backend currently only exposes read (`GET`) endpoints. Actions like "Request resupply" or "Update plan status" in the UI will require `POST`/`PUT` endpoints on the backend.