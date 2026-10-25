"use client";
import { useRef, useState } from "react";
import { formatSize, isImage, useEditor, type MediaFile } from "./fields";
import styles from "./admin.module.css";

export default function MediaLibrary({ onRemove, onRestore, loading }: { onRemove: (m: MediaFile) => void; onRestore: (m: MediaFile) => void; loading: boolean }) {
  const { media, upload, doc } = useEditor();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(0);
  const [copied, setCopied] = useState("");
  const used = JSON.stringify(doc);

  async function add(files: FileList | null) {
    if (!files) return;
    const list = Array.from(files);
    setBusy(list.length);
    for (const file of list) { await upload(file); setBusy(n => n - 1); }
    if (input.current) input.current.value = "";
  }

  async function copy(url: string) {
    try { await navigator.clipboard.writeText(url); setCopied(url); setTimeout(() => setCopied(""), 1500); }
    catch { prompt("Copy this URL", url); }
  }

  function remove(m: MediaFile) {
    const warning = used.includes(m.url) ? "\n\nThis file is still used in your content. Those links will break." : "";
    if (confirm(`Delete ${m.name}?${m.pending ? "" : " It will be removed when you publish."}${warning}`)) onRemove(m);
  }

  return <section className={styles.group}>
    <h3>Media library</h3>
    <p className={styles.hint}>JPG, PNG, WebP or iPhone (HEIC) photos — large photos are resized and converted automatically — and PDFs up to 10 MB. New uploads and deletions go live with your next publish. Paste a file’s URL into any link field (for example, a CV PDF in Social links).</p>
    <div className={styles.inlineButtons}>
      <button type="button" className="btn primary" disabled={busy > 0} onClick={() => input.current?.click()}>{busy ? `Uploading ${busy}…` : "Upload files"}</button>
      <input ref={input} type="file" hidden multiple accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif,application/pdf" onChange={e => add(e.target.files)} />
    </div>
    {loading ? <p className={styles.empty}>Loading media…</p> : media.length === 0 ? <p className={styles.empty}>No uploads yet.</p> :
      <ul className={styles.mediaGrid}>
        {media.map(m => <li key={m.path} className={m.deleted ? styles.mediaDeleted : undefined}>
          <div className={styles.mediaThumb}>
            {isImage(m.url) ? <img src={m.previewUrl || m.url} alt="" loading="lazy" onError={e => { (e.target as HTMLImageElement).style.visibility = "hidden"; }} /> : <span className={styles.pdfIcon}>PDF</span>}
            {m.pending && <span className={styles.tag}>Unpublished</span>}
            {m.deleted && <span className={styles.tagDanger}>Will be deleted</span>}
          </div>
          <div className={styles.mediaMeta}>
            <b title={m.name}>{m.name}</b>
            <small>{formatSize(m.size)}{used.includes(m.url) ? " · in use" : ""}</small>
          </div>
          <div className={styles.mediaActions}>
            {m.deleted
              ? <button type="button" onClick={() => onRestore(m)}>Undo delete</button>
              : <><button type="button" onClick={() => copy(m.url)}>{copied === m.url ? "Copied" : "Copy URL"}</button>
                {!m.pending && <a href={m.url} target="_blank" rel="noreferrer">Open</a>}
                <button type="button" className={styles.danger} onClick={() => remove(m)}>Delete</button></>}
          </div>
        </li>)}
      </ul>}
  </section>;
}
