export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    "/admin/:path*",
    "/pharmacie/:path*",
    "/restaurant/:path*",
    "/comptable/:path*",
  ],
};


