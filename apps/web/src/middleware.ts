import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isAuthPage = req.nextUrl.pathname.startsWith("/login");
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
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|manifest.json|icons|s/.*).*)"],
};
