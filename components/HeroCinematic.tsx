"use client";
import { useEffect, useRef, useState } from "react";
import styles from "./HeroCinematic.module.css";
import type { SiteContent } from "../lib/content";
import { sym } from "./SiteText";

type Props = { hero: SiteContent["hero"]; stats: SiteContent["stats"]; location: string };
type Card = { kind: "photo"; src: string; alt: string; fit?: string; focus?: string } | { kind: "stat"; icon: string; title: string; caption: string };

const pad = (n: number) => String(n).padStart(2, "0");
const offset = (i: number, active: number, n: number) => { let d = i - active; if (d < -n / 2) d += n; if (d >= n / 2) d -= n; return d; };

export default function HeroCinematic({ hero, stats, location }: Props) {
  const words = (hero.words ?? []).filter(Boolean);
  const wordsBox = useRef<HTMLDivElement>(null);
  const wordRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [fit, setFit] = useState<number[]>([]);

  // Shrink any giant word that is wider than the hero (e.g. PARTNERSHIP) so it is never cut off.
  useEffect(() => {
    const box = wordsBox.current;
    if (!box) return;
    const measure = () => {
      const avail = box.clientWidth * 0.98;
      setFit(wordRefs.current.map(el => (el && el.offsetWidth > avail ? avail / el.offsetWidth : 1)));
    };
    measure();
    document.fonts?.ready.then(measure);
    const ro = new ResizeObserver(measure);
    ro.observe(box);
    return () => ro.disconnect();
  }, [words.join("|")]);
  const photos = (hero.photos ?? []).filter(p => p.src);
  // Use uploaded photos; until there are some, show the highlight cards instead.
  let cards: Card[] = photos.length
    ? photos.map(p => ({ kind: "photo" as const, src: p.src, alt: p.alt, fit: p.fit, focus: p.focus }))
    : stats.map(s => ({ kind: "stat" as const, ...s }));
  // The wheel needs at least 5 cards to loop without a visible jump.
  if (cards.length) while (cards.length < 5) cards = cards.concat(cards);
  const realCount = photos.length || stats.length;

  const [w, setW] = useState(0);
  const [c, setC] = useState(0);
  const [paused, setPaused] = useState(false);
  const [motion, setMotion] = useState(true);

  useEffect(() => { setMotion(!window.matchMedia("(prefers-reduced-motion: reduce)").matches); }, []);
  useEffect(() => {
    if (!motion || words.length < 2) return;
    const t = setInterval(() => setW(x => x + 1), 2200);
    return () => clearInterval(t);
  }, [motion, words.length]);
  useEffect(() => {
    if (!motion || paused || cards.length < 2) return;
    const t = setInterval(() => setC(x => x + 1), 2600);
    return () => clearInterval(t);
  }, [motion, paused, cards.length]);

  const wa = words.length ? w % words.length : 0;
  const ca = cards.length ? c % cards.length : 0;

  return (
    <section className={styles.hero} id="top">
      <div className={styles.glow} aria-hidden="true" />
      <div className={`wrap ${styles.meta}`}><span>{hero.eyebrow}</span><span>{location}</span></div>

      {words.length > 0 && (
        <div ref={wordsBox} className={styles.words}>
          <h2 className={styles.srOnly}>{words.join(", ")}</h2>
          {words.map((t, i) => {
            const d = offset(i, wa, words.length);
            return <span key={t + i} aria-hidden="true" className={styles.word} style={{ transform: `translateY(${d * 45}%)`, opacity: d === 0 ? 1 : 0, filter: `blur(${d === 0 ? 0 : 12}px)` }}><span ref={el => { wordRefs.current[i] = el; }} className={styles.wordInner} style={{ transform: `scale(${fit[i] ?? 1})` }}>{t}</span></span>;
          })}
        </div>
      )}

      <div className={styles.wheel} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
        <div className={styles.pivot}>
          {cards.map((card, i) => {
            const d = offset(i, ca, cards.length);
            const ad = Math.abs(d);
            return (
              <figure key={i} className={styles.card} aria-hidden={ad !== 0}
                style={{ transform: `translate(-50%, -50%) rotate(${d * 17}deg) translateY(-1000px) scale(${ad === 0 ? 1 : 0.88})`, opacity: ad >= 2 ? 0 : ad === 1 ? 0.75 : 1, zIndex: 10 - ad }}>
                {card.kind === "photo"
                  ? (card.fit === "fit"
                    ? <><img className={styles.backdrop} src={card.src} alt="" aria-hidden="true" /><img className={styles.whole} src={card.src} alt={card.alt} loading={i === 0 ? "eager" : "lazy"} /></>
                    : <img src={card.src} alt={card.alt} loading={i === 0 ? "eager" : "lazy"} style={{ objectPosition: ({ top: "50% 15%", bottom: "50% 85%", left: "20% 50%", right: "80% 50%" } as Record<string, string>)[card.focus || ""] || "50% 50%" }} />)
                  : <div className={styles.statCard}><span aria-hidden="true">{sym(card.icon)}</span><b>{card.title}</b><small>{card.caption}</small></div>}
                <figcaption>{pad((i % realCount) + 1)} / {pad(realCount)}</figcaption>
              </figure>
            );
          })}
        </div>
      </div>

      <div className={`wrap ${styles.bottom}`}>
        <div className={styles.left}>
          <p className={styles.small}>{hero.greeting} {hero.greetingName} {hero.greetingEmoji}</p>
          <h1 className={styles.title}>{hero.title.text}<span>{hero.title.highlight}</span></h1>
        </div>
        <div className={styles.center}>
          <span className={styles.small}>{hero.nameSmall}</span>
          <span className={styles.serifName}>{hero.nameLarge}</span>
        </div>
        <div className={styles.right}>
          <p>{hero.intro}</p>
          <div className={styles.actions}>
            <a className="btn primary" href={hero.primaryCta.href}>{sym(hero.primaryCta.label)}</a>
            <a className="btn" href={hero.secondaryCta.href}>{sym(hero.secondaryCta.label)}</a>
          </div>
        </div>
      </div>
      <a className={`wrap ${styles.scroll}`} href="#about">{hero.scrollNote}</a>
    </section>
  );
}
