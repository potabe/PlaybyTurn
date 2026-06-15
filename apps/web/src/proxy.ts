import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const isLoggedIn = req.cookies.has("better-auth.session_token") || 
                     req.cookies.has("__Secure-better-auth.session_token") || 
                     req.cookies.has("neon-auth.session_token") ||
                     req.cookies.has("__Secure-neon-auth.session_token");
  
  const isAuthPage = req.nextUrl.pathname.startsWith("/login") || req.nextUrl.pathname.startsWith("/signup");
  const isProtectedPage = req.nextUrl.pathname.startsWith("/dashboard") || 
                          req.nextUrl.pathname.startsWith("/sessions") || 
                          req.nextUrl.pathname.startsWith("/profile") ||
                          req.nextUrl.pathname.startsWith("/stats");

  if (isAuthPage && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  if (isProtectedPage && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|manifest.json|icons|s/.*).*)"],
};
