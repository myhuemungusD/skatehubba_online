# Spec: Spots API SDK
📁 Path: /packages/api-sdk/src/spots.ts
📦 Depends on: TypeScript, ky (HTTP client) or fetch wrapper, Shared types/models, Auth token provider
🔁 Version: v1

---

## 🎯 Purpose
Deliver a typed client for SkateHubba spot + check-in APIs with robust error handling, retry/backoff, and built-in auth token management for web and mobile consumers.

## ✅ Inputs
- Base API URL from environment configuration
- Auth token provider/refresh hook
- Shared types and Zod schemas for request/response validation
- Optional telemetry hooks for logging/metrics

## 📤 Outputs
- Functions for profile fetch/update, spot search/detail, check-in create/list, achievements fetch, saved spots CRUD
- Normalized response objects conforming to shared models
- Error types with standardized codes and correlation IDs

## 📦 Dependencies
- HTTP client with retry, timeout, and cancellation support
- Serialization helpers for query params and pagination cursors
- Circuit breaker or minimal outage fallback logic for critical calls, including:
  - Trigger conditions:
    - Open the circuit after 5 consecutive failures for the same endpoint, or
    - When the rolling 60s error rate for a given endpoint exceeds 50%, or
    - When median latency for a given endpoint exceeds 2x the configured timeout over a 60s window.
  - State behavior:
    - Keep the circuit open (no outbound calls) for 30s before attempting a half-open probe.
    - In half-open, allow up to 3 probe requests; close the circuit on all-success, re-open on any failure.
  - Fallback strategy while open:
    - For GETs: return the most recent cached response if available and not older than 5 minutes; otherwise return a typed `ServiceUnavailable` error with a retry-after hint.
    - For non-idempotent writes (POST/PUT/DELETE): do not attempt retries; immediately return a typed `ServiceUnavailable` error without side effects.
    - Always include correlationId and circuit state in error metadata for observability.

## 🧠 Business Logic
1. Provide composable client with base configuration (baseUrl, headers, retries) and injectable fetch implementation for React Native.
2. Each method validates inputs with Zod before network calls; responses validated and converted to shared models.
3. Automatic auth header injection with refresh support; on 401, attempt token refresh once before surfacing error.
4. Implement exponential backoff with jitter for idempotent GETs and safe retries for POST only when explicitly marked retryable via client options (for example, a `retryable: true` flag combined with an idempotency key header).
5. Map API errors to typed failures; include correlationId and user-friendly messages without exposing backend stack traces.
6. Instrument calls with hooks for logging/metrics; redact PII and token values.

## 🧪 Validation
- Unit tests mocking network layer for success, validation failure, retry, and refresh flows.
- Contract tests against local dev server or mock server to ensure request/response compatibility.
- Type tests ensuring exports align with shared models and tree-shaking remains intact.
