"use client";
import { useState } from "react";
import { validateBlog, validateSite } from "../../lib/content";
import { useEditor, type Doc } from "./fields";
import styles from "./admin.module.css";

// Type errors mean the forms cannot render the content; missing required text is fine to apply.
export const isStructural = (message: string) => message.startsWith("Must be") || message === "Missing section.";

export default function RawJson({ onApply }: { onApply: (doc: Doc) => void }) {
  const { doc } = useEditor();
  const { blog, ...site } = doc;
  const [file, setFile] = useState<"site" | "blog">("site");
  const [text, setText] = useState({ site: JSON.stringify(site, null, 2), blog: JSON.stringify(blog, null, 2) });
  const [message, setMessage] = useState("");

  function apply() {
    let parsedSite: unknown, parsedBlog: unknown;
    try { parsedSite = JSON.parse(text.site); } catch (e) { setMessage("site.json is not valid JSON: " + (e as Error).message); setFile("site"); return; }
    try { parsedBlog = JSON.parse(text.blog); } catch (e) { setMessage("blog.json is not valid JSON: " + (e as Error).message); setFile("blog"); return; }
    const broken = [...validateSite(parsedSite), ...validateBlog(parsedBlog)].filter(e => isStructural(e.message));
    if (broken.length) { setMessage("Structure problem: " + broken.slice(0, 5).map(e => `${e.path || "root"} — ${e.message}`).join("; ")); return; }
    onApply({ ...(parsedSite as Doc), blog: parsedBlog as Doc["blog"] });
    setMessage("Applied to the editor. Publish when ready.");
  }

  return <section className={styles.group}>
    <h3>Raw JSON</h3>
    <p className={styles.hint}>A fallback for advanced edits. Changes here replace the form content when you press Apply; nothing is published until you press Publish.</p>
    <div className={styles.segmented} role="tablist" aria-label="File">
      <button type="button" role="tab" aria-selected={file === "site"} onClick={() => setFile("site")}>site.json</button>
      <button type="button" role="tab" aria-selected={file === "blog"} onClick={() => setFile("blog")}>blog.json</button>
    </div>
    <textarea className={styles.raw} spellCheck={false} aria-label={file + ".json"} value={text[file]} onChange={e => setText({ ...text, [file]: e.target.value })} />
    <div className={styles.inlineButtons}>
      <button type="button" className="btn primary" onClick={apply}>Apply to editor</button>
      <button type="button" className="btn" onClick={() => { setText({ site: JSON.stringify(site, null, 2), blog: JSON.stringify(blog, null, 2) }); setMessage(""); }}>Discard raw edits</button>
    </div>
    {message && <p className={styles.hint} role="status">{message}</p>}
  </section>;
}
