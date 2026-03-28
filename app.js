/* ---------------------------
   FULLSCREEN MENU OVERLAY
----------------------------*/
const hamburger = document.getElementById("hamburger");
const menuOverlay = document.getElementById("menuOverlay");

if (hamburger && menuOverlay) {
  hamburger.addEventListener("click", () => {
    menuOverlay.classList.add("show");
  });

  menuOverlay.addEventListener("click", (e) => {
    if (e.target === menuOverlay) {
      menuOverlay.classList.remove("show");
    }
  });
}

/* ---------------------------
   DAILY TASK TRACKER
----------------------------*/
let tasks = JSON.parse(localStorage.getItem("tasks") || "[]");

const daySelect = document.getElementById("daySelect");
const taskInput = document.getElementById("taskInput");
const addTaskBtn = document.getElementById("addTask");
const taskTableBody = document.getElementById("taskTableBody");
const clearTasksBtn = document.getElementById("clearTasks");

function renderTasks() {
  if (!taskTableBody || !daySelect) return;

  const selectedDay = daySelect.value;
  const filtered = tasks.filter(t => t.day === selectedDay);

  taskTableBody.innerHTML = "";

  filtered.forEach((task, index) => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${task.name}</td>
      <td><input type="checkbox" class="checkbox" data-index="${index}" ${task.done ? "checked" : ""}></td>
      <td><span class="remove" data-delete="${index}">✕</span></td>
    `;

    taskTableBody.appendChild(row);
  });

  updateCharts();
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

addTaskBtn?.addEventListener("click", () => {
  const name = taskInput.value.trim();
  if (!name || !daySelect) return;

  tasks.push({
    name,
    day: daySelect.value,
    done: false
  });

  taskInput.value = "";
  renderTasks();
});

taskTableBody?.addEventListener("click", (e) => {
  if (!daySelect) return;

  if (e.target.dataset.index !== undefined) {
    const selectedDay = daySelect.value;
    const filtered = tasks.filter(t => t.day === selectedDay);
    const realIndex = tasks.indexOf(filtered[e.target.dataset.index]);

    tasks[realIndex].done = !tasks[realIndex].done;
    renderTasks();
  }

  if (e.target.dataset.delete !== undefined) {
    const selectedDay = daySelect.value;
    const filtered = tasks.filter(t => t.day === selectedDay);
    const realIndex = tasks.indexOf(filtered[e.target.dataset.delete]);

    tasks.splice(realIndex, 1);
    renderTasks();
  }
});

/* CLEAR ALL LOGIC */
clearTasksBtn?.addEventListener("click", () => {
  if (!daySelect) return;

  const selectedDay = daySelect.value;

  if (selectedDay === "Sunday") {
    tasks = [];
  } else {
    tasks = tasks.filter(t => t.day !== selectedDay);
  }

  renderTasks();
});

/* ---------------------------
   DAILY + WEEKLY CHARTS
----------------------------*/
let dailyChart, weeklyChart;

function updateCharts() {
  const dailyCanvas = document.getElementById("dailyChart");
  const weeklyCanvas = document.getElementById("weeklyChart");
  const dailyPercentEl = document.getElementById("dailyPercent");
  const weeklyPercentText = document.getElementById("weeklyPercent");

  if (!dailyCanvas || !weeklyCanvas || !daySelect || !dailyPercentEl || !weeklyPercentText) return;

  const selectedDay = daySelect.value;
  const filtered = tasks.filter(t => t.day === selectedDay);
  const done = filtered.filter(t => t.done).length;
  const percent = filtered.length === 0 ? 0 : Math.round((done / filtered.length) * 100);

  dailyPercentEl.textContent = percent + "%";

  if (dailyChart) dailyChart.destroy();
  dailyChart = new Chart(dailyCanvas, {
    type: "doughnut",
    data: {
      datasets: [{
        data: [percent, 100 - percent],
        backgroundColor: ["#2563eb", "#e5e7eb"],
        borderWidth: 0
      }]
    },
    options: {
      cutout: "75%",
      plugins: { legend: { display: false } }
    }
  });

  // WEEKLY
  const total = tasks.length;
  const doneAll = tasks.filter(t => t.done).length;
  const weekPercent = total === 0 ? 0 : Math.round((doneAll / total) * 100);

  weeklyPercentText.textContent = weekPercent + "%";

  if (weeklyChart) weeklyChart.destroy();
  weeklyChart = new Chart(weeklyCanvas, {
    type: "doughnut",
    data: {
      datasets: [{
        data: [weekPercent, 100 - weekPercent],
        backgroundColor: ["#2563eb", "#e5e7eb"],
        borderWidth: 0
      }]
    },
    options: {
      cutout: "75%",
      plugins: { legend: { display: false } }
    }
  });
}

daySelect?.addEventListener("change", renderTasks);

/* ---------------------------
   HABIT TRACKER (SVG ARCS)
----------------------------*/
const HABITS_KEY = "habitTrackerData_v2";

const defaultHabits = [
  "Wake up at 7am",
  "Scripture Study",
  "No Social Media",
  "Don't overeat",
  "30 mins exercise",
  "5 minutes cleanup",
  "Work on a project"
];

const habitsListEl = document.getElementById("habitsList");
const habitDaySelect = document.getElementById("habitDaySelect");
const dailyArc = document.getElementById("habitsDailyArc");
const weeklyArc = document.getElementById("habitsWeeklyArc");
const habitsDailyPercentEl = document.getElementById("habitsDailyPercent");
const habitsWeeklyPercentEl = document.getElementById("habitsWeeklyPercent");

function loadHabitData() {
  return JSON.parse(localStorage.getItem(HABITS_KEY) || `{"days":{}}`);
}

function saveHabitData(data) {
  localStorage.setItem(HABITS_KEY, JSON.stringify(data));
}

function ensureDay(data, dayName) {
  if (!data.days[dayName]) {
    data.days[dayName] = {
      habits: Object.fromEntries(defaultHabits.map(h => [h, false]))
    };
  }
}

function renderHabits() {
  if (!habitsListEl || !habitDaySelect) return;

  const data = loadHabitData();
  const dayName = habitDaySelect.value;
  ensureDay(data, dayName);
  saveHabitData(data);

  const dayData = data.days[dayName];

  habitsListEl.innerHTML = "";

  defaultHabits.forEach(habit => {
    const li = document.createElement("li");
    li.className = "task-item";

    const label = document.createElement("span");
    label.textContent = habit;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = !!dayData.habits[habit];

    checkbox.addEventListener("change", () => {
      const updated = loadHabitData();
      ensureDay(updated, dayName);
      updated.days[dayName].habits[habit] = checkbox.checked;
      saveHabitData(updated);
      updateHabitProgress();
    });

    const del = document.createElement("span");
    del.className = "delete-btn";
    del.textContent = "✖";
    del.addEventListener("click", () => {
      const updated = loadHabitData();
      ensureDay(updated, dayName);
      delete updated.days[dayName].habits[habit];
      saveHabitData(updated);
      renderHabits();
    });

    li.appendChild(label);
    li.appendChild(checkbox);
    li.appendChild(del);
    habitsListEl.appendChild(li);
  });

  updateHabitProgress();
}

function updateHabitProgress() {
  if (!habitDaySelect) return;

  const data = loadHabitData();
  const dayName = habitDaySelect.value;
  ensureDay(data, dayName);
  saveHabitData(data);

  const todayData = data.days[dayName];

  const total = defaultHabits.length;
  const done = defaultHabits.filter(h => todayData.habits[h]).length;
  const dailyPercent = total ? Math.round((done / total) * 100) : 0;

  if (dailyArc) dailyArc.setAttribute("stroke-dasharray", `${dailyPercent},100`);
  if (habitsDailyPercentEl) habitsDailyPercentEl.textContent = `${dailyPercent}%`;

  // Weekly: average across all 7 days
  const daysOfWeek = [
    "Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"
  ];

  let weekTotal = 0;
  let weekCount = 0;

  daysOfWeek.forEach(dn => {
    ensureDay(data, dn);
    const dData = data.days[dn];
    const dDone = defaultHabits.filter(h => dData.habits[h]).length;
    weekTotal += dDone / total;
    weekCount++;
  });

  const weeklyPercent = weekCount ? Math.round((weekTotal / weekCount) * 100) : 0;

  if (weeklyArc) weeklyArc.setAttribute("stroke-dasharray", `${weeklyPercent},100`);
  if (habitsWeeklyPercentEl) habitsWeeklyPercentEl.textContent = `${weeklyPercent}%`;
}

if (habitDaySelect) {
  const todayIndex = new Date().getDay(); // 0-6
  habitDaySelect.selectedIndex = todayIndex;
  habitDaySelect.addEventListener("change", renderHabits);
  renderHabits();
}

/* ---------------------------
   GOAL TRACKER (NEW VERSION)
----------------------------*/
let goals = JSON.parse(localStorage.getItem("goals_v2") || "[]");

const goalTitle = document.getElementById("goalTitle");
const goalDescription = document.getElementById("goalDescription");
const goalCategory = document.getElementById("goalCategory");
const goalStart = document.getElementById("goalStart");
const goalTarget = document.getElementById("goalTarget");
const goalPriority = document.getElementById("goalPriority");
const goalStatus = document.getElementById("goalStatus");
const addGoalBtn = document.getElementById("addGoal");
const goalsGrid = document.getElementById("goalsGrid");

const editOverlay = document.getElementById("editOverlay");
const editTitle = document.getElementById("editTitle");
const editDescription = document.getElementById("editDescription");
const editCategory = document.getElementById("editCategory");
const editStart = document.getElementById("editStart");
const editTarget = document.getElementById("editTarget");
const editPriority = document.getElementById("editPriority");
const editStatus = document.getElementById("editStatus");
const saveEditBtn = document.getElementById("saveEdit");
const cancelEditBtn = document.getElementById("cancelEdit");

let editingIndex = null;

function saveGoals() {
  localStorage.setItem("goals_v2", JSON.stringify(goals));
}

function renderGoals() {
  if (!goalsGrid) return;

  goalsGrid.innerHTML = "";

  goals.forEach((g, index) => {
    const card = document.createElement("div");
    card.className = "goal-card";

    card.innerHTML = `
      <div class="goal-title">${g.title}</div>
      <div class="goal-meta">${g.category || "Uncategorized"} • ${g.priority || "No priority"} • ${g.status}</div>
      <div class="goal-description">${g.description || ""}</div>
      <div class="goal-meta">Start: ${g.start || "—"} • Target: ${g.target || "—"}</div>

      <div class="goal-actions">
        <span class="goal-edit" data-edit="${index}">✎ Edit</span>
        <span class="goal-delete" data-del="${index}">✖</span>
      </div>
    `;

    goalsGrid.appendChild(card);
  });
}

addGoalBtn?.addEventListener("click", () => {
  const title = goalTitle?.value.trim();
  if (!title) return;

  goals.push({
    title,
    description: goalDescription.value.trim(),
    category: goalCategory.value,
    start: goalStart.value,
    target: goalTarget.value,
    priority: goalPriority.value,
    status: goalStatus.value
  });

  saveGoals();
  renderGoals();

  goalTitle.value = "";
  goalDescription.value = "";
  goalCategory.value = "";
  goalStart.value = "";
  goalTarget.value = "";
  goalPriority.value = "";
  goalStatus.value = "Not started";
});

goalsGrid?.addEventListener("click", (e) => {

  // DELETE
  if (e.target.dataset.del !== undefined) {
    goals.splice(e.target.dataset.del, 1);
    saveGoals();
    renderGoals();
    return;
  }

  // EDIT
  if (e.target.dataset.edit !== undefined) {
    editingIndex = Number(e.target.dataset.edit);
    const g = goals[editingIndex];

    editTitle.value = g.title;
    editDescription.value = g.description;
    editCategory.value = g.category || "Health";
    editStart.value = g.start || "";
    editTarget.value = g.target || "";
    editPriority.value = g.priority || "Low";
    editStatus.value = g.status || "Not started";

    editOverlay.classList.add("show");
  }
});

// SAVE EDIT
saveEditBtn?.addEventListener("click", () => {
  if (editingIndex === null) return;

  goals[editingIndex] = {
    title: editTitle.value.trim(),
    description: editDescription.value.trim(),
    category: editCategory.value,
    start: editStart.value,
    target: editTarget.value,
    priority: editPriority.value,
    status: editStatus.value
  };

  saveGoals();
  renderGoals();
  editOverlay.classList.remove("show");
  editingIndex = null;
});

// CANCEL EDIT
cancelEditBtn?.addEventListener("click", () => {
  editOverlay.classList.remove("show");
  editingIndex = null;
});

if (goalsGrid) {
  renderGoals();
}

/* ---------------------------
   FOCUS / POMODORO
----------------------------*/
let mode = "pomodoro";
let sessionCount = 1;

const focusTimer = document.getElementById("focusTimer");
const startFocus = document.getElementById("startFocus");
const resetFocus = document.getElementById("resetFocus");
const tabs = document.querySelectorAll(".focus-tab");
const breakMusic = document.getElementById("breakMusic");

let focusTime = 25 * 60;
let focusInterval = null;

function updateFocusDisplay() {
  if (!focusTimer) return;
  const m = Math.floor(focusTime / 60);
  const s = focusTime % 60;
  focusTimer.textContent = `${m}:${s.toString().padStart(2, "0")}`;
}

function playRandomOPM() {
  if (!breakMusic) return;
  const sources = breakMusic.querySelectorAll("source");
  if (!sources.length) return;
  const random = Math.floor(Math.random() * sources.length);
  breakMusic.src = sources[random].src;
  breakMusic.play();
}

function stopOPM() {
  if (!breakMusic) return;
  breakMusic.pause();
  breakMusic.currentTime = 0;
}

function setMode(newMode) {
  mode = newMode;

  tabs.forEach(t => t.classList.remove("active"));
  const activeTab = document.querySelector(`[data-mode="${mode}"]`);
  if (activeTab) activeTab.classList.add("active");

  if (mode === "pomodoro") {
    focusTime = 25 * 60;
    stopOPM();
  }

  if (mode === "short") {
    focusTime = 5 * 60;
    playRandomOPM();
  }

  if (mode === "long") {
    focusTime = 15 * 60;
    stopOPM();
  }

  updateFocusDisplay();
}

tabs.forEach(tab => {
  tab.addEventListener("click", () => {
    clearInterval(focusInterval);
    focusInterval = null;
    if (startFocus) startFocus.textContent = "START";
    setMode(tab.dataset.mode);
  });
});

startFocus?.addEventListener("click", () => {
  if (focusInterval) {
    clearInterval(focusInterval);
    focusInterval = null;
    startFocus.textContent = "START";
    return;
  }

  startFocus.textContent = "PAUSE";

  focusInterval = setInterval(() => {
    focusTime--;
    updateFocusDisplay();

    if (focusTime <= 0) {
      clearInterval(focusInterval);
      focusInterval = null;

      stopOPM();

      sessionCount++;
      const focusSession = document.getElementById("focusSession");
      if (focusSession) focusSession.textContent = "#" + sessionCount;

      setMode("short");
      startFocus.textContent = "START";
    }
  }, 1000);
});

resetFocus?.addEventListener("click", () => {
  clearInterval(focusInterval);
  focusInterval = null;

  if (mode === "pomodoro") focusTime = 25 * 60;
  if (mode === "short") focusTime = 5 * 60;
  if (mode === "long") focusTime = 15 * 60;

  stopOPM();
  updateFocusDisplay();
  if (startFocus) startFocus.textContent = "START";
});

/* ---------------------------
   NOTES PAGE (FINAL + SAFE)
----------------------------*/
(function () {
  const notesGrid = document.getElementById("notesGrid");
  if (!notesGrid) return;

  let notes = JSON.parse(localStorage.getItem("notes_v2") || "[]");

  const noteInput = document.getElementById("noteInput");
  const addNoteBtn = document.getElementById("addNote");

  const editNoteOverlay = document.getElementById("editNoteOverlay");
  const editNoteText = document.getElementById("editNoteText");
  const saveNoteEdit = document.getElementById("saveNoteEdit");
  const cancelNoteEdit = document.getElementById("cancelNoteEdit");

  let editingNoteIndex = null;

  function saveNotes() {
    localStorage.setItem("notes_v2", JSON.stringify(notes));
  }

  function renderNotes() {
    notesGrid.innerHTML = "";

    notes.forEach((text, index) => {
      const card = document.createElement("div");
      card.className = "note-card";

      card.innerHTML = `
        <div>${text}</div>

        <div class="note-actions">
          <span class="note-edit" data-edit="${index}">✎ Edit</span>
          <span class="note-delete" data-del="${index}">✖</span>
        </div>
      `;

      notesGrid.appendChild(card);
    });
  }

  addNoteBtn?.addEventListener("click", () => {
    const text = noteInput.value.trim();
    if (!text) return;

    notes.push(text);
    saveNotes();
    renderNotes();

    noteInput.value = "";
  });

  notesGrid.addEventListener("click", (e) => {
    if (e.target.dataset.del !== undefined) {
      notes.splice(e.target.dataset.del, 1);
      saveNotes();
      renderNotes();
      return;
    }

    if (e.target.dataset.edit !== undefined) {
      editingNoteIndex = Number(e.target.dataset.edit);
      editNoteText.value = notes[editingNoteIndex];
      editNoteOverlay.classList.add("show");
    }
  });

  saveNoteEdit?.addEventListener("click", () => {
    if (editingNoteIndex === null) return;

    notes[editingNoteIndex] = editNoteText.value.trim();
    saveNotes();
    renderNotes();
    editNoteOverlay.classList.remove("show");
    editingNoteIndex = null;
  });

  cancelNoteEdit?.addEventListener("click", () => {
    editNoteOverlay.classList.remove("show");
    editingNoteIndex = null;
  });

  renderNotes();
})();

/* ---------------------------
   BOTTOM NAV ACTIVE STATE
----------------------------*/
(function () {
  const navItems = document.querySelectorAll(".nav-item");
  if (!navItems.length) return;

  const page = document.body.dataset.page;

  navItems.forEach(item => {
    if (item.dataset.page === page) {
      item.classList.add("active");
    }
  });
})();


/* ---------------------------
   INITIAL LOAD
----------------------------*/
renderTasks();
renderHabits();
renderGoals();
updateFocusDisplay();


/* ---------------------------
   GOOGLE SHEETS SYNC
----------------------------*/
const BACKEND_URL = "https://your-backend.com/tasks"; // 🔁 replace with your backend URL
const SHEET_SOURCE_TAG = "__fromSheet__"; // tag to identify sheet-sourced tasks

async function syncFromSheet() {
  try {
    const res = await fetch(BACKEND_URL);
    const { tasks: sheetTasks } = await res.json();

    if (!Array.isArray(sheetTasks)) return;

    // Remove old sheet-synced tasks (don't touch manually added ones)
    tasks = tasks.filter(t => !t[SHEET_SOURCE_TAG]);

    // Add fresh sheet tasks, avoiding duplicates by name+day
    sheetTasks.forEach(sheetTask => {
      const alreadyExists = tasks.some(
        t => t.name === sheetTask.name && t.day === sheetTask.day
      );
      if (!alreadyExists) {
        tasks.push({
          name: sheetTask.name,
          day: sheetTask.day,
          done: false,
          [SHEET_SOURCE_TAG]: true  // mark it as coming from sheet
        });
      }
    });

    localStorage.setItem("tasks", JSON.stringify(tasks));
    renderTasks(); // refresh the visible table

  } catch (err) {
    console.warn("Sheet sync failed:", err);
  }
}

// Sync immediately on load, then every 10 seconds
syncFromSheet();
setInterval(syncFromSheet, 10000);
