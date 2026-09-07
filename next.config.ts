import type { NextConfig } from "next";

const NORD =
  "https://midasfurniture.com/static/frontend/Brainvire/midasfurniture/en_US/fonts/nord";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  images: {
    remotePatterns: [{ protocol: "https", hostname: "midasfurniture.com" }],
  },
  async rewrites() {
    return [
      {
        source: "/brand-fonts/nord/:file",
        destination: `${NORD}/:file`,
      },
      {
        source: "/:store/:slug.html",
        destination: "/:store/:slug",
      },
    ];
  },
};

export default nextConfig;
