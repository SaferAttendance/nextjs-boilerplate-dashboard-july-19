// app/api/session/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";

type Body = { idToken: string; rememberMe?: boolean };

function firstString(...vals: any[]): string {
  for (const v of vals) {
    if (v === null || v === undefined) continue;
    if (typeof v === "string" && v.trim().length > 0) return v;
    if (typeof v === "number" || typeof v === "boolean") return String(v);
  }
  return "";
}

// ---- POST: create cookies
export async function POST(request: NextRequest) {
  try {
    const { idToken, rememberMe = false }: Body = await request.json();
    const adminAuth = getAdminAuth();

    const decoded = await adminAuth.verifyIdToken(idToken);

    if (decoded.email && decoded.email_verified === false) {
      return NextResponse.json({ error: "Email not verified" }, { status: 403 });
    }

    // Note: ID tokens expire ~1 hour, but we keep your existing behavior for compatibility.
    const maxAge = rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 4; // 30d vs 4h

    const res = NextResponse.json({ success: true });

    // ✅ Keep existing contract: token cookie contains the Firebase ID token
    res.cookies.set("token", idToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge,
    });

    // ✅ Add a *separate* Firebase session cookie for later migration (does not break anything now)
    // If this fails (misconfig), we still allow login because token=idToken is set.
    try {
      const expiresIn = maxAge * 1000;
      const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

      res.cookies.set("sa_session", sessionCookie, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge,
      });
    } catch (e) {
      console.warn("createSessionCookie failed (continuing with idToken cookie):", e);
    }

    // convenience email cookie (non-httpOnly)
    if (decoded.email) {
      res.cookies.set("email", decoded.email, {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge,
      });
    }

    return res;
  } catch (error) {
    console.error("POST /api/session error:", error);
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
}

// ---- GET and DELETE: keep your existing code as-is,
// BUT add clearing of sa_session in DELETE (shown below)

// ---- DELETE: clear session + all profile cookies
export async function DELETE() {
  const res = NextResponse.json({ success: true });
  const base = {
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
  };

  res.cookies.set("token", "", { ...base, httpOnly: true, maxAge: 0 });
  res.cookies.set("sa_session", "", { ...base, httpOnly: true, maxAge: 0 });

  [
    "full_name",
    "fullname",
    "district_code",
    "school_code",
    "email",
    "role",
    "sub_assigned",
    "phone_id",
  ].forEach((k) => res.cookies.set(k, "", { ...base, httpOnly: false, maxAge: 0 }));

  return res;
}
