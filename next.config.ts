import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  api: {
    bodyParser: {
      sizeLimit: '25mb',
    },
    responseLimit: '25mb',
  },
};
export default nextConfig;
