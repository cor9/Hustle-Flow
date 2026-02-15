const STORAGE_KEY = "hustle_flow_v1";
const STATUS_FLOW = ["Backlog", "In Progress", "Review", "Done"];
const PRIORITY_ORDER = { Critical: 0, High: 1, Medium: 2, Low: 3 };

const today = new Date();
let viewMonth = new Date(today.getFullYear(), today.getMonth(), 1);

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
      comments: ["Kickoff completed"]
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
      comments: []
    }
  ],
  boards: ["Core", "Marketing"],
  documents: [
    { id: crypto.randomUUID(), name: "MVP PRD", url: "docs/mvp-prd.md" }
  ],
  wiki: [
    { id: crypto.randomUUID(), title: "Operating Rhythm", content: "Weekly planning on Monday, review Friday." }
  ],
  agents: [
    { id: crypto.randomUUID(), name: "FlowBot", skills: ["planning", "research"], status: "Available", load: 35 },
    { id: crypto.randomUUID(), name: "MarketPilot", skills: ["marketing", "content"], status: "Busy", load: 75 }
  ],
  projects: [
    { id: crypto.randomUUID(), name: "Hustle Flow Core", budget: 40000, health: "Green" }
  ],
  timeEntries: [],
  openClaw: { url: "", token: "" }
};

let state = loadState();
let taskView = "table";
let selectedSection = "dashboard";
let selectedBoard = state.boards[0] || "Core";

cacheInputs();
wireEvents();
renderAll();

window.addEventListener("storage", (event) => {
  if (event.key === STORAGE_KEY) {
    state = loadState();
    renderAll();
    refs.liveSync.textContent = "Synced from another tab.";
  }
});

function cacheInputs() {
  window.refs = {
    sectionTitle: el("section-title"),
    liveSync: el("live-sync"),
    navButtons: document.querySelectorAll(".nav-btn"),
    sections: document.querySelectorAll(".section"),
    statsGrid: el("stats-grid"),
    milestoneList: el("milestone-list"),
    teamPlanner: el("team-planner"),

    taskForm: el("task-form"),
    taskTitle: el("task-title"),
    taskAssignee: el("task-assignee"),
    taskType: el("task-type"),
    taskStatus: el("task-status"),
    taskPriority: el("task-priority"),
    taskBoard: el("task-board"),
    taskStart: el("task-start"),
    taskDue: el("task-due"),
    taskEstimate: el("task-estimate"),
    taskCostRate: el("task-cost-rate"),
    taskCustom: el("task-custom"),
    taskMilestone: el("task-milestone"),
    taskDetails: el("task-details"),

    taskViewTable: el("task-view-table"),
    taskViewCalendar: el("task-view-calendar"),
    taskViewGallery: el("task-view-gallery"),
    viewButtons: document.querySelectorAll(".seg-btn"),
    searchInput: el("search-input"),
    filterStatus: el("filter-status"),
    filterPriority: el("filter-priority"),
    sortBy: el("sort-by"),

    boardForm: el("board-form"),
    boardName: el("board-name"),
    boardSelector: el("board-selector"),
    kanban: el("kanban"),

    gantt: el("gantt"),
    roadmap: el("roadmap"),

    prevMonth: el("prev-month"),
    nextMonth: el("next-month"),
    calendarLabel: el("calendar-label"),
    monthGrid: el("month-grid"),

    documentForm: el("document-form"),
    docName: el("doc-name"),
    docUrl: el("doc-url"),
    documentList: el("document-list"),

    wikiForm: el("wiki-form"),
    wikiTitle: el("wiki-title"),
    wikiContent: el("wiki-content"),
    wikiList: el("wiki-list"),

    timeForm: el("time-form"),
    timeTask: el("time-task"),
    timeDate: el("time-date"),
    timeHours: el("time-hours"),
    timeRate: el("time-rate"),
    timeList: el("time-list"),

    budgetForm: el("budget-form"),
    projectName: el("project-name"),
    projectBudget: el("project-budget"),
    projectHealth: el("project-health"),
    budgetSummary: el("budget-summary"),

    portfolioGrid: el("portfolio-grid"),

    agentForm: el("agent-form"),
    agentName: el("agent-name"),
    agentSkills: el("agent-skills"),
    agentStatus: el("agent-status"),
    agentList: el("agent-list"),

    assignForm: el("agent-assignment-form"),
    assignTask: el("assign-task"),
    assignAgent: el("assign-agent"),
    agentOps: el("agent-ops"),

    openclawUrl: el("openclaw-url"),
    openclawToken: el("openclaw-token"),
    saveOpenclaw: el("save-openclaw"),
    seedTemplate: el("seed-template"),
    exportJson: el("export-json")
  };
}

