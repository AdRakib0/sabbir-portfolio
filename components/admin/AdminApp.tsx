"use client";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { validateBlog, validateSite } from "../../lib/content";
import { Editor, setIn, type Doc, type MediaFile, type Path } from "./fields";
import { AboutSection, BlogSection, ContactSection, EducationSection, ExperienceSection, ProfileSection, ProjectsSection, RecommendationsSection, SeoSection, ServicesSection, SkillsSection, StatsSection, HeroPhotosSection } from "./sections";
import MediaLibrary from "./MediaLibrary";
import RawJson, { isStructural } from "./RawJson";
import styles from "./admin.module.css";

const SECTIONS = [
  { id: "profile", label: "Profile & Hero", prefixes: ["name", "headline", "location", "brand", "nav", "hero"], Component: ProfileSection },
  { id: "heroPhotos", label: "Hero photos", prefixes: ["hero.photos"], Component: HeroPhotosSection },
  { id: "stats", label: "Stats", prefixes: ["stats"], Component: StatsSection },
  { id: "about", label: "About", prefixes: ["sections.about", "about"], Component: AboutSection },
  { id: "experience", label: "Experience", prefixes: ["sections.experience", "experience"], Component: ExperienceSection },
  { id: "education", label: "Education", prefixes: ["education"], Component: EducationSection },
  { id: "skills", label: "Skills", prefixes: ["sections.services", "skillDetails"], Component: SkillsSection },
  { id: "projects", label: "Projects", prefixes: ["sections.work", "projects"], Component: ProjectsSection },
  { id: "services", label: "Services", prefixes: ["services"], Component: ServicesSection },
  { id: "recommendations", label: "Recommendations", prefixes: ["sections.recommendations", "recommendations"], Component: RecommendationsSection },
  { id: "blog", label: "Blog posts", prefixes: ["blog"], Component: BlogSection },
  { id: "contact", label: "Contact & Socials", prefixes: ["email", "contact", "sections.contact", "socials", "footer"], Component: ContactSection },
  { id: "seo", label: "SEO", prefixes: ["seo"], Component: SeoSection },
] as const;
type Tab = (typeof SECTIONS)[number]["id"] | "media" | "raw";

const CHUNK = 3 * 1024 * 1024;
const LIMITS: Record<string, number> = { jpg: 5, jpeg: 5, png: 5, webp: 5, pdf: 10 };

type Notice = { kind: "ok" | "error" | "info"; text: string } | null;

class SessionExpired extends Error {}

