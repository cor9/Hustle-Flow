export const metadata = {
  title: "Hustle Flow User Guide",
  description: "Feature list and usage guide for Hustle Flow",
};

const features = [
  "Work Packages: tasks, bugs, features, risks with custom attributes, priorities, statuses, assignees, milestones",
  "Agile Boards: unlimited boards with drag-and-drop Kanban workflow",
  "Views: table, calendar, gallery task views with filtering and sorting",
  "Timeline: Gantt-style scheduling and roadmap milestone tracking",
  "Project Calendar: month view of due dates and deadlines",
  "Documents + Wiki: centralized references and project knowledge pages",
  "Time + Cost Tracking: log time, rates, and monitor budget usage",
  "Portfolio Overview: high-level health and budget visibility across projects",
  "AI Agents: create agent users, assign tasks, monitor load",
  "Gemini Integration: built-in AI assistant panel for planning/marketing/scheduling/research",
  "Supabase Integration: sync app data to PostgreSQL tables and upload files to Storage",
  "Self-hosted Ready: run with Next.js on your own infrastructure",
];

const gettingStarted = [
  "Install dependencies: npm install",
  "Configure .env.local (Gemini + Supabase keys)",
  "Run development server: npm run dev",
  "Open http://localhost:3000",
  "Apply template or create your first work package",
  "Create at least one board and move tasks through statuses",
  "Sync Supabase to persist data server-side",
];

const workflows = [
  {
    title: "Daily workflow",
    steps: [
      "Open Dashboard to review workload, milestones, and tracked costs",
      "Use Work Packages to add or update tasks with due dates and priorities",
      "Use Agile Boards to move work from Backlog to Done",
      "Log effort in Time + Cost",
      "Push updates using Sync Supabase",
    ],
  },
  {
    title: "Release planning",
    steps: [
      "Mark key tasks as Milestones",
      "Set start and due dates for schedule visibility",
      "Review Gantt and Roadmap sections",
      "Use Calendar view to validate deadline distribution",
      "Use Gemini panel to generate release checklists and risk plans",
    ],
  },
  {
    title: "Document management",
    steps: [
      "Add document links manually in Documents",
      "Upload files with Upload to Storage",
      "Create wiki entries for SOPs, project decisions, and runbooks",
      "Load Supabase from another device/session to continue where you left off",
    ],
  },
];

export default function GuidePage() {
  return (
    <main className="guide-page">
      <div className="guide-wrap">
        <header className="guide-hero panel">
          <h1>Hustle Flow User Guide</h1>
          <p className="muted">
            This guide covers what Hustle Flow does, how to use each core feature, and the standard flow for solo founders running project operations with AI support.
          </p>
          <div className="actions">
            <a className="btn" href="/">Open App</a>
            <a className="btn ghost" href="/#agents">Jump to AI Agents</a>
          </div>
        </header>

        <section className="panel">
          <h2>Feature List</h2>
          <ul className="guide-list">
            {features.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="panel">
          <h2>Getting Started</h2>
          <ol className="guide-list ordered">
            {gettingStarted.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        </section>

        <section className="panel">
          <h2>Core Workflows</h2>
          <div className="guide-grid">
            {workflows.map((flow) => (
              <article key={flow.title} className="item">
                <h3>{flow.title}</h3>
                <ol className="guide-list ordered compact">
                  {flow.steps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
              </article>
            ))}
          </div>
        </section>

        <section className="panel">
          <h2>Supabase + Storage Notes</h2>
          <ul className="guide-list">
            <li>Use the top bar buttons in the app: <strong>Sync Supabase</strong> and <strong>Load Supabase</strong>.</li>
            <li>Run the schema from <code>/Users/coreyralston/Documents/New project/supabase/schema.sql</code> first.</li>
            <li>Use the Documents section for file upload to the <code>documents</code> bucket.</li>
          </ul>
        </section>
      </div>
    </main>
  );
}
