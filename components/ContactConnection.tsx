"use client";
import { useEffect, useRef, useState } from "react";
import styles from "./ContactConnection.module.css";
import type { SiteContent } from "../lib/content";
import { ARROW } from "./SiteText";

type Props = { kicker: string; contact: SiteContent["contact"]; email: string; socials: SiteContent["socials"]; status: string };

// Rest positions for up to six label words (left/top as % of the stage, x nudge in px, tilt in degrees).
const LAYOUT = [
  { left: 42, top: 15, x: -40, rot: -6 }, { left: 55, top: 32, x: 20, rot: 4 }, { left: 47, top: 50, x: -10, rot: -3 },
  { left: 36, top: 67, x: 0, rot: 7 }, { left: 52, top: 84, x: 10, rot: -4 }, { left: 60, top: 92, x: 0, rot: 3 },
];
const RADIUS = 280;

export default function ContactConnection({ kicker, contact, email, socials, status }: Props) {
  const words = (contact.words ?? []).filter(Boolean).slice(0, 6);
  const stage = useRef<HTMLDivElement>(null);
  const [m, setM] = useState({ x: 0, y: 0, w: 1180, h: 560, inside: false });
  const [pct, setPct] = useState(0);
  const [copied, setCopied] = useState(false);
  const [motion, setMotion] = useState(true);

  useEffect(() => { setMotion(!window.matchMedia("(prefers-reduced-motion: reduce)").matches); }, []);
  useEffect(() => {
    if (!m.inside) { setPct(0); return; }
    const t = setInterval(() => setPct(p => (p >= 99 ? 0 : p + 7)), 180);
    return () => clearInterval(t);
  }, [m.inside]);

  const move = (e: React.PointerEvent) => {
    if (!motion || !stage.current) return;
    const r = stage.current.getBoundingClientRect();
    setM({ x: e.clientX - r.left, y: e.clientY - r.top, w: r.width, h: r.height, inside: true });
  };
  const mail = (subject: string) => `mailto:${email}?subject=${encodeURIComponent(subject)}`;
  const copy = async () => {
    try { await navigator.clipboard.writeText(email); } catch { /* clipboard blocked: the email is still visible */ }
    setCopied(true); window.setTimeout(() => setCopied(false), 2000);
  };
  const linkedIn = socials.find(s => /linkedin/i.test(s.label) || /linkedin\.com/.test(s.url));

  return (
    <section id="contact" className={styles.section}>
      <div className="kicker">{kicker}</div>

      <div ref={stage} className={styles.stage} onPointerMove={move} onPointerLeave={() => setM(s => ({ ...s, inside: false }))}>
        <h2 className={styles.words}>
          <span className={styles.srOnly}>{words.join(" ")}</span>
          {words.map((t, i) => {
            const b = LAYOUT[i];
            let ox = 0, oy = 0, er = 0;
            if (m.inside) {
              const wx = m.w * b.left / 100 + b.x, wy = m.h * b.top / 100;
              const dx = wx - m.x, dy = wy - m.y, d = Math.max(Math.hypot(dx, dy), 1);
              if (d < RADIUS) { const p = Math.pow((RADIUS - d) / RADIUS, 1.4) * 140; ox = dx / d * p; oy = dy / d * p; er = (dx / d) * p * 0.12; }
            }
            const accent = contact.accentWord && t.trim().toLowerCase() === contact.accentWord.trim().toLowerCase();
            return (
              <span key={i} aria-hidden="true" className={styles.label}
                style={{ left: `${b.left}%`, top: `${b.top}%`, zIndex: 5 + i, transform: `translate(-50%, -50%) translate(${b.x + ox}px, ${oy}px) rotate(${b.rot + er}deg)` }}>
                <span className={accent ? styles.accent : undefined} style={{ animationDelay: `${i * 0.4}s` }}>{t}</span>
              </span>
            );
          })}
        </h2>

        <div className={styles.err}>
          <div className={styles.errBar}>{contact.errorFile || "connection.exe"} <span aria-hidden="true">✕</span></div>
          <div className={styles.errBody}>
            <b>{contact.errorTitle || "Download failed"}</b>
            <span>{contact.errorText || "Error 404: connections can’t be downloaded."}</span>
            <span className={styles.progress} aria-hidden="true"><span /></span>
            <a href={mail(contact.errorSubject || "Let's make a connection")}>{contact.errorButton || "Make one instead →"}</a>
          </div>
        </div>

        <div className={styles.cursorTag} aria-hidden="true" style={{ left: m.x, top: m.y, opacity: m.inside ? 1 : 0 }}>
          ↓ downloading connection<span className={styles.blink}>…</span> {pct}%
        </div>
        <p className={styles.hint} aria-hidden="true">Move your cursor through the words</p>
      </div>

      <div className={styles.payoff}>
        <p className={styles.payoffText}>{contact.payoffText}<span>{contact.payoffHighlight}</span></p>
        {status && <span className={styles.status}><span aria-hidden="true" />{status}</span>}
      </div>

      <div className={styles.reach}>
        <div className={styles.emailRow}>
          <a className={styles.email} href={`mailto:${email}`}>{email}</a>
          <button type="button" className={copied ? styles.copied : styles.copy} onClick={copy}>{copied ? "✓ Copied" : "Copy email"}</button>
        </div>
        <div className={styles.chips}>
          {(contact.chips ?? []).filter(c => c.label).map(c => <a key={c.label} href={mail(c.subject || c.label)}>{c.label}</a>)}
          {linkedIn && <a className={styles.social} href={linkedIn.url} target="_blank" rel="noreferrer">{linkedIn.label} {ARROW}</a>}
        </div>
      </div>
      {contact.caption && <p className={styles.caption}>{contact.caption}</p>}
    </section>
  );
}
