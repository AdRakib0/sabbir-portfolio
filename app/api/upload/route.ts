import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "../../../lib/server/auth";
import { UPLOAD_DIR, createBlob, errorMessage, listUploads, readBlob } from "../../../lib/server/github";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Vercel functions accept request bodies up to 4.5 MB, so the editor sends files in chunks.
// Each chunk is stored as a GitHub blob; "finalize" joins and validates them and creates the
// final blob. Nothing reaches the repository until /api/publish commits the blob into a tree.
const CHUNK_LIMIT = 3 * 1024 * 1024;
const MAX_CHUNKS = 5;
const TYPES = {
  jpg: { limit: 5 * 1024 * 1024, mime: "image/jpeg" },
  png: { limit: 5 * 1024 * 1024, mime: "image/png" },
  webp: { limit: 5 * 1024 * 1024, mime: "image/webp" },
  pdf: { limit: 10 * 1024 * 1024, mime: "application/pdf" },
} as const;
type Ext = keyof typeof TYPES;

// Identify the file from its first bytes rather than trusting the name or browser-supplied type.
function detect(bytes: Buffer): Ext | null {
  if (bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpg";
  if (bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "png";
  if (bytes.subarray(0, 4).toString("latin1") === "RIFF" && bytes.subarray(8, 12).toString("latin1") === "WEBP") return "webp";
  if (bytes.subarray(0, 5).toString("latin1") === "%PDF-") return "pdf";
  return null;
}

function sanitiseName(name: string) {
  const base = name.replace(/\.[^.]*$/, "");
  const clean = base.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60).replace(/-+$/, "");
  return clean || "file";
}

const mb = (n: number) => (n / 1024 / 1024).toFixed(0) + " MB";

export async function GET(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  try {
    return NextResponse.json({ files: await listUploads() });
  } catch (e) {
    return NextResponse.json({ error: errorMessage(e, "Could not list uploads.") }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  try {
    if ((req.headers.get("content-type") || "").startsWith("multipart/form-data")) {
      const form = await req.formData();
      const chunk = form.get("chunk");
      if (!(chunk instanceof Blob) || !chunk.size) return NextResponse.json({ error: "No file data received." }, { status: 400 });
      if (chunk.size > CHUNK_LIMIT) return NextResponse.json({ error: "Upload chunk too large." }, { status: 413 });
      const sha = await createBlob(Buffer.from(await chunk.arrayBuffer()).toString("base64"));
      return NextResponse.json({ sha });
    }

    const body = await req.json().catch(() => null);
    const chunks: unknown = body?.chunks;
    const name = typeof body?.name === "string" ? body.name : "";
    const size = Number(body?.size);
    if (!name || !Array.isArray(chunks) || !chunks.length || chunks.length > MAX_CHUNKS || chunks.some(c => typeof c !== "string" || !/^[0-9a-f]{40}$/.test(c))) {
      return NextResponse.json({ error: "Invalid upload request." }, { status: 400 });
    }
    const parts: Buffer[] = [];
    for (const sha of chunks as string[]) parts.push(await readBlob(sha));
    const file = Buffer.concat(parts);
    if (file.length !== size) return NextResponse.json({ error: "The upload was incomplete. Please try again." }, { status: 400 });
    const ext = detect(file);
    if (!ext) return NextResponse.json({ error: "Only JPG, PNG, WebP images and PDF files are allowed." }, { status: 415 });
    if (file.length > TYPES[ext].limit) {
      return NextResponse.json({ error: `${ext === "pdf" ? "PDFs" : "Images"} must be ${mb(TYPES[ext].limit)} or smaller.` }, { status: 413 });
    }
    const sha = chunks.length === 1 ? chunks[0] as string : await createBlob(file.toString("base64"));
    const fileName = `${Date.now()}-${sanitiseName(name)}.${ext}`;
    return NextResponse.json({ path: `${UPLOAD_DIR}/${fileName}`, name: fileName, url: `/uploads/${fileName}`, sha, size: file.length, mime: TYPES[ext].mime });
  } catch (e) {
    return NextResponse.json({ error: errorMessage(e, "Upload failed.") }, { status: 500 });
  }
}
