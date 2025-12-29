# Spec: Web Profile Page
📁 Path: /apps/web/src/pages/profile.tsx
📦 Depends on: React 18, Vite, TailwindCSS, TanStack Query, API SDK (Spots), Auth session provider, Analytics client
🔁 Version: v1

---

## 🎯 Purpose
Deliver a responsive, authenticated profile experience on the web that highlights a skater's identity, session stats, spot history, and achievements while enabling safe account management.

## ✅ Inputs
- Authenticated user session (ID token + profile claims)
- Spots API SDK for profile, check-ins, and spots data
- Media assets (avatar URL, hero banner) stored in CDN/Storage
- Feature flags for gated modules (badges, streaks)
- Device and viewport metadata for responsive layout

## 📤 Outputs
- Rendered profile page with sections for identity, stats, check-ins, saved spots, and achievements
- Network calls for profile fetch, check-in history, spot bookmarks, and avatar upload
- Analytics events for page view, card interactions, and settings changes
- Form submissions for profile updates and notification preferences

## 📦 Dependencies
- UI component library (buttons, cards, tabs, avatar, modal)
- Form handling + validation (React Hook Form + Zod)
- File upload utility for avatars/banner (with size/type guards)
- Auth guard + route protection middleware
- Error boundary + toast system for user feedback

## 🧠 Business Logic
1. Gate access to authenticated users; redirect guests to sign-in with a return URL.
2. On load, prefetch profile, recent check-ins (paginated), and saved spots using API SDK with caching + retry/backoff.
3. Display hero section with avatar, display name, hometown, stance, and rank; allow avatar/banner replacement with immediate preview and guarded upload (max size, mime allowlist).
4. Stats module: expose lifetime check-ins, landed/bailed ratios, streak count, and most visited spot; calculate ratios client-side from API payloads.
5. Timeline module: paginated list of recent check-ins showing trick name, spot, date, video thumbnail, and status; support deep link to video or spot detail.
6. Saved spots module: grid/list toggle with map preview, distance calculation from current geolocation, and filter by difficulty/legendary flag.
7. Achievements module: badge grid fed by API, with locked/unlocked states and hover tooltips; show progress toward next tier.
8. Settings drawer: update display name, bio, stance, notification preferences; validate with Zod, optimistic UI with rollback on failure.
9. Accessibility + performance: ensure keyboard navigation, focus traps on dialogs, lazy-load heavy media, and compress uploads before transfer.

## 🧪 Validation
- Unit coverage for hooks (data fetching, ratio calculations, distance helpers) and form schemas.
- Integration tests for route guard, profile fetch/render, avatar upload happy/invalid paths, and settings mutation rollback.
- Lighthouse targets: Performance ≥ 90, Accessibility ≥ 95 on modern desktop + mobile.