function wireEvents() {
  refs.navButtons.forEach((button) => {
    button.addEventListener("click", () => setSection(button.dataset.section));
  });

  refs.taskForm.addEventListener("submit", onCreateTask);
  refs.viewButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      taskView = btn.dataset.view;
      renderTaskViews();
      refs.viewButtons.forEach((node) => node.classList.toggle("active", node === btn));
    });
  });

  [refs.searchInput, refs.filterStatus, refs.filterPriority, refs.sortBy].forEach((input) => {
    input.addEventListener("input", renderTaskViews);
    input.addEventListener("change", renderTaskViews);
  });

  refs.boardForm.addEventListener("submit", onCreateBoard);
  refs.boardSelector.addEventListener("change", () => {
    selectedBoard = refs.boardSelector.value;
    renderKanban();
  });

  refs.documentForm.addEventListener("submit", onAddDocument);
  refs.wikiForm.addEventListener("submit", onAddWiki);
  refs.timeForm.addEventListener("submit", onLogTime);
  refs.budgetForm.addEventListener("submit", onUpsertProject);
  refs.agentForm.addEventListener("submit", onAddAgent);
  refs.assignForm.addEventListener("submit", onAssignAgent);

  refs.prevMonth.addEventListener("click", () => {
    viewMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1);
    renderCalendar();
  });

  refs.nextMonth.addEventListener("click", () => {
    viewMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1);
    renderCalendar();
  });

  refs.seedTemplate.addEventListener("click", applyTemplate);
  refs.exportJson.addEventListener("click", exportState);
  refs.saveOpenclaw.addEventListener("click", () => {
    state.openClaw = {
      url: refs.openclawUrl.value.trim(),
      token: refs.openclawToken.value.trim()
    };
    persist();
    refs.liveSync.textContent = "OpenClaw integration saved locally.";
  });
}

function renderAll() {
  renderBoardSelectors();
  renderTaskFilters();
  renderDashboard();
  renderTaskViews();
  renderKanban();
  renderTimeline();
  renderCalendar();
  renderDocs();
  renderWiki();
  renderFinance();
  renderPortfolio();
  renderAgents();
  refs.openclawUrl.value = state.openClaw.url;
  refs.openclawToken.value = state.openClaw.token;
  setSection(selectedSection);
}

function setSection(sectionId) {
  selectedSection = sectionId;
  refs.sectionTitle.textContent = titleCase(sectionId.replace("-", " "));

  refs.sections.forEach((section) => {
    section.classList.toggle("active", section.id === sectionId);
  });

  refs.navButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.section === sectionId);
  });
}

