# Hustle Flow (Simplified Next.js)

Hustle Flow is a streamlined solo-operator project cockpit with a card-first board, deadline calendar, OpenClaw skill execution, and a lightweight document vault.

## Core navigation
1. Dashboard
2. Boards
3. Calendar
4. Agent Hub
5. Vault

## Feature list
- **Action Items** (single unified entity for tasks/work items)
- **Kanban + Gallery Boards**
- **Card-first UI** with minimal surface info and expandable details
- **Task Detail Drawer** with tabs: Overview, Agent Output, Advanced
- **Properties Sidebar** (custom attributes hidden from main board)
- **OpenClaw Skill Slot** on every Action Item
- **Run Agent** with in-task live activity log + output area
- **Deadline-only Calendar**
- **Vault** for Documents + Wiki
- **Optimistic drag/drop** board movement
- **Supabase sync/load** and Storage uploads (optional)

## OpenClaw endpoint contract
- `Run Agent` attempts:
  - `POST <OPENCLAW_URL>/api/skills/run`
- Headers:
  - `Authorization: Bearer <token>`
  - `Content-Type: application/json`
- Body:
  - `{ skill, task: { id, title, projectTag, description, customAttrs, advanced } }`
- Expected response:
  - `{ logs: string[], output: string }` (or `result` as fallback)
- If unavailable, Hustle Flow falls back to local simulated execution logs/output.

## Local run
```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Environment variables
```bash
GEMINI_API_KEY=your_gemini_key_here
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_optional
NEXT_PUBLIC_SUPABASE_ANON_LEGACY_KEY=your_supabase_legacy_anon_key_optional
SUPABASE_DB_URL=postgresql://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres
SUPABASE_DB_PASSWORD=your_supabase_db_password
```

## Supabase setup
- Run schema SQL: `/Users/coreyralston/Documents/New project/supabase/schema.sql`
- Use **Sync Cloud** / **Load Cloud** in app
- Use **Vault > Upload to Storage** for file upload to bucket `documents`
