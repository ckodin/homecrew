/* screens.jsx — Insights, Tasks, Settings, TabBar (fully built out) */

const { useState } = React;

/* ============================================================
   INSIGHTS — fairness dashboard + week summary + activity feed
   ============================================================ */
function Insights({ weekStats, activity, members, membersById }) {
  const [metric, setMetric] = useState("completed");
  const data = FAIRNESS[metric];
  const a = data[members[0]?.key] ?? 0, b = data[members[1]?.key] ?? 0;
  const total = members.reduce((s, m) => s + (data[m.key] ?? 0), 0) || 1;
  const bal = balanceFor(a, b);
  const maxTrend = Math.max(1, ...FAIRNESS.trend.flatMap((w) => members.map((m) => w[m.key] ?? 0)));

  return (
    <div>
      {/* this week at a glance */}
      <div className="stat-row">
        <div className="stat-card">
          <div className="stat-num">{weekStats.done}<span>/{weekStats.total}</span></div>
          <div className="stat-lbl">chores done this week</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{weekStats.rate}<span>%</span></div>
          <div className="stat-lbl">completion rate</div>
        </div>
      </div>

      {/* balance */}
      <div className="balance-card">
        <div className="balance-status">
          <span className="bdot" style={{ background: bal.tone }} />
          <b>{bal.label}</b>
        </div>
        <p className="balance-note">{bal.note}</p>

        <div className="metric-tabs">
          <button className={"metric-tab" + (metric === "assigned" ? " on" : "")} onClick={() => setMetric("assigned")}>Assigned effort</button>
          <button className={"metric-tab" + (metric === "completed" ? " on" : "")} onClick={() => setMetric("completed")}>Completed effort</button>
        </div>

        {members.map((m) => (
          <div className="effbar" key={m.key}>
            <div className="effbar-top">
              <span className="effbar-name"><span className="mini-av" style={{ background: m.color }}>{m.initial}</span>{m.name}</span>
              <span className="effbar-val"><b>{data[m.key] ?? 0}</b> pts</span>
            </div>
            <div className="effbar-track">
              <div className="effbar-fill" style={{ width: `${((data[m.key] ?? 0) / total) * 100}%`, background: m.color }} />
            </div>
          </div>
        ))}
      </div>

      {/* trend */}
      <div className="sec" style={{ marginTop: 4 }}>
        <div className="sec-head"><h3 className="sec-title">Completed effort · last {FAIRNESS.trend.length} weeks</h3></div>
        <div className="trend">
          {FAIRNESS.trend.map((w) => (
            <div className="trend-wk" key={w.wk}>
              <div className="trend-bars">
                {members.map((m) => (
                  <div key={m.key} className="trend-bar" style={{ height: `${((w[m.key] ?? 0) / maxTrend) * 100}%`, background: m.color }} title={`${m.name} ${w[m.key] ?? 0}`} />
                ))}
              </div>
              <span className="trend-lbl">{w.wk}</span>
            </div>
          ))}
        </div>
        <div className="legend" style={{ marginTop: 14, justifyContent: "center" }}>
          {members.map((m) => (
            <span className="legend-item" key={m.key}><span className="dot" style={{ background: m.color }} />{m.name}</span>
          ))}
        </div>
      </div>

      {/* activity */}
      <div className="sec">
        <div className="sec-head"><h3 className="sec-title">Recent activity</h3></div>
        <ul className="feed">
          {activity.map((h, i) => {
            const m = h.who ? membersById[h.who] : null;
            return (
              <li key={i} className="feed-item">
                <span className="mini-av" style={{ background: m ? m.color : "var(--ink-3)" }}>{m ? m.initial : "·"}</span>
                <span className="feed-text"><b>{m ? m.name : "Someone"}</b> {h.text}</span>
                <time className="feed-time">{h.when}</time>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

/* ============================================================
   TASKS — manage recurring chores + floating tasks
   ============================================================ */
function TasksScreen({ templates, floating, onEditTemplate, onNewTemplate, onToggleFloating, onNewFloating, membersById }) {
  const [showArchived, setShowArchived] = useState(false);
  const active = templates.filter((t) => t.active);
  const archived = templates.filter((t) => !t.active);

  return (
    <div>
      <div className="sec" style={{ marginTop: 4 }}>
        <div className="sec-head">
          <h3 className="sec-title">Recurring chores</h3>
          <button className="sec-add" onClick={onNewTemplate}><IconPlus size={15} sw={2.25} /> New</button>
        </div>
        {active.map((c) => (
          <div className="row-item tappable" key={c.id} onClick={() => onEditTemplate(c)} role="button" tabIndex={0}
               onKeyDown={(e) => { if (e.key === "Enter") onEditTemplate(c); }}>
            <div className="ri-body">
              <div className="ri-title">{c.name}</div>
              <div className="ri-meta">{c.category} · {freqLabel(c)}</div>
            </div>
            <span className="effort sm" title={`Effort ${c.effort}`}>
              {[1,2,3,4,5].map((n) => <i key={n} className={n <= c.effort ? "on" : ""} />)}
            </span>
            <IconChevR className="chev" size={18} />
          </div>
        ))}
        {active.length === 0 && <p className="hist-empty">No active chores. Tap “New” to add one.</p>}

        {archived.length > 0 && (
          <>
            <button className="archived-toggle" onClick={() => setShowArchived((v) => !v)}>
              <IconChevR size={15} style={{ transform: showArchived ? "rotate(90deg)" : "none", transition: "transform .15s" }} />
              {archived.length} archived
            </button>
            {showArchived && archived.map((c) => (
              <div className="row-item tappable archived" key={c.id} onClick={() => onEditTemplate(c)}>
                <div className="ri-body">
                  <div className="ri-title">{c.name}</div>
                  <div className="ri-meta">Archived · {c.category}</div>
                </div>
                <IconChevR className="chev" size={18} />
              </div>
            ))}
          </>
        )}
      </div>

      <div className="sec">
        <div className="sec-head">
          <h3 className="sec-title">Other chores</h3>
          <button className="sec-add" onClick={onNewFloating}><IconPlus size={15} sw={2.25} /> Add</button>
        </div>
        {floating.map((t) => <FloatingTaskItem key={t.id} task={t} onToggle={onToggleFloating} membersById={membersById} />)}
      </div>
    </div>
  );
}

/* ============================================================
   SETTINGS — household, members, notifications
   ============================================================ */
function SettingsScreen({ members, membersById, memberStats, onOpenMember, onAddMember }) {
  const [notif, setNotif] = useState({ reminders: true, nudges: true, weekly: false });
  const flip = (k) => setNotif((p) => ({ ...p, [k]: !p[k] }));

  return (
    <div>
      <div className="sec" style={{ marginTop: 4 }}>
        <div className="sec-head"><h3 className="sec-title">Household</h3></div>
        <div className="set-group">
          <div className="set-row"><span className="sr-label">Name</span><span className="sr-val">Home Crew <IconChevR size={16} /></span></div>
          <div className="set-row"><span className="sr-label">Week starts on</span><span className="sr-val">Monday <IconChevR size={16} /></span></div>
          <div className="set-row"><span className="sr-label">Members</span><span className="sr-val">{members.length} <IconChevR size={16} /></span></div>
        </div>
      </div>

      <div className="sec" style={{ marginTop: 4 }}>
        <div className="sec-head">
          <h3 className="sec-title">Members</h3>
          <button className="sec-add" onClick={onAddMember}><IconPlus size={15} sw={2.25} /> Add</button>
        </div>
        {members.map((m) => (
          <div className="row-item tappable" key={m.key} onClick={() => onOpenMember(m)} role="button" tabIndex={0}>
            <span className="mini-av" style={{ background: m.color, width: 34, height: 34, fontSize: 14 }}>{m.initial}</span>
            <div className="ri-body">
              <div className="ri-title">{m.name}</div>
              <div className="ri-meta">{m.role} · {memberStats[m.key]?.completed ?? 0} pts done</div>
            </div>
            <span className="pill">Active</span>
            <IconChevR className="chev" size={18} />
          </div>
        ))}
        <div className="row-item tappable" style={{ borderStyle: "dashed", cursor: "pointer" }} onClick={onAddMember}>
          <span className="mini-av unassigned" style={{ width: 34, height: 34 }}><IconPlus size={16} sw={2} /></span>
          <div className="ri-body"><div className="ri-title" style={{ color: "var(--ink-3)" }}>Add a member</div></div>
        </div>
      </div>

      <div className="sec" style={{ marginTop: 4 }}>
        <div className="sec-head"><h3 className="sec-title">Notifications</h3></div>
        <div className="set-group">
          {[
            ["reminders", "Chore reminders", "Morning ping for today's chores"],
            ["nudges", "Fairness nudges", "When the load gets uneven"],
            ["weekly", "Weekly summary", "Sunday recap of the week"],
          ].map(([k, label, sub]) => (
            <div className="set-row" key={k}>
              <div><div className="sr-label">{label}</div><div className="sr-sub">{sub}</div></div>
              <button className={"switch" + (notif[k] ? " on" : "")} onClick={() => flip(k)} aria-pressed={notif[k]} aria-label={label}><i /></button>
            </div>
          ))}
        </div>
      </div>

      <p className="empty-note" style={{ padding: "4px 20px 0" }}>HomeCrew · prototype<br />Tap the Tweaks button to change the look.</p>
    </div>
  );
}

/* ---------- Tab bar ---------- */
function TabBar({ tab, onTab }) {
  const tabs = [
    { key: "board",    label: "Board",    Icon: IconBoard },
    { key: "tasks",    label: "Tasks",    Icon: IconTasks },
    { key: "insights", label: "Insights", Icon: IconInsights },
    { key: "settings", label: "Settings", Icon: IconSettings },
  ];
  return (
    <nav className="tabbar">
      {tabs.map(({ key, label, Icon }) => (
        <button key={key} className={"tab" + (tab === key ? " active" : "") + (key === "board" ? " board-tab" : "")}
                onClick={() => onTab(key)} aria-current={tab === key}>
          <Icon size={23} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}

Object.assign(window, { Insights, TasksScreen, SettingsScreen, TabBar });
