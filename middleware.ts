import { NextRequest, NextResponse } from "next/server";

const ALLOWED = [
  "/maintenance",
  "/favicon.ico",
  "/robots.txt",
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Pass through static assets and the maintenance page itself
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    ALLOWED.includes(pathname)
  ) {
    return NextResponse.next();
  }

  return NextResponse.redirect(new URL("/maintenance", req.url));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
