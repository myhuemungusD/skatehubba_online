# Spec: Check-in Endpoint (Server)
📁 Path: /apps/server/src/routes/checkins.ts
📦 Depends on: Express, Drizzle ORM, Postgres/Neon, Redis cache (optional), Auth middleware, Zod validation, Storage client (for media URLs)
🔁 Version: v1

---

## 🎯 Purpose
Expose secure HTTP endpoints for creating and retrieving skate spot check-ins with validation, rate limiting, and audit visibility.

## ✅ Inputs
- Authenticated user session (JWT/session cookie with uid)
- Request payloads: spotId, trick name, status enum, optional videoUrl (required for legendary spots), device metadata, location coordinates
- Query params for pagination, filtering by status/spot, date ranges
- Feature flags controlling media upload requirement or moderation rules

## 📤 Outputs
- Responses for create/read: persisted check-in record with IDs, timestamps, derived fields (landed/bailed), and signed media URLs when applicable
- Error responses for validation, auth failure, rate limiting, or moderation blocks
- Audit logs for mutations and suspicious patterns

## 📦 Dependencies
- Rate limiter tuned per IP + user
- Input schema validation via Zod with strict enums and coordinate bounds
- Database tables: users, spots, checkins (+ relations)
- Geo utilities for distance validation vs spot coordinates
- Observability: structured logs and metrics per endpoint

## 🧠 Business Logic
1. Require authenticated user; reject or refresh session if invalid.
2. POST /checkins: validate payload, confirm spot exists and is active, ensure coordinates are within allowed radius of spot, enforce status enum {landed, bailed, retry}, and require videoUrl for legendary spots (spots marked with legendary=true flag must include a valid videoUrl in the check-in payload).
3. Prevent spam via rate limits and duplication check (same user, spot, trick within a 10-minute window).
4. Persist check-in with server timestamp, link to user + spot; compute derived fields (e.g., landed flag) and store mediaUrl if provided.
5. GET /checkins: support pagination (cursor), filtering by spotId, status, date range, and userId; default sort by newest.
6. Include signed URLs for media when needed; never expose raw storage paths.
7. Emit analytics/log events for creation and retrieval, including geo validation outcomes (without PII leakage).
8. Return safe error shapes with correlation IDs; avoid leaking internal messages.

## 🧪 Validation
- Unit tests for validation schemas, geo guard, duplication detector, and signed URL helper.
- Integration tests covering happy path creation, invalid payloads, rate-limit rejection, unauthorized access, and GET filters.
- Load test target: P99 < 250ms for GET with warm cache; < 500ms for POST without media.
