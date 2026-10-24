"use client";
import { createContext, useContext, useId, useRef, useState, type ReactNode } from "react";
import type { BlogPost, SiteContent } from "../../lib/content";
import styles from "./admin.module.css";

export type Doc = SiteContent & { blog: BlogPost[] };
export type Path = (string | number)[];
export type MediaFile = { path: string; name: string; url: string; size: number; sha: string; previewUrl?: string; pending?: boolean; deleted?: boolean };

type EditorContext = {
  doc: Doc;
  set: (path: Path, value: unknown) => void;
  errors: Record<string, string>;
  media: MediaFile[];
  upload: (file: File) => Promise<MediaFile | null>;
};

export const Editor = createContext<EditorContext | null>(null);

export function useEditor() {
  const ctx = useContext(Editor);
  if (!ctx) throw new Error("Editor context missing");
  return ctx;
}

export function getIn(obj: unknown, path: Path): any {
  return path.reduce<any>((value, key) => (value == null ? undefined : value[key]), obj);
}

export function setIn(obj: any, path: Path, value: unknown): any {
  if (!path.length) return value;
  const [key, ...rest] = path;
  const copy = Array.isArray(obj) ? [...obj] : { ...obj };
  copy[key as any] = setIn(obj?.[key as any], rest, value);
  return copy;
}

export const isImage = (url: string) => /\.(jpe?g|png|webp|gif|avif)(\?|$)/i.test(url);
export const formatSize = (n: number) => n > 1024 * 1024 ? (n / 1024 / 1024).toFixed(1) + " MB" : Math.max(1, Math.round(n / 1024)) + " KB";

export function Group({ title, hint, children }: { title: string; hint?: ReactNode; children: ReactNode }) {
  return <section className={styles.group}><h3>{title}</h3>{hint && <p className={styles.hint}>{hint}</p>}<div className={styles.fields}>{children}</div></section>;
}

type TextProps = {
  path: Path; label: string; required?: boolean; multiline?: boolean; rows?: number; placeholder?: string;
  hint?: ReactNode; type?: string; wide?: boolean; count?: number; list?: string; onChange?: (value: string) => void;
};

export function Text({ path, label, required, multiline, rows = 3, placeholder, hint, type = "text", wide, count, list, onChange }: TextProps) {
  const { doc, set, errors } = useEditor();
  const id = useId();
  const value: string = getIn(doc, path) ?? "";
  const error = errors[path.join(".")];
  const change = (v: string) => onChange ? onChange(v) : set(path, v);
  const common = { id, value, placeholder, "aria-invalid": !!error, "aria-describedby": error ? id + "-err" : undefined, className: error ? styles.invalid : undefined };
  return <div className={wide || multiline ? styles.fieldWide : styles.field}>
    <label htmlFor={id}>{label}{required && <span className={styles.req} aria-label="required"> *</span>}{count && <span className={value.length > count ? styles.over : styles.counter}>{value.length}/{count}</span>}</label>
    {multiline
      ? <textarea {...common} rows={rows} onChange={e => change(e.target.value)} />
      : <input {...common} type={type} list={list} onChange={e => change(e.target.value)} />}
    {error && <small id={id + "-err"} className={styles.error}>{error}</small>}
    {hint && !error && <small className={styles.hint}>{hint}</small>}
  </div>;
}

export function HeadingFields({ path, label, hint }: { path: Path; label: string; hint?: ReactNode }) {
  const { doc, set } = useEditor();
  const id = useId();
  return <div className={styles.headingRow}>
    <Text path={[...path, "text"]} label={label + " — text"} multiline rows={2} hint={hint ?? "Press Enter for a line break."} />
    <Text path={[...path, "highlight"]} label="Highlighted words" />
    <div className={styles.field}>
      <label htmlFor={id}>Highlight colour</label>
      <select id={id} value={getIn(doc, [...path, "tone"])} onChange={e => set([...path, "tone"], e.target.value)}>
        <option value="green">Green</option><option value="muted">Muted grey</option>
      </select>
    </div>
  </div>;
}

export function SectionHeadingFields({ id, subtitle = true }: { id: keyof SiteContent["sections"]; subtitle?: boolean }) {
  const base = ["sections", id];
  return <Group title="Section heading">
    <Text path={[...base, "kicker"]} label="Kicker" placeholder="01 / ABOUT" />
    <HeadingFields path={[...base, "title"]} label="Heading" />
    {subtitle && <Text path={[...base, "subtitle"]} label="Subtitle" wide />}
  </Group>;
}

function move<T>(list: T[], from: number, to: number) {
  const copy = [...list];
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return copy;
}

export function StringList({ path, label, itemLabel, multiline, hint }: { path: Path; label: string; itemLabel: string; multiline?: boolean; hint?: ReactNode }) {
  const { doc, set } = useEditor();
  const list: string[] = getIn(doc, path) ?? [];
  return <div className={styles.fieldWide}>
    <span className={styles.labelText}>{label}</span>
    {hint && <small className={styles.hint}>{hint}</small>}
    <ol className={styles.stringList}>
      {list.map((item, i) => <li key={i}>
        {multiline
          ? <textarea aria-label={`${itemLabel} ${i + 1}`} rows={3} value={item} onChange={e => set([...path, i], e.target.value)} />
          : <input aria-label={`${itemLabel} ${i + 1}`} value={item} onChange={e => set([...path, i], e.target.value)} />}
        <span className={styles.rowTools}>
          <button type="button" aria-label="Move up" disabled={i === 0} onClick={() => set(path, move(list, i, i - 1))}>↑</button>
          <button type="button" aria-label="Move down" disabled={i === list.length - 1} onClick={() => set(path, move(list, i, i + 1))}>↓</button>
          <button type="button" aria-label={`Delete ${itemLabel.toLowerCase()}`} className={styles.danger} onClick={() => { if (!item.trim() || confirm(`Delete this ${itemLabel.toLowerCase()}?`)) set(path, list.filter((_, n) => n !== i)); }}>✕</button>
        </span>
      </li>)}
    </ol>
    <button type="button" className={styles.addSmall} onClick={() => set(path, [...list, ""])}>+ Add {itemLabel.toLowerCase()}</button>
  </div>;
}

