# Hustle Flow (Next.js)

Hustle Flow is a Next.js web app for solopreneur project operations with AI-agent-assisted workflows.

## Stack
- Next.js App Router
- React
- Supabase (Postgres tables + Storage bucket)
- CSS global design system

## Features in this build
- Work Packages with custom attributes, statuses, priorities
- Kanban boards with drag-and-drop status moves
- Table / Calendar / Gallery views
- Gantt timeline + Roadmap milestones
- Project calendar
- Documents + Wiki
- Time tracking, cost tracking, budgets
- Portfolio overview
- AI agent roster + task assignment
- Gemini Flash 2.5 integration (`/api/ai`)
- Supabase sync/load for app tables
- Supabase Storage upload for Documents

## Run locally
1. Install dependencies:
```bash
npm install
```

2. Copy environment template:
```bash
cp .env.example .env.local
```

3. Fill `.env.local`:
```bash
GEMINI_API_KEY=your_gemini_key_here
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
# Optional fallbacks:
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_SUPABASE_ANON_LEGACY_KEY=your_supabase_legacy_anon_key
SUPABASE_DB_URL=postgresql://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres
SUPABASE_DB_PASSWORD=your_supabase_db_password
```

4. Start dev server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000)

## Supabase setup
1. Create a Supabase project.
2. Open SQL Editor and run:
- `/Users/coreyralston/Documents/New project/supabase/schema.sql`
3. Confirm bucket `documents` exists (created by SQL).
4. In the app top bar:
- `Sync Supabase`: pushes local state into Supabase tables.
- `Load Supabase`: pulls Supabase tables into app state.
5. In `Documents`, use `Upload to Storage` to upload files to the `documents` bucket and attach public URLs.

## Build for production
```bash
npm run build
npm run start
```

## Logo
The app uses:
- `/Users/coreyralston/Documents/New project/public/assets/hustle-flow-logo.png`

## Notes
- Local browser state is still persisted via localStorage.
- Supabase integration currently uses public anon-key policies from `schema.sql` for rapid self-hosted MVP usage.
- For production hardening, switch to authenticated RLS policies and per-user/workspace access control.
