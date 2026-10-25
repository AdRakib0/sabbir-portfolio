"use client";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import styles from "./ProjectsDeck.module.css";
import type { Project } from "../lib/content";

const pad = (n: number) => String(n).padStart(2, "0");
const SLOTS = [
  { x: 0, y: 0, rot: -2, scale: 1, op: 1 },
  { x: 26, y: 16, rot: 5, scale: 0.95, op: 1 },
  { x: -22, y: 30, rot: -7, scale: 0.9, op: 1 },
];
const HIDDEN = { x: 0, y: 40, rot: 2, scale: 0.86, op: 0 };

function Cover({ p, large }: { p: Project; large?: boolean }) {
  if (p.image) return <img className={styles.coverImg} src={p.image} alt="" loading="lazy" />;
  return (
    <span className={styles.coverArt} aria-hidden="true">
      <span className={large ? styles.symbolLg : styles.symbol}>{p.symbol || "↗"}</span>
      {p.artLabel && <small>{p.artLabel}</small>}
    </span>
  );
}

export default function ProjectsDeck({ projects, heading, subtitle, kicker }: { projects: Project[]; heading: ReactNode; subtitle?: string; kicker: string }) {
  const n = projects.length;
  const [top, setTop] = useState(0);
  const [fly, setFly] = useState<number | null>(null);
  const [open, setOpen] = useState<number | null>(null);
  const [drag, setDrag] = useState(0);
  const start = useRef<number | null>(null);
  const moved = useRef(false);
  const lastTrigger = useRef<HTMLElement | null>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const t = n ? ((top % n) + n) % n : 0;

  const forward = useCallback(() => {
    if (n < 2) return;
    setFly(t);
    setTop(x => x + 1);
    window.setTimeout(() => setFly(null), 750);
  }, [n, t]);
  const back = useCallback(() => { if (n > 1) setTop(x => x - 1); }, [n]);

  const openCase = (i: number, el?: HTMLElement | null) => { lastTrigger.current = el ?? (document.activeElement as HTMLElement); setOpen(i); };
  const close = useCallback(() => { setOpen(null); lastTrigger.current?.focus(); }, []);

  useEffect(() => {
    if (open === null) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeBtn.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") setOpen(o => (o === null ? o : (o + 1) % n));
      if (e.key === "ArrowLeft") setOpen(o => (o === null ? o : (o - 1 + n) % n));
    };
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener("keydown", onKey); };
  }, [open, n, close]);

  if (!n) return null;

  // Swipe or drag the top card; a tap without movement opens the case study.
  const onDown = (e: React.PointerEvent) => { start.current = e.clientX; moved.current = false; (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); };
  const onMove = (e: React.PointerEvent) => { if (start.current === null) return; const dx = e.clientX - start.current; if (Math.abs(dx) > 6) moved.current = true; setDrag(dx); };
  const onUp = (i: number) => (e: React.PointerEvent) => {
    if (start.current === null) return;
    const dx = e.clientX - start.current;
    start.current = null; setDrag(0);
    if (dx < -70) forward(); else if (dx > 70) back();
    else if (!moved.current) openCase(i, e.currentTarget as HTMLElement);
  };

  const cur = open !== null ? projects[open] : null;
  const info = cur ? [["My role", cur.role], ["Audience", cur.audience], ["Year", cur.year], ["Tools", cur.tools]].filter(([, v]) => v) : [];

  return (
    <section id="work" className={styles.section}>
      <div className="kicker">{kicker}</div>
      <div className={styles.layout}>
        <div className={styles.side}>
          <div className={`section-heading ${styles.head}`}>{heading}</div>
          {subtitle && <p className={styles.sub}>{subtitle}</p>}
          <div className={styles.controls}>
            <button type="button" className="btn primary" onClick={e => openCase(t, e.currentTarget)} aria-haspopup="dialog">View case study</button>
            {n > 1 && <>
              <button type="button" className={styles.round} onClick={back} aria-label="Previous project">←</button>
              <button type="button" className={styles.round} onClick={forward} aria-label="Next project">→</button>
            </>}
            <span className={styles.pos} aria-live="polite">{pad(t + 1)} / {pad(n)}</span>
          </div>
        </div>

        <div className={styles.deck}>
          {projects.map((p, i) => {
            const rel = ((i - t) % n + n) % n;
            const flying = fly === i;
            const s = flying ? { x: -520, y: -40, rot: -24, scale: 0.95, op: 0 } : rel < 3 ? SLOTS[rel] : HIDDEN;
            const z = flying ? 30 : rel < 3 ? 20 - rel : 1;
            const isTop = rel === 0 && !flying;
            const dx = isTop ? drag : 0;
            return (
              <button key={p.title + i} type="button" className={`${styles.card} ${dx ? styles.dragging : ""}`}
                tabIndex={isTop ? 0 : -1} aria-hidden={!isTop} aria-label={isTop ? `Open ${p.title} case study` : undefined}
                style={{ transform: `translate(-50%, -50%) translate(${s.x + dx}px, ${s.y}px) rotate(${s.rot + dx / 18}deg) scale(${s.scale})`, opacity: s.op, zIndex: z }}
                onPointerDown={isTop ? onDown : undefined} onPointerMove={isTop ? onMove : undefined} onPointerUp={isTop ? onUp(i) : undefined}
                onClick={isTop ? e => { if (e.detail === 0) openCase(i, e.currentTarget); } : () => setTop(top + rel)}>
                <span className={styles.cover}><Cover p={p} /></span>
                <span className={styles.num}>{pad(i + 1)}</span>
                <span className={styles.foot}><small>{p.category}</small><b>{p.title}</b></span>
              </button>
            );
          })}
          <p className={styles.hint} aria-hidden="true">{n > 1 ? "Tap the top card for details · swipe or use the arrows" : "Tap the card for details"}</p>
        </div>
      </div>

      {cur && open !== null && (
        <div className={styles.overlay} onClick={close}>
          <div className={styles.modal} role="dialog" aria-modal="true" aria-label={`${cur.title} case study`} onClick={e => e.stopPropagation()}>
            <div className={styles.bar}>
              <span>Case study · {pad(open + 1)} / {pad(n)}</span>
              <span className={styles.barBtns}>
                {n > 1 && <>
                  <button type="button" className={styles.round} onClick={() => setOpen((open - 1 + n) % n)} aria-label="Previous project">←</button>
                  <button type="button" className={styles.round} onClick={() => setOpen((open + 1) % n)} aria-label="Next project">→</button>
                </>}
                <button ref={closeBtn} type="button" className={styles.round} onClick={close} aria-label="Close case study">✕</button>
              </span>
            </div>
            <div className={styles.hero}><Cover p={cur} large /></div>
            <div className={styles.body}>
              <div><small className={styles.cat}>{cur.category}</small><h3 className={styles.title}>{cur.title}</h3></div>
              {info.length > 0 && <dl className={styles.info}>{info.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>}
              <div className={styles.cols}>
                <div className={styles.main}>
                  {cur.description && <div><h4>Overview</h4><p>{cur.description}</p></div>}
                  {cur.challenge && <div><h4>The challenge</h4><p>{cur.challenge}</p></div>}
                  {cur.did?.length > 0 && <div><h4>What I did</h4><ul>{cur.did.map((d, k) => <li key={k}>{d}</li>)}</ul></div>}
                </div>
                <div className={styles.aside}>
                  {cur.results?.length > 0 && <><h4>Results</h4>{cur.results.map((r, k) => <div className={styles.result} key={k}><b>{r.value}</b><span>{r.label}</span></div>)}</>}
                  {cur.tags.length > 0 && <div className={styles.tags}>{cur.tags.map(tg => <span key={tg}>{tg}</span>)}</div>}
                </div>
              </div>
              {cur.gallery?.length > 0 && <div><h4>Gallery</h4><div className={styles.gallery}>{cur.gallery.map((g, k) => <img key={k} src={g.src} alt={g.alt} loading="lazy" />)}</div></div>}
              <div className={styles.actions}>
                {cur.linkHref && <a className="btn primary" href={cur.linkHref} onClick={() => setOpen(null)}>{cur.linkLabel || "Discuss project"}</a>}
                {cur.extraHref && <a className="btn" href={cur.extraHref}>{cur.extraLabel || "Learn more"} ↗</a>}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
