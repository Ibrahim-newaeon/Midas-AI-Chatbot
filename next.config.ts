import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "midasfurniture.com" },
    ],
  },
};

export default nextConfig;
