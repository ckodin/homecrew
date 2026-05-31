/* data.jsx — HomeCrew sample data (from the FairShare/HomeCrew PRD) */

const MEMBERS = {
  clarisse: { key: "clarisse", name: "Clarisse", initial: "C", color: "var(--c-clarisse)" },
  ra:       { key: "ra",       name: "RA",       initial: "R", color: "var(--c-ra)" },
};
const MEMBER_LIST = [MEMBERS.clarisse, MEMBERS.ra];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAYS_FULL = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// Anchor: the week of Mon May 25 – Sun May 31, 2026 (today = Sun May 31).
const WEEK_START = new Date(2026, 4, 25);
const TODAY_INDEX = 6; // Sunday

function dateForDay(weekOffset, dayIdx) {
  const d = new Date(WEEK_START);
  d.setDate(d.getDate() + weekOffset * 7 + dayIdx);
  return d;
}
function fmtDayNum(weekOffset, dayIdx) { return dateForDay(weekOffset, dayIdx).getDate(); }
function fmtRange(weekOffset) {
  const a = dateForDay(weekOffset, 0), b = dateForDay(weekOffset, 6);
  const mo = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const sameMonth = a.getMonth() === b.getMonth();
  return sameMonth
    ? `${mo[a.getMonth()]} ${a.getDate()}–${b.getDate()}, ${b.getFullYear()}`
    : `${mo[a.getMonth()]} ${a.getDate()} – ${mo[b.getMonth()]} ${b.getDate()}, ${b.getFullYear()}`;
}
function weekTitle(weekOffset) {
  if (weekOffset === 0) return "This week";
  if (weekOffset === -1) return "Last week";
  if (weekOffset === 1) return "Next week";
  return weekOffset < 0 ? `${-weekOffset} weeks ago` : `In ${weekOffset} weeks`;
}

/* Chore templates. scheduled = which weekday indices generate an occurrence. */
const CATEGORIES = ["Kitchen", "Cleaning", "Household", "Outdoor", "Admin", "Pets"];
const FREQUENCIES = ["Daily", "Weekdays", "Weekly", "Fortnightly", "Monthly"];

const CHORES = [
  { id: "dishes",  name: "Dishes",          category: "Kitchen",   freq: "Daily",      effort: 1, scheduled: [0,1,2,3,4,5,6], active: true },
  { id: "cook",    name: "Cook dinner",     category: "Kitchen",   freq: "Weekdays",   effort: 2, scheduled: [0,1,2,3,4],   active: true },
  { id: "laundry", name: "Laundry",         category: "Cleaning",  freq: "Weekly",     effort: 2, scheduled: [2,5],       active: true },
  { id: "vacuum",  name: "Vacuum",          category: "Cleaning",  freq: "Weekly",     effort: 3, scheduled: [5],         active: true },
  { id: "trash",   name: "Trash & recycle", category: "Household", freq: "Weekly",     effort: 1, scheduled: [1],         active: true },
  { id: "plants",  name: "Water plants",    category: "Household", freq: "Fortnightly",effort: 1, scheduled: [6],         active: true },
];

// Default scheduled days suggested by a frequency, used when creating/editing.
function defaultDaysFor(freq) {
  if (freq === "Daily") return [0,1,2,3,4,5,6];
  if (freq === "Weekdays") return [0,1,2,3,4];
  return [];
}
function freqLabel(t) {
  if (t.freq === "Daily" || t.freq === "Weekdays") return t.freq;
  const dl = (t.scheduled || []).map((i) => DAYS[i]).join(", ");
  return dl ? `${t.freq} · ${dl}` : t.freq;
}
let __nid = 100;
function newTemplate() {
  return { id: "c" + (++__nid), name: "", category: "Cleaning", freq: "Weekly", effort: 2, scheduled: [], active: true };
}
function newFloatingId() { return "f" + (++__nid); }

