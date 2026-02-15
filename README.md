# Hustle Flow (Next.js)

Hustle Flow is now a Next.js web app for solopreneur project operations with AI-agent-assisted workflows.

## Stack
- Next.js App Router
- React
- CSS (global design system)
- Browser localStorage persistence (MVP)

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
- OpenClaw integration settings placeholder

## Run locally
1. Install dependencies:
```bash
npm install
```

2. Start dev server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000)

## Build for production
```bash
npm run build
npm run start
```

## Logo
The app uses:
- `/Users/coreyralston/Documents/New project/public/assets/hustle-flow-logo.png`

## Notes
- Data currently persists per-browser via localStorage.
- Next step for multi-user/self-hosted teams: add API routes + PostgreSQL + auth + realtime sync.
