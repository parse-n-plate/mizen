import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  env: {
    NEXT_PUBLIC_APP_ENV: process.env.APP_ENV,
    NEXT_PUBLIC_ENABLE_DEV_SIGNIN: process.env.ENABLE_DEV_SIGNIN,
  },
};

export default nextConfig;
