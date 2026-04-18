import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /** Autorise des images jusqu’à 5 Mo dans les Server Actions (`createMeal`). */
  experimental: {
    serverActions: {
      bodySizeLimit: "6mb",
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/**",
      },
    ],
  },
};

export default nextConfig;
