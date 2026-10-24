import { NextRequest, NextResponse } from "next/server";
import siteJson from "../../../content/site.json";
import blogJson from "../../../content/blog.json";
import { requireAdmin } from "../../../lib/server/auth";
import { BLOG_PATH, SITE_PATH, errorMessage, gitBlobSha, readRepoFile } from "../../../lib/server/github";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Loads the latest content from GitHub (falling back to the deployed files) for the admin editor.
// Publishing happens through /api/publish.
export async function GET(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  let warning = "";
  async function load(file: string, deployed: unknown) {
    try {
      const remote = await readRepoFile(file);
      if (remote) return remote;
    } catch (e) {
      warning = "Could not reach GitHub (" + errorMessage(e, "unknown error") + "). Showing the deployed copy.";
    }
    const text = JSON.stringify(deployed, null, 2) + "\n";
    return { text, sha: gitBlobSha(text) };
  }
  try {
    const [site, blog] = await Promise.all([load(SITE_PATH, siteJson), load(BLOG_PATH, blogJson)]);
    return NextResponse.json({ site: JSON.parse(site.text), blog: JSON.parse(blog.text), siteSha: site.sha, blogSha: blog.sha, warning });
  } catch (e) {
    return NextResponse.json({ error: errorMessage(e, "Could not load content.") }, { status: 500 });
  }
}
