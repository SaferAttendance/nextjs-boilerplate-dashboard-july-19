import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true, // ✅ Keep strict mode for catching issues
  experimental: {
    appDir: true,        // ✅ Explicitly enable App Router (app/)
  },
  output: "standalone",  // ✅ Optimize Vercel build for serverless
};

export default nextConfig;
