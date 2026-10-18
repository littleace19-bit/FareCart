# FareCart

Hyperlocal grocery inflation tracker and budget-navigation PWA for the Bronx.

## Tech Stack

- **Framework**: Next.js 16 (App Router) with TypeScript
- **Database**: Supabase (PostgreSQL + PostGIS)
- **Mapping**: Mapbox GL JS
- **Styling**: Tailwind CSS v4
- **Data Ingestion**: Cheerio-based scraping in Next.js API routes

## Project Structure

- `src/app/` — Next.js App Router pages and API routes
- `src/components/` — React components (Map/, Cart/, Layout/)
- `src/lib/` — Business logic (supabase/, harvester/, mapbox/, cost-benefit/)
- `src/types/` — TypeScript interfaces
- `src/hooks/` — Custom React hooks
- `supabase/migrations/` — SQL migration files

## Commands

- `npm run dev` — Start development server
- `npm run build` — Production build
- `npm run lint` — ESLint

## Conventions

- Use `'use client'` only for components that need browser APIs (Mapbox, geolocation, localStorage)
- Server components by default
- API routes use service role Supabase client; browser uses anon key client
- Environment variables prefixed with `NEXT_PUBLIC_` are client-safe
- PostGIS uses `GEOGRAPHY(Point, 4326)` type (meters, not degrees)
