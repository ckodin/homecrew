/* board.jsx — Weekly Board (primary screen), cell action sheet, floating tasks */

const { useState, useEffect, useRef } = React;

/* ---------- a single board cell ---------- */
function Cell({ chore, dayIdx, occ, isToday, scheduled, onOpen, onQuickToggle }) {
  const assigned = occ && occ.assignee;
  const done = occ && occ.status === "done";
  const m = assigned ? MEMBERS[occ.assignee] : null;
  const offSched = !scheduled && !assigned;

  return (
    <div className={"cell" + (done ? " done" : "") + (isToday ? " today-col" : "") + (offSched ? " unscheduled" : "")}
         role="button" tabIndex={0}
         aria-label={`${chore.name}, ${DAYS_FULL[dayIdx]}${!scheduled ? " (off-schedule)" : ""}, ${done ? "completed by " + m.name : assigned ? "assigned to " + m.name : "unassigned"}`}
         onClick={() => onOpen(chore, dayIdx)}
         onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen(chore, dayIdx); } }}>
      {assigned ? (
        <span className="tok-wrap">
          <span className="token" data-m={occ.assignee} style={{ "--m": m.color }}>
            {m.initial}
          </span>
          <button className="qcheck" aria-label={done ? "Mark not done" : "Mark complete"}
                  onClick={(e) => { e.stopPropagation(); onQuickToggle(chore, dayIdx); }}>
            <IconCheck size={11} sw={2.5} />
          </button>
        </span>
      ) : (
        <span className="plus">+</span>
      )}
    </div>
  );
}

/* ---------- the board grid ---------- */
function Board({ chores, weekOffset, occs, onOpenCell, onQuickToggle }) {
  return (
    <div className="board-wrap">
      <div className="board" role="grid" aria-label="Weekly chore board">
        <div className="bh bh-corner" />
        {DAYS.map((d, i) => (
          <div key={d} className={"bh bh-day" + (weekOffset === 0 && i === TODAY_INDEX ? " today" : "")}>
            <b>{d}</b>
            <span>{fmtDayNum(weekOffset, i)}</span>
          </div>
        ))}

        {chores.map((chore) => (
          <React.Fragment key={chore.id}>
            <div className="chore-cell">
              <div className="chore-name">{chore.name}</div>
              <div className="chore-meta">
                <span>{chore.freq}</span>
              </div>
            </div>
            {DAYS.map((d, i) => (
              <Cell key={i} chore={chore} dayIdx={i}
                    occ={occs[`${chore.id}:${i}`]}
                    scheduled={chore.scheduled.includes(i)}
                    isToday={weekOffset === 0 && i === TODAY_INDEX}
                    onOpen={onOpenCell} onQuickToggle={onQuickToggle} />
            ))}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

/* ---------- floating tasks list ---------- */
function FloatingTasks({ tasks, onToggle, onOpenNew }) {
  return (
    <div className="sec">
      <div className="sec-head">
        <h3 className="sec-title">Floating tasks</h3>
        <button className="sec-add" onClick={onOpenNew}><IconPlus size={15} sw={2.25} /> Add</button>
      </div>
      {tasks.map((t) => {
        const m = t.assignee ? MEMBERS[t.assignee] : null;
        return (
          <div key={t.id} className={"ftask" + (t.status === "done" ? " done" : "")}
               onClick={() => onToggle(t.id)} role="button" tabIndex={0}
               onKeyDown={(e) => { if (e.key === "Enter") onToggle(t.id); }}>
            <span className="ftask-check"><IconCheck size={12} sw={2.5} /></span>
            <div className="ftask-body">
              <div className="ftask-title">{t.title}</div>
              <div className="ftask-meta">{m ? `${m.name}` : "Unassigned"}{t.status === "done" ? " · done" : ""}</div>
            </div>
            {m
              ? <span className="mini-av" style={{ background: m.color }}>{m.initial}</span>
              : <span className="mini-av unassigned">?</span>}
          </div>
        );
      })}
    </div>
  );
}

/* ---------- bottom sheet for a cell ---------- */
function CellSheet({ ctx, occs, history, onAssign, onClear, onComplete, onClose }) {
  // ctx = { chore, dayIdx, weekOffset } or null
  const open = !!ctx;
  const occ = open ? occs[`${ctx.chore.id}:${ctx.dayIdx}`] : null;
  const assignee = occ && occ.assignee;
  const done = occ && occ.status === "done";
  const hist = open ? (history[`${ctx.chore.id}:${ctx.dayIdx}`] || []) : [];

  return (
    <>
      <div className={"scrim" + (open ? " show" : "")} onClick={onClose} />
      <div className={"sheet" + (open ? " show" : "")} role="dialog" aria-modal="true">
        <div className="sheet-grip" />
        {open && (
          <>
            <div className="sheet-head">
              <div className="sheet-icon"><IconBroom size={22} /></div>
              <div>
                <h2 className="sheet-title">{ctx.chore.name}</h2>
                <p className="sheet-sub">{DAYS_FULL[ctx.dayIdx]} · effort {ctx.chore.effort}</p>
              </div>
              <button className="sheet-x" onClick={onClose} aria-label="Close"><IconX size={16} /></button>
            </div>

            <p className="sheet-label">Assign to</p>
            <div className="assign-row">
              {MEMBER_LIST.map((m) => (
                <button key={m.key}
                        className={"assign-opt" + (assignee === m.key ? " sel" : "")}
                        style={{ "--am": m.color }}
                        onClick={() => onAssign(ctx, m.key)}>
                  <span className="ao-av" style={{ background: m.color }}>{m.initial}</span>
                  <span className="ao-name">{m.name}</span>
                </button>
              ))}
              <button className="assign-opt clear" onClick={() => onClear(ctx)} aria-label="Unassign">
                <span className="ao-av"><IconX size={16} /></span>
                <span className="ao-name" style={{ fontSize: 11 }}>Clear</span>
              </button>
            </div>

            <button className="sheet-btn primary" disabled={!assignee}
                    onClick={() => onComplete(ctx)}>
              <IconCheck size={18} sw={2.25} />
              {done ? "Mark as not done" : "Mark complete"}
            </button>

            <p className="sheet-label" style={{ marginTop: 22 }}>History</p>
            {hist.length === 0
              ? <p className="hist-empty">No activity yet for this occurrence.</p>
              : (
                <ul className="hist">
                  {hist.map((h, i) => {
                    const hm = h.who ? MEMBERS[h.who] : null;
                    return (
                      <li key={i}>
                        <span className="dotm" style={{ background: hm ? hm.color : "var(--ink-3)" }} />
                        <span>{h.text}</span>
                        <time>{h.when}</time>
                      </li>
                    );
                  })}
                </ul>
              )}
          </>
        )}
      </div>
    </>
  );
}

Object.assign(window, { Board, FloatingTasks, CellSheet });
