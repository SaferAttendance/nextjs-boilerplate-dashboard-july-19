import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(req: NextRequest) {
  const token = req.cookies.get("firebaseToken")?.value

  // If no token and accessing protected route, redirect to login
  if (!token && req.nextUrl.pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/", req.url))
  }

  try {
    // Call Xano to validate role
    const xanoRes = await fetch(
      `https://your-xano.com/admin_dashboard_userDetails`, // Replace with your actual endpoint
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    )

    const userData = await xanoRes.json()

    if (userData.role !== "admin") {
      return NextResponse.redirect(new URL("/unauthorized", req.url))
    }

    // Authenticated and authorized
    return NextResponse.next()
  } catch (err) {
    console.error("Middleware Auth Error:", err)
    return NextResponse.redirect(new URL("/", req.url))
  }
}

export const config = {
  matcher: ["/dashboard/:path*", "/landing", "/teacher-search"],
}

