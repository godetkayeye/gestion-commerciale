import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: "standalone",
  experimental: {
    outputFileTracingIncludes: {
      "/**": [
        "./app/generated/prisma/**/*",
      ],
    },
  },
};

export default nextConfig;