export default function AdminApp() {
  const [auth, setAuth] = useState<"checking" | "out" | "in">("checking");
  const [configured, setConfigured] = useState(true);
  const [expiresAt, setExpiresAt] = useState(0);
  const [doc, setDoc] = useState<Doc | null>(null);
  const [saved, setSaved] = useState("");
  const [shas, setShas] = useState({ siteSha: "", blogSha: "" });
  const [media, setMedia] = useState<MediaFile[]>([]);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [tab, setTab] = useState<Tab>("profile");
  const [notice, setNotice] = useState<Notice>(null);
  const [publishing, setPublishing] = useState(false);
  const [loadError, setLoadError] = useState("");

  const api = useCallback(async (url: string, init?: RequestInit) => {
    const headers = typeof init?.body === "string" ? { "Content-Type": "application/json" } : undefined;
    const r = await fetch(url, { ...init, headers, credentials: "same-origin" });
    const data = await r.json().catch(() => ({}));
    if (r.status === 401) { setAuth("out"); throw new SessionExpired(data.error || "Your session has expired. Please sign in again."); }
    if (!r.ok) throw Object.assign(new Error(data.error || `Request failed (${r.status}).`), { data });
    return data;
  }, []);

  useEffect(() => {
    fetch("/api/auth/session").then(r => r.json()).then(d => {
      setConfigured(d.configured);
      setExpiresAt(d.expiresAt);
      setAuth(d.authenticated ? "in" : "out");
    }).catch(() => setAuth("out"));
  }, []);

  const load = useCallback(async () => {
    setLoadError("");
    try {
      const d = await api("/api/content");
      const next: Doc = { ...d.site, blog: d.blog };
      setDoc(next);
      setSaved(JSON.stringify(next));
      setShas({ siteSha: d.siteSha, blogSha: d.blogSha });
      if ([...validateSite(d.site), ...validateBlog(d.blog)].some(e => isStructural(e.message))) {
        setTab("raw");
        setNotice({ kind: "error", text: "The stored content doesn’t match the expected structure. Fix it in Raw JSON." });
      } else if (d.warning) setNotice({ kind: "info", text: d.warning });
    } catch (e) {
      if (!(e instanceof SessionExpired)) setLoadError((e as Error).message);
    }
    setMediaLoading(true);
    try { setMedia((await api("/api/upload")).files); } catch (e) { if (!(e instanceof SessionExpired)) setNotice({ kind: "error", text: "Media library: " + (e as Error).message }); }
    setMediaLoading(false);
  }, [api]);

  useEffect(() => { if (auth === "in" && !doc) load(); }, [auth, doc, load]);

  const errorList = useMemo(() => {
    if (!doc) return [];
    const { blog, ...site } = doc;
    return [...validateSite(site), ...validateBlog(blog)];
  }, [doc]);
  const errors = useMemo(() => Object.fromEntries(errorList.map(e => [e.path, e.message])), [errorList]);
  const mediaChanges = media.filter(m => m.pending || m.deleted).length;
  const dirty = !!doc && (JSON.stringify(doc) !== saved || mediaChanges > 0);

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const set = useCallback((path: Path, value: unknown) => setDoc(d => (d ? setIn(d, path, value) : d)), []);

  const upload = useCallback(async (file: File): Promise<MediaFile | null> => {
    const ext = (file.name.split(".").pop() || "").toLowerCase();
    if (!LIMITS[ext]) { setNotice({ kind: "error", text: `${file.name}: only JPG, PNG, WebP and PDF files are allowed.` }); return null; }
    if (file.size > LIMITS[ext] * 1024 * 1024) { setNotice({ kind: "error", text: `${file.name} is larger than ${LIMITS[ext]} MB.` }); return null; }
    try {
      const chunks: string[] = [];
      for (let offset = 0; offset < file.size; offset += CHUNK) {
        const form = new FormData();
        form.append("chunk", file.slice(offset, offset + CHUNK));
        chunks.push((await api("/api/upload", { method: "POST", body: form })).sha);
      }
      const d = await api("/api/upload", { method: "POST", body: JSON.stringify({ name: file.name, size: file.size, chunks }) });
      const item: MediaFile = { path: d.path, name: d.name, url: d.url, size: d.size, sha: d.sha, pending: true, previewUrl: d.mime.startsWith("image/") ? URL.createObjectURL(file) : undefined };
      setMedia(m => [item, ...m]);
      setNotice({ kind: "info", text: `Uploaded ${d.name}. It goes live with your next publish.` });
      return item;
    } catch (e) {
      setNotice({ kind: "error", text: `${file.name}: ${(e as Error).message}` });
      return null;
    }
  }, [api]);

  function removeMedia(m: MediaFile) {
    if (m.pending) {
      if (m.previewUrl) URL.revokeObjectURL(m.previewUrl);
      setMedia(list => list.filter(x => x.path !== m.path));
    } else setMedia(list => list.map(x => (x.path === m.path ? { ...x, deleted: true } : x)));
  }

  async function publish() {
    if (!doc) return;
    if (errorList.length) {
      const first = SECTIONS.find(s => s.prefixes.some(p => errorList.some(e => e.path === p || e.path.startsWith(p + "."))));
      if (first) setTab(first.id);
      setNotice({ kind: "error", text: `Fix ${errorList.length} highlighted field${errorList.length === 1 ? "" : "s"} before publishing.` });
      return;
    }
    setPublishing(true);
    setNotice({ kind: "info", text: "Publishing…" });
    try {
      const { blog, ...site } = doc;
      const d = await api("/api/publish", {
        method: "POST",
        body: JSON.stringify({ site, blog, ...shas, uploads: media.filter(m => m.pending).map(m => ({ path: m.path, sha: m.sha })), deletions: media.filter(m => m.deleted).map(m => m.path) }),
      });
      setSaved(JSON.stringify(doc));
      setShas({ siteSha: d.siteSha, blogSha: d.blogSha });
      setMedia(list => list.filter(m => !m.deleted).map(m => ({ ...m, pending: false })));
      setNotice({ kind: "ok", text: d.unchanged ? "Nothing to publish — the live content already matches." : "Published. Live in about 1–2 minutes." });
    } catch (e) {
      setNotice({ kind: "error", text: (e as Error).message });
    }
    setPublishing(false);
  }

  async function logout() {
    if (dirty && !confirm("You have unpublished changes. Log out and discard them?")) return;
    await fetch("/api/auth/logout", { method: "POST" });
    setDoc(null); setSaved(""); setMedia([]); setNotice(null); setTab("profile");
    setAuth("out");
  }

  if (auth === "checking") return <main className={styles.center}><p className={styles.hint}>Loading…</p></main>;
  if (auth === "out") return <Login configured={configured} expired={!!doc} onLogin={exp => { setExpiresAt(exp); setAuth("in"); }} />;

  const current = SECTIONS.find(s => s.id === tab);
  const countFor = (prefixes: readonly string[]) => errorList.filter(e => prefixes.some(p => e.path === p || e.path.startsWith(p + "."))).length;

  return <div className={styles.shell}>
    <header className={styles.topbar}>
      <a className={styles.logo} href="/" target="_blank" rel="noreferrer"><span className={styles.mark}>S<b>.</b></span><span>Portfolio CMS</span></a>
      <div className={styles.status} aria-live="polite">
        {dirty ? <span className={styles.dirty}><i />Unsaved changes</span> : doc && <span className={styles.clean}><i />All changes published</span>}
      </div>
      <div className={styles.topActions}>
        <button type="button" className="btn primary" onClick={publish} disabled={!doc || publishing || !dirty}>{publishing ? "Publishing…" : "Publish"}</button>
        <button type="button" className="btn" onClick={logout} title={expiresAt ? "Session ends at " + new Date(expiresAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : undefined}>Log out</button>
      </div>
    </header>
    {notice && <div className={styles["notice-" + notice.kind]} role={notice.kind === "error" ? "alert" : "status"}><span>{notice.text}</span><button type="button" aria-label="Dismiss" onClick={() => setNotice(null)}>✕</button></div>}
    <div className={styles.body}>
      <nav className={styles.sidebar} aria-label="Content sections">
        {SECTIONS.map(s => { const n = countFor(s.prefixes); return <button type="button" key={s.id} aria-current={tab === s.id ? "page" : undefined} onClick={() => setTab(s.id)}>{s.label}{n > 0 && <span className={styles.badge}>{n}</span>}</button>; })}
        <span className={styles.navRule} />
        <button type="button" aria-current={tab === "media" ? "page" : undefined} onClick={() => setTab("media")}>Media library{mediaChanges > 0 && <span className={styles.badgeInfo}>{mediaChanges}</span>}</button>
        <button type="button" aria-current={tab === "raw" ? "page" : undefined} onClick={() => setTab("raw")}>Raw JSON</button>
      </nav>
      <main className={styles.main}>
        {loadError ? <div className={styles.group}><h3>Couldn’t load content</h3><p className={styles.hint}>{loadError}</p><button className="btn" onClick={load}>Try again</button></div>
          : !doc ? <p className={styles.hint}>Loading content…</p>
          : <Editor.Provider value={{ doc, set, errors, media, upload }}>
            <h2 className={styles.title}>{current?.label ?? (tab === "media" ? "Media library" : "Raw JSON")}</h2>
            {current ? <current.Component /> : tab === "media"
              ? <MediaLibrary loading={mediaLoading} onRemove={removeMedia} onRestore={m => setMedia(list => list.map(x => (x.path === m.path ? { ...x, deleted: false } : x)))} />
              : <RawJson onApply={next => setDoc(next)} />}
          </Editor.Provider>}
      </main>
    </div>
  </div>;
}

function Login({ configured, expired, onLogin }: { configured: boolean; expired: boolean; onLogin: (expiresAt: number) => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      const r = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) setError(d.error || "Sign-in failed.");
      else { setPassword(""); onLogin(d.expiresAt); }
    } catch { setError("Network error. Please try again."); }
    setBusy(false);
  }
  return <main className={styles.center}>
    <form className={styles.login} onSubmit={submit}>
      <a className={styles.logo} href="/"><span className={styles.mark}>S<b>.</b></span><span>Portfolio CMS</span></a>
      <h1>Sign in</h1>
      {expired && <p className={styles["notice-info"]}>Your session ended. Sign in again to continue — your unpublished edits are still here.</p>}
      {!configured && <p className={styles["notice-error"]}>ADMIN_TOKEN is not set for this deployment.</p>}
      <label htmlFor="admin-password">Password</label>
      <input id="admin-password" type="password" autoComplete="current-password" autoFocus value={password} onChange={e => setPassword(e.target.value)} required />
      {error && <small className={styles.error} role="alert">{error}</small>}
      <button className="btn primary" disabled={busy || !password}>{busy ? "Signing in…" : "Sign in"}</button>
      <a className={styles.back} href="/">← Back to portfolio</a>
    </form>
  </main>;
}
