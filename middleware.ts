import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Edge-runtime middleware to protect any /dashboard/* route.
 * 1.  Looks for the `firebaseToken` cookie set by /api/session
 * 2.  Verifies the token with Firebase Admin
 * 3.  Calls Xano to confirm the user is an admin
 *
 * If any step fails, the user is redirected to login (or /unauthorized).
 */
import { auth } from "@/lib/firebaseClient";   // your client-side Firebase init

export async function middleware(req: NextRequest) {
  const token = req.cookies.get("firebaseToken")?.value;

  /* ──────────────────────────────
     1. Must be logged in to reach /dashboard/*
     ────────────────────────────── */
  if (!token && req.nextUrl.pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  /* ──────────────────────────────
     2. Verify Firebase ID token
     ────────────────────────────── */
  let decoded: { email?: string } | null = null;
  try {
    decoded = await auth.verifyIdToken(token!);
  } catch (_) {
    // Bad token → sign-in required
    return NextResponse.redirect(new URL("/", req.url));
  }

  /* ──────────────────────────────
     3. Look up role in Xano
     ────────────────────────────── */
  try {
    const xanoBase = process.env.NEXT_PUBLIC_XANO_BASE;   // ← set this in Vercel
    const res = await fetch(
      `${xanoBase}/admin_dashboard_userDetails?email=${encodeURIComponent(
        decoded?.email ?? ""
      )}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        // Edge fetch defaults to GET; Xano “get by email” endpoint is GET
      }
    );

    // If Xano says “not found” or “non-admin”, block the user
    const data = await res.json();
    if (data?.role !== "admin") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }
  } catch (err) {
    console.error("Xano role check failed:", err);
    // Fail closed → force login
    return NextResponse.redirect(new URL("/", req.url));
  }

  /* ──────────────────────────────
     4. Allow request through
     ────────────────────────────── */
  return NextResponse.next();
}

/* Run on every /dashboard route (and anything you add below) */
export const config = {
  matcher: ["/dashboard/:path*"],
};