function renderDashboard() {
  const tasks = state.tasks;
  const completed = tasks.filter((task) => task.status === "Done").length;
  const overdue = tasks.filter((task) => task.dueDate && new Date(task.dueDate) < startOfDay(new Date()) && task.status !== "Done").length;
  const totalHours = state.timeEntries.reduce((sum, entry) => sum + entry.hours, 0);
  const totalCost = state.timeEntries.reduce((sum, entry) => sum + (entry.hours * entry.rate), 0);

  refs.statsGrid.innerHTML = [
    statCard("Work Packages", tasks.length),
    statCard("Completed", completed),
    statCard("Overdue", overdue),
    statCard("Tracked Cost", `$${Math.round(totalCost).toLocaleString()}`)
  ].join("");

  refs.milestoneList.innerHTML = "";
  const milestones = tasks
    .filter((task) => task.milestone)
    .sort((a, b) => (a.dueDate || "").localeCompare(b.dueDate || ""));

  if (!milestones.length) {
    refs.milestoneList.innerHTML = '<li class="item">No milestones yet.</li>';
  } else {
    milestones.slice(0, 6).forEach((milestone) => {
      refs.milestoneList.insertAdjacentHTML(
        "beforeend",
        `<li class="item"><strong>${escapeHtml(milestone.title)}</strong><br><span class="muted">${milestone.dueDate || "No due date"} - ${milestone.status}</span></li>`
      );
    });
  }

  refs.teamPlanner.innerHTML = "";
  const assignees = groupBy(tasks, (task) => task.assignee || "Unassigned");
  Object.entries(assignees).forEach(([name, list]) => {
    const load = list.reduce((sum, task) => sum + (Number(task.estimateHours) || 0), 0);
    refs.teamPlanner.insertAdjacentHTML(
      "beforeend",
      `<div class="item"><strong>${escapeHtml(name)}</strong><br><span class="muted">${list.length} items, ${load}h planned</span></div>`
    );
  });

  if (!Object.keys(assignees).length) {
    refs.teamPlanner.innerHTML = '<div class="item">No assignments yet.</div>';
  }

  refs.liveSync.textContent = `Ready. ${tasks.length} packages, ${Math.round(totalHours)}h logged.`;
}

function renderTaskFilters() {
  refs.filterStatus.innerHTML = '<option value="">All statuses</option>' + STATUS_FLOW.map((status) => `<option value="${status}">${status}</option>`).join("");
  refs.filterPriority.innerHTML = '<option value="">All priorities</option>' + ["Critical", "High", "Medium", "Low"].map((priority) => `<option value="${priority}">${priority}</option>`).join("");
}

function renderTaskViews() {
  const filtered = getFilteredTasks();

  refs.taskViewTable.classList.toggle("hidden", taskView !== "table");
  refs.taskViewCalendar.classList.toggle("hidden", taskView !== "calendar");
  refs.taskViewGallery.classList.toggle("hidden", taskView !== "gallery");

  renderTableView(filtered);
  renderTaskCalendarView(filtered);
  renderGalleryView(filtered);
  populateTaskSelector();
}

function renderTableView(tasks) {
  if (!tasks.length) {
    refs.taskViewTable.innerHTML = '<p class="muted">No work packages match current filters.</p>';
    return;
  }

  refs.taskViewTable.innerHTML = `
    <table class="table">
      <thead>
        <tr>
          <th>Title</th>
          <th>Status</th>
          <th>Priority</th>
          <th>Board</th>
          <th>Dates</th>
          <th>Assignee</th>
          <th>Custom</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${tasks.map((task) => `
          <tr>
            <td><strong>${escapeHtml(task.title)}</strong><br><span class="muted">${escapeHtml(task.type)}</span></td>
            <td>${escapeHtml(task.status)}</td>
            <td><span class="badge pri-${task.priority}">${task.priority}</span></td>
            <td>${escapeHtml(task.board)}</td>
            <td>${task.startDate || "-"}<br>${task.dueDate || "-"}</td>
            <td>${escapeHtml(task.assignee || "Unassigned")}</td>
            <td>${formatAttrs(task.customAttrs)}</td>
            <td>
              <button class="btn ghost" data-act="advance" data-id="${task.id}">Advance</button>
              <button class="btn ghost" data-act="delete" data-id="${task.id}">Delete</button>
            </td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;

  refs.taskViewTable.querySelectorAll("button[data-act]").forEach((button) => {
    button.addEventListener("click", () => {
      const task = state.tasks.find((item) => item.id === button.dataset.id);
      if (!task) return;
      if (button.dataset.act === "advance") {
        const idx = STATUS_FLOW.indexOf(task.status);
        task.status = STATUS_FLOW[(idx + 1) % STATUS_FLOW.length];
      }
      if (button.dataset.act === "delete") {
        state.tasks = state.tasks.filter((item) => item.id !== task.id);
      }
      persistAndRender();
    });
  });
}

