# SIH 26191 — Hazard Red Zone & Relocation Planning Platform

Smart India Hackathon — Problem Statement 26191 (Ministry of Home Affairs, NDRF DM Division)

## What this is
A GIS-enabled decision support platform that identifies multi-hazard red zones,
assesses carrying capacity of safer relocation sites, and prioritizes vulnerable
habitations for relocation — for use by State Disaster Management Authorities.

## Team & Roles
| Member | Role |
|--------|------|
| M1 | GIS & Data Engineer |
| M2 | Frontend & GIS UI |
| M3 | Backend Engineer |
| M4 | Risk & Optimization Engineer |
| M5 | AI/ML Engineer |
| M6 | Integration + Testing + Deployment |

## Structure

## Contract
See `docs/CONTRACT.md` for the shared data schema and API endpoints — check
this before building anything that talks to another part of the system.

## Case study region
chamoli uttarakhand

## Tier 1 — Core features (build these first, non-negotiable)

Interactive hazard map — the map is your case-study region, color-coded by risk level (landslide/flood/erosion/cloudburst), rendered from your /zones endpoint.
Habitation markers on the map — clickable points showing habitation name, population, and current risk zone.
Safe relocation site markers — showing candidate sites with their carrying capacity score.
Priority list/dashboard panel — a ranked list (from /priorities) showing which habitations need relocation first, with urgency labels (immediate / short-term / medium-term).
Click-through detail view — clicking a habitation or site shows its full data (population, hazard type, capacity score, why it's ranked where it is).

## Tier 2 — Strong additions (build if Tier 1 is solid by Day 3-4)

Filters — by hazard type, risk level, or urgency, so the map isn't overwhelming.
"Why this score" breakdown — showing the components of M4's formula for a selected site/habitation (land availability, infra access, density) — this is what makes judges trust your scoring isn't a black box.
Simple stats summary bar — total habitations at risk, total population affected, number of safe sites identified — gives judges an instant sense of scale.
Before/after toggle or comparison — showing "reactive relocation" (status quo) vs. "proactive relocation" (your system's recommendation) — this directly ties back to the problem statement's framing and is a strong storytelling device.

## Tier 3 — Stretch goals (only if everything above is done and stable)

The notification/alert feature we discussed earlier — simulated alert when a hazard threshold is crossed, showing the nearest safe site.
ML risk prediction layer (M5's optional model), if it's genuinely working and improving on the simple formula.
Export/report generation — letting an official download a PDF summary of the relocation plan for a region (nice authority-tool touch, easy to fake for a demo).
Timeline/simulation view — showing how red zones might expand over time based on historical hazard data.