type ListProps<T> = {
  path: Path; label: string; itemLabel: string; newItem: () => T; title: (item: T, index: number) => string;
  subtitle?: (item: T) => string; render: (base: Path, item: T, index: number) => ReactNode; hint?: ReactNode;
};

export function ListEditor<T>({ path, label, itemLabel, newItem, title, subtitle, render, hint }: ListProps<T>) {
  const { doc, set, errors } = useEditor();
  const list: T[] = getIn(doc, path) ?? [];
  const [open, setOpen] = useState<number | null>(null);
  const key = path.join(".");
  const errorCount = (i: number) => Object.keys(errors).filter(k => k.startsWith(`${key}.${i}.`) || k === `${key}.${i}`).length;
  function reorder(from: number, to: number) {
    set(path, move(list, from, to));
    if (open === from) setOpen(to); else if (open === to) setOpen(from);
  }
  function remove(i: number) {
    if (!confirm(`Delete “${title(list[i], i) || "untitled"}”? This cannot be undone after publishing.`)) return;
    set(path, list.filter((_, n) => n !== i));
    setOpen(o => (o === i ? null : o !== null && o > i ? o - 1 : o));
  }
  return <Group title={label} hint={hint}>
    <div className={styles.list}>
      {list.length === 0 && <p className={styles.empty}>No {label.toLowerCase()} yet.</p>}
      {list.map((item, i) => {
        const count = errorCount(i);
        const isOpen = open === i;
        return <article key={i} className={isOpen ? styles.itemOpen : styles.item}>
          <header>
            <button type="button" className={styles.itemToggle} aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : i)}>
              <span className={styles.itemIndex}>{String(i + 1).padStart(2, "0")}</span>
              <span className={styles.itemTitle}><b>{title(item, i) || <em>Untitled {itemLabel.toLowerCase()}</em>}</b>{subtitle && <small>{subtitle(item)}</small>}</span>
              {count > 0 && <span className={styles.badge}>{count} to fix</span>}
              <span className={styles.chev} aria-hidden="true">{isOpen ? "−" : "+"}</span>
            </button>
            <span className={styles.rowTools}>
              <button type="button" aria-label="Move up" disabled={i === 0} onClick={() => reorder(i, i - 1)}>↑</button>
              <button type="button" aria-label="Move down" disabled={i === list.length - 1} onClick={() => reorder(i, i + 1)}>↓</button>
              <button type="button" aria-label={`Delete ${itemLabel.toLowerCase()}`} className={styles.danger} onClick={() => remove(i)}>✕</button>
            </span>
          </header>
          {isOpen && <div className={styles.itemBody}>{render([...path, i], item, i)}</div>}
        </article>;
      })}
    </div>
    <button type="button" className={"btn " + styles.addBtn} onClick={() => { set(path, [...list, newItem()]); setOpen(list.length); }}>+ Add {itemLabel.toLowerCase()}</button>
  </Group>;
}

export function ImageField({ path, label, hint }: { path: Path; label: string; hint?: ReactNode }) {
  const { doc, set, media, upload, errors } = useEditor();
  const value: string = getIn(doc, path) ?? "";
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [broken, setBroken] = useState("");
  const id = useId();
  const images = media.filter(m => !m.deleted && isImage(m.url));
  const match = media.find(m => m.url === value);
  const preview = match?.previewUrl || value;
  const error = errors[path.join(".")];
  async function pick(file?: File) {
    if (!file) return;
    setBusy(true);
    const result = await upload(file);
    setBusy(false);
    if (result) set(path, result.url);
    if (input.current) input.current.value = "";
  }
  return <div className={styles.fieldWide}>
    <label htmlFor={id}>{label}</label>
    <div className={styles.imageField}>
      <div className={styles.imagePreview}>
        {value && broken !== preview ? <img src={preview} alt="" onError={() => setBroken(preview)} /> : <span>{value ? "Preview available after the next deploy" : "No image"}</span>}
      </div>
      <div className={styles.imageControls}>
        <input id={id} value={value} placeholder="/uploads/… or https://…" onChange={e => set(path, e.target.value)} />
        <div className={styles.inlineButtons}>
          <button type="button" className="btn" disabled={busy} onClick={() => input.current?.click()}>{busy ? "Uploading…" : "Upload image"}</button>
          {images.length > 0 && <select aria-label="Choose from media library" value="" onChange={e => e.target.value && set(path, e.target.value)}>
            <option value="">Choose from library…</option>
            {images.map(m => <option key={m.path} value={m.url}>{m.name}{m.pending ? " (unpublished)" : ""}</option>)}
          </select>}
          {value && <button type="button" className="btn" onClick={() => set(path, "")}>Remove</button>}
        </div>
        <input ref={input} type="file" hidden accept="image/jpeg,image/png,image/webp" onChange={e => pick(e.target.files?.[0])} />
        {error ? <small className={styles.error}>{error}</small> : hint && <small className={styles.hint}>{hint}</small>}
      </div>
    </div>
  </div>;
}