// Occurrence seed for THIS week (offset 0). Key = `${choreId}:${dayIdx}`.
// status: 'unassigned' | 'assigned' | 'done'. The PRD example (Laundry Wed✓/Sat,
// Vacuum Sat→Clarisse) is preserved exactly; surrounding chores fill a realistic week.
function seedThisWeek() {
  const A = (assignee, status, by) => ({ assignee, status, completedBy: by || (status === "done" ? assignee : null) });
  return {
    // Dishes — alternating, done through Saturday, Sunday pending
    "dishes:0": A("ra", "done"),       "dishes:1": A("clarisse", "done"),
    "dishes:2": A("ra", "done"),       "dishes:3": A("clarisse", "done"),
    "dishes:4": A("ra", "done"),       "dishes:5": A("clarisse", "done"),
    "dishes:6": A("ra", "assigned"),
    // Cook dinner — weekdays
    "cook:0": A("clarisse", "done"),   "cook:1": A("ra", "done"),
    "cook:2": A("clarisse", "done"),   "cook:3": A("ra", "done"),
    "cook:4": A("clarisse", "done"),
    // Laundry — PRD: Wed completed by Clarisse, Sat assigned RA
    "laundry:2": A("clarisse", "done"),
    "laundry:5": A("ra", "assigned"),
    // Vacuum — PRD: Sat, Clarisse
    "vacuum:5": A("clarisse", "assigned"),
    // Trash — Tue, done
    "trash:1": A("ra", "done"),
    // Water plants — Sun, unassigned (needs a home)
    "plants:6": { assignee: null, status: "unassigned", completedBy: null },
  };
}

/* Floating tasks — PRD examples. */
function seedFloating() {
  return [
    { id: "f1", title: "Buy dishwasher tablets", assignee: "clarisse", status: "open" },
    { id: "f2", title: "Replace hallway light bulb", assignee: "ra", status: "open" },
    { id: "f3", title: "Call plumber about leak", assignee: null, status: "open" },
    { id: "f4", title: "Book vet appointment", assignee: "clarisse", status: "done" },
  ];
}

/* Fairness — PRD rolling-4-week figures. */
const FAIRNESS = {
  assigned:  { clarisse: 12, ra: 10 },
  completed: { clarisse: 14, ra: 8 },
  // 4-week completed-effort trend (oldest → newest)
  trend: [
    { wk: "Wk 1", clarisse: 11, ra: 12 },
    { wk: "Wk 2", clarisse: 13, ra: 10 },
    { wk: "Wk 3", clarisse: 12, ra: 9 },
    { wk: "Wk 4", clarisse: 14, ra: 8 },
  ],
};

function balanceFor(a, b) {
  const total = a + b;
  if (!total) return { label: "No data yet", tone: "var(--ink-3)", note: "Complete a few chores to see how the load is shared." };
  const diff = Math.abs(a - b) / total; // share gap
  if (diff <= 0.12) return { label: "Balanced", tone: "var(--ok)", note: "Effort is shared evenly across the household. Nice work." };
  if (diff <= 0.28) return { label: "Slightly uneven", tone: "var(--warn)", note: "One of you is carrying a little more this month. Worth a glance." };
  return { label: "Significantly uneven", tone: "oklch(0.6 0.14 28)", note: "The load is tilted heavily one way. Consider reassigning a few chores." };
}

/* Recent household activity feed (for Insights). */
function seedActivity() {
  return [
    { who: "clarisse", text: "completed Dishes",      when: "Today, 8:10" },
    { who: "ra",       text: "completed Cook dinner", when: "Fri, 19:40" },
    { who: "clarisse", text: "completed Laundry",     when: "Wed, 11:05" },
    { who: "ra",       text: "completed Trash & recycle", when: "Tue, 7:50" },
    { who: "clarisse", text: "added Water plants",    when: "Mon, 9:15" },
    { who: "ra",       text: "completed Dishes",      when: "Mon, 21:00" },
  ];
}

Object.assign(window, {
  MEMBERS, MEMBER_LIST, DAYS, DAYS_FULL, TODAY_INDEX,
  dateForDay, fmtDayNum, fmtRange, weekTitle,
  CHORES, CATEGORIES, FREQUENCIES, defaultDaysFor, freqLabel, newTemplate, newFloatingId,
  seedThisWeek, seedFloating, seedActivity, FAIRNESS, balanceFor,
});
