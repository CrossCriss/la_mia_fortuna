import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { ADMIN_SESSION_COOKIE, verifySessionToken } from "@/lib/admin-session";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAdminPage = pathname.startsWith("/admin") && pathname !== "/admin/login";
  const isAdminApi = pathname.startsWith("/api/admin") && pathname !== "/api/admin/login";

  if (isAdminPage || isAdminApi) {
    const secret = process.env.ADMIN_SESSION_SECRET;
    const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    const email = secret ? await verifySessionToken(token, secret) : null;

    if (email) {
      return NextResponse.next();
    }

    if (isAdminApi) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Кабінет клієнта: /account/login лишається публічним (форма входу/реєстрації),
  // решта /account/* потребує NextAuth-сесії.
  const isAccountPage = pathname.startsWith("/account") && pathname !== "/account/login";
  if (isAccountPage) {
    const session = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (session) {
      return NextResponse.next();
    }

    const loginUrl = new URL("/account/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*", "/account/:path*"],
};
