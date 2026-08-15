import type { NextConfig } from "next";

// Supabase Storage public host (for seller-uploaded product images).
const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

const nextConfig: NextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      // Seed/demo product images.
      { protocol: 'https', hostname: 'picsum.photos' },
      // Seller-uploaded images in the public Storage bucket.
      ...(supabaseHost
        ? [{ protocol: 'https' as const, hostname: supabaseHost, pathname: '/storage/v1/object/public/**' }]
        : []),
    ],
  },
};

export default nextConfig;
