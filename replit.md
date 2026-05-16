# Fuadfx

A production-grade forex trading journal app built on a Shadcn admin dashboard chassis. Fully migrated to Supabase Auth with a secure Express backend.

## Stack
- **Framework**: React 19 + Vite 8
- **Routing**: TanStack Router (file-based, with autoCodeSplitting)
- **Data**: TanStack Query, Zustand
- **UI**: Shadcn UI (Radix primitives) + Tailwind CSS v4
- **Charts**: Recharts
- **Forms/Validation**: react-hook-form + zod
- **Auth**: Supabase Auth (email/password, password reset)
- **Backend**: Express.js (`server/`) with Supabase service role
- **Database**: Supabase PostgreSQL (schema in `supabase/schema.sql`, RLS in `supabase/rls.sql`)
- **AI**: Google Gemini (Market Pulse + AI analysis) via `VITE_GEMINI_API_KEY`
- **Language**: TypeScript
- **Package manager**: npm

## Architecture

```
Frontend (Vite React)
    ↓
Express Backend (/api/*)  ←  Supabase Service Role (server-side only)
    ↓
Supabase PostgreSQL + Auth
```

## Environment Variables
All secrets are stored in Replit Secrets / Vercel Environment Variables. See `.env.example` for the full list.

| Variable | Where Used | Purpose |
|---|---|---|
| `VITE_SUPABASE_URL` | Frontend + Backend | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Frontend only | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Backend only | Admin access — never exposed to browser |
| `VITE_GEMINI_API_KEY` | Frontend | Google Gemini AI for news + analysis |

## Database Setup
Run these SQL files in your Supabase SQL Editor (in order):
1. `supabase/schema.sql` — creates all tables, indexes, and the profile auto-creation trigger
2. `supabase/rls.sql` — enables Row Level Security with ownership-based policies

## Pages
| Route | Feature folder | What it does |
|---|---|---|
| `/` | `features/dashboard` | KPI cards, equity curve, recent trades, monthly P&L, risk snapshot |
| `/tasks` | `features/tasks` | Trade Journal — full CRUD table, CSV import |
| `/analytics` | `features/analytics` | Deep analytics — equity curve, P&L by pair/session/day |
| `/calendar` | `features/calendar` | Month-view P&L heatmap |
| `/apps` | `features/apps` | Strategy Playbook |
| `/users` | `features/accounts` | Trading Accounts — broker/prop accounts |
| `/chats` | `features/chats` | Journal Notes — per-account journal entries |
| `/news` | `features/news` | Economic News + AI Market Pulse |
| `/settings/*` | `features/settings` | Profile, account, appearance, notifications |
| `/onboarding` | `features/onboarding` | New-user onboarding flow |

## Auth Flow
- Sign in/up: `src/features/auth/` (forms call Supabase Auth directly)
- Session: managed by `@supabase/supabase-js`, initialized in `src/main.tsx`
- Route guard: `src/routes/_authenticated/route.tsx` checks real Supabase session via `getSession()`
- Store: `src/stores/auth-store.ts` holds user + session state (Zustand)

## Backend API Routes
| Endpoint | Description |
|---|---|
| `GET /api/health` | Health check |
| `GET/POST/PUT/DELETE /api/trades` | Trade CRUD (JWT-protected) |
| `GET /api/analytics/summary` | Server-side analytics |
| `GET /api/analytics/equity-curve` | Equity curve data |
| `GET/PUT /api/profile` | User profile |

## Replit Setup
- **Workflow**: `Start application` runs `npm run dev` on port `5000` (webview)
- **Backend** (development): `npm run dev:server` runs Express on port `3001`
- **Vite dev server**: bound to `0.0.0.0:5000` with `allowedHosts: true`
- **Deployment**: Configured for Vercel (`vercel.json`) — static frontend + Express API routes

## User Preferences
- Package manager: npm (not pnpm)
- Auth: Supabase Auth (Clerk removed)
- Deployment target: Vercel
