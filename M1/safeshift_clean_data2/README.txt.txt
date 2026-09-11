SafeShift Data Package — M1 se M3/M2/M4 ke liye
==================================================
CRS: EPSG:4326 (WGS 84) — Sabhi layers standard WGS 84 projection mein hain.
Pilot Area: Chamoli District, Uttarakhand
Total Habitations: 10 Villages
Safe Candidate Sites: 5 Sites

CSV Schema:
- villages.csv: id, name, latitude, longitude, population, elderly_population, children_population, disability_population, risk_score, priority
- hazards.csv: id, habitation_id, flood_score, landslide_score, rainfall_score, historical_score
- candidate_sites.csv: id, name, latitude, longitude, land_area, estimated_capacity, water_score, road_score, healthcare_score, hazard_score

GeoJSON Layers:
- chamoli_boundary.geojson (District polygon boundary)
- villages.geojson (Point layer for habitations)
- roads.geojson (Clipped road network)
- rivers.geojson (Clipped river network)
- flood_zones.geojson (River buffer hazard polygon)
- landslide_zones.geojson (Slope > 30 deg hazard polygon)

Handover Notes:
- villages.csv mein risk_score aur priority initial prototype ke liye 0/null hain; M4 algorithm runtime par inhe update karega.
- Sabhi vector layers verified hain aur direct Mapbox/Leaflet (M2) aur PostGIS (M3) loading ke liye ready hain.