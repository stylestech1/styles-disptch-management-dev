import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const token = req.cookies.get("token");
  const userRole = req.cookies.get("userRole")?.value;
  const pathname = req.nextUrl.pathname;

  const isAdminRoute = pathname.startsWith("/admin");
  const isManagerRoute = pathname.startsWith("/manager");
  const isEmployeeRoute = pathname.startsWith("/users");

  // Redirect to login if no token
  if ((isAdminRoute || isManagerRoute || isEmployeeRoute) && !token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Verify manager role for manager routes
  if (isManagerRoute && userRole !== "manager") {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Verify admin role for admin routes
  if (isAdminRoute && userRole !== "admin") {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/manager/:path*", "/users/:path*"],
};
