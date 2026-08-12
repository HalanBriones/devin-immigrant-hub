import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Post/comment forms upload images through server actions.
    serverActions: { bodySizeLimit: "25mb" },
  },
};

export default nextConfig;
