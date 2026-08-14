import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Temporary: seed product images (Phase 3 will supply real/optimized assets).
    remotePatterns: [{ protocol: 'https', hostname: 'picsum.photos' }],
  },
};

export default nextConfig;