function renderTaskCalendarView(tasks) {
  const grouped = groupBy(tasks.filter((task) => task.dueDate), (task) => task.dueDate);
  const dates = Object.keys(grouped).sort();

  if (!dates.length) {
    refs.taskViewCalendar.innerHTML = '<p class="muted">No due dates set for filtered packages.</p>';
    return;
  }

  refs.taskViewCalendar.innerHTML = `<div class="task-cal-grid">${dates.map((date) => `
      <div class="item">
        <strong>${date}</strong>
        <ul class="list">
          ${grouped[date].map((task) => `<li>${escapeHtml(task.title)} <span class="badge pri-${task.priority}">${task.priority}</span></li>`).join("")}
        </ul>
      </div>
    `).join("")}</div>`;
}

function renderGalleryView(tasks) {
  if (!tasks.length) {
    refs.taskViewGallery.innerHTML = '<p class="muted">No cards to display.</p>';
    return;
  }

  refs.taskViewGallery.innerHTML = `<div class="task-gallery">${tasks.map((task) => `
      <article class="item">
        <strong>${escapeHtml(task.title)}</strong>
        <p class="muted">${escapeHtml(task.details || "No description")}</p>
        <span class="badge">${escapeHtml(task.status)}</span>
        <span class="badge pri-${task.priority}">${task.priority}</span>
      </article>
    `).join("")}</div>`;
}

function renderKanban() {
  refs.kanban.innerHTML = "";
  const tasks = state.tasks.filter((task) => task.board === selectedBoard);

  STATUS_FLOW.forEach((status) => {
    const col = document.createElement("section");
    col.className = "kanban-col";
    col.dataset.status = status;
    col.innerHTML = `<h4>${status}</h4>`;

    tasks.filter((task) => task.status === status).forEach((task) => {
      const card = document.createElement("article");
      card.className = "card";
      card.draggable = true;
      card.dataset.id = task.id;
      card.innerHTML = `<strong>${escapeHtml(task.title)}</strong><br><span class="muted">${escapeHtml(task.assignee || "Unassigned")}</span><br><span class="badge pri-${task.priority}">${task.priority}</span>`;
      card.addEventListener("dragstart", (event) => {
        event.dataTransfer.setData("text/task-id", task.id);
      });
      col.append(card);
    });

    col.addEventListener("dragover", (event) => event.preventDefault());
    col.addEventListener("drop", (event) => {
      event.preventDefault();
      const taskId = event.dataTransfer.getData("text/task-id");
      const task = state.tasks.find((item) => item.id === taskId);
      if (!task) return;
      task.status = status;
      persistAndRender();
    });

    refs.kanban.append(col);
  });
}

function renderTimeline() {
  const tasks = state.tasks.filter((task) => task.startDate && task.dueDate).sort((a, b) => a.startDate.localeCompare(b.startDate));
  refs.gantt.innerHTML = "";

  if (!tasks.length) {
    refs.gantt.innerHTML = '<p class="muted">Add start and due dates to show Gantt bars.</p>';
  } else {
    const minDate = new Date(tasks[0].startDate);
    const maxDate = new Date(Math.max(...tasks.map((task) => new Date(task.dueDate).getTime())));
    const totalSpan = Math.max(1, dayDiff(minDate, maxDate));

    tasks.forEach((task) => {
      const left = (dayDiff(minDate, new Date(task.startDate)) / totalSpan) * 100;
      const width = (Math.max(1, dayDiff(new Date(task.startDate), new Date(task.dueDate))) / totalSpan) * 100;
      refs.gantt.insertAdjacentHTML(
        "beforeend",
        `<div class="gantt-row"><strong>${escapeHtml(task.title)}</strong><br><span class="muted">${task.startDate} -> ${task.dueDate}</span><div class="gantt-bar-wrap"><div class="gantt-bar" style="margin-left:${left}%;width:${Math.min(width, 100 - left)}%"></div></div></div>`
      );
    });
  }

  const roadmapItems = state.tasks
    .filter((task) => task.milestone)
    .sort((a, b) => (a.dueDate || "").localeCompare(b.dueDate || ""));

  refs.roadmap.innerHTML = roadmapItems.length
    ? roadmapItems.map((item) => `<div class="item"><strong>${escapeHtml(item.title)}</strong><br><span class="muted">${item.dueDate || "No date"} | ${item.status}</span></div>`).join("")
    : '<p class="muted">No roadmap milestones yet.</p>';
}

