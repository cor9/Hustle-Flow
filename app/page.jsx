"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "../lib/supabase/client";

const STORAGE_KEY = "hustle_flow_simplified_v1";
const WORKSPACE_ID = "solo-default";
const STATUS_COLUMNS = ["Backlog", "To Do", "Doing", "Done"];
const PRIORITY_LEVELS = ["Low", "Medium", "High", "Critical"];

const defaultSkills = [
  {
    id: crypto.randomUUID(),
    name: "OpenClaw Web Search",
    description: "Collect sources, summarize findings, and return link-backed notes.",
  },
  {
    id: crypto.randomUUID(),
    name: "OpenClaw Planner",
    description: "Build scoped execution plans with dependencies and time blocks.",
  },
  {
    id: crypto.randomUUID(),
    name: "OpenClaw Copy Draft",
    description: "Generate campaign copy, headlines, and launch messaging drafts.",
  },
];

const defaults = {
  actionItems: [
    {
      id: crypto.randomUUID(),
      title: "Ship onboarding walkthrough",
      projectTag: "Product",
      status: "Doing",
      priority: "High",
      assignee: "Founder",
      dueDate: dateOffset(4),
      startDate: dateOffset(-1),
      imageUrl: "https://images.unsplash.com/photo-1523475472560-d2df97ec485c?auto=format&fit=crop&w=1200&q=80",
      description: "Design a simple first-run checklist for new users.",
      advanced: {
        estimateHours: 8,
        costRate: 95,
        budgetCap: 1200,
        portfolioTag: "Core",
        workload: "Medium",
        riskLevel: "Low",
      },
      customAttrs: { stream: "onboarding", channel: "web" },
      agent: {
        skill: "OpenClaw Planner",
        status: "running",
        log: [
          {
            id: crypto.randomUUID(),
            text: "Planner started: sequencing story points and dependencies.",
            time: new Date().toISOString(),
          },
        ],
        output: "",
        lastRunAt: "",
      },
    },
    {
      id: crypto.randomUUID(),
      title: "Research competitor pricing",
      projectTag: "Growth",
      status: "To Do",
      priority: "Critical",
      assignee: "",
      dueDate: dateOffset(6),
      startDate: dateOffset(1),
      imageUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80",
      description: "Build side-by-side pricing matrix and identify positioning gaps.",
      advanced: {
        estimateHours: 6,
        costRate: 110,
        budgetCap: 1500,
        portfolioTag: "Go-To-Market",
        workload: "Medium",
        riskLevel: "Medium",
      },
      customAttrs: { market: "US", output: "matrix" },
      agent: {
        skill: "OpenClaw Web Search",
        status: "idle",
        log: [],
        output: "",
        lastRunAt: "",
      },
    },
    {
      id: crypto.randomUUID(),
      title: "Draft launch hero visuals",
      projectTag: "Creative",
      status: "Backlog",
      priority: "Medium",
      assignee: "",
      dueDate: dateOffset(9),
      startDate: dateOffset(3),
      imageUrl: "https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=1200&q=80",
      description: "Create three visual directions for landing page hero.",
      advanced: {
        estimateHours: 10,
        costRate: 85,
        budgetCap: 1800,
        portfolioTag: "Brand",
        workload: "High",
        riskLevel: "Low",
      },
      customAttrs: { assetType: "image", campaign: "launch" },
      agent: {
        skill: "OpenClaw Copy Draft",
        status: "idle",
        log: [],
        output: "",
        lastRunAt: "",
      },
    },
  ],
  documents: [],
  wiki: [
    {
      id: crypto.randomUUID(),
      title: "Operating cadence",
      content: "Daily board review at 9:00. Weekly roadmap review every Friday.",
    },
  ],
  openClaw: {
    url: "",
    token: "",
  },
  agentSkills: defaultSkills,
};

