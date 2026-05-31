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

const CHORES = [];

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

function seedThisWeek() { return {}; }

function seedFloating() { return []; }

const FAIRNESS = {
  assigned:  { clarisse: 0, ra: 0 },
  completed: { clarisse: 0, ra: 0 },
  trend: [],
};

function balanceFor(a, b) {
  const total = a + b;
  if (!total) return { label: "No data yet", tone: "var(--ink-3)", note: "Complete a few chores to see how the load is shared." };
  const diff = Math.abs(a - b) / total; // share gap
  if (diff <= 0.12) return { label: "Balanced", tone: "var(--ok)", note: "Effort is shared evenly across the household. Nice work." };
  if (diff <= 0.28) return { label: "Slightly uneven", tone: "var(--warn)", note: "One of you is carrying a little more this month. Worth a glance." };
  return { label: "Significantly uneven", tone: "oklch(0.6 0.14 28)", note: "The load is tilted heavily one way. Consider reassigning a few chores." };
}

function seedActivity() { return []; }

Object.assign(window, {
  MEMBERS, MEMBER_LIST, DAYS, DAYS_FULL, TODAY_INDEX,
  dateForDay, fmtDayNum, fmtRange, weekTitle,
  CHORES, CATEGORIES, FREQUENCIES, defaultDaysFor, freqLabel, newTemplate, newFloatingId,
  seedThisWeek, seedFloating, seedActivity, FAIRNESS, balanceFor,
});
