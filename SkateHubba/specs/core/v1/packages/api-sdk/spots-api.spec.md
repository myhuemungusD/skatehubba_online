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
- Circuit breaker or minimal outage fallback logic for critical calls

## 🧠 Business Logic
1. Provide composable client with base configuration (baseUrl, headers, retries) and injectable fetch implementation for React Native.
2. Each method validates inputs with Zod before network calls; responses validated and converted to shared models.
3. Automatic auth header injection with refresh support; on 401, attempt token refresh once before surfacing error.
4. Implement exponential backoff with jitter for idempotent GETs and safe retries for POST only when marked retryable.
5. Map API errors to typed failures; include correlationId and user-friendly messages without exposing backend stack traces.
6. Instrument calls with hooks for logging/metrics; redact PII and token values.

## 🧪 Validation
- Unit tests mocking network layer for success, validation failure, retry, and refresh flows.
- Contract tests against local dev server or mock server to ensure request/response compatibility.
- Type tests ensuring exports align with shared models and tree-shaking remains intact.
