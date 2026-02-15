"use client";

import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "hustle_flow_v2";
const STATUS_FLOW = ["Backlog", "In Progress", "Review", "Done"];
const PRIORITY_ORDER = { Critical: 0, High: 1, Medium: 2, Low: 3 };

const defaults = {
  tasks: [
    {
      id: crypto.randomUUID(),
      title: "Define launch scope",
      assignee: "Founder",
      type: "Task",
      status: "In Progress",
      priority: "High",
      board: "Core",
      startDate: keyForOffset(-2),
      dueDate: keyForOffset(4),
      estimateHours: 8,
      costRate: 95,
      details: "Finalize MVP boundary for v1 release.",
      milestone: false,
      customAttrs: { stream: "planning" },
    },
    {
      id: crypto.randomUUID(),
      title: "Beta milestone",
      assignee: "FlowBot",
      type: "Feature",
      status: "Backlog",
      priority: "Critical",
      board: "Core",
      startDate: keyForOffset(3),
      dueDate: keyForOffset(14),
      estimateHours: 12,
      costRate: 120,
      details: "Public beta package.",
      milestone: true,
      customAttrs: { release: "0.1" },
    },
  ],
  boards: ["Core", "Marketing"],
  documents: [{ id: crypto.randomUUID(), name: "MVP PRD", url: "docs/mvp-prd.md" }],
  wiki: [{ id: crypto.randomUUID(), title: "Operating Rhythm", content: "Weekly planning on Monday, review Friday." }],
  agents: [
    { id: crypto.randomUUID(), name: "FlowBot", skills: ["planning", "research"], status: "Available", load: 35 },
    { id: crypto.randomUUID(), name: "MarketPilot", skills: ["marketing", "content"], status: "Busy", load: 75 },
  ],
  projects: [{ id: crypto.randomUUID(), name: "Hustle Flow Core", budget: 40000, health: "Green" }],
  timeEntries: [],
  openClaw: { url: "", token: "" },
};

