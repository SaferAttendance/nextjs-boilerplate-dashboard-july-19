import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // ✅ Your app sets httpOnly cookie "token" in POST /api/session
  const token = req.cookies.get("token")?.value

  const isProtected =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/landing") ||
    pathname.startsWith("/teacher-search")

  if (isProtected && !token) {
    const loginUrl = new URL("/admin/login", req.url)
    loginUrl.searchParams.set("next", pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*", "/landing", "/teacher-search"],
}
