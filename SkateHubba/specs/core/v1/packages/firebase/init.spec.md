# Spec: Firebase Initialization
📁 Path: /packages/firebase/src/init.ts
📦 Depends on: Firebase Web SDK, Firebase Admin SDK (server), Environment config loader
🔁 Version: v1

---

## 🎯 Purpose
Provide centralized, type-safe initialization for Firebase services across client and server contexts with strict environment validation and no duplicate app instances.

## ✅ Inputs
- Environment variables for Firebase project ID, API key, auth domain, storage bucket, messaging sender ID, app ID, measurement ID
- Optional emulator host config for local development
- Service account credentials for server-side Admin usage

## 📤 Outputs
- Initialized Firebase client app and exported handles for Auth, Firestore, Storage, Remote Config, and Messaging (web)
- Initialized Admin app for server-side tasks with limited-scope credentials
- Guarded configuration loader with validation errors when misconfigured

## 📦 Dependencies
- Env validation via Zod
- Singleton pattern for app instances to prevent duplicate initialization
- Logger for surfaced initialization failures (without leaking secrets)

## 🧠 Business Logic
1. Validate required environment variables at startup; throw descriptive errors for missing/invalid values before attempting initialization.
2. Provide separate init functions for client and server; ensure client initialization is idempotent even across hot reloads.
3. Support emulator configuration toggled by env flags for Auth, Firestore, and Storage without affecting production builds.
4. Ensure Admin app uses minimal permission service account and caches credential loading; avoid reading from insecure paths.
5. Export typed helpers to access initialized services and wrap them with light instrumentation for observability.

## 🧪 Validation
- Unit tests for env validation, singleton enforcement, and emulator toggles.
- Integration smoke tests for connecting to emulators and verifying Auth/Firestore read-write in test mode.
- Static analysis to ensure no secrets are logged or bundled in client builds.
