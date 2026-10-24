import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "../../../lib/server/auth";
import { BLOG_PATH, GitHubError, SITE_PATH, UPLOAD_PATH_PATTERN, branch, errorMessage, gitBlobSha, github, listUploads } from "../../../lib/server/github";
import { validateBlog, validateSite } from "../../../lib/content";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type TreeEntry = { path: string; mode: "100644"; type: "blob"; sha?: string | null; content?: string };

// Publishes site.json, blog.json and any added or removed uploads as ONE commit on the branch,
// so Vercel builds a single deployment.
export async function POST(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  const errors = [...validateSite(body.site), ...validateBlog(body.blog)];
  if (errors.length) return NextResponse.json({ error: "Please fix the highlighted fields before publishing.", errors }, { status: 400 });

  const uploads: { path: string; sha: string }[] = Array.isArray(body.uploads) ? body.uploads : [];
  const deletions: string[] = Array.isArray(body.deletions) ? body.deletions : [];
  if (uploads.length > 50 || deletions.length > 200
    || uploads.some(u => typeof u?.path !== "string" || !UPLOAD_PATH_PATTERN.test(u.path) || typeof u.sha !== "string" || !/^[0-9a-f]{40}$/.test(u.sha))
    || deletions.some(d => typeof d !== "string" || !UPLOAD_PATH_PATTERN.test(d))) {
    return NextResponse.json({ error: "Invalid upload list." }, { status: 400 });
  }

  const siteText = JSON.stringify(body.site, null, 2) + "\n";
  const blogText = JSON.stringify(body.blog, null, 2) + "\n";

  try {
    for (let attempt = 0; attempt < 2; attempt++) {
      const ref = await github<{ object: { sha: string } }>(`/git/ref/heads/${encodeURIComponent(branch)}`);
      const headSha = ref.object.sha;
      const head = await github<{ tree: { sha: string } }>(`/git/commits/${headSha}`);

      // Refuse to overwrite content that changed on GitHub after the editor loaded it.
      const current = await github<{ tree: { path: string; sha: string }[] }>(`/git/trees/${head.tree.sha}?recursive=1`);
      const shaOf = (p: string) => current.tree.find(t => t.path === p)?.sha;
      const changed = [[SITE_PATH, body.siteSha], [BLOG_PATH, body.blogSha]].filter(([p, loaded]) => shaOf(p) && shaOf(p) !== loaded).map(([p]) => p);
      if (changed.length) {
        return NextResponse.json({ error: `${changed.join(" and ")} changed on GitHub since you opened the editor. Copy anything you need from the Raw JSON tab, then reload.` }, { status: 409 });
      }

      const existing = new Set((await listUploads()).map(u => u.path));
      const tree: TreeEntry[] = [];
      if (shaOf(SITE_PATH) !== gitBlobSha(siteText)) tree.push({ path: SITE_PATH, mode: "100644", type: "blob", content: siteText });
      if (shaOf(BLOG_PATH) !== gitBlobSha(blogText)) tree.push({ path: BLOG_PATH, mode: "100644", type: "blob", content: blogText });
      for (const u of uploads) tree.push({ path: u.path, mode: "100644", type: "blob", sha: u.sha });
      for (const d of deletions) if (existing.has(d) && !uploads.some(u => u.path === d)) tree.push({ path: d, mode: "100644", type: "blob", sha: null });
      if (!tree.length) return NextResponse.json({ ok: true, unchanged: true, siteSha: gitBlobSha(siteText), blogSha: gitBlobSha(blogText) });

      const newTree = await github<{ sha: string }>("/git/trees", { method: "POST", body: JSON.stringify({ base_tree: head.tree.sha, tree }) });
      const parts = [tree.some(t => t.path === SITE_PATH) && "site content", tree.some(t => t.path === BLOG_PATH) && "blog posts", uploads.length && `${uploads.length} upload(s)`, deletions.length && `${deletions.length} deletion(s)`].filter(Boolean);
      const commit = await github<{ sha: string; html_url: string }>("/git/commits", {
        method: "POST",
        body: JSON.stringify({ message: `Update ${parts.join(", ")} via admin CMS`, tree: newTree.sha, parents: [headSha] }),
      });
      try {
        await github(`/git/refs/heads/${encodeURIComponent(branch)}`, { method: "PATCH", body: JSON.stringify({ sha: commit.sha, force: false }) });
      } catch (e) {
        // The branch moved between reading and writing; rebuild the commit on the new head once.
        if (e instanceof GitHubError && e.status === 422 && attempt === 0) continue;
        throw e;
      }
      return NextResponse.json({ ok: true, commit: commit.sha, url: commit.html_url, siteSha: gitBlobSha(siteText), blogSha: gitBlobSha(blogText) });
    }
    return NextResponse.json({ error: "The branch kept changing. Please try again." }, { status: 409 });
  } catch (e) {
    return NextResponse.json({ error: errorMessage(e, "Publish failed.") }, { status: e instanceof GitHubError ? 502 : 500 });
  }
}