export default function Page() {
  const [hydrated, setHydrated] = useState(false);
  const [state, setState] = useState(defaults);
  const [section, setSection] = useState("dashboard");
  const [boardView, setBoardView] = useState("kanban");
  const [search, setSearch] = useState("");
  const [selectedItemId, setSelectedItemId] = useState("");
  const [detailTab, setDetailTab] = useState("overview");
  const [expandedCards, setExpandedCards] = useState({});
  const [customAttrsText, setCustomAttrsText] = useState("");

  const [monthView, setMonthView] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1));

  const [composer, setComposer] = useState({
    title: "",
    projectTag: "Product",
    status: "Backlog",
    priority: "Medium",
    dueDate: "",
    imageUrl: "",
    description: "",
  });

  const [documentForm, setDocumentForm] = useState({ name: "", url: "" });
  const [wikiForm, setWikiForm] = useState({ title: "", content: "" });
  const [skillForm, setSkillForm] = useState({ name: "", description: "" });
  const [docFile, setDocFile] = useState(null);

  const [syncLoading, setSyncLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState("");
  const [uploadingDoc, setUploadingDoc] = useState(false);

  const supabase = useMemo(() => getSupabaseBrowserClient(), []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const merged = {
          ...defaults,
          ...parsed,
          actionItems: Array.isArray(parsed?.actionItems) ? parsed.actionItems : defaults.actionItems,
          documents: Array.isArray(parsed?.documents) ? parsed.documents : [],
          wiki: Array.isArray(parsed?.wiki) ? parsed.wiki : [],
          agentSkills: Array.isArray(parsed?.agentSkills) && parsed.agentSkills.length ? parsed.agentSkills : defaultSkills,
          openClaw: parsed?.openClaw || defaults.openClaw,
        };
        setState(merged);
      }
    } catch {
      setState(defaults);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [hydrated, state]);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return state.actionItems;
    return state.actionItems.filter((item) => {
      return (
        item.title.toLowerCase().includes(query) ||
        item.projectTag.toLowerCase().includes(query) ||
        (item.description || "").toLowerCase().includes(query)
      );
    });
  }, [search, state.actionItems]);

  const selectedItem = useMemo(
    () => state.actionItems.find((item) => item.id === selectedItemId) || null,
    [selectedItemId, state.actionItems]
  );

  useEffect(() => {
    if (!selectedItem) {
      setCustomAttrsText("");
      return;
    }
    setCustomAttrsText(formatCustomAttrs(selectedItem.customAttrs));
  }, [selectedItem]);

  const summary = useMemo(() => {
    const total = state.actionItems.length;
    const doing = state.actionItems.filter((item) => item.status === "Doing").length;
    const done = state.actionItems.filter((item) => item.status === "Done").length;
    const runningAgents = state.actionItems.filter((item) => item.agent?.status === "running").length;
    const dueSoon = state.actionItems.filter((item) => isDueWithinDays(item.dueDate, 7) && item.status !== "Done").length;
    return { total, doing, done, runningAgents, dueSoon };
  }, [state.actionItems]);

  const calendarCells = useMemo(() => {
    const first = new Date(monthView.getFullYear(), monthView.getMonth(), 1);
    const offset = first.getDay();
    first.setDate(first.getDate() - offset);

    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(first.getFullYear(), first.getMonth(), first.getDate() + index);
      const key = keyFromDate(date);
      const items = state.actionItems.filter((item) => item.dueDate === key);
      return { date, key, items };
    });
  }, [monthView, state.actionItems]);

  function upsertState(mutator) {
    setState((prev) => {
      const next = structuredClone(prev);
      mutator(next);
      return next;
    });
  }

  function updateActionItem(itemId, mutator) {
    upsertState((next) => {
      const target = next.actionItems.find((item) => item.id === itemId);
      if (!target) return;
      mutator(target);
    });
  }

  function createActionItem(event) {
    event.preventDefault();
    if (!composer.title.trim()) return;

    const newItem = {
      id: crypto.randomUUID(),
      title: composer.title.trim(),
      projectTag: composer.projectTag.trim() || "General",
      status: composer.status,
      priority: composer.priority,
      assignee: "",
      dueDate: composer.dueDate,
      startDate: "",
      imageUrl: composer.imageUrl.trim(),
      description: composer.description.trim(),
      advanced: {
        estimateHours: 0,
        costRate: 0,
        budgetCap: 0,
        portfolioTag: "",
        workload: "Low",
        riskLevel: "Low",
      },
      customAttrs: {},
      agent: {
        skill: state.agentSkills[0]?.name || "",
        status: "idle",
        log: [],
        output: "",
        lastRunAt: "",
      },
    };

    upsertState((next) => {
      next.actionItems.unshift(newItem);
    });

    setComposer({
      title: "",
      projectTag: composer.projectTag,
      status: "Backlog",
      priority: "Medium",
      dueDate: "",
      imageUrl: "",
      description: "",
    });
  }

  function moveCard(itemId, nextStatus) {
    updateActionItem(itemId, (item) => {
      item.status = nextStatus;
    });
  }

  function removeActionItem(itemId) {
    upsertState((next) => {
      next.actionItems = next.actionItems.filter((item) => item.id !== itemId);
    });
    if (selectedItemId === itemId) {
      setSelectedItemId("");
    }
  }

  function toggleCardDetails(itemId) {
    setExpandedCards((prev) => ({ ...prev, [itemId]: !prev[itemId] }));
  }

  function assignSkill(itemId, skillName) {
    updateActionItem(itemId, (item) => {
      item.agent.skill = skillName;
    });
  }

  function runAgent(itemId) {
    const item = state.actionItems.find((candidate) => candidate.id === itemId);
    if (!item) return;
    if (!item.agent?.skill) {
      setSyncStatus("Assign an Agent Skill before running.");
      return;
    }

    const startTime = new Date().toISOString();
    updateActionItem(itemId, (target) => {
      target.agent.status = "running";
      target.agent.lastRunAt = startTime;
      target.agent.log = [
        ...target.agent.log,
        {
          id: crypto.randomUUID(),
          time: startTime,
          text: `Starting ${target.agent.skill} for \"${target.title}\".`,
        },
      ].slice(-60);
    });

    if (state.openClaw.url && state.openClaw.token) {
      void executeOpenClaw(itemId, item);
      return;
    }

    simulateAgentExecution(itemId);
  }

  function appendAgentLog(itemId, text) {
    updateActionItem(itemId, (target) => {
      target.agent.log = [
        ...target.agent.log,
        {
          id: crypto.randomUUID(),
          time: new Date().toISOString(),
          text,
        },
      ].slice(-60);
    });
  }

  async function executeOpenClaw(itemId, itemSnapshot) {
    appendAgentLog(itemId, "Connecting to OpenClaw endpoint...");

    try {
      const baseUrl = state.openClaw.url.replace(/\/+$/, "");
      const response = await fetch(`${baseUrl}/api/skills/run`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${state.openClaw.token}`,
        },
        body: JSON.stringify({
          skill: itemSnapshot.agent.skill,
          task: {
            id: itemSnapshot.id,
            title: itemSnapshot.title,
            projectTag: itemSnapshot.projectTag,
            description: itemSnapshot.description,
            customAttrs: itemSnapshot.customAttrs,
            advanced: itemSnapshot.advanced,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenClaw responded ${response.status}`);
      }

      const payload = await response.json();
      const output = String(payload?.output || payload?.result || "No output payload returned.");
      const logs = Array.isArray(payload?.logs)
        ? payload.logs.map((line) => String(line))
        : ["OpenClaw execution completed."];

      updateActionItem(itemId, (target) => {
        target.agent.status = "idle";
        target.agent.lastRunAt = new Date().toISOString();
        target.agent.output = output;
        target.agent.log = [
          ...target.agent.log,
          ...logs.map((line) => ({
            id: crypto.randomUUID(),
            time: new Date().toISOString(),
            text: line,
          })),
          {
            id: crypto.randomUUID(),
            time: new Date().toISOString(),
            text: "OpenClaw run completed. Output saved.",
          },
        ].slice(-60);
      });
    } catch (error) {
      appendAgentLog(itemId, `OpenClaw unavailable (${error.message}). Falling back to local simulation.`);
      simulateAgentExecution(itemId);
    }
  }

  function simulateAgentExecution(itemId) {
    window.setTimeout(() => {
      appendAgentLog(itemId, "Collecting context from task description and properties...");
    }, 500);

    window.setTimeout(() => {
      appendAgentLog(itemId, "Executing skill pipeline and drafting structured output...");
    }, 1100);

    window.setTimeout(() => {
      updateActionItem(itemId, (target) => {
        const output = [
          `Skill: ${target.agent.skill}`,
          `Generated: ${new Date().toLocaleString()}`,
          "",
          "Actionable Output:",
          `1. Goal: ${target.title}`,
          `2. Recommended next step: finalize a short execution brief for ${target.projectTag}.`,
          "3. Suggested artifacts: checklist, links, and decision notes.",
          "4. Risk flag: validate assumptions before execution.",
        ].join("\n");

        target.agent.status = "idle";
        target.agent.output = output;
        target.agent.log = [
          ...target.agent.log,
          {
            id: crypto.randomUUID(),
            time: new Date().toISOString(),
            text: "Run completed. Output saved in Agent Output.",
          },
        ].slice(-60);
      });
    }, 1900);
  }

  function saveCustomProperties() {
    if (!selectedItem) return;
    const parsed = parseCustomAttrs(customAttrsText);
    updateActionItem(selectedItem.id, (item) => {
      item.customAttrs = parsed;
    });
    setSyncStatus("Properties saved.");
  }

  function addDocumentLink(event) {
    event.preventDefault();
    if (!documentForm.name.trim() || !documentForm.url.trim()) return;
    upsertState((next) => {
      next.documents.unshift({
        id: crypto.randomUUID(),
        name: documentForm.name.trim(),
        url: documentForm.url.trim(),
        storagePath: "",
      });
    });
    setDocumentForm({ name: "", url: "" });
  }

  async function uploadDocumentToStorage() {
    if (!supabase) {
      setSyncStatus("Set Supabase environment variables to use Storage upload.");
      return;
    }
    if (!docFile) {
      setSyncStatus("Choose a file first.");
      return;
    }

    setUploadingDoc(true);
    setSyncStatus("Uploading file to Supabase Storage...");

    try {
      const safeName = sanitizeFileName(docFile.name);
      const storagePath = `${WORKSPACE_ID}/${Date.now()}-${safeName}`;
      const uploadResult = await supabase.storage.from("documents").upload(storagePath, docFile, { upsert: false });
      if (uploadResult.error) throw uploadResult.error;

      const { data } = supabase.storage.from("documents").getPublicUrl(storagePath);
      const publicUrl = data?.publicUrl || "";

      const newDoc = {
        id: crypto.randomUUID(),
        name: documentForm.name.trim() || docFile.name,
        url: publicUrl,
        storagePath,
      };

      upsertState((next) => {
        next.documents.unshift(newDoc);
      });

      setDocFile(null);
      setDocumentForm({ name: "", url: "" });
      setSyncStatus("Upload complete. Document added to Vault.");
    } catch (error) {
      setSyncStatus(`Upload failed: ${error.message}`);
    } finally {
      setUploadingDoc(false);
    }
  }

  function addWikiPage(event) {
    event.preventDefault();
    if (!wikiForm.title.trim() || !wikiForm.content.trim()) return;

    upsertState((next) => {
      next.wiki.unshift({
        id: crypto.randomUUID(),
        title: wikiForm.title.trim(),
        content: wikiForm.content.trim(),
      });
    });

    setWikiForm({ title: "", content: "" });
  }

  function addSkill(event) {
    event.preventDefault();
    if (!skillForm.name.trim()) return;

    const newSkill = {
      id: crypto.randomUUID(),
      name: skillForm.name.trim(),
      description: skillForm.description.trim() || "Custom OpenClaw skill.",
    };

    upsertState((next) => {
      next.agentSkills.push(newSkill);
    });

    setSkillForm({ name: "", description: "" });
  }

  function removeSkill(skillId) {
    const skill = state.agentSkills.find((item) => item.id === skillId);
    if (!skill) return;

    upsertState((next) => {
      next.agentSkills = next.agentSkills.filter((item) => item.id !== skillId);
      next.actionItems.forEach((actionItem) => {
        if (actionItem.agent.skill === skill.name) {
          actionItem.agent.skill = "";
        }
      });
    });
  }

  function saveOpenClaw() {
    setSyncStatus("OpenClaw credentials stored locally.");
  }

  async function syncToSupabase() {
    if (!supabase) {
      setSyncStatus("Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_* key before syncing.");
      return;
    }

    setSyncLoading(true);
    setSyncStatus("Syncing to Supabase...");

    try {
      const taskRows = state.actionItems.map((item) => ({
        id: item.id,
        workspace_id: WORKSPACE_ID,
        title: item.title,
        assignee: item.assignee || "",
        type: "Action Item",
        status: item.status,
        priority: item.priority,
        board: item.projectTag || "General",
        start_date: item.startDate || null,
        due_date: item.dueDate || null,
        estimate_hours: Number(item.advanced?.estimateHours || 0),
        cost_rate: Number(item.advanced?.costRate || 0),
        details: item.description || "",
        milestone: false,
        custom_attrs: {
          projectTag: item.projectTag,
          imageUrl: item.imageUrl,
          advanced: item.advanced,
          customAttrs: item.customAttrs,
          agent: item.agent,
        },
      }));

      const documentRows = state.documents.map((doc) => ({
        id: doc.id,
        workspace_id: WORKSPACE_ID,
        name: doc.name,
        url: doc.url,
        storage_path: doc.storagePath || null,
      }));

      const wikiRows = state.wiki.map((page) => ({
        id: page.id,
        workspace_id: WORKSPACE_ID,
        title: page.title,
        content: page.content,
      }));

      await replaceWorkspaceRows(supabase, "tasks", taskRows);
      await replaceWorkspaceRows(supabase, "documents", documentRows);
      await replaceWorkspaceRows(supabase, "wiki_pages", wikiRows);

      const openClawResult = await supabase.from("openclaw_settings").upsert({
        id: WORKSPACE_ID,
        workspace_id: WORKSPACE_ID,
        url: state.openClaw.url || "",
        token: state.openClaw.token || "",
      });
      if (openClawResult.error) throw openClawResult.error;

      setSyncStatus("Supabase sync complete.");
    } catch (error) {
      setSyncStatus(`Sync failed: ${error.message}`);
    } finally {
      setSyncLoading(false);
    }
  }

  async function loadFromSupabase() {
    if (!supabase) {
      setSyncStatus("Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_* key before loading.");
      return;
    }

    setSyncLoading(true);
    setSyncStatus("Loading workspace from Supabase...");

    try {
      const [tasksRes, docsRes, wikiRes, openClawRes] = await Promise.all([
        supabase.from("tasks").select("*").eq("workspace_id", WORKSPACE_ID),
        supabase.from("documents").select("*").eq("workspace_id", WORKSPACE_ID),
        supabase.from("wiki_pages").select("*").eq("workspace_id", WORKSPACE_ID),
        supabase.from("openclaw_settings").select("*").eq("workspace_id", WORKSPACE_ID).maybeSingle(),
      ]);

      if (tasksRes.error) throw tasksRes.error;
      if (docsRes.error) throw docsRes.error;
      if (wikiRes.error) throw wikiRes.error;
      if (openClawRes.error && openClawRes.error.code !== "PGRST116") throw openClawRes.error;

      const actionItems = (tasksRes.data || []).map((row) => {
        const attrs = asObject(row.custom_attrs);
        const advanced = asObject(attrs.advanced);
        const customAttrs = asObject(attrs.customAttrs);
        const agent = asObject(attrs.agent);

        return {
          id: row.id,
          title: row.title,
          projectTag: attrs.projectTag || row.board || "General",
          status: STATUS_COLUMNS.includes(row.status) ? row.status : "Backlog",
          priority: PRIORITY_LEVELS.includes(row.priority) ? row.priority : "Medium",
          assignee: row.assignee || "",
          dueDate: row.due_date || "",
          startDate: row.start_date || "",
          imageUrl: attrs.imageUrl || "",
          description: row.details || "",
          advanced: {
            estimateHours: Number(advanced.estimateHours || row.estimate_hours || 0),
            costRate: Number(advanced.costRate || row.cost_rate || 0),
            budgetCap: Number(advanced.budgetCap || 0),
            portfolioTag: String(advanced.portfolioTag || ""),
            workload: String(advanced.workload || "Low"),
            riskLevel: String(advanced.riskLevel || "Low"),
          },
          customAttrs,
          agent: {
            skill: String(agent.skill || ""),
            status: String(agent.status || "idle"),
            log: Array.isArray(agent.log) ? agent.log : [],
            output: String(agent.output || ""),
            lastRunAt: String(agent.lastRunAt || ""),
          },
        };
      });

      const documents = (docsRes.data || []).map((row) => ({
        id: row.id,
        name: row.name,
        url: row.url,
        storagePath: row.storage_path || "",
      }));

      const wiki = (wikiRes.data || []).map((row) => ({
        id: row.id,
        title: row.title,
        content: row.content,
      }));

      setState((prev) => ({
        ...prev,
        actionItems: actionItems.length ? actionItems : prev.actionItems,
        documents,
        wiki,
        openClaw: openClawRes.data
          ? {
              url: openClawRes.data.url || "",
              token: openClawRes.data.token || "",
            }
          : prev.openClaw,
      }));

      setSyncStatus("Loaded latest data from Supabase.");
    } catch (error) {
      setSyncStatus(`Load failed: ${error.message}`);
    } finally {
      setSyncLoading(false);
    }
  }

  if (!hydrated) {
    return <main className="loading">Loading Hustle Flow...</main>;
  }

  return (
    <div className="hf-shell">
      <aside className="hf-sidebar">
        <div className="hf-brand-card">
          <img className="hf-logo" src="/assets/hustle-flow-logo.png" alt="Hustle Flow" />
        </div>
        <div className="hf-brand-copy">
          <h1>Hustle Flow</h1>
          <p>Lean PMOS for founders + OpenClaw skills</p>
        </div>

        <nav className="hf-nav" aria-label="Primary">
          {[
            ["dashboard", "Dashboard"],
            ["boards", "Boards"],
            ["calendar", "Calendar"],
            ["agent-hub", "Agent Hub"],
            ["vault", "Vault"],
          ].map(([id, label]) => (
            <button
              key={id}
              className={`hf-nav-btn ${section === id ? "active" : ""}`}
              onClick={() => setSection(id)}
            >
              {label}
            </button>
          ))}
        </nav>
      </aside>

      <main className="hf-main">
        <header className="hf-topbar">
          <div>
            <h2>{titleCase(section.replace("-", " "))}</h2>
            <p className="muted">
              {syncStatus || "Optimistic interactions enabled. Card moves update instantly."}
            </p>
          </div>
          <div className="hf-actions">
            <a className="btn ghost" href="/guide">User Guide</a>
            <button className="btn ghost" onClick={loadFromSupabase} disabled={syncLoading}>Load Cloud</button>
            <button className="btn" onClick={syncToSupabase} disabled={syncLoading}>{syncLoading ? "Syncing..." : "Sync Cloud"}</button>
          </div>
        </header>

        {section === "dashboard" && (
          <section className="hf-section">
            <div className="hf-stat-grid">
              <article className="hf-stat"><h4>Action Items</h4><p>{summary.total}</p></article>
              <article className="hf-stat status-doing"><h4>Doing</h4><p>{summary.doing}</p></article>
              <article className="hf-stat status-done"><h4>Done</h4><p>{summary.done}</p></article>
              <article className="hf-stat"><h4>Agents Running</h4><p>{summary.runningAgents}</p></article>
            </div>

            <div className="hf-grid-two">
              <article className="hf-panel">
                <h3>Due in 7 Days</h3>
                <p className="muted">{summary.dueSoon} items need attention this week.</p>
                <ul className="hf-list">
                  {state.actionItems
                    .filter((item) => isDueWithinDays(item.dueDate, 7) && item.status !== "Done")
                    .sort((a, b) => (a.dueDate || "").localeCompare(b.dueDate || ""))
                    .slice(0, 8)
                    .map((item) => (
                      <li key={item.id} className="hf-item">
                        <strong>{item.title}</strong>
                        <span className="muted">{item.projectTag} · due {item.dueDate || "n/a"}</span>
                      </li>
                    ))}
                </ul>
              </article>

              <article className="hf-panel">
                <h3>Quick Actions</h3>
                <div className="hf-quick-actions">
                  <button className="btn" onClick={() => setSection("boards")}>Open Boards</button>
                  <button className="btn ghost" onClick={() => setSection("agent-hub")}>Manage Skills</button>
                  <button className="btn ghost" onClick={() => setSection("vault")}>Open Vault</button>
                  <a className="btn ghost" href="/guide">Read User Guide</a>
                </div>
              </article>
            </div>
          </section>
        )}

        {section === "boards" && (
          <section className="hf-section">
            <article className="hf-panel">
              <div className="hf-row">
                <h3>Action Items</h3>
                <div className="hf-segmented">
                  <button className={`hf-seg-btn ${boardView === "kanban" ? "active" : ""}`} onClick={() => setBoardView("kanban")}>Kanban</button>
                  <button className={`hf-seg-btn ${boardView === "gallery" ? "active" : ""}`} onClick={() => setBoardView("gallery")}>Gallery</button>
                </div>
              </div>

              <form className="hf-composer" onSubmit={createActionItem}>
                <input
                  value={composer.title}
                  onChange={(event) => setComposer((prev) => ({ ...prev, title: event.target.value }))}
                  placeholder="New Action Item title"
                  required
                />
                <input
                  value={composer.projectTag}
                  onChange={(event) => setComposer((prev) => ({ ...prev, projectTag: event.target.value }))}
                  placeholder="Project Tag"
                />
                <select value={composer.status} onChange={(event) => setComposer((prev) => ({ ...prev, status: event.target.value }))}>
                  {STATUS_COLUMNS.map((status) => <option key={status}>{status}</option>)}
                </select>
                <select value={composer.priority} onChange={(event) => setComposer((prev) => ({ ...prev, priority: event.target.value }))}>
                  {PRIORITY_LEVELS.map((priority) => <option key={priority}>{priority}</option>)}
                </select>
                <input
                  type="date"
                  value={composer.dueDate}
                  onChange={(event) => setComposer((prev) => ({ ...prev, dueDate: event.target.value }))}
                />
                <input
                  value={composer.imageUrl}
                  onChange={(event) => setComposer((prev) => ({ ...prev, imageUrl: event.target.value }))}
                  placeholder="Image URL (optional for Gallery)"
                />
                <textarea
                  rows={2}
                  value={composer.description}
                  onChange={(event) => setComposer((prev) => ({ ...prev, description: event.target.value }))}
                  placeholder="Short description"
                />
                <button className="btn" type="submit">Create Action Item</button>
              </form>

              <div className="hf-row">
                <input
                  className="hf-search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search title, project tag, or description"
                />
              </div>

              {boardView === "kanban" ? (
                <div className="hf-kanban">
                  {STATUS_COLUMNS.map((status) => (
                    <section
                      key={status}
                      className="hf-column"
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={(event) => {
                        const id = event.dataTransfer.getData("text/item-id");
                        moveCard(id, status);
                      }}
                    >
                      <header className={`hf-column-head status-${toStatusClass(status)}`}>
                        <h4>{status}</h4>
                        <span>{filteredItems.filter((item) => item.status === status).length}</span>
                      </header>

                      <div className="hf-card-stack">
                        {filteredItems
                          .filter((item) => item.status === status)
                          .map((item) => (
                            <article
                              key={item.id}
                              className="hf-card"
                              draggable
                              onDragStart={(event) => event.dataTransfer.setData("text/item-id", item.id)}
                            >
                              <button className="hf-card-open" onClick={() => { setSelectedItemId(item.id); setDetailTab("overview"); }}>
                                <strong>{item.title}</strong>
                                <span className="hf-tag">{item.projectTag || "General"}</span>
                                {item.agent?.status === "running" ? <span className="hf-agent-active">Agent Running</span> : null}
                              </button>

                              <button className="hf-mini-link" onClick={() => toggleCardDetails(item.id)}>
                                {expandedCards[item.id] ? "Hide" : "Show More"}
                              </button>

                              {expandedCards[item.id] ? (
                                <div className="hf-card-more">
                                  <div className="hf-mini-meta">
                                    <span className={`hf-priority p-${item.priority.toLowerCase()}`}>{item.priority}</span>
                                    <span>{item.assignee || "Unassigned"}</span>
                                    <span>{item.dueDate || "No deadline"}</span>
                                  </div>

                                  <label className="hf-field-label">Assign to Agent Skill</label>
                                  <select
                                    value={item.agent.skill || ""}
                                    onChange={(event) => assignSkill(item.id, event.target.value)}
                                  >
                                    <option value="">Select skill</option>
                                    {state.agentSkills.map((skill) => (
                                      <option key={skill.id} value={skill.name}>{skill.name}</option>
                                    ))}
                                  </select>

                                  <div className="hf-row-tight">
                                    <button className="btn" onClick={() => runAgent(item.id)}>Run Agent</button>
                                    <button className="btn ghost" onClick={() => removeActionItem(item.id)}>Delete</button>
                                  </div>

                                  <div className="hf-log-box">
                                    {item.agent.log.length ? (
                                      item.agent.log.slice(-3).map((entry) => (
                                        <p key={entry.id}><span>{formatClock(entry.time)}</span> {entry.text}</p>
                                      ))
                                    ) : (
                                      <p>No activity yet.</p>
                                    )}
                                  </div>
                                </div>
                              ) : null}
                            </article>
                          ))}
                      </div>
                    </section>
                  ))}
                </div>
              ) : (
                <div className="hf-gallery">
                  {filteredItems.map((item) => (
                    <article key={item.id} className="hf-gallery-card" onClick={() => { setSelectedItemId(item.id); setDetailTab("overview"); }}>
                      <img src={item.imageUrl || fallbackImage(item.projectTag)} alt={item.title} loading="lazy" />
                      <div className="hf-gallery-meta">
                        <strong>{item.title}</strong>
                        <span className="hf-tag">{item.projectTag || "General"}</span>
                        {item.agent?.status === "running" ? <span className="hf-agent-active">Agent Running</span> : null}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </article>
          </section>
        )}

        {section === "calendar" && (
          <section className="hf-section">
            <article className="hf-panel">
              <div className="hf-row">
                <h3>Calendar (Deadlines)</h3>
                <div className="hf-row-tight">
                  <button className="btn ghost" onClick={() => setMonthView(new Date(monthView.getFullYear(), monthView.getMonth() - 1, 1))}>Prev</button>
                  <button className="btn ghost" onClick={() => setMonthView(new Date(monthView.getFullYear(), monthView.getMonth() + 1, 1))}>Next</button>
                </div>
              </div>

              <p className="muted">{monthView.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</p>

              <div className="hf-calendar-head">
                <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
              </div>
              <div className="hf-calendar-grid">
                {calendarCells.map((cell) => (
                  <div key={`${cell.key}-${cell.date.getDate()}`} className="hf-day">
                    <span className="hf-day-num">{cell.date.getDate()}</span>
                    {cell.items.slice(0, 3).map((item) => (
                      <button key={item.id} className="hf-day-item" onClick={() => { setSection("boards"); setSelectedItemId(item.id); setDetailTab("overview"); }}>
                        {item.title}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </article>
          </section>
        )}

        {section === "agent-hub" && (
          <section className="hf-section">
            <div className="hf-grid-two">
              <article className="hf-panel">
                <h3>OpenClaw Status</h3>
                <p className="muted">Connection is {state.openClaw.url && state.openClaw.token ? "configured" : "not configured"}.</p>
                <label className="hf-field-label">OpenClaw URL</label>
                <input
                  value={state.openClaw.url}
                  onChange={(event) => setState((prev) => ({ ...prev, openClaw: { ...prev.openClaw, url: event.target.value } }))}
                  placeholder="https://agents.yourdomain"
                />
                <label className="hf-field-label">Token</label>
                <input
                  type="password"
                  value={state.openClaw.token}
                  onChange={(event) => setState((prev) => ({ ...prev, openClaw: { ...prev.openClaw, token: event.target.value } }))}
                  placeholder="ocw_..."
                />
                <div className="hf-row-tight">
                  <button className="btn" onClick={saveOpenClaw}>Save OpenClaw</button>
                  <button className="btn ghost" onClick={syncToSupabase} disabled={syncLoading}>{syncLoading ? "Syncing..." : "Sync Cloud"}</button>
                  <button className="btn ghost" onClick={loadFromSupabase} disabled={syncLoading}>Load Cloud</button>
                </div>
              </article>

              <article className="hf-panel">
                <h3>Skill Management</h3>
                <form className="hf-stack" onSubmit={addSkill}>
                  <input
                    value={skillForm.name}
                    onChange={(event) => setSkillForm((prev) => ({ ...prev, name: event.target.value }))}
                    placeholder="Skill name"
                    required
                  />
                  <textarea
                    rows={2}
                    value={skillForm.description}
                    onChange={(event) => setSkillForm((prev) => ({ ...prev, description: event.target.value }))}
                    placeholder="Skill description"
                  />
                  <button className="btn" type="submit">Add Skill</button>
                </form>

                <ul className="hf-list">
                  {state.agentSkills.map((skill) => (
                    <li key={skill.id} className="hf-item">
                      <strong>{skill.name}</strong>
                      <span className="muted">{skill.description}</span>
                      <button className="hf-mini-link" onClick={() => removeSkill(skill.id)}>Remove</button>
                    </li>
                  ))}
                </ul>
              </article>
            </div>
          </section>
        )}

        {section === "vault" && (
          <section className="hf-section">
            <div className="hf-grid-two">
              <article className="hf-panel">
                <h3>Documents</h3>
                <form className="hf-stack" onSubmit={addDocumentLink}>
                  <input
                    value={documentForm.name}
                    onChange={(event) => setDocumentForm((prev) => ({ ...prev, name: event.target.value }))}
                    placeholder="Document name"
                    required
                  />
                  <input
                    value={documentForm.url}
                    onChange={(event) => setDocumentForm((prev) => ({ ...prev, url: event.target.value }))}
                    placeholder="Document URL"
                    required
                  />
                  <button className="btn" type="submit">Add Link</button>
                </form>

                <div className="hf-stack">
                  <input type="file" onChange={(event) => setDocFile(event.target.files?.[0] || null)} />
                  <button className="btn ghost" onClick={uploadDocumentToStorage} disabled={uploadingDoc}>
                    {uploadingDoc ? "Uploading..." : "Upload to Storage"}
                  </button>
                </div>

                <ul className="hf-list">
                  {state.documents.length ? state.documents.map((doc) => (
                    <li key={doc.id} className="hf-item">
                      <strong>{doc.name}</strong>
                      <a href={doc.url} target="_blank" rel="noreferrer">{doc.url}</a>
                    </li>
                  )) : <li className="hf-item">No documents yet.</li>}
                </ul>
              </article>

              <article className="hf-panel">
                <h3>Wiki</h3>
                <form className="hf-stack" onSubmit={addWikiPage}>
                  <input
                    value={wikiForm.title}
                    onChange={(event) => setWikiForm((prev) => ({ ...prev, title: event.target.value }))}
                    placeholder="Page title"
                    required
                  />
                  <textarea
                    rows={4}
                    value={wikiForm.content}
                    onChange={(event) => setWikiForm((prev) => ({ ...prev, content: event.target.value }))}
                    placeholder="Notes, SOP, decisions"
                    required
                  />
                  <button className="btn" type="submit">Save Wiki Page</button>
                </form>

                <ul className="hf-list">
                  {state.wiki.length ? state.wiki.map((page) => (
                    <li key={page.id} className="hf-item">
                      <strong>{page.title}</strong>
                      <span className="muted">{page.content.slice(0, 220)}</span>
                    </li>
                  )) : <li className="hf-item">No wiki pages yet.</li>}
                </ul>
              </article>
            </div>
          </section>
        )}
      </main>

      {selectedItem ? (
        <aside className="hf-detail-drawer">
          <header className="hf-detail-head">
            <h3>{selectedItem.title}</h3>
            <button className="hf-mini-link" onClick={() => setSelectedItemId("")}>Close</button>
          </header>

          <div className="hf-detail-tabs">
            <button className={detailTab === "overview" ? "active" : ""} onClick={() => setDetailTab("overview")}>Overview</button>
            <button className={detailTab === "agent" ? "active" : ""} onClick={() => setDetailTab("agent")}>Agent Output</button>
            <button className={detailTab === "advanced" ? "active" : ""} onClick={() => setDetailTab("advanced")}>Advanced</button>
          </div>

          {detailTab === "overview" ? (
            <div className="hf-detail-body">
              <label className="hf-field-label">Title</label>
              <input value={selectedItem.title} onChange={(event) => updateActionItem(selectedItem.id, (item) => { item.title = event.target.value; })} />

              <label className="hf-field-label">Project Tag</label>
              <input value={selectedItem.projectTag} onChange={(event) => updateActionItem(selectedItem.id, (item) => { item.projectTag = event.target.value; })} />

              <div className="hf-grid-two-compact">
                <div>
                  <label className="hf-field-label">Status</label>
                  <select value={selectedItem.status} onChange={(event) => updateActionItem(selectedItem.id, (item) => { item.status = event.target.value; })}>
                    {STATUS_COLUMNS.map((status) => <option key={status}>{status}</option>)}
                  </select>
                </div>
                <div>
                  <label className="hf-field-label">Priority</label>
                  <select value={selectedItem.priority} onChange={(event) => updateActionItem(selectedItem.id, (item) => { item.priority = event.target.value; })}>
                    {PRIORITY_LEVELS.map((priority) => <option key={priority}>{priority}</option>)}
                  </select>
                </div>
              </div>

              <div className="hf-grid-two-compact">
                <div>
                  <label className="hf-field-label">Due Date</label>
                  <input type="date" value={selectedItem.dueDate || ""} onChange={(event) => updateActionItem(selectedItem.id, (item) => { item.dueDate = event.target.value; })} />
                </div>
                <div>
                  <label className="hf-field-label">Assignee</label>
                  <input value={selectedItem.assignee || ""} onChange={(event) => updateActionItem(selectedItem.id, (item) => { item.assignee = event.target.value; })} />
                </div>
              </div>

              <label className="hf-field-label">Image URL (Gallery preview)</label>
              <input value={selectedItem.imageUrl || ""} onChange={(event) => updateActionItem(selectedItem.id, (item) => { item.imageUrl = event.target.value; })} />

              <label className="hf-field-label">Description</label>
              <textarea rows={4} value={selectedItem.description || ""} onChange={(event) => updateActionItem(selectedItem.id, (item) => { item.description = event.target.value; })} />
            </div>
          ) : null}

          {detailTab === "agent" ? (
            <div className="hf-detail-body">
              <label className="hf-field-label">Assign to Agent Skill</label>
              <select
                value={selectedItem.agent.skill || ""}
                onChange={(event) => assignSkill(selectedItem.id, event.target.value)}
              >
                <option value="">Select skill</option>
                {state.agentSkills.map((skill) => (
                  <option key={skill.id} value={skill.name}>{skill.name}</option>
                ))}
              </select>

              <button className="btn" onClick={() => runAgent(selectedItem.id)}>Run Agent</button>

              <section className="hf-live-terminal">
                <h4>Live Activity Log</h4>
                {selectedItem.agent.log.length ? (
                  selectedItem.agent.log.slice(-12).map((entry) => (
                    <p key={entry.id}><span>{formatClock(entry.time)}</span> {entry.text}</p>
                  ))
                ) : (
                  <p>No activity yet.</p>
                )}
              </section>

              <section className="hf-output-box">
                <h4>Agent Output</h4>
                <textarea
                  rows={10}
                  value={selectedItem.agent.output || ""}
                  onChange={(event) => updateActionItem(selectedItem.id, (item) => { item.agent.output = event.target.value; })}
                  placeholder="Agent findings, drafts, and links will appear here."
                />
              </section>
            </div>
          ) : null}

          {detailTab === "advanced" ? (
            <div className="hf-detail-body">
              <div className="hf-grid-two-compact">
                <div>
                  <label className="hf-field-label">Estimate (hours)</label>
                  <input type="number" min="0" step="0.5" value={selectedItem.advanced.estimateHours || 0} onChange={(event) => updateActionItem(selectedItem.id, (item) => { item.advanced.estimateHours = Number(event.target.value || 0); })} />
                </div>
                <div>
                  <label className="hf-field-label">Cost Rate ($/hr)</label>
                  <input type="number" min="0" step="1" value={selectedItem.advanced.costRate || 0} onChange={(event) => updateActionItem(selectedItem.id, (item) => { item.advanced.costRate = Number(event.target.value || 0); })} />
                </div>
              </div>

              <div className="hf-grid-two-compact">
                <div>
                  <label className="hf-field-label">Budget Cap ($)</label>
                  <input type="number" min="0" step="10" value={selectedItem.advanced.budgetCap || 0} onChange={(event) => updateActionItem(selectedItem.id, (item) => { item.advanced.budgetCap = Number(event.target.value || 0); })} />
                </div>
                <div>
                  <label className="hf-field-label">Portfolio Tag</label>
                  <input value={selectedItem.advanced.portfolioTag || ""} onChange={(event) => updateActionItem(selectedItem.id, (item) => { item.advanced.portfolioTag = event.target.value; })} />
                </div>
              </div>

              <div className="hf-grid-two-compact">
                <div>
                  <label className="hf-field-label">Workload</label>
                  <select value={selectedItem.advanced.workload || "Low"} onChange={(event) => updateActionItem(selectedItem.id, (item) => { item.advanced.workload = event.target.value; })}>
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                  </select>
                </div>
                <div>
                  <label className="hf-field-label">Risk Level</label>
                  <select value={selectedItem.advanced.riskLevel || "Low"} onChange={(event) => updateActionItem(selectedItem.id, (item) => { item.advanced.riskLevel = event.target.value; })}>
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                  </select>
                </div>
              </div>
            </div>
          ) : null}

          <aside className="hf-properties-sidebar">
            <details>
              <summary>Properties</summary>
              <p className="muted">Custom attributes are hidden from the board and managed here.</p>
              <textarea rows={6} value={customAttrsText} onChange={(event) => setCustomAttrsText(event.target.value)} placeholder="client:Acme\nphase:Beta" />
              <button className="btn ghost" onClick={saveCustomProperties}>Save Properties</button>
            </details>
          </aside>
        </aside>
      ) : null}
    </div>
  );
}

async function replaceWorkspaceRows(supabase, tableName, rows) {
  const deleteResult = await supabase.from(tableName).delete().eq("workspace_id", WORKSPACE_ID);
  if (deleteResult.error) throw deleteResult.error;
  if (!rows.length) return;
  const insertResult = await supabase.from(tableName).insert(rows);
  if (insertResult.error) throw insertResult.error;
}

function parseCustomAttrs(raw) {
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .reduce((acc, line) => {
      const [key, ...rest] = line.split(":");
      if (!key || !rest.length) return acc;
      acc[key.trim()] = rest.join(":").trim();
      return acc;
    }, {});
}

function formatCustomAttrs(attrs) {
  const entries = Object.entries(attrs || {});
  return entries.map(([key, value]) => `${key}:${String(value)}`).join("\n");
}

function asObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function keyFromDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function dateOffset(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return keyFromDate(date);
}

function isDueWithinDays(dateKey, days) {
  if (!dateKey) return false;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const due = new Date(dateKey).getTime();
  if (Number.isNaN(due)) return false;
  const diff = Math.round((due - today) / (1000 * 60 * 60 * 24));
  return diff >= 0 && diff <= days;
}

function titleCase(value) {
  return value.replace(/\b\w/g, (char) => char.toUpperCase());
}

function toStatusClass(status) {
  return status.toLowerCase().replace(/\s+/g, "-");
}

function formatClock(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function sanitizeFileName(value) {
  return value.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-");
}

function fallbackImage(tag) {
  const safe = encodeURIComponent(tag || "project");
  return `https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80&sig=${safe.length}`;
}
