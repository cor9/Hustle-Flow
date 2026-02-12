const STORAGE_KEY = "simple_habit_tracker_v2";
const LEGACY_STORAGE_KEY = "simple_habit_tracker_v1";
const MAX_HABITS = 15;

const form = document.getElementById("habit-form");
const input = document.getElementById("habit-input");
const list = document.getElementById("habit-list");
const count = document.getElementById("count");
const selectedDateText = document.getElementById("selected-date");
const monthLabel = document.getElementById("month-label");
const calendarGrid = document.getElementById("calendar-grid");
const prevMonthButton = document.getElementById("prev-month");
const nextMonthButton = document.getElementById("next-month");

const todayKey = dateToKey(new Date());
let selectedDateKey = todayKey;
let viewMonthDate = keyToDate(todayKey);

let state = loadState();
render();

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const name = input.value.trim();
  if (!name || state.habits.length >= MAX_HABITS) return;

  state.habits.push({
    id: crypto.randomUUID(),
    name,
  });
  input.value = "";
  saveAndRender();
});

prevMonthButton.addEventListener("click", () => {
  viewMonthDate = new Date(viewMonthDate.getFullYear(), viewMonthDate.getMonth() - 1, 1);
  render();
});

nextMonthButton.addEventListener("click", () => {
  viewMonthDate = new Date(viewMonthDate.getFullYear(), viewMonthDate.getMonth() + 1, 1);
  render();
});

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return migrateLegacyState();
    const parsed = JSON.parse(raw);
    const habitsRaw = Array.isArray(parsed?.habits) ? parsed.habits : [];
    const checksRaw = parsed?.checks && typeof parsed.checks === "object" ? parsed.checks : {};

    const habits = habitsRaw
      .filter((h) => h && typeof h.name === "string")
      .slice(0, MAX_HABITS)
      .map((h) => ({
        id: typeof h.id === "string" ? h.id : crypto.randomUUID(),
        name: h.name.trim(),
      }))
      .filter((h) => h.name.length > 0);

    const validHabitIds = new Set(habits.map((h) => h.id));
    const checks = {};
    for (const [dateKey, habitChecks] of Object.entries(checksRaw)) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey) || !habitChecks || typeof habitChecks !== "object") {
        continue;
      }
      checks[dateKey] = {};
      for (const [habitId, checked] of Object.entries(habitChecks)) {
        if (validHabitIds.has(habitId) && checked) {
          checks[dateKey][habitId] = true;
        }
      }
      if (Object.keys(checks[dateKey]).length === 0) {
        delete checks[dateKey];
      }
    }

    return { habits, checks };
  } catch {
    return migrateLegacyState();
  }
}

function migrateLegacyState() {
  try {
    const legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!legacyRaw) return { habits: [], checks: {} };
    const legacy = JSON.parse(legacyRaw);
    if (!Array.isArray(legacy)) return { habits: [], checks: {} };

    const habits = legacy
      .filter((h) => h && typeof h.name === "string")
      .slice(0, MAX_HABITS)
      .map((h) => ({
        id: typeof h.id === "string" ? h.id : crypto.randomUUID(),
        name: h.name.trim(),
        done: Boolean(h.done),
      }))
      .filter((h) => h.name.length > 0);

    const checks = {};
    for (const habit of habits) {
      if (habit.done) {
        if (!checks[todayKey]) checks[todayKey] = {};
        checks[todayKey][habit.id] = true;
      }
      delete habit.done;
    }

    return { habits, checks };
  } catch {
    return { habits: [], checks: {} };
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function saveAndRender() {
  saveState();
  render();
}

function render() {
  renderCalendar();
  renderSelectedDateLabel();
  renderHabitList();
  count.textContent = `${state.habits.length}/${MAX_HABITS} habits`;
  input.disabled = state.habits.length >= MAX_HABITS;
  form.querySelector("button").disabled = state.habits.length >= MAX_HABITS;
  input.placeholder =
    state.habits.length >= MAX_HABITS ? "Limit reached (15)" : "Add a habit";
}

function renderSelectedDateLabel() {
  const date = keyToDate(selectedDateKey);
  const doneCount = state.habits.filter((h) => isHabitChecked(selectedDateKey, h.id)).length;
  selectedDateText.textContent = `${date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  })} - ${doneCount}/${state.habits.length} checked`;
}

function renderCalendar() {
  monthLabel.textContent = viewMonthDate.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  calendarGrid.innerHTML = "";
  const start = new Date(viewMonthDate.getFullYear(), viewMonthDate.getMonth(), 1);
  const offset = start.getDay();
  start.setDate(start.getDate() - offset);

  for (let i = 0; i < 42; i += 1) {
    const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    const dateKey = dateToKey(date);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "day";
    if (date.getMonth() !== viewMonthDate.getMonth()) button.classList.add("other-month");
    if (dateKey === todayKey) button.classList.add("today");
    if (dateKey === selectedDateKey) button.classList.add("selected");
    button.setAttribute("aria-label", `Select ${date.toDateString()}`);

    const dayNum = document.createElement("span");
    dayNum.className = "day-num";
    dayNum.textContent = String(date.getDate());

    const marks = countChecksForDate(dateKey);
    button.append(dayNum);
    if (marks > 0) {
      const dot = document.createElement("span");
      dot.className = "day-mark";
      button.append(dot);
    }

    button.addEventListener("click", () => {
      selectedDateKey = dateKey;
      viewMonthDate = new Date(date.getFullYear(), date.getMonth(), 1);
      render();
    });

    calendarGrid.append(button);
  }
}

function renderHabitList() {
  list.innerHTML = "";

  state.habits.forEach((habit) => {
    const item = document.createElement("li");
    item.className = "habit-item";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = isHabitChecked(selectedDateKey, habit.id);
    checkbox.setAttribute("aria-label", `Mark ${habit.name} complete for selected date`);
    checkbox.addEventListener("change", () => {
      setHabitChecked(selectedDateKey, habit.id, checkbox.checked);
      saveAndRender();
    });

    const name = document.createElement("span");
    name.className = "habit-name";
    name.textContent = habit.name;

    const remove = document.createElement("button");
    remove.className = "remove";
    remove.type = "button";
    remove.textContent = "Remove";
    remove.addEventListener("click", () => {
      state.habits = state.habits.filter((h) => h.id !== habit.id);
      removeHabitFromChecks(habit.id);
      saveAndRender();
    });

    item.append(checkbox, name, remove);
    list.appendChild(item);
  });
}

function isHabitChecked(dateKey, habitId) {
  return Boolean(state.checks[dateKey]?.[habitId]);
}

function setHabitChecked(dateKey, habitId, checked) {
  if (checked) {
    if (!state.checks[dateKey]) state.checks[dateKey] = {};
    state.checks[dateKey][habitId] = true;
    return;
  }

  if (!state.checks[dateKey]) return;
  delete state.checks[dateKey][habitId];
  if (Object.keys(state.checks[dateKey]).length === 0) {
    delete state.checks[dateKey];
  }
}

function countChecksForDate(dateKey) {
  return Object.keys(state.checks[dateKey] || {}).length;
}

function removeHabitFromChecks(habitId) {
  for (const dateKey of Object.keys(state.checks)) {
    delete state.checks[dateKey][habitId];
    if (Object.keys(state.checks[dateKey]).length === 0) {
      delete state.checks[dateKey];
    }
  }
}

function dateToKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function keyToDate(key) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}
