import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    appDir: true, // ✅ Enable /app directory routing
  },
};

export default nextConfig;
