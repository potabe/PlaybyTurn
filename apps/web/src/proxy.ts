import { auth } from '@/lib/auth/server';

export default auth.middleware();

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|manifest.json|icons|s/.*).*)"],
};
