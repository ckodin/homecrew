/* app.jsx — root: state, routing, history, toast, tweaks */

const { useState, useEffect, useRef, useCallback } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "look": "paper",
  "members": ["#c2683f", "#4a7fa3"],
  "density": "regular",
  "dark": false
}/*EDITMODE-END*/;

const COLOR_PAIRS = [
  ["#c2683f", "#4a7fa3"], // terracotta · slate blue (default)
  ["#7f8d56", "#b06a4e"], // sage · clay
  ["#9a5a86", "#3f8f86"], // plum · teal
  ["#c0903e", "#5a6aa8"], // amber · indigo
];

const now = () => "just now";
const TOAST_DURATION_MS = 1900;

const loadLS = (key, fallback) => { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; } };
const saveLS = (key, val) => { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} };

function usePersistentState(key, fallback) {
  const [state, setState] = useState(() => loadLS(key, fallback()));
  useEffect(() => saveLS(key, state), [key, state]);
  return [state, setState];
}

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [tab, setTab] = useState("board");
  const [weekOffset, setWeekOffset] = useState(0);
  const [occsByWeek, setOccsByWeek] = usePersistentState("hc_occsByWeek", () => ({ 0: seedThisWeek() }));
  const [histByWeek, setHistByWeek] = usePersistentState("hc_histByWeek", () => ({ 0: {} }));
  const [floating,   setFloating]   = usePersistentState("hc_floating",   () => seedFloating());
  const [templates,  setTemplates]  = usePersistentState("hc_templates",  () => CHORES.map((c) => ({ ...c })));
  const [activity,   setActivity]   = usePersistentState("hc_activity",   () => seedActivity());
  const [sheetCtx, setSheetCtx] = useState(null);
  const [manage, setManage] = useState(null); // {type:'template'|'floating'|'member', ...}
  const [toast, setToast] = useState("");
  const toastTimer = useRef(null);

  /* apply theme tweaks to <html> */
  useEffect(() => {
    const el = document.documentElement;
    el.classList.add("theme-switching");
    el.setAttribute("data-look", t.look);
    el.setAttribute("data-density", t.density);
    el.setAttribute("data-theme", t.dark ? "dark" : "light");
    const [c, r] = t.members || COLOR_PAIRS[0];
    el.style.setProperty("--c-clarisse", c);
    el.style.setProperty("--c-ra", r);
    const id = requestAnimationFrame(() => requestAnimationFrame(() => el.classList.remove("theme-switching")));
    return () => cancelAnimationFrame(id);
  }, [t.look, t.density, t.dark, t.members]);

  const flash = useCallback((msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), TOAST_DURATION_MS);
  }, []);

  const occs = occsByWeek[weekOffset] || {};
  const hist = histByWeek[weekOffset] || {};
  const activeTemplates = templates.filter((t) => t.active);

  const pushActivity = (who, text) => setActivity((prev) => [{ who, text, when: "just now" }, ...prev]);

  const pushHist = (key, ev) => {
    setHistByWeek((prev) => {
      const wk = { ...(prev[weekOffset] || {}) };
      wk[key] = [ev, ...(wk[key] || [])];
      return { ...prev, [weekOffset]: wk };
    });
  };
  const setOcc = (key, updater) => {
    setOccsByWeek((prev) => {
      const wk = { ...(prev[weekOffset] || {}) };
      const next = updater(wk[key]);
      if (next === null) delete wk[key]; else wk[key] = next;
      return { ...prev, [weekOffset]: wk };
    });
  };

  /* ---- cell actions ---- */
  const openCell = (chore, dayIdx) => setSheetCtx({ chore, dayIdx });
  const closeSheet = () => setSheetCtx(null);

  const assign = (ctx, memberKey) => {
    const key = cellKey(ctx.chore.id, ctx.dayIdx);
    setOcc(key, (o) => ({ assignee: memberKey, status: o && o.status === "done" ? "done" : "assigned", completedBy: o ? o.completedBy : null }));
    pushHist(key, { who: memberKey, text: `Assigned to ${MEMBERS[memberKey].name}`, when: now() });
    flash(`${ctx.chore.name} → ${MEMBERS[memberKey].name}`);
  };
  const clearCell = (ctx) => {
    const key = cellKey(ctx.chore.id, ctx.dayIdx);
    setOcc(key, () => null);
    pushHist(key, { who: null, text: "Unassigned", when: now() });
    flash("Cleared");
  };
  const toggleStatus = (chore, dayIdx, cur) => {
    if (!cur || !cur.assignee) return;
    const key = cellKey(chore.id, dayIdx);
    const willDone = cur.status !== "done";
    setOcc(key, (o) => ({ ...o, status: willDone ? "done" : "assigned", completedBy: willDone ? o.assignee : null }));
    pushHist(key, { who: cur.assignee, text: willDone ? `Completed by ${MEMBERS[cur.assignee].name}` : "Reopened", when: now() });
    if (willDone && weekOffset === 0) pushActivity(cur.assignee, `completed ${chore.name}`);
    flash(willDone ? "Nice — done!" : "Reopened");
  };
  const completeCell = (ctx) => toggleStatus(ctx.chore, ctx.dayIdx, (occsByWeek[weekOffset] || {})[cellKey(ctx.chore.id, ctx.dayIdx)]);
  const quickToggle = (chore, dayIdx) => toggleStatus(chore, dayIdx, occs[cellKey(chore.id, dayIdx)]);
  const moveToken = useCallback((srcChore, srcDayIdx, dstChore, dstDayIdx) => {
    if (srcChore.id === dstChore.id && srcDayIdx === dstDayIdx) return;
    const srcKey = cellKey(srcChore.id, srcDayIdx);
    const dstKey = cellKey(dstChore.id, dstDayIdx);
    const srcOcc = occs[srcKey];
    const dstOcc = occs[dstKey] || null;
    if (!srcOcc?.assignee) return;
    setOccsByWeek((prev) => {
      const wk = { ...(prev[weekOffset] || {}) };
      if (dstOcc?.assignee) {
        wk[dstKey] = { ...srcOcc };
        wk[srcKey] = { ...dstOcc };
      } else {
        wk[dstKey] = { ...srcOcc };
        delete wk[srcKey];
      }
      return { ...prev, [weekOffset]: wk };
    });
    if (dstOcc?.assignee) {
      flash(`Swapped ${MEMBERS[srcOcc.assignee].name} ↔ ${MEMBERS[dstOcc.assignee].name}`);
    } else {
      flash(`Moved to ${dstChore.name}`);
    }
  }, [weekOffset, occs, flash, setOccsByWeek]);
  const toggleFloating = (id) => {
    setFloating((prev) => prev.map((f) => {
      if (f.id !== id) return f;
      const done = f.status !== "done";
      if (done && f.assignee) pushActivity(f.assignee, `completed ${f.title}`);
      return { ...f, status: done ? "done" : "open" };
    }));
  };

  /* ---- template management ---- */
  const editTemplate = (tpl) => setManage({ type: "template", isNew: false, draft: { ...tpl } });
  const newTemplateSheet = () => setManage({ type: "template", isNew: true, draft: newTemplate() });
  const saveTemplate = (d) => {
    setTemplates((prev) => prev.some((t) => t.id === d.id) ? prev.map((t) => t.id === d.id ? { ...d } : t) : [...prev, { ...d }]);
    setManage(null);
    flash(manage && manage.isNew ? `Added ${d.name}` : "Saved");
  };
  const archiveTemplate = (id) => {
    setTemplates((prev) => prev.map((t) => t.id === id ? { ...t, active: false } : t));
    setManage(null);
    flash("Chore archived");
  };
  const deleteTemplate = (id) => {
    setTemplates((prev) => prev.filter((t) => t.id !== id));
    setOccsByWeek((prev) => {
      const next = {};
      Object.entries(prev).forEach(([wk, occs]) => {
        next[wk] = Object.fromEntries(Object.entries(occs).filter(([k]) => !k.startsWith(`${id}:`)));
      });
      return next;
    });
    setManage(null);
    flash("Chore deleted");
  };

  /* ---- floating management ---- */
  const newFloatingSheet = () => setManage({ type: "floating" });
  const saveFloating = ({ title, assignee }) => {
    setFloating((prev) => [{ id: newFloatingId(), title, assignee, status: "open" }, ...prev]);
    setManage(null);
    flash("Task added");
  };

  /* ---- member ---- */
  const openMember = (m) => setManage({ type: "member", member: m });
  const invite = () => flash("Invite link copied");
  const closeManage = () => setManage(null);

  /* ---- computed stats ---- */
  const thisWeek = occsByWeek[0] || {};
  const wkVals = Object.values(thisWeek);
  const wkTotal = wkVals.length;
  const wkDone = wkVals.filter((o) => o.status === "done").length;
  const weekStats = { done: wkDone, total: wkTotal, rate: wkTotal ? Math.round((wkDone / wkTotal) * 100) : 0 };
  const memberStats = React.useMemo(() => {
    const stats = Object.fromEntries(MEMBER_LIST.map((m) => [m.key, { assigned: 0, completed: 0 }]));
    Object.values(occsByWeek).forEach((week) =>
      Object.values(week).forEach((o) => {
        if (o.assignee && stats[o.assignee]) {
          stats[o.assignee].assigned++;
          if (o.status === "done") stats[o.assignee].completed++;
        }
      })
    );
    return stats;
  }, [occsByWeek]);

  const titleByTab = { board: null, tasks: "Tasks", insights: "Insights", settings: "Settings" };
  const todayKeys = Object.keys(thisWeek).filter((k) => k.endsWith(`:${TODAY_INDEX}`));
  const todayDone = todayKeys.filter((k) => thisWeek[k].status === "done").length;
  const todayDate = dateForDay(0, TODAY_INDEX);
  const todayLabel = todayDate.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
  const boardSub = `${todayLabel} · ${todayDone} of ${todayKeys.length} today done`;

  return (
    <div className="canvas">
      <div className="app">
        {/* top bar */}
        <header className="topbar">
          <div className="topbar-row">
            <div>
              <h1 className="hh-name">{tab === "board" ? "Home Crew" : titleByTab[tab]}</h1>
              <p className="hh-sub">{tab === "board" ? boardSub : tab === "tasks" ? "Recurring & one-off tasks" : tab === "insights" ? "How the load is shared" : "Household & members"}</p>
            </div>
            <div className="avatars">
              {MEMBER_LIST.map((m) => (
                <span key={m.key} className="av" style={{ background: m.color }}>{m.initial}</span>
              ))}
            </div>
          </div>

          {tab === "board" && (
            <div className="week-nav">
              <button className="navbtn" onClick={() => setWeekOffset((w) => w - 1)} aria-label="Previous week"><IconChevL size={18} /></button>
              <button className="navbtn" onClick={() => setWeekOffset((w) => w + 1)} aria-label="Next week"><IconChevR size={18} /></button>
              <div className="week-label">
                <b>{weekTitle(weekOffset)}</b>
                <span>{fmtRange(weekOffset)}</span>
              </div>
              <button className="today-pill" disabled={weekOffset === 0} onClick={() => setWeekOffset(0)}>Today</button>
            </div>
          )}
        </header>

        {/* screen */}
        <main className="screen">
          {tab === "board" && (
            <>
              <div className="legend">
                {MEMBER_LIST.map((m) => (
                  <span className="legend-item" key={m.key}><span className="dot" style={{ background: m.color }} />{m.name}</span>
                ))}
                <span className="legspace" />
                <span className="legkey"><IconCheck size={13} sw={2.5} style={{ color: "var(--ok)" }} /> done</span>
              </div>
              <Board chores={activeTemplates} weekOffset={weekOffset} occs={occs} onOpenCell={openCell} onQuickToggle={quickToggle} onMoveToken={moveToken} />
              <FloatingTasks tasks={floating} onToggle={toggleFloating} onOpenNew={newFloatingSheet} />
            </>
          )}
          {tab === "tasks" && <TasksScreen templates={templates} floating={floating}
                                onEditTemplate={editTemplate} onNewTemplate={newTemplateSheet}
                                onToggleFloating={toggleFloating} onNewFloating={newFloatingSheet} />}
          {tab === "insights" && <Insights weekStats={weekStats} activity={activity} />}
          {tab === "settings" && <SettingsScreen memberStats={memberStats} onOpenMember={openMember} onInvite={invite} />}
        </main>

        <CellSheet ctx={sheetCtx} occs={occs} history={hist}
                   onAssign={assign} onClear={clearCell} onComplete={completeCell} onClose={closeSheet} />

        <Sheet open={!!manage} onClose={closeManage}>
          {manage && manage.type === "template" && (
            <TemplateSheet draft={manage.draft} isNew={manage.isNew}
                           onSave={saveTemplate} onArchive={archiveTemplate} onDelete={deleteTemplate} onClose={closeManage} />
          )}
          {manage && manage.type === "floating" && (
            <FloatingSheet draft={null} onSave={saveFloating} onClose={closeManage} />
          )}
          {manage && manage.type === "member" && (
            <MemberSheet member={manage.member} stats={memberStats[manage.member.key]} onClose={closeManage} />
          )}
        </Sheet>

        <div className={"toast" + (toast ? " show" : "")}>{toast}</div>

        <TabBar tab={tab} onTab={setTab} />
      </div>

      {/* Tweaks */}
      <TweaksPanel>
        <TweakSection label="Look" />
        <TweakRadio label="Surface" value={t.look}
                    options={["paper", "board", "soft"]}
                    onChange={(v) => setTweak("look", v)} />
        <TweakColor label="Member colors" value={t.members}
                    options={COLOR_PAIRS}
                    onChange={(v) => setTweak("members", v)} />
        <TweakRadio label="Density" value={t.density}
                    options={["compact", "regular", "roomy"]}
                    onChange={(v) => setTweak("density", v)} />
        <TweakSection label="Theme" />
        <TweakToggle label="Dark mode" value={t.dark} onChange={(v) => setTweak("dark", v)} />
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
