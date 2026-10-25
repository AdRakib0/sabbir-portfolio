"use client";
import { useEffect, useRef, useState } from "react";
import styles from "./RecommendationsMarquee.module.css";
import type { Recommendation } from "../lib/content";

const initials = (name: string) => name.split(" ").filter(Boolean).map(n => n[0]).join("").slice(0, 2);
const firstSentence = (t: string) => (t.match(/^[^.!?]+[.!?]/) || [t])[0].trim();

export default function RecommendationsMarquee({ items }: { items: Recommendation[] }) {
  const [open, setOpen] = useState<number | null>(null);
  const [held, setHeld] = useState(false);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const trigger = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (open === null) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeBtn.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(null); };
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener("keydown", onKey); trigger.current?.focus(); };
  }, [open]);

  if (!items.length) return null;
  // Repeat the set so the strip is always wider than the screen, then double it for a seamless loop.
  const reps = Math.max(1, Math.ceil(6 / items.length));
  const set = Array.from({ length: reps }, () => items).flat();
  const loop = [...set, ...set];
  const duration = `${set.length * 9}s`;
  const cur = open !== null ? items[open] : null;

  return (
    <>
      <div className={`${styles.viewport} ${held ? styles.held : ""}`} onPointerDown={() => setHeld(true)} onPointerUp={() => setHeld(false)} onPointerCancel={() => setHeld(false)} onPointerLeave={() => setHeld(false)}>
        <div className={styles.track} style={{ animationDuration: duration }}>
          {loop.map((r, k) => {
            const real = k < items.length; // only the first copy is exposed to screen readers and keyboard
            const idx = k % items.length;
            return (
              <figure key={k} className={styles.card} aria-hidden={!real} onClick={() => { setOpen(idx); }}>
                <span className={styles.mark} aria-hidden="true">“</span>
                <blockquote className={styles.headline}>{r.headline || firstSentence(r.text)}</blockquote>
                <p className={styles.excerpt}>{r.text.replace(/\n+/g, " ")}</p>
                <button type="button" className={styles.more} tabIndex={real ? 0 : -1}
                  onClick={e => { e.stopPropagation(); trigger.current = e.currentTarget; setOpen(idx); }}>Read full recommendation →</button>
                <figcaption className={styles.person}>
                  <span className={styles.avatar} aria-hidden="true">{initials(r.name)}</span>
                  <span><b>{r.name}</b><small>{r.role}</small></span>
                </figcaption>
              </figure>
            );
          })}
        </div>
      </div>

      {cur && (
        <div className={styles.overlay} onClick={() => setOpen(null)}>
          <div className={styles.dialog} role="dialog" aria-modal="true" aria-label={`Recommendation from ${cur.name}`} onClick={e => e.stopPropagation()}>
            <button ref={closeBtn} type="button" className={styles.close} onClick={() => setOpen(null)} aria-label="Close">✕</button>
            <span className={styles.mark} aria-hidden="true">“</span>
            <div className={styles.full}>{cur.text.split(/\n\s*\n/).map((p, i) => <p key={i}>{p}</p>)}</div>
            <div className={styles.person}>
              <span className={styles.avatar} aria-hidden="true">{initials(cur.name)}</span>
              <span><b>{cur.name}</b><small>{cur.role}</small>{cur.date && <small>{cur.date}</small>}</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
