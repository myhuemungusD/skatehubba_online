# Spec: Shared Types and Models
📁 Path: /packages/types/src/models.ts
📦 Depends on: TypeScript, Zod, Database schema enums
🔁 Version: v1

---

## 🎯 Purpose
Provide a single source of truth for shared domain types across web, mobile, server, and SDK consumers to ensure consistent contracts and runtime-safe validation.

## ✅ Inputs
- Database schema enums and table shapes
- API payload definitions for profile, spots, check-ins, achievements, and notifications
- Error response shapes and pagination contracts

## 📤 Outputs
- Exported TypeScript interfaces/types for domain models and DTOs
- Zod schemas for runtime validation and serialization
- Versioned changelog for breaking type updates

## 📦 Dependencies
- Types re-exported from db schema (enums, IDs)
- Serialization helpers for ISO timestamps and UUIDs
- Pagination + filter types used by API SDK

## 🧠 Business Logic
1. Maintain discriminated unions for trick status, stance, and achievement tiers aligned with DB enums.
2. Define DTOs for profile read/update, check-in create/read, spot summaries, saved spots, achievements, and feature flags.
3. Encode error response model with standardized codes, messages, and correlationId.
4. Provide helpers to convert between API payloads and internal models (e.g., camelCase ↔ snake_case if needed).
5. All exports must be tree-shakeable and avoid runtime side effects; Zod schemas co-located with types.

## 🧪 Validation
- Type tests (tsd or equivalent) ensuring compatibility with DB schema types.
- Unit tests for Zod schema parsing, especially date/UUID validation and enum guards.
- Contract tests shared with API SDK to prevent breaking changes.
