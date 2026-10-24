import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

export const SESSION_COOKIE = "admin_session";
export const SESSION_SECONDS = 8 * 60 * 60;

function secret() {
  const token = process.env.ADMIN_TOKEN;
  if (!token) throw new Error("Admin login is not configured. Add ADMIN_TOKEN in Vercel.");
  // Derive a separate signing key so the cookie never carries anything usable as the password.
  return createHmac("sha256", token).update("portfolio-admin-session-v1").digest();
}

function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

function safeEqual(a: string, b: string) {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

export function checkPassword(password: string) {
  const expected = process.env.ADMIN_TOKEN;
  if (!expected) throw new Error("Admin login is not configured. Add ADMIN_TOKEN in Vercel.");
  return safeEqual(password, expected);
}

export function createSessionValue() {
  const payload = `${Date.now() + SESSION_SECONDS * 1000}.${randomBytes(12).toString("base64url")}`;
  return `${payload}.${sign(payload)}`;
}

export function isValidSession(value: string | undefined) {
  if (!value || !process.env.ADMIN_TOKEN) return false;
  const parts = value.split(".");
  if (parts.length !== 3) return false;
  const payload = parts[0] + "." + parts[1];
  if (!safeEqual(parts[2], sign(payload))) return false;
  const expires = Number(parts[0]);
  return Number.isFinite(expires) && expires > Date.now();
}

export function sessionExpiry(value: string | undefined) {
  return value ? Number(value.split(".")[0]) || 0 : 0;
}

export function setSessionCookie(res: NextResponse, value: string) {
  res.cookies.set(SESSION_COOKIE, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_SECONDS,
  });
}

export function clearSessionCookie(res: NextResponse) {
  res.cookies.set(SESSION_COOKIE, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: 0 });
}

// Returns an error response when the request is not from a signed-in admin, otherwise null.
export function requireAdmin(req: NextRequest): NextResponse | null {
  const origin = req.headers.get("origin");
  if (origin && req.method !== "GET") {
    const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
    try { if (new URL(origin).host !== host) return NextResponse.json({ error: "Cross-site request blocked." }, { status: 403 }); }
    catch { return NextResponse.json({ error: "Cross-site request blocked." }, { status: 403 }); }
  }
  if (!isValidSession(req.cookies.get(SESSION_COOKIE)?.value)) {
    return NextResponse.json({ error: "Your session has expired. Please sign in again." }, { status: 401 });
  }
  return null;
}

// Failed-login limiter. In-memory, so it is per server instance: it slows brute force
// without needing a database, but is not a global counter across all Vercel instances.
const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 5;
const failures = new Map<string, { count: number; first: number }>();

export function clientIp(req: NextRequest) {
  return (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || req.headers.get("x-real-ip") || "unknown";
}

export function loginBlockedFor(ip: string) {
  const entry = failures.get(ip);
  if (!entry) return 0;
  const remaining = entry.first + WINDOW_MS - Date.now();
  if (remaining <= 0) { failures.delete(ip); return 0; }
  return entry.count >= MAX_FAILURES ? Math.ceil(remaining / 1000) : 0;
}

export function recordLoginFailure(ip: string) {
  const now = Date.now();
  const entry = failures.get(ip);
  if (!entry || entry.first + WINDOW_MS < now) failures.set(ip, { count: 1, first: now });
  else entry.count++;
  if (failures.size > 5000) failures.clear();
}

export function clearLoginFailures(ip: string) {
  failures.delete(ip);
}