function renderCalendar() {
  refs.calendarLabel.textContent = viewMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  refs.monthGrid.innerHTML = "";

  const first = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1);
  const offset = first.getDay();
  first.setDate(first.getDate() - offset);

  for (let i = 0; i < 42; i += 1) {
    const date = new Date(first.getFullYear(), first.getMonth(), first.getDate() + i);
    const key = keyFromDate(date);
    const dayTasks = state.tasks.filter((task) => task.dueDate === key).slice(0, 3);
    const cell = document.createElement("div");
    cell.className = "day-cell";
    cell.innerHTML = `<span class="day-num">${date.getDate()}</span>${dayTasks.map((task) => `<span class="day-task">${escapeHtml(task.title)}</span>`).join("")}`;
    refs.monthGrid.append(cell);
  }
}

function renderDocs() {
  refs.documentList.innerHTML = state.documents.length
    ? state.documents.map((doc) => `<li class="item"><strong>${escapeHtml(doc.name)}</strong><br><a href="${escapeHtml(doc.url)}" target="_blank" rel="noopener">${escapeHtml(doc.url)}</a></li>`).join("")
    : '<li class="item">No documents uploaded yet.</li>';
}

function renderWiki() {
  refs.wikiList.innerHTML = state.wiki.length
    ? state.wiki.map((page) => `<li class="item"><strong>${escapeHtml(page.title)}</strong><br><span class="muted">${escapeHtml(page.content.slice(0, 140))}</span></li>`).join("")
    : '<li class="item">No wiki pages yet.</li>';
}

function renderFinance() {
  const tasks = state.tasks;
  refs.timeTask.innerHTML = tasks.map((task) => `<option value="${task.id}">${escapeHtml(task.title)}</option>`).join("");

  refs.timeList.innerHTML = state.timeEntries.length
    ? state.timeEntries.map((entry) => {
      const task = tasks.find((item) => item.id === entry.taskId);
      return `<li class="item"><strong>${escapeHtml(task?.title || "Unknown task")}</strong><br><span class="muted">${entry.date} | ${entry.hours}h at $${entry.rate}/h</span></li>`;
    }).join("")
    : '<li class="item">No time logged yet.</li>';

  const totalCost = state.timeEntries.reduce((sum, entry) => sum + (entry.hours * entry.rate), 0);
  const totalBudget = state.projects.reduce((sum, project) => sum + Number(project.budget || 0), 0);
  const consumed = totalBudget ? Math.min(100, (totalCost / totalBudget) * 100) : 0;

  refs.budgetSummary.innerHTML = `
    <div class="item"><strong>Total Budget:</strong> $${Math.round(totalBudget).toLocaleString()}</div>
    <div class="item"><strong>Spent:</strong> $${Math.round(totalCost).toLocaleString()}</div>
    <div class="item"><strong>Consumption:</strong> ${consumed.toFixed(1)}%</div>
  `;
}

function renderPortfolio() {
  const totalCost = state.timeEntries.reduce((sum, entry) => sum + entry.hours * entry.rate, 0);

  refs.portfolioGrid.innerHTML = state.projects.length
    ? state.projects.map((project) => {
      const ratio = project.budget ? Math.min(100, (totalCost / project.budget) * 100) : 0;
      return `<article class="item"><strong>${escapeHtml(project.name)}</strong><br><span class="muted">Health: ${project.health} | Budget: $${Number(project.budget).toLocaleString()} | Used: ${ratio.toFixed(1)}%</span></article>`;
    }).join("")
    : '<article class="item">No projects yet.</article>';
}

