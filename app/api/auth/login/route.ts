import { NextRequest, NextResponse } from "next/server";
import { checkPassword, clearLoginFailures, clientIp, createSessionValue, loginBlockedFor, recordLoginFailure, sessionExpiry, setSessionCookie } from "../../../../lib/server/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!process.env.ADMIN_TOKEN) return NextResponse.json({ error: "Admin login is not configured. Add ADMIN_TOKEN in Vercel." }, { status: 503 });
  const ip = clientIp(req);
  const blocked = loginBlockedFor(ip);
  if (blocked) return NextResponse.json({ error: `Too many failed attempts. Try again in ${Math.ceil(blocked / 60)} minute(s).` }, { status: 429, headers: { "Retry-After": String(blocked) } });
  const body = await req.json().catch(() => null);
  const password = body && typeof body.password === "string" ? body.password : "";
  if (!password || !checkPassword(password)) {
    recordLoginFailure(ip);
    await new Promise(r => setTimeout(r, 700));
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  }
  clearLoginFailures(ip);
  const value = createSessionValue();
  const res = NextResponse.json({ ok: true, expiresAt: sessionExpiry(value) });
  setSessionCookie(res, value);
  return res;
}
