/* board.jsx — Weekly Board (primary screen), cell action sheet, floating tasks */

const { useState, useEffect, useRef } = React;

/* Resolve the board cell under a screen point (used for touch dragging, since
   touch events don't carry a drop target the way HTML5 drag-and-drop does). */
function cellFromPoint(x, y) {
  const el = document.elementFromPoint(x, y);
  const cellEl = el && el.closest ? el.closest(".cell[data-chore-id]") : null;
  if (!cellEl) return null;
  return { el: cellEl, choreId: cellEl.dataset.choreId, dayIdx: Number(cellEl.dataset.dayIdx) };
}
const TOUCH_HOLD_MS = 250;   // long-press before a token is "picked up"
const TOUCH_MOVE_TOL = 10;   // px of movement that cancels the pickup (treated as a scroll)

/* ---------- a single board cell ---------- */
const Cell = React.memo(function Cell({ chore, dayIdx, occ, isToday, onOpen, onQuickToggle, dragSrc, onMoveToken, chores }) {
  const assigned = occ && occ.assignee;
  const done = occ && occ.status === "done";
  const m = assigned ? MEMBERS[occ.assignee] : null;
  const cellRef = useRef(null);
  const touch = useRef(null);

  /* --- touch drag: long-press to pick up, drag, release to drop --- */
  const handleTouchStart = (e) => {
    if (!assigned || e.touches.length !== 1) return;
    if (e.target.closest && e.target.closest(".qcheck")) return; // let the complete button work
    const t = e.touches[0];
    const st = { startX: t.clientX, startY: t.clientY, dragging: false, ghost: null, lastOver: null };

    const positionGhost = (x, y) => {
      if (st.ghost) { st.ghost.style.left = x + "px"; st.ghost.style.top = y + "px"; }
    };
    const updateOver = (x, y) => {
      const hit = cellFromPoint(x, y);
      const el = hit ? hit.el : null;
      if (st.lastOver && st.lastOver !== el) st.lastOver.classList.remove("drag-over");
      if (el) el.classList.add("drag-over");
      st.lastOver = el;
    };
    const begin = (x, y) => {
      st.dragging = true;
      dragSrc.current = { chore, dayIdx };
      document.body.classList.add("dragging");
      const ghost = document.createElement("div");
      ghost.className = "token drag-ghost";
      ghost.dataset.m = occ.assignee;
      ghost.style.setProperty("--m", m.color);
      ghost.textContent = m.initial;
      document.body.appendChild(ghost);
      st.ghost = ghost;
      positionGhost(x, y);
      updateOver(x, y);
      if (navigator.vibrate) navigator.vibrate(12);
    };
    const cleanup = () => {
      clearTimeout(st.timer);
      document.removeEventListener("touchmove", st.onMove);
      document.removeEventListener("touchend", st.onEnd);
      document.removeEventListener("touchcancel", st.onEnd);
      if (st.ghost) st.ghost.remove();
      if (st.lastOver) st.lastOver.classList.remove("drag-over");
      document.body.classList.remove("dragging");
      dragSrc.current = null;
      touch.current = null;
    };

    st.onMove = (ev) => {
      const p = ev.touches[0];
      if (!st.dragging) {
        if (Math.abs(p.clientX - st.startX) > TOUCH_MOVE_TOL ||
            Math.abs(p.clientY - st.startY) > TOUCH_MOVE_TOL) cleanup(); // it's a scroll, not a pickup
        return;
      }
      ev.preventDefault();
      positionGhost(p.clientX, p.clientY);
      updateOver(p.clientX, p.clientY);
    };
    st.onEnd = (ev) => {
      if (st.dragging) {
        const p = ev.changedTouches[0];
        const hit = cellFromPoint(p.clientX, p.clientY);
        if (hit) {
          const dstChore = chores.find((c) => String(c.id) === String(hit.choreId));
          if (dstChore) onMoveToken(chore, dayIdx, dstChore, hit.dayIdx);
        }
      }
      cleanup();
    };

    st.timer = setTimeout(() => begin(st.startX, st.startY), TOUCH_HOLD_MS);
    touch.current = st;
    document.addEventListener("touchmove", st.onMove, { passive: false });
    document.addEventListener("touchend", st.onEnd);
    document.addEventListener("touchcancel", st.onEnd);
  };

  const handleDragStart = (e) => {
    dragSrc.current = { chore, dayIdx };
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", `${chore.id}:${dayIdx}`);
  };
  const handleDragEnd = () => {
    dragSrc.current = null;
  };
  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    cellRef.current?.classList.add("drag-over");
  };
  const handleDragEnter = (e) => e.preventDefault();
  const handleDragLeave = (e) => {
    if (!cellRef.current?.contains(e.relatedTarget))
      cellRef.current?.classList.remove("drag-over");
  };
  const handleDrop = (e) => {
    e.preventDefault();
    cellRef.current?.classList.remove("drag-over");
    const src = dragSrc.current;
    if (!src || (src.chore.id === chore.id && src.dayIdx === dayIdx)) return;
    onMoveToken(src.chore, src.dayIdx, chore, dayIdx);
  };

  return (
    <div ref={cellRef}
         className={"cell" + (done ? " done" : "") + (isToday ? " today-col" : "")}
         role="button" tabIndex={0}
         draggable={!!assigned}
         data-chore-id={chore.id}
         data-day-idx={dayIdx}
         aria-label={`${chore.name}, ${DAYS_FULL[dayIdx]}, ${done ? "completed by " + m.name : assigned ? "assigned to " + m.name : "unassigned"}`}
         onClick={() => onOpen(chore, dayIdx)}
         onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen(chore, dayIdx); } }}
         onTouchStart={assigned ? handleTouchStart : undefined}
         onDragStart={assigned ? handleDragStart : undefined}
         onDragEnd={assigned ? handleDragEnd : undefined}
         onDragOver={handleDragOver}
         onDragEnter={handleDragEnter}
         onDragLeave={handleDragLeave}
         onDrop={handleDrop}>
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
});

