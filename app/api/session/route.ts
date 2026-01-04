// app/api/session/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getAdminAuth } from "@/lib/firebaseAdmin"

export const runtime = "nodejs"

type Body = { idToken: string; rememberMe?: boolean }

function firstString(...vals: any[]): string {
  for (const v of vals) {
    if (v === null || v === undefined) continue
    if (typeof v === "string" && v.trim().length > 0) return v
    if (typeof v === "number" || typeof v === "boolean") return String(v)
  }
  return ""
}

function secondsUntilExp(decoded: any): number {
  const now = Math.floor(Date.now() / 1000)
  const exp = typeof decoded?.exp === "number" ? decoded.exp : null
  if (!exp) return 0
  return Math.max(0, exp - now)
}

// ---- POST: create session cookie (NOT idToken)
export async function POST(request: NextRequest) {
  try {
    const { idToken, rememberMe = false }: Body = await request.json()

    const adminAuth = getAdminAuth()

    // Verify the ID token once
    const decoded = await adminAuth.verifyIdToken(idToken)

    if (decoded.email && decoded.email_verified === false) {
      return NextResponse.json({ error: "Email not verified" }, { status: 403 })
    }

    // Create a Firebase session cookie with desired duration
    const maxAge = rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 4 // 30d vs 4h
    const expiresIn = maxAge * 1000

    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn })

    const res = NextResponse.json({ success: true })

    // ✅ httpOnly session cookie (stable for maxAge)
    res.cookies.set("token", sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge,
    })

    // convenience email cookie (non-httpOnly)
    if (decoded.email) {
      res.cookies.set("email", decoded.email, {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge,
      })
    }

    return res
  } catch (error) {
    console.error("POST /api/session error:", error)
    return NextResponse.json({ error: "Invalid token" }, { status: 401 })
  }
}

// ---- GET: hydrate profile cookies from /api/verify endpoint
export async function GET(request: NextRequest) {
  try {
    const adminAuth = getAdminAuth()

    const token = request.cookies.get("token")?.value
    if (!token) return NextResponse.json({ error: "No session" }, { status: 401 })

    // ✅ Verify the session cookie
    // Fallback to verifyIdToken for a short transition period (optional but helpful)
    let decoded: any
    try {
      decoded = await adminAuth.verifySessionCookie(token, false)
    } catch {
      decoded = await adminAuth.verifyIdToken(token)
    }

    const email = decoded.email || request.cookies.get("email")?.value
    if (!email) return NextResponse.json({ error: "No email" }, { status: 400 })

    // Call our own /api/verify endpoint instead of calling Xano directly
    const baseUrl = request.nextUrl.origin
    const verifyUrl = `${baseUrl}/api/verify?email=${encodeURIComponent(email)}`

    const r = await fetch(verifyUrl, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    })

    if (!r.ok) {
      const out = await r.text().catch(() => "")
      console.warn("Verify endpoint failed:", r.status, out)
      return NextResponse.json({ error: "Verify failed" }, { status: 502 })
    }

    const data = await r.json()

    const full_name = firstString(data.full_name)
    const district_code = firstString(data.district_code)
    const school_code = firstString(data.school_code)
    const role = firstString(data.role)
    const sub_assigned = firstString(data.sub_assigned)
    const phone_id = firstString(data.Phone_ID)

    const res = NextResponse.json({
      success: true,
      profile: { full_name, district_code, school_code, role, sub_assigned, phone_id, email },
    })

    // ✅ Make profile cookies not outlive the auth session
    const remaining = secondsUntilExp(decoded)
    const maxAge = remaining > 0 ? Math.min(remaining, 60 * 60 * 24 * 7) : 60 * 60 // fallback 1h

    const cookieOpts = {
      httpOnly: false as const,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: "/",
      maxAge,
    }

    if (full_name) {
      res.cookies.set("full_name", full_name, cookieOpts)
      res.cookies.set("fullname", full_name, cookieOpts) // legacy alias
    }
    if (district_code) res.cookies.set("district_code", district_code, cookieOpts)
    if (school_code) res.cookies.set("school_code", school_code, cookieOpts)
    if (role) res.cookies.set("role", role, cookieOpts)
    if (sub_assigned) res.cookies.set("sub_assigned", sub_assigned, cookieOpts)
    if (phone_id) res.cookies.set("phone_id", phone_id, cookieOpts)
    res.cookies.set("email", email, cookieOpts)

    return res
  } catch (e) {
    console.error("GET /api/session error:", e)
    return NextResponse.json({ error: "Session hydrate failed" }, { status: 500 })
  }
}

// ---- DELETE: clear session + all profile cookies
export async function DELETE() {
  const res = NextResponse.json({ success: true })
  const base = {
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
  }

  res.cookies.set("token", "", { ...base, httpOnly: true, maxAge: 0 })

  ;[
    "full_name",
    "fullname",
    "district_code",
    "school_code",
    "email",
    "role",
    "sub_assigned",
    "phone_id",
  ].forEach((k) => res.cookies.set(k, "", { ...base, httpOnly: false, maxAge: 0 }))

  return res
}
