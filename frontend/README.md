# RakshaGrid — SIH 26191 Frontend Prototype

Government-facing proactive disaster relocation planning dashboard for Smart India Hackathon Problem Statement 26191.

## Included
- Government command-center dashboard
- Leaflet multi-hazard risk map
- Risk filtering/search
- Priority habitation ranking
- Carrying-capacity indicators
- Planning alerts
- Relocation progress
- Responsive UI
- Mock data matching the SIH API contract

## Run
Node.js 18+ required.

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Backend integration
Replace demo data with:
- GET /zones
- GET /habitations
- GET /sites
- GET /priorities

The included Uttarakhand values/coordinates are illustrative. Replace them with the team's selected case-study district and real GeoJSON/API data.
