import type { NextConfig } from "next";

const NORD =
  "https://midasfurniture.com/static/frontend/Brainvire/midasfurniture/en_US/fonts/nord";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  images: {
    remotePatterns: [{ protocol: "https", hostname: "midasfurniture.com" }],
  },
  async headers() {
    return [
      {
        source: "/embed",
        headers: [
          {
            key: "Content-Security-Policy",
            value:
              "frame-ancestors 'self' https://midasfurniture.com https://www.midasfurniture.com",
          },
        ],
      },
      {
        source: "/widget/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Cache-Control", value: "public, max-age=300" },
        ],
      },
    ];
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
