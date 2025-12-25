# SkateHubba - Mobile Skateboarding Platform

## Overview
SkateHubba is a multi-platform skateboarding ecosystem designed for production, featuring a React Native mobile app, a React web app, an Express.js backend, and Firebase Cloud Functions. It offers unique features like Remote S.K.A.T.E. challenges, AR check-ins with geo-verification, trick collectibles, an AI chat assistant, leaderboards, and e-commerce capabilities. The project aims to create a comprehensive digital hub for skateboarders, fostering community and engagement.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
- **Design Theme**: Dark-themed with an orange accent, reflecting skateboarding culture.
- **UI Framework**: Tailwind CSS with shadcn/ui and Radix UI for accessible and customizable components.
- **WCAG AA Compliance**: 
  - **Color Contrast**: Success green changed from `#24d52b` (2.8:1 - FAILS) to `#00ff41` Baker green (7+:1 - PASSES)
  - **Design Tokens**: Implemented semantic success tokens (`bg-success`, `text-success`, `hover:bg-success-hover`)
  - **Coverage**: All brand/success surfaces updated across 30+ components/pages (0 legacy greens remain)
  - **Focus Indicators**: Orange (#f97316) 3px solid outlines with 2px offset for keyboard navigation
  - **Screen Reader Support**: Proper ARIA labels and semantic HTML structure
  - **Reduced Motion**: Respects `prefers-reduced-motion` for accessibility
  - **High Contrast**: Supports `prefers-contrast: high` mode
- **Polish & Accessibility**: Professional-level polish including smooth transitions, loading skeletons, micro-interactions, and a robust toast system.
- **Mobile & PWA**: Full PWA implementation with install prompts, mobile-responsive optimizations, and touch-friendly interactions.
- **Performance**: Code splitting, Suspense boundaries, lazy loading images, and performance monitoring.

### Technical Implementations
- **Mobile App**: React Native with Expo SDK 51, expo-router, expo-camera, expo-location, and react-native-maps.
- **Web Frontend**: React 18 with TypeScript, Vite, Wouter for routing, TanStack React Query for state, and React Hook Form with Zod for forms.
- **Backend**: Node.js with TypeScript (ESM), Express.js for REST APIs, Drizzle ORM with Neon (serverless PostgreSQL), and connect-pg-simple for session storage.
- **Cloud Functions**: Firebase Cloud Functions v7 for Remote S.K.A.T.E. challenge system with deadlines and FCM push notifications.
- **Monorepo**: Shared code (`/shared/`) for types, schemas, and utilities across client, server, and mobile.
- **Authentication**: Firebase Authentication (email/password, phone, Google) integrated across web and mobile.
- **Data Architecture**: PostgreSQL for core data (users, spots, products), and Firestore for real-time features (challenges, chat, presence).
- **Tutorial System**: Dynamic onboarding with progress tracking and dedicated API endpoints.

### System Design Choices
- **Directory Structure**:
  - `/mobile/` - React Native Expo app
  - `/client/` - React web app
  - `/server/` - Express.js REST API
  - `/infra/firebase/functions/` - Firebase Cloud Functions
  - `/shared/` - Shared types, schemas, and utilities
  - `/migrations/` - Database migrations
- **API Architecture**: REST endpoints (`/api/*`) for Express, Cloud Functions (httpsCallable) for Remote S.K.A.T.E. challenges, and Firestore real-time listeners.
- **Client-Server Communication**: Custom fetch wrapper with TanStack React Query (web), apiRequest helper + Firebase callable functions (mobile), cookie-based sessions for web, and Firebase tokens for mobile.
- **Deployment**: Mobile via Expo EAS Build to app stores; Web as static files on Replit/Vercel; Backend on Replit with auto-scaling; Functions via Firebase Cloud Functions.

## External Dependencies

### Backend & Cloud
- **Database**: Neon Database (serverless PostgreSQL)
- **Real-time**: Firebase Firestore
- **Cloud Functions**: Firebase Functions v7
- **Authentication**: Firebase Authentication
- **Storage**: Firebase Cloud Storage

### Web App
- **UI Libraries**: Radix UI, shadcn/ui, Tailwind CSS
- **State Management**: TanStack React Query, Zustand
- **Form Validation**: Zod, React Hook Form
- **Build Tools**: Vite, esbuild, tsx

### Mobile App
- **Framework**: Expo SDK 51, React Native
- **Navigation**: Expo Router
- **Camera**: expo-camera, expo-av
- **Location**: expo-location, react-native-maps
- **Theme System**: WCAG AA compliant design tokens with #00ff41 success color
- **Accessibility**: Full accessibilityRole, accessibilityLabel, and accessibilityState props on all interactive elements

### Shared
- **TypeScript**: For type safety
- **Date Handling**: date-fns
- **Linting**: ESLint, Prettier