function renderAgents() {
  refs.agentList.innerHTML = state.agents.length
    ? state.agents.map((agent) => `<li class="item"><strong>${escapeHtml(agent.name)}</strong><br><span class="muted">${escapeHtml(agent.skills.join(", "))} | ${agent.status} | Load ${agent.load}%</span></li>`).join("")
    : '<li class="item">No agents added.</li>';

  refs.assignTask.innerHTML = state.tasks.map((task) => `<option value="${task.id}">${escapeHtml(task.title)}</option>`).join("");
  refs.assignAgent.innerHTML = state.agents.map((agent) => `<option value="${agent.id}">${escapeHtml(agent.name)}</option>`).join("");

  const assigned = state.tasks.filter((task) => state.agents.some((agent) => agent.name === task.assignee));
  refs.agentOps.innerHTML = assigned.length
    ? assigned.map((task) => `<div class="item"><strong>${escapeHtml(task.title)}</strong><br><span class="muted">Assigned to ${escapeHtml(task.assignee)} (${task.status})</span></div>`).join("")
    : '<div class="item">No tasks currently assigned to AI agents.</div>';
}

function renderBoardSelectors() {
  refs.taskBoard.innerHTML = state.boards.map((board) => `<option value="${board}">${escapeHtml(board)}</option>`).join("");
  refs.boardSelector.innerHTML = state.boards.map((board) => `<option value="${board}">${escapeHtml(board)}</option>`).join("");
  if (!state.boards.includes(selectedBoard)) selectedBoard = state.boards[0];
  refs.boardSelector.value = selectedBoard;
}

function onCreateTask(event) {
  event.preventDefault();

  const task = {
    id: crypto.randomUUID(),
    title: refs.taskTitle.value.trim(),
    assignee: refs.taskAssignee.value.trim(),
    type: refs.taskType.value,
    status: refs.taskStatus.value,
    priority: refs.taskPriority.value,
    board: refs.taskBoard.value,
    startDate: refs.taskStart.value,
    dueDate: refs.taskDue.value,
    estimateHours: Number(refs.taskEstimate.value || 0),
    costRate: Number(refs.taskCostRate.value || 0),
    details: refs.taskDetails.value.trim(),
    milestone: refs.taskMilestone.checked,
    customAttrs: parseCustomAttrs(refs.taskCustom.value),
    comments: []
  };

  if (!task.title) return;
  state.tasks.push(task);
  refs.taskForm.reset();
  persistAndRender();
}

function onCreateBoard(event) {
  event.preventDefault();
  const name = refs.boardName.value.trim();
  if (!name || state.boards.includes(name)) return;
  state.boards.push(name);
  selectedBoard = name;
  refs.boardName.value = "";
  persistAndRender();
}

function onAddDocument(event) {
  event.preventDefault();
  state.documents.unshift({
    id: crypto.randomUUID(),
    name: refs.docName.value.trim(),
    url: refs.docUrl.value.trim()
  });
  refs.documentForm.reset();
  persistAndRender();
}

function onAddWiki(event) {
  event.preventDefault();
  state.wiki.unshift({
    id: crypto.randomUUID(),
    title: refs.wikiTitle.value.trim(),
    content: refs.wikiContent.value.trim()
  });
  refs.wikiForm.reset();
  persistAndRender();
}

function onLogTime(event) {
  event.preventDefault();
  state.timeEntries.unshift({
    id: crypto.randomUUID(),
    taskId: refs.timeTask.value,
    date: refs.timeDate.value,
    hours: Number(refs.timeHours.value),
    rate: Number(refs.timeRate.value)
  });
  refs.timeForm.reset();
  persistAndRender();
}

function onUpsertProject(event) {
  event.preventDefault();
  const name = refs.projectName.value.trim();
  if (!name) return;

  const existing = state.projects.find((project) => project.name.toLowerCase() === name.toLowerCase());
  if (existing) {
    existing.budget = Number(refs.projectBudget.value || 0);
    existing.health = refs.projectHealth.value;
  } else {
    state.projects.push({
      id: crypto.randomUUID(),
      name,
      budget: Number(refs.projectBudget.value || 0),
      health: refs.projectHealth.value
    });
  }

  refs.budgetForm.reset();
  persistAndRender();
}

function onAddAgent(event) {
  event.preventDefault();
  state.agents.push({
    id: crypto.randomUUID(),
    name: refs.agentName.value.trim(),
    skills: refs.agentSkills.value.split(",").map((skill) => skill.trim()).filter(Boolean),
    status: refs.agentStatus.value,
    load: refs.agentStatus.value === "Busy" ? 80 : refs.agentStatus.value === "Available" ? 30 : 0
  });
  refs.agentForm.reset();
  persistAndRender();
}

