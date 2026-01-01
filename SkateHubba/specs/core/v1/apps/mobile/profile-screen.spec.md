# Spec: Mobile Profile Screen
📁 Path: /apps/mobile/src/screens/ProfileScreen.tsx
📦 Depends on: React Native/Expo, React Navigation, TanStack Query, API SDK (Spots), Secure Storage, Analytics SDK
🔁 Version: v1

---

## 🎯 Purpose
Provide a fast, offline-tolerant mobile profile experience that surfaces identity, session metrics, check-in history, and quick actions while respecting limited bandwidth and device permissions.

## ✅ Inputs
- Auth token + refresh flow stored in secure storage
- Profile + check-in endpoints via API SDK
- Local device signals: network status, geolocation permission, camera roll access (for avatar)
- Feature flags delivered at app start
- Push notification token (for settings updates)

## 📤 Outputs
- Profile UI with header, stats, recent activity, saved spots, and achievements
- Mutations for profile edits, avatar uploads, and notification preference updates
- Analytics events for screen view, CTA taps, and error cases (redacted PII)
- Offline cache hydration events and retry queue entries

## 📦 Dependencies
- Navigation stack with deep link support
- React Native UI primitives + shared design system tokens
- Image picker/uploader with size + mime validation
- Background sync queue for offline mutations
- Toast/snackbar + haptics for feedback

## 🧠 Business Logic
1. Guard screen behind auth; show blocking sign-in redirect if token invalid/expired with refresh attempt before logout.
2. On focus, hydrate cached profile/check-ins from query cache, then refetch with stale-while-revalidate policy and exponential backoff on failure.
3. Render header with avatar, display name, stance, hometown, and QR/share CTA for profile link; avatar updates optimize for small payloads and retry on flaky networks.
4. Stats cards: landed vs bailed ratio, streak days, total check-ins, favorite spot; calculations derived client-side with memoization.
5. Activity feed: infinite scroll list with trick name, spot, date, status pill, optional video thumbnail; allow tap to open spot detail or video player.
6. Saved spots: compact list with distance-from-user (if permission granted), offline fallback to last known location; include filter chips for legendary spots and difficulty.
7. Achievements: badge carousel with locked/unlocked states and progress indicator; tapping reveals description in bottom sheet.
8. Settings: edit display name/bio/stance, toggle notifications, link/unlink sign-in providers; persist via API SDK with optimistic updates and rollback on errors.
9. Resilience: queue mutations offline, replay on reconnect; ensure state consistency by reconciling server version vs cached version IDs.

## 🧪 Validation
- Unit tests for data hooks, offline queue, and form schema validation.
- Integration tests for navigation guard, offline-first hydration, avatar upload failure fallback, and optimistic update rollback.
- Performance budget: first meaningful paint < 2s on mid-tier device; network requests compressed and batched.
