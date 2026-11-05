import type { NextConfig } from "next";
import { isMotionTuningBuild } from "./src/lib/motion-tuning";

const RETIRED_PAGES = ["/homepage", "/get-started", "/changelog", "/recipes/:slug"];

const nextConfig: NextConfig = {
  devIndicators: false,
  env: {
    // Inlined at build time: "true" only on Vercel preview/staging builds.
    MIZEN_MOTION_TUNING: isMotionTuningBuild(process.env) ? "true" : "false",
  },
  async redirects() {
    return RETIRED_PAGES.map((source) => ({ source, destination: "/", permanent: false }));
  },
};

export default nextConfig;
