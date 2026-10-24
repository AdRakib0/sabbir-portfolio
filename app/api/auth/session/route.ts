import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, isValidSession, sessionExpiry } from "../../../../lib/server/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const value = req.cookies.get(SESSION_COOKIE)?.value;
  const authenticated = isValidSession(value);
  return NextResponse.json({ authenticated, expiresAt: authenticated ? sessionExpiry(value) : 0, configured: !!process.env.ADMIN_TOKEN });
}
