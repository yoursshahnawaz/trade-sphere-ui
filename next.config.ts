import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    // Seed/demo product images.
    remotePatterns: [{ protocol: 'https', hostname: 'picsum.photos' }],
  },
};

export default nextConfig;
