import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActionsBodySizeLimit: '100mb',
  },
  api: {
    bodyParser: {
      sizeLimit: '100mb',
    },
    responseLimit: '100mb',
  },
};

export default nextConfig;
