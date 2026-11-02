import type { NextConfig } from "next";

const RETIRED_PAGES = ["/homepage", "/get-started", "/changelog", "/recipes/:slug"];

const nextConfig: NextConfig = {
  devIndicators: false,
  async redirects() {
    return RETIRED_PAGES.map((source) => ({ source, destination: "/", permanent: false }));
  },
};

export default nextConfig;
