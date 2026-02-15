# Hustle Flow

Hustle Flow is a colorful, self-hostable project and task management web app for solopreneurs with AI-agent-assisted operations.

## What this MVP includes
- Work Packages for tasks, bugs, features, and risks with:
  - Custom attributes
  - Status + priority controls
  - Search, filtering, sorting
  - Table, calendar, and gallery task views
- Agile Boards:
  - Unlimited board creation
  - Kanban drag-and-drop by status
- Gantt + Roadmap:
  - Timeline bars from start/due dates
  - Milestone roadmap list
- Calendar:
  - Monthly calendar view of due tasks
- Documents + Wiki:
  - Document references/links
  - Wiki page storage
- Time Tracking + Cost Tracking:
  - Time logs by task
  - Cost rollups and budget consumption
- Portfolios:
  - Multi-project health and budget overview
- Team Planner:
  - Weekly workload summary by assignee
- AI Agent Users:
  - Agent roster with skills/status
  - Task assignment to agents
- OpenClaw integration settings:
  - Local endpoint/token config placeholder
- Self-hosted friendly:
  - Static HTML/CSS/JS app
  - LocalStorage persistence
  - Export to JSON

## Run locally
Open `/Users/coreyralston/Documents/New project/index.html` in a browser.

## Self-host options
Because it is static, you can host with any static file server:

```bash
# from /Users/coreyralston/Documents/New project
python3 -m http.server 8080
```

Then open `http://localhost:8080`.

## Suggested next build steps
- Add a real backend (PostgreSQL + API) for multi-user and server-side auth.
- Add WebSocket collaboration for true real-time multi-user editing.
- Add actual OpenClaw API calls and skill execution history.
- Add role-based permissions and audit logs.
- Add import/export from GitHub Issues and Projects.

## Logo setup
Place your logo image at `/Users/coreyralston/Documents/New project/assets/hustle-flow-logo.png`.
The sidebar brand card is already styled with a charcoal background for this mark.
