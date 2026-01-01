# Spec: Geo Helpers
📁 Path: /utils/geo/index.ts
📦 Depends on: TypeScript, geospatial math utilities (haversine), Shared types
🔁 Version: v1

---

## 🎯 Purpose
Provide reliable, tested geospatial helpers for distance calculations, bounding-box checks, and coordinate validation to support spot discovery and check-in enforcement.

## ✅ Inputs
- Latitude/longitude pairs (degrees)
- Spot metadata including coordinates and optional radius
- Device geolocation readings with accuracy metadata

## 📤 Outputs
- Functions: distanceBetweenPoints, isWithinRadius, boundingBoxFromPoint, normalizeCoordinates, formatDistance
- Error handling for invalid coordinates and insufficient accuracy
- Typed return values with units (meters/kilometers)

## 📦 Dependencies
- Haversine implementation with double precision
- Input validation utilities shared with API/server
- Unit conversion constants (earth radius)

## 🧠 Business Logic
1. Validate coordinate ranges (lat between -90..90, lng between -180..180) and reject invalid inputs before calculation.
2. distanceBetweenPoints returns meters with deterministic rounding; formatDistance outputs human-readable strings with unit selection.
3. isWithinRadius accounts for horizontal accuracy by subtracting accuracy margin before comparison to reduce false positives.
4. boundingBoxFromPoint produces min/max lat/lng for map viewports and query windows with configurable padding.
5. Helpers remain side-effect free, deterministic, and tree-shakeable; no reliance on global state or device APIs.

## 🧪 Validation
- Unit tests covering coordinate validation, edge cases near poles/antimeridian, and accuracy-aware radius checks.
- Property-based tests for symmetry of distanceBetweenPoints and bounding box generation.
- Performance check ensuring helper calls remain under 1ms per invocation in typical usage.
