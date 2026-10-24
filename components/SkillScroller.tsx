"use client";
import { useEffect, useState } from "react";
import styles from "./SkillScroller.module.css";

export type SkillItem = { name: string; desc: string };

const ROW = 64; // px between words

export default function SkillScroller({ items, interval = 1600 }: { items: SkillItem[]; interval?: number }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const n = items.length;

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || paused || n < 2) return;
    const t = setInterval(() => setActive((a) => (a + 1) % n), interval);
    return () => clearInterval(t);
  }, [paused, n, interval]);

  if (!n) return null;
  const current = items[active];

  return (
    <div className={styles.wrap}>
      <div
        className={styles.panel}
        aria-hidden="true"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div className={styles.track}>
          {items.map((s, i) => {
            let d = i - active;
            if (d < -n / 2) d += n;
            if (d >= n / 2) d -= n;
            const ad = Math.abs(d);
            return (
              <div
                key={s.name}
                className={styles.word}
                style={{
                  transform: `translateY(${d * ROW}px) rotateX(${-d * 11}deg) scale(${1 - Math.min(ad, 4) * 0.06})`,
                  filter: `blur(${ad * 2.2}px)`,
                  opacity: ad >= 4 ? 0 : 1 - ad * 0.24,
                }}
              >
                <span className={styles.arrow} style={{ opacity: ad === 0 ? 1 : 0 }}>
                  <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M13 6l6 6-6 6" /></svg>
                </span>
                <span>{s.name}</span>
              </div>
            );
          })}
        </div>
      </div>
      <div className={styles.caption}>
        <small>NOW SHOWING · {String(active + 1).padStart(2, "0")} / {String(n).padStart(2, "0")}</small>
        <p aria-live="polite"><b>{current.name}:</b> {current.desc}</p>
      </div>
      <ul className={styles.srList}>
        {items.map((s) => <li key={s.name}>{s.name}: {s.desc}</li>)}
      </ul>
    </div>
  );
}
