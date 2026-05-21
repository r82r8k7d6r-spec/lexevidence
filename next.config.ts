import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActionsBodySizeLimit: "30mb",
  },
};

export default nextConfig;
