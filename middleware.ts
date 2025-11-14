import { withAuth } from "next-auth/middleware";

export default withAuth({
  callbacks: {
    authorized({ token, req }) {
      // Allow access to authenticated users
      return !!token;
    },
  },
});

export const config = {
  matcher: [
    "/admin/:path*",
    "/pharmacie/:path*",
    "/restaurant/:path*",
    "/comptable/:path*",
  ],
};