export default function Page() {
  const [hydrated, setHydrated] = useState(false);
  const [state, setState] = useState(defaults);
  const [section, setSection] = useState("dashboard");
  const [taskView, setTaskView] = useState("table");
  const [selectedBoard, setSelectedBoard] = useState(defaults.boards[0]);
  const [monthView, setMonthView] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1));

  const [taskForm, setTaskForm] = useState({
    title: "",
    assignee: "",
    type: "Feature",
    status: "Backlog",
    priority: "Medium",
    board: defaults.boards[0],
    startDate: "",
    dueDate: "",
    estimateHours: "",
    costRate: "",
    custom: "",
    milestone: false,
    details: "",
  });

  const [filters, setFilters] = useState({ search: "", status: "", priority: "", sortBy: "dueDate" });
  const [boardName, setBoardName] = useState("");
  const [docForm, setDocForm] = useState({ name: "", url: "" });
  const [wikiForm, setWikiForm] = useState({ title: "", content: "" });
  const [timeForm, setTimeForm] = useState({ taskId: "", date: "", hours: "", rate: "" });
  const [projectForm, setProjectForm] = useState({ name: "", budget: "", health: "Green" });
  const [agentForm, setAgentForm] = useState({ name: "", skills: "", status: "Available" });
  const [assignment, setAssignment] = useState({ taskId: "", agentId: "" });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const next = {
          ...defaults,
          ...parsed,
          boards: parsed?.boards?.length ? parsed.boards : defaults.boards,
          tasks: Array.isArray(parsed?.tasks) ? parsed.tasks : defaults.tasks,
        };
        setState(next);
        setSelectedBoard(next.boards[0]);
        setTaskForm((prev) => ({ ...prev, board: next.boards[0] }));
      }
    } catch {
      setState(defaults);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, hydrated]);

  useEffect(() => {
    if (!state.boards.includes(selectedBoard)) {
      setSelectedBoard(state.boards[0] || "Core");
    }
  }, [state.boards, selectedBoard]);

  const filteredTasks = useMemo(() => {
    const query = filters.search.toLowerCase().trim();
    const list = state.tasks.filter((task) => {
      const mq = !query || task.title.toLowerCase().includes(query) || (task.assignee || "").toLowerCase().includes(query);
      const ms = !filters.status || task.status === filters.status;
      const mp = !filters.priority || task.priority === filters.priority;
      return mq && ms && mp;
    });
    return list.sort((a, b) => {
      if (filters.sortBy === "priority") return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
      if (filters.sortBy === "dueDate") return (a.dueDate || "9999-99-99").localeCompare(b.dueDate || "9999-99-99");
      return String(a[filters.sortBy] || "").localeCompare(String(b[filters.sortBy] || ""));
    });
  }, [state.tasks, filters]);

  const totalCost = useMemo(
    () => state.timeEntries.reduce((sum, entry) => sum + Number(entry.hours) * Number(entry.rate), 0),
    [state.timeEntries]
  );
  const totalHours = useMemo(() => state.timeEntries.reduce((sum, entry) => sum + Number(entry.hours), 0), [state.timeEntries]);

  const milestones = useMemo(
    () => state.tasks.filter((task) => task.milestone).sort((a, b) => (a.dueDate || "").localeCompare(b.dueDate || "")),
    [state.tasks]
  );

  const assigneeLoads = useMemo(() => {
    const map = {};
    for (const task of state.tasks) {
      const key = task.assignee || "Unassigned";
      if (!map[key]) map[key] = { count: 0, hours: 0 };
      map[key].count += 1;
      map[key].hours += Number(task.estimateHours || 0);
    }
    return Object.entries(map);
  }, [state.tasks]);

  const tasksByDate = useMemo(() => {
    const map = {};
    for (const task of state.tasks) {
      if (!task.dueDate) continue;
      if (!map[task.dueDate]) map[task.dueDate] = [];
      map[task.dueDate].push(task);
    }
    return map;
  }, [state.tasks]);

  const taskDateKeys = useMemo(() => Object.keys(tasksByDate).sort(), [tasksByDate]);

  const calendarCells = useMemo(() => {
    const first = new Date(monthView.getFullYear(), monthView.getMonth(), 1);
    const offset = first.getDay();
    first.setDate(first.getDate() - offset);
    return Array.from({ length: 42 }, (_, idx) => {
      const date = new Date(first.getFullYear(), first.getMonth(), first.getDate() + idx);
      const key = keyFromDate(date);
      return { date, key, tasks: (tasksByDate[key] || []).slice(0, 3) };
    });
  }, [monthView, tasksByDate]);

  function upsertState(mutator) {
    setState((prev) => {
      const next = structuredClone(prev);
      mutator(next);
      return next;
    });
  }

  function handleCreateTask(event) {
    event.preventDefault();
    if (!taskForm.title.trim()) return;

    const task = {
      id: crypto.randomUUID(),
      title: taskForm.title.trim(),
      assignee: taskForm.assignee.trim(),
      type: taskForm.type,
      status: taskForm.status,
      priority: taskForm.priority,
      board: taskForm.board,
      startDate: taskForm.startDate,
      dueDate: taskForm.dueDate,
      estimateHours: Number(taskForm.estimateHours || 0),
      costRate: Number(taskForm.costRate || 0),
      details: taskForm.details.trim(),
      milestone: taskForm.milestone,
      customAttrs: parseCustomAttrs(taskForm.custom),
    };

    upsertState((next) => {
      next.tasks.push(task);
    });

    setTaskForm((prev) => ({
      ...prev,
      title: "",
      assignee: "",
      estimateHours: "",
      costRate: "",
      custom: "",
      milestone: false,
      details: "",
    }));
  }

  function advanceTask(taskId) {
    upsertState((next) => {
      const task = next.tasks.find((item) => item.id === taskId);
      if (!task) return;
      const idx = STATUS_FLOW.indexOf(task.status);
      task.status = STATUS_FLOW[(idx + 1) % STATUS_FLOW.length];
    });
  }

  function deleteTask(taskId) {
    upsertState((next) => {
      next.tasks = next.tasks.filter((item) => item.id !== taskId);
      next.timeEntries = next.timeEntries.filter((item) => item.taskId !== taskId);
    });
  }

  function createBoard(event) {
    event.preventDefault();
    const name = boardName.trim();
    if (!name || state.boards.includes(name)) return;
    upsertState((next) => {
      next.boards.push(name);
    });
    setSelectedBoard(name);
    setTaskForm((prev) => ({ ...prev, board: name }));
    setBoardName("");
  }

  function moveTask(taskId, status) {
    upsertState((next) => {
      const task = next.tasks.find((item) => item.id === taskId);
      if (task) task.status = status;
    });
  }

  function addDocument(event) {
    event.preventDefault();
    if (!docForm.name.trim() || !docForm.url.trim()) return;
    upsertState((next) => {
      next.documents.unshift({ id: crypto.randomUUID(), name: docForm.name.trim(), url: docForm.url.trim() });
    });
    setDocForm({ name: "", url: "" });
  }

  function addWiki(event) {
    event.preventDefault();
    if (!wikiForm.title.trim() || !wikiForm.content.trim()) return;
    upsertState((next) => {
      next.wiki.unshift({ id: crypto.randomUUID(), title: wikiForm.title.trim(), content: wikiForm.content.trim() });
    });
    setWikiForm({ title: "", content: "" });
  }

  function logTime(event) {
    event.preventDefault();
    if (!timeForm.taskId || !timeForm.date || !timeForm.hours || !timeForm.rate) return;
    upsertState((next) => {
      next.timeEntries.unshift({ id: crypto.randomUUID(), ...timeForm, hours: Number(timeForm.hours), rate: Number(timeForm.rate) });
    });
    setTimeForm({ taskId: state.tasks[0]?.id || "", date: "", hours: "", rate: "" });
  }

  function upsertProject(event) {
    event.preventDefault();
    const name = projectForm.name.trim();
    if (!name) return;
    upsertState((next) => {
      const existing = next.projects.find((project) => project.name.toLowerCase() === name.toLowerCase());
      if (existing) {
        existing.budget = Number(projectForm.budget || 0);
        existing.health = projectForm.health;
      } else {
        next.projects.push({ id: crypto.randomUUID(), name, budget: Number(projectForm.budget || 0), health: projectForm.health });
      }
    });
    setProjectForm({ name: "", budget: "", health: "Green" });
  }

  function addAgent(event) {
    event.preventDefault();
    if (!agentForm.name.trim() || !agentForm.skills.trim()) return;
    upsertState((next) => {
      next.agents.push({
        id: crypto.randomUUID(),
        name: agentForm.name.trim(),
        skills: agentForm.skills.split(",").map((s) => s.trim()).filter(Boolean),
        status: agentForm.status,
        load: agentForm.status === "Busy" ? 80 : agentForm.status === "Available" ? 30 : 0,
      });
    });
    setAgentForm({ name: "", skills: "", status: "Available" });
  }

  function assignAgent(event) {
    event.preventDefault();
    upsertState((next) => {
      const task = next.tasks.find((t) => t.id === assignment.taskId);
      const agent = next.agents.find((a) => a.id === assignment.agentId);
      if (!task || !agent) return;
      task.assignee = agent.name;
      if (task.status === "Backlog") task.status = "In Progress";
      agent.status = "Busy";
      agent.load = Math.min(100, agent.load + 10);
    });
  }

  function saveOpenClaw() {
    upsertState((next) => {
      next.openClaw = { ...next.openClaw };
    });
  }

  function applyTemplate() {
    const templateTasks = [
      { title: "Brand positioning brief", type: "Task", priority: "High", due: keyForOffset(5), board: "Marketing" },
      { title: "Landing page copy", type: "Feature", priority: "Medium", due: keyForOffset(9), board: "Marketing" },
      { title: "QA regression checklist", type: "Task", priority: "High", due: keyForOffset(7), board: "Core" },
      { title: "Launch milestone", type: "Risk", priority: "Critical", due: keyForOffset(14), board: "Core", milestone: true },
    ];

    upsertState((next) => {
      for (const item of templateTasks) {
        if (!next.boards.includes(item.board)) next.boards.push(item.board);
        next.tasks.push({
          id: crypto.randomUUID(),
          title: item.title,
          assignee: "Founder",
          type: item.type,
          status: "Backlog",
          priority: item.priority,
          board: item.board,
          startDate: keyForOffset(0),
          dueDate: item.due,
          estimateHours: 4,
          costRate: 85,
          details: "Added from template",
          milestone: Boolean(item.milestone),
          customAttrs: { template: "Product Launch" },
        });
      }
    });
  }

  function exportJson() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `hustle-flow-export-${keyFromDate(new Date())}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!hydrated) {
    return <main className="loading">Loading Hustle Flow...</main>;
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand brand-charcoal">
          <img className="brand-logo" src="/assets/hustle-flow-logo.png" alt="Hustle Flow logo" />
        </div>
        <div className="brand-copy">
          <h1>Hustle Flow</h1>
          <p>Solo PM + AI Agent Ops</p>
        </div>

        <nav className="nav" aria-label="Primary">
          {[
            ["dashboard", "Dashboard"],
            ["work-packages", "Work Packages"],
            ["boards", "Agile Boards"],
            ["timeline", "Gantt & Roadmap"],
            ["calendar", "Calendar"],
            ["docs", "Documents & Wiki"],
            ["finance", "Time + Cost"],
            ["portfolio", "Portfolios"],
            ["agents", "AI Agents"],
          ].map(([id, label]) => (
            <button key={id} className={`nav-btn ${section === id ? "active" : ""}`} onClick={() => setSection(id)}>
              {label}
            </button>
          ))}
        </nav>

        <section className="panel small">
          <h3>OpenClaw</h3>
          <label className="field-label" htmlFor="openclaw-url">Server URL</label>
          <input
            id="openclaw-url"
            type="url"
            placeholder="https://agents.local"
            value={state.openClaw.url}
            onChange={(event) => setState((prev) => ({ ...prev, openClaw: { ...prev.openClaw, url: event.target.value } }))}
          />
          <label className="field-label" htmlFor="openclaw-token">Access Token</label>
          <input
            id="openclaw-token"
            type="password"
            placeholder="ocw_..."
            value={state.openClaw.token}
            onChange={(event) => setState((prev) => ({ ...prev, openClaw: { ...prev.openClaw, token: event.target.value } }))}
          />
          <button className="btn full" onClick={saveOpenClaw}>Save Integration</button>
        </section>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <h2>{titleCase(section.replace("-", " "))}</h2>
            <p className="muted">Ready. Changes persist in browser storage.</p>
          </div>
          <div className="actions">
            <button className="btn ghost" onClick={applyTemplate}>Apply Product Launch Template</button>
            <button className="btn" onClick={exportJson}>Export Data</button>
          </div>
        </header>

        {section === "dashboard" && (
          <section className="section active">
            <div className="stats">
              <article className="stat"><h4>Work Packages</h4><p>{state.tasks.length}</p></article>
              <article className="stat"><h4>Completed</h4><p>{state.tasks.filter((t) => t.status === "Done").length}</p></article>
              <article className="stat"><h4>Tracked Hours</h4><p>{Math.round(totalHours)}</p></article>
              <article className="stat"><h4>Tracked Cost</h4><p>${Math.round(totalCost).toLocaleString()}</p></article>
            </div>
            <div className="grid two">
              <article className="panel">
                <h3>Upcoming Milestones</h3>
                <ul className="list">
                  {milestones.length ? milestones.slice(0, 6).map((m) => (
                    <li key={m.id} className="item"><strong>{m.title}</strong><br /><span className="muted">{m.dueDate || "No due date"} - {m.status}</span></li>
                  )) : <li className="item">No milestones yet.</li>}
                </ul>
              </article>
              <article className="panel">
                <h3>Weekly Load Planner</h3>
                <div className="planner">
                  {assigneeLoads.length ? assigneeLoads.map(([name, load]) => (
                    <div key={name} className="item"><strong>{name}</strong><br /><span className="muted">{load.count} items, {load.hours}h planned</span></div>
                  )) : <div className="item">No assignments yet.</div>}
                </div>
              </article>
            </div>
          </section>
        )}

        {section === "work-packages" && (
          <section className="section active">
            <article className="panel">
              <h3>Create Work Package</h3>
              <form className="grid-form" onSubmit={handleCreateTask}>
                <input value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} required placeholder="Title" />
                <input value={taskForm.assignee} onChange={(e) => setTaskForm({ ...taskForm, assignee: e.target.value })} placeholder="Assignee or AI Agent" />
                <select value={taskForm.type} onChange={(e) => setTaskForm({ ...taskForm, type: e.target.value })}><option>Feature</option><option>Task</option><option>Bug</option><option>Risk</option></select>
                <select value={taskForm.status} onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value })}>{STATUS_FLOW.map((s) => <option key={s}>{s}</option>)}</select>
                <select value={taskForm.priority} onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}><option>Low</option><option>Medium</option><option>High</option><option>Critical</option></select>
                <select value={taskForm.board} onChange={(e) => setTaskForm({ ...taskForm, board: e.target.value })}>{state.boards.map((board) => <option key={board}>{board}</option>)}</select>
                <input type="date" value={taskForm.startDate} onChange={(e) => setTaskForm({ ...taskForm, startDate: e.target.value })} />
                <input type="date" value={taskForm.dueDate} onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })} />
                <input type="number" min="0" step="0.5" value={taskForm.estimateHours} onChange={(e) => setTaskForm({ ...taskForm, estimateHours: e.target.value })} placeholder="Estimate hours" />
                <input type="number" min="0" step="1" value={taskForm.costRate} onChange={(e) => setTaskForm({ ...taskForm, costRate: e.target.value })} placeholder="Hourly $ rate" />
                <input value={taskForm.custom} onChange={(e) => setTaskForm({ ...taskForm, custom: e.target.value })} placeholder="Custom attrs (e.g. client:Acme,channel:SEO)" />
                <label className="inline-check"><input type="checkbox" checked={taskForm.milestone} onChange={(e) => setTaskForm({ ...taskForm, milestone: e.target.checked })} /> Milestone</label>
                <textarea rows={2} value={taskForm.details} onChange={(e) => setTaskForm({ ...taskForm, details: e.target.value })} placeholder="Description" />
                <button className="btn" type="submit">Add Work Package</button>
              </form>
            </article>

            <article className="panel">
              <div className="row-wrap">
                <h3>Views</h3>
                <div className="segmented">
                  {[
                    ["table", "Table"],
                    ["calendar", "Calendar"],
                    ["gallery", "Gallery"],
                  ].map(([id, label]) => (
                    <button key={id} className={`seg-btn ${taskView === id ? "active" : ""}`} onClick={() => setTaskView(id)}>{label}</button>
                  ))}
                </div>
              </div>

              <div className="filters">
                <input placeholder="Search title or assignee" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
                <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}><option value="">All statuses</option>{STATUS_FLOW.map((s) => <option key={s} value={s}>{s}</option>)}</select>
                <select value={filters.priority} onChange={(e) => setFilters({ ...filters, priority: e.target.value })}><option value="">All priorities</option>{["Critical", "High", "Medium", "Low"].map((p) => <option key={p} value={p}>{p}</option>)}</select>
                <select value={filters.sortBy} onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}>
                  <option value="dueDate">Sort: Due date</option><option value="priority">Sort: Priority</option><option value="status">Sort: Status</option><option value="title">Sort: Title</option>
                </select>
              </div>

              {taskView === "table" && (
                filteredTasks.length ? (
                  <table className="table">
                    <thead><tr><th>Title</th><th>Status</th><th>Priority</th><th>Board</th><th>Dates</th><th>Assignee</th><th>Custom</th><th>Actions</th></tr></thead>
                    <tbody>
                      {filteredTasks.map((task) => (
                        <tr key={task.id}>
                          <td><strong>{task.title}</strong><br /><span className="muted">{task.type}</span></td>
                          <td>{task.status}</td>
                          <td><span className={`badge pri-${task.priority}`}>{task.priority}</span></td>
                          <td>{task.board}</td>
                          <td>{task.startDate || "-"}<br />{task.dueDate || "-"}</td>
                          <td>{task.assignee || "Unassigned"}</td>
                          <td>{formatAttrs(task.customAttrs)}</td>
                          <td>
                            <button className="btn ghost" onClick={() => advanceTask(task.id)}>Advance</button>
                            <button className="btn ghost" onClick={() => deleteTask(task.id)}>Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : <p className="muted">No work packages match current filters.</p>
              )}

              {taskView === "calendar" && (
                taskDateKeys.length ? (
                  <div className="task-cal-grid">
                    {taskDateKeys.map((date) => (
                      <div key={date} className="item">
                        <strong>{date}</strong>
                        <ul className="list">
                          {tasksByDate[date].map((task) => <li key={task.id}>{task.title} <span className={`badge pri-${task.priority}`}>{task.priority}</span></li>)}
                        </ul>
                      </div>
                    ))}
                  </div>
                ) : <p className="muted">No due dates set for filtered packages.</p>
              )}

              {taskView === "gallery" && (
                filteredTasks.length ? (
                  <div className="task-gallery">
                    {filteredTasks.map((task) => (
                      <article key={task.id} className="item">
                        <strong>{task.title}</strong>
                        <p className="muted">{task.details || "No description"}</p>
                        <span className="badge">{task.status}</span> <span className={`badge pri-${task.priority}`}>{task.priority}</span>
                      </article>
                    ))}
                  </div>
                ) : <p className="muted">No cards to display.</p>
              )}
            </article>
          </section>
        )}

        {section === "boards" && (
          <section className="section active">
            <article className="panel">
              <div className="row-wrap">
                <h3>Kanban + Action Boards</h3>
                <form className="inline-form" onSubmit={createBoard}>
                  <input value={boardName} onChange={(e) => setBoardName(e.target.value)} maxLength={40} placeholder="New board name" required />
                  <button className="btn" type="submit">Create Board</button>
                </form>
              </div>

              <div className="row-wrap">
                <label className="field-label" htmlFor="board-selector">Board</label>
                <select id="board-selector" value={selectedBoard} onChange={(e) => setSelectedBoard(e.target.value)}>
                  {state.boards.map((board) => <option key={board} value={board}>{board}</option>)}
                </select>
              </div>

              <div className="kanban">
                {STATUS_FLOW.map((status) => (
                  <section
                    key={status}
                    className="kanban-col"
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => {
                      const taskId = event.dataTransfer.getData("text/task-id");
                      moveTask(taskId, status);
                    }}
                  >
                    <h4>{status}</h4>
                    {state.tasks.filter((task) => task.board === selectedBoard && task.status === status).map((task) => (
                      <article
                        key={task.id}
                        className="card"
                        draggable
                        onDragStart={(event) => event.dataTransfer.setData("text/task-id", task.id)}
                      >
                        <strong>{task.title}</strong><br />
                        <span className="muted">{task.assignee || "Unassigned"}</span><br />
                        <span className={`badge pri-${task.priority}`}>{task.priority}</span>
                      </article>
                    ))}
                  </section>
                ))}
              </div>
            </article>
          </section>
        )}

        {section === "timeline" && (
          <section className="section active">
            <div className="grid two">
              <article className="panel">
                <h3>Gantt</h3>
                <div className="gantt">
                  {renderGanttRows(state.tasks)}
                </div>
              </article>
              <article className="panel">
                <h3>Roadmap</h3>
                <div className="roadmap">
                  {milestones.length ? milestones.map((item) => (
                    <div key={item.id} className="item"><strong>{item.title}</strong><br /><span className="muted">{item.dueDate || "No date"} | {item.status}</span></div>
                  )) : <p className="muted">No roadmap milestones yet.</p>}
                </div>
              </article>
            </div>
          </section>
        )}

        {section === "calendar" && (
          <section className="section active">
            <article className="panel">
              <div className="row-wrap">
                <h3>Project Calendar</h3>
                <div>
                  <button className="btn ghost" onClick={() => setMonthView(new Date(monthView.getFullYear(), monthView.getMonth() - 1, 1))}>Prev</button>
                  <button className="btn ghost" onClick={() => setMonthView(new Date(monthView.getFullYear(), monthView.getMonth() + 1, 1))}>Next</button>
                </div>
              </div>
              <p className="muted">{monthView.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</p>
              <div className="month-grid-head"><span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span></div>
              <div className="month-grid">
                {calendarCells.map((cell) => (
                  <div key={`${cell.key}-${cell.date.getDate()}`} className="day-cell">
                    <span className="day-num">{cell.date.getDate()}</span>
                    {cell.tasks.map((task) => <span key={task.id} className="day-task">{task.title}</span>)}
                  </div>
                ))}
              </div>
            </article>
          </section>
        )}

        {section === "docs" && (
          <section className="section active">
            <div className="grid two">
              <article className="panel">
                <h3>Documents</h3>
                <form className="inline-form" onSubmit={addDocument}>
                  <input required placeholder="Document name" value={docForm.name} onChange={(e) => setDocForm({ ...docForm, name: e.target.value })} />
                  <input required placeholder="File URL or path" value={docForm.url} onChange={(e) => setDocForm({ ...docForm, url: e.target.value })} />
                  <button className="btn" type="submit">Add Document</button>
                </form>
                <ul className="list">
                  {state.documents.length ? state.documents.map((doc) => (
                    <li key={doc.id} className="item"><strong>{doc.name}</strong><br /><a href={doc.url} target="_blank" rel="noreferrer">{doc.url}</a></li>
                  )) : <li className="item">No documents yet.</li>}
                </ul>
              </article>

              <article className="panel">
                <h3>Wiki</h3>
                <form className="stack-form" onSubmit={addWiki}>
                  <input required placeholder="Wiki page title" value={wikiForm.title} onChange={(e) => setWikiForm({ ...wikiForm, title: e.target.value })} />
                  <textarea rows={4} required placeholder="Notes, SOPs, decisions, runbooks..." value={wikiForm.content} onChange={(e) => setWikiForm({ ...wikiForm, content: e.target.value })} />
                  <button className="btn" type="submit">Save Wiki Page</button>
                </form>
                <ul className="list">
                  {state.wiki.length ? state.wiki.map((page) => (
                    <li key={page.id} className="item"><strong>{page.title}</strong><br /><span className="muted">{page.content.slice(0, 160)}</span></li>
                  )) : <li className="item">No wiki pages yet.</li>}
                </ul>
              </article>
            </div>
          </section>
        )}

        {section === "finance" && (
          <section className="section active">
            <div className="grid two">
              <article className="panel">
                <h3>Time Tracking</h3>
                <form className="inline-form" onSubmit={logTime}>
                  <select value={timeForm.taskId} onChange={(e) => setTimeForm({ ...timeForm, taskId: e.target.value })}>
                    <option value="">Select task</option>
                    {state.tasks.map((task) => <option key={task.id} value={task.id}>{task.title}</option>)}
                  </select>
                  <input type="date" required value={timeForm.date} onChange={(e) => setTimeForm({ ...timeForm, date: e.target.value })} />
                  <input type="number" min="0.25" step="0.25" required placeholder="Hours" value={timeForm.hours} onChange={(e) => setTimeForm({ ...timeForm, hours: e.target.value })} />
                  <input type="number" min="0" step="1" required placeholder="$/hour" value={timeForm.rate} onChange={(e) => setTimeForm({ ...timeForm, rate: e.target.value })} />
                  <button className="btn" type="submit">Log Time</button>
                </form>
                <ul className="list">
                  {state.timeEntries.length ? state.timeEntries.map((entry) => {
                    const task = state.tasks.find((t) => t.id === entry.taskId);
                    return <li key={entry.id} className="item"><strong>{task?.title || "Unknown"}</strong><br /><span className="muted">{entry.date} | {entry.hours}h at ${entry.rate}/h</span></li>;
                  }) : <li className="item">No time logged yet.</li>}
                </ul>
              </article>

              <article className="panel">
                <h3>Cost Tracking & Budgets</h3>
                <form className="inline-form" onSubmit={upsertProject}>
                  <input required placeholder="Project name" value={projectForm.name} onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })} />
                  <input type="number" min="0" step="100" required placeholder="Budget" value={projectForm.budget} onChange={(e) => setProjectForm({ ...projectForm, budget: e.target.value })} />
                  <select value={projectForm.health} onChange={(e) => setProjectForm({ ...projectForm, health: e.target.value })}><option>Green</option><option>Yellow</option><option>Red</option></select>
                  <button className="btn" type="submit">Upsert Project</button>
                </form>
                <div>
                  <div className="item"><strong>Total Budget:</strong> ${state.projects.reduce((sum, p) => sum + Number(p.budget || 0), 0).toLocaleString()}</div>
                  <div className="item"><strong>Spent:</strong> ${Math.round(totalCost).toLocaleString()}</div>
                </div>
              </article>
            </div>
          </section>
        )}

        {section === "portfolio" && (
          <section className="section active">
            <article className="panel">
              <h3>Portfolio Overview</h3>
              <div className="cards">
                {state.projects.length ? state.projects.map((project) => {
                  const used = project.budget ? Math.min(100, (totalCost / Number(project.budget)) * 100) : 0;
                  return <article key={project.id} className="item"><strong>{project.name}</strong><br /><span className="muted">Health: {project.health} | Budget: ${Number(project.budget).toLocaleString()} | Used: {used.toFixed(1)}%</span></article>;
                }) : <article className="item">No projects yet.</article>}
              </div>
            </article>
          </section>
        )}

        {section === "agents" && (
          <section className="section active">
            <div className="grid two">
              <article className="panel">
                <h3>AI Agent Users</h3>
                <form className="inline-form" onSubmit={addAgent}>
                  <input required placeholder="Agent name" value={agentForm.name} onChange={(e) => setAgentForm({ ...agentForm, name: e.target.value })} />
                  <input required placeholder="Skills (comma-separated)" value={agentForm.skills} onChange={(e) => setAgentForm({ ...agentForm, skills: e.target.value })} />
                  <select value={agentForm.status} onChange={(e) => setAgentForm({ ...agentForm, status: e.target.value })}><option>Available</option><option>Busy</option><option>Offline</option></select>
                  <button className="btn" type="submit">Add Agent</button>
                </form>
                <ul className="list">
                  {state.agents.length ? state.agents.map((agent) => (
                    <li key={agent.id} className="item"><strong>{agent.name}</strong><br /><span className="muted">{agent.skills.join(", ")} | {agent.status} | Load {agent.load}%</span></li>
                  )) : <li className="item">No agents added.</li>}
                </ul>
              </article>

              <article className="panel">
                <h3>Agent Command Center</h3>
                <p className="muted">Assign work packages to AI agents for planning, marketing, research, scheduling, and execution support.</p>
                <form className="inline-form" onSubmit={assignAgent}>
                  <select value={assignment.taskId} onChange={(e) => setAssignment({ ...assignment, taskId: e.target.value })}>
                    <option value="">Select task</option>
                    {state.tasks.map((task) => <option key={task.id} value={task.id}>{task.title}</option>)}
                  </select>
                  <select value={assignment.agentId} onChange={(e) => setAssignment({ ...assignment, agentId: e.target.value })}>
                    <option value="">Select agent</option>
                    {state.agents.map((agent) => <option key={agent.id} value={agent.id}>{agent.name}</option>)}
                  </select>
                  <button className="btn" type="submit">Assign</button>
                </form>
                <div className="ops-box">
                  {state.tasks.filter((task) => state.agents.some((agent) => agent.name === task.assignee)).length ? (
                    state.tasks
                      .filter((task) => state.agents.some((agent) => agent.name === task.assignee))
                      .map((task) => <div key={task.id} className="item"><strong>{task.title}</strong><br /><span className="muted">Assigned to {task.assignee} ({task.status})</span></div>)
                  ) : <div className="item">No tasks currently assigned to AI agents.</div>}
                </div>
              </article>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function renderGanttRows(tasks) {
  const dated = tasks.filter((task) => task.startDate && task.dueDate).sort((a, b) => a.startDate.localeCompare(b.startDate));
  if (!dated.length) return <p className="muted">Add start and due dates to show Gantt bars.</p>;

  const minDate = new Date(dated[0].startDate);
  const maxDate = new Date(Math.max(...dated.map((task) => new Date(task.dueDate).getTime())));
  const totalSpan = Math.max(1, dayDiff(minDate, maxDate));

  return dated.map((task) => {
    const left = (dayDiff(minDate, new Date(task.startDate)) / totalSpan) * 100;
    const width = (Math.max(1, dayDiff(new Date(task.startDate), new Date(task.dueDate))) / totalSpan) * 100;
    return (
      <div key={task.id} className="gantt-row">
        <strong>{task.title}</strong><br />
        <span className="muted">{task.startDate} -&gt; {task.dueDate}</span>
        <div className="gantt-bar-wrap"><div className="gantt-bar" style={{ marginLeft: `${left}%`, width: `${Math.min(width, 100 - left)}%` }} /></div>
      </div>
    );
  });
}

function formatAttrs(attrs) {
  const entries = Object.entries(attrs || {});
  if (!entries.length) return <span className="muted">none</span>;
  return entries.map(([key, value]) => <span key={key} className="badge">{key}:{String(value)}</span>);
}

function parseCustomAttrs(raw) {
  if (!raw.trim()) return {};
  return raw
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce((acc, pair) => {
      const [k, ...rest] = pair.split(":");
      if (!k || !rest.length) return acc;
      acc[k.trim()] = rest.join(":").trim();
      return acc;
    }, {});
}

function keyFromDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function keyForOffset(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return keyFromDate(date);
}

function dayDiff(start, end) {
  return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
}

function titleCase(value) {
  return value.replace(/\b\w/g, (char) => char.toUpperCase());
}