function onAssignAgent(event) {
  event.preventDefault();
  const task = state.tasks.find((item) => item.id === refs.assignTask.value);
  const agent = state.agents.find((item) => item.id === refs.assignAgent.value);
  if (!task || !agent) return;
  task.assignee = agent.name;
  if (task.status === "Backlog") task.status = "In Progress";
  agent.status = "Busy";
  agent.load = Math.min(100, agent.load + 10);
  persistAndRender();
}

function applyTemplate() {
  const templateTasks = [
    { title: "Brand positioning brief", type: "Task", priority: "High", due: keyForOffset(5), board: "Marketing" },
    { title: "Landing page copy", type: "Feature", priority: "Medium", due: keyForOffset(9), board: "Marketing" },
    { title: "QA regression checklist", type: "Task", priority: "High", due: keyForOffset(7), board: "Core" },
    { title: "Launch milestone", type: "Risk", priority: "Critical", due: keyForOffset(14), board: "Core", milestone: true }
  ];

  templateTasks.forEach((item) => {
    state.tasks.push({
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
      comments: []
    });
  });

  persistAndRender();
}

function exportState() {
  const data = JSON.stringify(state, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `hustle-flow-export-${keyFromDate(new Date())}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function getFilteredTasks() {
  const query = refs.searchInput.value.trim().toLowerCase();
  const status = refs.filterStatus.value;
  const priority = refs.filterPriority.value;
  const sortBy = refs.sortBy.value;

  const filtered = state.tasks.filter((task) => {
    const matchesQuery = !query || task.title.toLowerCase().includes(query) || (task.assignee || "").toLowerCase().includes(query);
    const matchesStatus = !status || task.status === status;
    const matchesPriority = !priority || task.priority === priority;
    return matchesQuery && matchesStatus && matchesPriority;
  });

  return filtered.sort((a, b) => {
    if (sortBy === "priority") return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
    if (sortBy === "dueDate") return (a.dueDate || "9999").localeCompare(b.dueDate || "9999");
    return String(a[sortBy] || "").localeCompare(String(b[sortBy] || ""));
  });
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

function formatAttrs(attrs) {
  const entries = Object.entries(attrs || {});
  if (!entries.length) return '<span class="muted">none</span>';
  return entries.map(([key, value]) => `<span class="badge">${escapeHtml(key)}:${escapeHtml(String(value))}</span>`).join(" ");
}

function populateTaskSelector() {
  refs.timeTask.innerHTML = state.tasks.map((task) => `<option value="${task.id}">${escapeHtml(task.title)}</option>`).join("");
}

function persistAndRender() {
  persist();
  renderAll();
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (!parsed) return structuredClone(defaults);
    return {
      tasks: Array.isArray(parsed.tasks) ? parsed.tasks : structuredClone(defaults.tasks),
      boards: Array.isArray(parsed.boards) && parsed.boards.length ? parsed.boards : structuredClone(defaults.boards),
      documents: Array.isArray(parsed.documents) ? parsed.documents : [],
      wiki: Array.isArray(parsed.wiki) ? parsed.wiki : [],
      agents: Array.isArray(parsed.agents) ? parsed.agents : structuredClone(defaults.agents),
      projects: Array.isArray(parsed.projects) ? parsed.projects : structuredClone(defaults.projects),
      timeEntries: Array.isArray(parsed.timeEntries) ? parsed.timeEntries : [],
      openClaw: parsed.openClaw || { url: "", token: "" }
    };
  } catch {
    return structuredClone(defaults);
  }
}

function statCard(label, value) {
  return `<article class="stat"><h4>${label}</h4><p>${value}</p></article>`;
}

function el(id) {
  return document.getElementById(id);
}

function groupBy(list, mapper) {
  return list.reduce((acc, item) => {
    const key = mapper(item);
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
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

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function titleCase(value) {
  return value.replace(/\b\w/g, (char) => char.toUpperCase());
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
