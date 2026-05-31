/* manage.jsx — reusable bottom-sheet shell + Template / Floating-task / Member editors */

const { useState, useEffect } = React;

/* Generic animated bottom sheet. `open` controls visibility; renders children. */
function Sheet({ open, onClose, children }) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (open && ref.current) ref.current.scrollTop = 0;
  }, [open]);

  return (
    <>
      <div className={"scrim" + (open ? " show" : "")} onClick={onClose} />
      <div ref={ref} className={"sheet" + (open ? " show" : "")} role="dialog" aria-modal="true">
        <div className="sheet-grip" />
        {open && children}
      </div>
    </>
  );
}

function SheetHeader({ icon, title, sub, onClose }) {
  return (
    <div className="sheet-head">
      <div className="sheet-icon">{icon}</div>
      <div>
        <h2 className="sheet-title">{title}</h2>
        {sub && <p className="sheet-sub">{sub}</p>}
      </div>
      <button className="sheet-x" onClick={onClose} aria-label="Close"><IconX size={16} /></button>
    </div>
  );
}

/* ---------- Template editor (create / edit / archive) ---------- */
function TemplateSheet({ draft, isNew, onSave, onArchive, onDelete, onClose }) {
  const [d, setD] = useState(draft);
  const [confirmDelete, setConfirmDelete] = useState(false);
  useEffect(() => { setD(draft); }, [draft?.id]);
  const nameRef = React.useRef(null);
  useEffect(() => {
    const t = setTimeout(() => nameRef.current?.focus(), 310);
    return () => clearTimeout(t);
  }, []);
  if (!d) return null;

  const set = (patch) => setD((p) => ({ ...p, ...patch }));
  const pickFreq = (f) => set({ freq: f });
  const canSave = d.name.trim() && d.timesPerPeriod >= 1;

  return (
    <>
      <SheetHeader icon={<IconBroom size={22} />} title={isNew ? "New chore" : "Edit chore"}
                   sub={isNew ? "Recurring household chore" : d.category} onClose={onClose} />

      <p className="field-label">Name</p>
      <input ref={nameRef} className="tinput" value={d.name} placeholder="e.g. Clean bathroom"
             onChange={(e) => set({ name: e.target.value })} />

      <p className="field-label">Category</p>
      <div className="chiprow">
        {CATEGORIES.map((c) => (
          <button key={c} className={"chip-opt" + (d.category === c ? " on" : "")} onClick={() => set({ category: c })}>{c}</button>
        ))}
      </div>

      <p className="field-label">Frequency</p>
      <div className="chiprow">
        {FREQUENCIES.map((f) => (
          <button key={f} className={"chip-opt" + (d.freq === f ? " on" : "")} onClick={() => pickFreq(f)}>{f}</button>
        ))}
      </div>

      <p className="field-label">Times per {d.freq.toLowerCase()}</p>
      <div className="chiprow" style={{ alignItems: "center", gap: 12 }}>
        <button className="chip-opt" onClick={() => set({ timesPerPeriod: Math.max(1, d.timesPerPeriod - 1) })}>−</button>
        <span style={{ minWidth: 24, textAlign: "center", fontWeight: 600 }}>{d.timesPerPeriod}</span>
        <button className="chip-opt" onClick={() => set({ timesPerPeriod: d.timesPerPeriod + 1 })}>+</button>
      </div>

      <p className="field-label">Effort</p>
      <div className="effort-pick">
        {[1,2,3,4,5].map((n) => (
          <button key={n} className={"effort-dot" + (d.effort === n ? " on" : "")} onClick={() => set({ effort: n })}>{n}</button>
        ))}
        <span className="effort-hint">{EFFORT_LABELS[d.effort]}</span>
      </div>

      <button className="sheet-btn primary" style={{ marginTop: 24 }} disabled={!canSave} onClick={() => onSave(d)}>
        <IconCheck size={18} sw={2.25} /> {isNew ? "Create chore" : "Save changes"}
      </button>
      {!isNew && !confirmDelete && (
        <button className="sheet-btn danger" onClick={() => onArchive(d.id)}>Archive chore</button>
      )}
      {!isNew && !confirmDelete && (
        <button className="sheet-btn ghost" onClick={() => setConfirmDelete(true)}>Delete chore</button>
      )}
      {!isNew && confirmDelete && (
        <>
          <p className="field-label" style={{ textAlign: "center", marginTop: 16 }}>Delete "{d.name}" permanently?</p>
          <button className="sheet-btn danger" onClick={() => onDelete(d.id)}>Yes, delete forever</button>
          <button className="sheet-btn ghost" onClick={() => setConfirmDelete(false)}>Cancel</button>
        </>
      )}
    </>
  );
}

/* ---------- Floating-task composer ---------- */
function FloatingSheet({ draft, onSave, onClose }) {
  const [title, setTitle] = useState("");
  const [assignee, setAssignee] = useState(null);
  useEffect(() => { setTitle(draft ? draft.title : ""); setAssignee(draft ? draft.assignee : null); }, [draft]);
  const titleRef = React.useRef(null);
  useEffect(() => {
    const t = setTimeout(() => titleRef.current?.focus(), 310);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      <SheetHeader icon={<IconTasks size={22} />} title="New task" sub="One-off, not on a schedule" onClose={onClose} />
      <p className="field-label">What needs doing?</p>
      <input ref={titleRef} className="tinput" value={title} placeholder="e.g. Call the plumber"
             onChange={(e) => setTitle(e.target.value)} />
      <p className="field-label">Assign to (optional)</p>
      <div className="assign-row">
        {MEMBER_LIST.map((m) => (
          <button key={m.key} className={"assign-opt" + (assignee === m.key ? " sel" : "")} style={{ "--am": m.color }}
                  onClick={() => setAssignee(assignee === m.key ? null : m.key)}>
            <span className="ao-av" style={{ background: m.color }}>{m.initial}</span>
            <span className="ao-name">{m.name}</span>
          </button>
        ))}
      </div>
      <button className="sheet-btn primary" style={{ marginTop: 8 }} disabled={!title.trim()}
              onClick={() => onSave({ title: title.trim(), assignee })}>
        <IconPlus size={18} sw={2.25} /> Add task
      </button>
    </>
  );
}

/* ---------- Member detail ---------- */
function MemberSheet({ member, stats, onClose }) {
  if (!member) return null;
  return (
    <>
      <SheetHeader
        icon={<span className="mini-av" style={{ background: member.color, width: 30, height: 30, fontSize: 13 }}>{member.initial}</span>}
        title={member.name} sub={member.key === "clarisse" ? "Household owner" : "Member · joined Apr 2026"} onClose={onClose} />
      <div className="balance-card" style={{ marginTop: 4 }}>
        <div className="effbar">
          <div className="effbar-top"><span className="effbar-name">Assigned this month</span><span className="effbar-val"><b>{stats.assigned}</b> pts</span></div>
        </div>
        <div className="effbar" style={{ marginBottom: 0 }}>
          <div className="effbar-top"><span className="effbar-name">Completed this month</span><span className="effbar-val"><b>{stats.completed}</b> pts</span></div>
        </div>
      </div>
      <button className="sheet-btn ghost"><IconRepeat size={17} /> Reassign their chores</button>
      {member.key !== "clarisse" && <button className="sheet-btn danger">Remove from household</button>}
    </>
  );
}

Object.assign(window, { Sheet, SheetHeader, TemplateSheet, FloatingSheet, MemberSheet });