/* ---------- the board grid ---------- */
function Board({ chores, weekOffset, occs, onOpenCell, onQuickToggle, onMoveToken }) {
  const dragSrc = useRef(null);
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
                <span>{freqLabel(chore)}</span>
              </div>
            </div>
            {DAYS.map((d, i) => (
              <Cell key={i} chore={chore} dayIdx={i}
                    occ={occs[cellKey(chore.id, i)]}
                    isToday={weekOffset === 0 && i === TODAY_INDEX}
                    onOpen={onOpenCell} onQuickToggle={onQuickToggle}
                    dragSrc={dragSrc} onMoveToken={onMoveToken} chores={chores} />
            ))}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

/* ---------- shared floating task row (also used by screens.jsx TasksScreen) ---------- */
function FloatingTaskItem({ task, onToggle }) {
  const m = task.assignee ? MEMBERS[task.assignee] : null;
  return (
    <div className={"ftask" + (task.status === "done" ? " done" : "")}
         onClick={() => onToggle(task.id)} role="button" tabIndex={0}
         onKeyDown={(e) => { if (e.key === "Enter") onToggle(task.id); }}>
      <span className="ftask-check"><IconCheck size={12} sw={2.5} /></span>
      <div className="ftask-body">
        <div className="ftask-title">{task.title}</div>
        <div className="ftask-meta">{m ? m.name : "Unassigned"}{task.status === "done" ? " · done" : ""}</div>
      </div>
      {m ? <span className="mini-av" style={{ background: m.color }}>{m.initial}</span>
         : <span className="mini-av unassigned">?</span>}
    </div>
  );
}

/* ---------- floating tasks list ---------- */
function FloatingTasks({ tasks, onToggle, onOpenNew }) {
  return (
    <div className="sec">
      <div className="sec-head">
        <h3 className="sec-title">Other chores</h3>
        <button className="sec-add" onClick={onOpenNew}><IconPlus size={15} sw={2.25} /> Add</button>
      </div>
      {tasks.map((t) => <FloatingTaskItem key={t.id} task={t} onToggle={onToggle} />)}
    </div>
  );
}

/* ---------- bottom sheet for a cell ---------- */
function CellSheet({ ctx, occs, history, onAssign, onClear, onComplete, onClose }) {
  // ctx = { chore, dayIdx, weekOffset } or null
  const open = !!ctx;
  const occ = open ? occs[cellKey(ctx.chore.id, ctx.dayIdx)] : null;
  const assignee = occ && occ.assignee;
  const done = occ && occ.status === "done";
  const hist = open ? (history[cellKey(ctx.chore.id, ctx.dayIdx)] || []) : [];

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

Object.assign(window, { Board, FloatingTaskItem, FloatingTasks, CellSheet });
