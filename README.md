# FUADFX

Trading journal dashboard built with Vite, React, TanStack Router, Supabase Auth, and a separate Express API deployed on Render.

![Dashboard preview](public/images/shadcn-admin.png)

## Tech Stack

- Vite and React
- TanStack Router and TanStack Query
- Supabase Auth and database
- Express API on Render
- Tailwind CSS and shadcn/ui

## Run Locally

Install dependencies:

```bash
npm install
```

Copy `.env.example` to `.env` and fill in the Supabase values.

Start the frontend:

```bash
npm run dev
```

Start the API in another terminal:

```bash
npm run dev:server
```

The Vite dev server proxies `/api/*` to the local API and strips the `/api` prefix before forwarding.

## Deployment Checklist

This project is split across three services:

- Vercel serves the Vite frontend from `dist`.
- Render runs the Express API from `server/index.ts`.
- Supabase provides auth and database access.

### Vercel Environment Variables

Set these for Production, Preview, and Development in Vercel:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_URL=https://your-render-service.onrender.com
VITE_GEMINI_API_KEY=your-gemini-api-key
```

`VITE_API_URL` must point to the Render API root. If it is missing, the frontend falls back to `/api`, which only works during local Vite development through the dev proxy.

Do not set `SUPABASE_SERVICE_ROLE_KEY` in Vercel. Vite exposes `VITE_*` values to browser code, and the service role key must stay server-only.

### Render Environment Variables

Set these on the Render web service:

```bash
NODE_ENV=production
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
FRONTEND_URL=https://your-vercel-app.vercel.app
```

`FRONTEND_URL` can be a comma-separated list if you need to allow multiple frontend origins.

### Supabase Auth URLs

In Supabase Dashboard > Authentication > URL Configuration:

- Site URL: your production Vercel URL
- Redirect URLs: your production Vercel URL plus any Vercel preview URLs you use

## Useful Checks

Build the frontend:

```bash
npm run build
```

Type-check the Render API:

```bash
npm run build:server
```

Check the Render health endpoint:

```bash
curl https://your-render-service.onrender.com/api/health
```
