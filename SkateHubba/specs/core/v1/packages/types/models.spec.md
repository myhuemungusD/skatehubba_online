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
4. Provide helpers to convert between API payloads and internal models, with a clear naming convention:
   - Standard convention: all TypeScript domain models and public API DTOs use `camelCase` field names.
   - Use `snake_case` only when required by external systems (e.g., legacy APIs or database-level conventions), and perform conversion at the boundary.
   - New APIs exposed by this codebase MUST use `camelCase` in their request/response payloads.
5. All exports must be tree-shakeable and avoid runtime side effects; Zod schemas co-located with types in the same file, exported alongside their corresponding interfaces (e.g., `export interface User {}` followed by `export const UserSchema = z.object({...})`), organized by domain entity (users, spots, checkins, etc.).

## 🧪 Validation
- Type tests using `tsd` ensuring compatibility with DB schema types.
- Unit tests for Zod schema parsing, especially date/UUID validation and enum guards.
- Contract tests shared with API SDK to prevent breaking changes, implemented as a versioned contract test suite (e.g., Pact or equivalent)
  that is published alongside the API SDK and run in CI for both API and SDK changes.
