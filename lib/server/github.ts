import { createHash } from "node:crypto";

// Server-only GitHub helpers. GITHUB_TOKEN is read here and never sent to the browser.
export const repo = process.env.GITHUB_REPOSITORY || "AdRakib0/sabbir-portfolio";
export const branch = process.env.GITHUB_BRANCH || "main";
export const SITE_PATH = "content/site.json";
export const BLOG_PATH = "content/blog.json";
const apiBase = process.env.GITHUB_API_URL || "https://api.github.com";
export const UPLOAD_DIR = "public/uploads";
export const UPLOAD_PATH_PATTERN = /^public\/uploads\/[a-z0-9]+(?:-[a-z0-9]+)*\.(jpg|png|webp|pdf)$/;

export class GitHubError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

export async function github<T = any>(pathname: string, init?: RequestInit): Promise<T> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new GitHubError("GitHub publishing is not configured. Add GITHUB_TOKEN in Vercel.", 503);
  const r = await fetch(apiBase + "/repos/" + repo + pathname, {
    ...init,
    headers: { Authorization: "Bearer " + token, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28", "Content-Type": "application/json", ...(init?.headers || {}) },
    cache: "no-store",
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new GitHubError(data.message || "GitHub API request failed.", r.status);
  return data as T;
}

// The blob SHA git would give this text, so the client can track what it last loaded or published.
export function gitBlobSha(text: string) {
  const body = Buffer.from(text, "utf8");
  return createHash("sha1").update(`blob ${body.length}\0`).update(body).digest("hex");
}

export async function readRepoFile(path: string): Promise<{ text: string; sha: string } | null> {
  try {
    const meta = await github<{ sha: string; content?: string; encoding?: string }>(`/contents/${path}?ref=${encodeURIComponent(branch)}`);
    let base64 = meta.encoding === "base64" ? meta.content || "" : "";
    // The contents API leaves `content` empty for files over 1 MB; fall back to the blob API.
    if (!base64) base64 = (await github<{ content: string }>(`/git/blobs/${meta.sha}`)).content;
    return { text: Buffer.from(base64.replace(/\n/g, ""), "base64").toString("utf8"), sha: meta.sha };
  } catch (e) {
    if (e instanceof GitHubError && e.status === 404) return null;
    throw e;
  }
}

export async function createBlob(base64: string) {
  return (await github<{ sha: string }>("/git/blobs", { method: "POST", body: JSON.stringify({ content: base64, encoding: "base64" }) })).sha;
}

export async function readBlob(sha: string) {
  const blob = await github<{ content: string; size: number }>(`/git/blobs/${sha}`);
  return Buffer.from(blob.content.replace(/\n/g, ""), "base64");
}

export type UploadEntry = { path: string; name: string; url: string; size: number; sha: string };

export async function listUploads(): Promise<UploadEntry[]> {
  try {
    const items = await github<{ type: string; path: string; name: string; size: number; sha: string }[]>(`/contents/${UPLOAD_DIR}?ref=${encodeURIComponent(branch)}`);
    return items
      .filter(item => item.type === "file" && UPLOAD_PATH_PATTERN.test(item.path))
      .map(item => ({ path: item.path, name: item.name, url: "/uploads/" + item.name, size: item.size, sha: item.sha }))
      .sort((a, b) => b.name.localeCompare(a.name));
  } catch (e) {
    if (e instanceof GitHubError && e.status === 404) return [];
    throw e;
  }
}

export function errorMessage(e: unknown, fallback: string) {
  return e instanceof Error ? e.message : fallback;
}
