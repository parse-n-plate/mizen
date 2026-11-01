import type { NextConfig } from "next";

// Mizen is sunsetting: the getting-started, changelog and demo recipe pages are retired and
// send visitors to the sunset notice on the homepage. Temporary, so they can come back.
const RETIRED_PAGES = ["/homepage", "/get-started", "/changelog", "/recipes/:slug"];

const nextConfig: NextConfig = {
  devIndicators: false,
  async redirects() {
    return RETIRED_PAGES.map((source) => ({ source, destination: "/", permanent: false }));
  },
};

export default nextConfig;
