# Backend — SIH 26191

Express + TypeScript + MongoDB (Mongoose, with 2dsphere geospatial indexes).

## Setup

```bash
cd backend
npm install
```

Copy `.env.example` to `.env` and fill in your MongoDB Atlas connection string:

```bash
cp .env.example .env
```

## Run

```bash
npm run dev
```

Server runs at http://localhost:5000

- `GET /` — health check
- `GET /api/zones`
- `GET /api/habitations`
- `GET /api/sites`
- `GET /api/priorities`

## Seed dummy data

Dummy Chamoli-region GeoJSON files are already in `../data/cleaned/`.
From inside `backend/`, run:

```bash
npm run seed
```

This loads zones, habitations, and sites into MongoDB, and auto-classifies
each habitation into its containing hazard zone using MongoDB's
`$geoIntersects` query.

## Replacing dummy data with real data

Once M1 delivers real cleaned data, just overwrite the same three files in
`../data/cleaned/` (same filenames) and re-run `npm run seed`. No code
changes needed.

## Replacing the placeholder scoring formula

`src/routes/routes.ts` has a placeholder `calculatePriorityScore()` function.
Once M4 finalizes the real carrying-capacity/priority formula, swap the
logic inside that function (or move it to `src/scoring/priorityScore.ts`
and import it).
