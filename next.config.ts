import type { NextConfig } from "next";

// Mizen is sunsetting: the marketing pages are retired and send visitors to the sunset
// notice on the homepage. Temporary redirects, so they can come back if Mizen does.
const RETIRED_PAGES = [
  "/homepage",
  "/get-started",
  "/changelog",
  "/faq",
  "/links",
  "/recipes/:slug",
];

const nextConfig: NextConfig = {
  devIndicators: false,
  async redirects() {
    return RETIRED_PAGES.map((source) => ({ source, destination: "/", permanent: false }));
  },
};

export default nextConfig;
