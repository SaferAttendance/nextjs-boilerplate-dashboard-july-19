import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,   // ✅ Keep strict mode for catching issues
  output: "standalone",    // ✅ Optimize Vercel build for serverless

  // **No more experimental.appDir** — Next 15+ enables the App Router by default.
};

export default nextConfig;
