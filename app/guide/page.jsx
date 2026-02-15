export const metadata = {
  title: "Hustle Flow User Guide",
  description: "Simplified workflow guide for Hustle Flow",
};

const features = [
  "Action Items: one unified entity for tasks, bugs, features, and risks",
  "Boards: roomy Kanban and visual Gallery with card-first design",
  "Calendar: deadline-only month view",
  "Agent Hub: OpenClaw status, credential storage, and skill management",
  "Vault: documents and wiki knowledge base",
  "Task Detail Drawer with tabs: Overview, Agent Output, Advanced",
  "Properties sidebar: custom attributes kept out of board clutter",
  "Agent Slot in every card: Assign to Agent Skill + Run Agent",
  "Live Activity Log + Agent Output embedded in task context",
  "Optimistic drag-and-drop card movement for instant board updates",
  "Modern dark UI with high-contrast status/priority signals",
  "Mobile-friendly single-column Kanban layout",
];

const sidebarMap = [
  "Dashboard",
  "Boards",
  "Calendar",
  "Agent Hub",
  "Vault",
];

const quickStart = [
  "Open Boards and create your first Action Item",
  "Set project tag and deadline",
  "Switch between Kanban and Gallery views",
  "Open an Action Item, assign an Agent Skill, and run the agent",
  "Review Agent Output and save decisions into Vault Wiki",
  "Use Calendar to verify upcoming due dates",
  "Use Sync Cloud in the top bar or Agent Hub when needed",
];

export default function GuidePage() {
  return (
    <main className="guide-page">
      <div className="guide-wrap">
        <header className="guide-hero hf-panel">
          <h1>Hustle Flow User Guide</h1>
          <p className="muted">
            Hustle Flow is intentionally simplified for solo operators: fewer routes, clearer cards, and agent actions embedded directly in task context.
          </p>
          <div className="hf-actions">
            <a className="btn" href="/">Open App</a>
            <a className="btn ghost" href="/">Back to Dashboard</a>
          </div>
        </header>

        <section className="hf-panel">
          <h2>Sidebar Structure</h2>
          <ol className="guide-list ordered">
            {sidebarMap.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        </section>

        <section className="hf-panel">
          <h2>Feature List</h2>
          <ul className="guide-list">
            {features.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="hf-panel">
          <h2>Quick Start</h2>
          <ol className="guide-list ordered compact">
            {quickStart.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        </section>
      </div>
    </main>
  );
}
