import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  // Keeps the dev badge out of screenshots captured from the dev server.
  devIndicators: false,
  experimental: {
    // The on-disk Turbopack cache served stale CSS (old fonts and tokens) twice, in production
    // and in dev, with the Tailwind loader rule below. Correct output beats faster restarts.
    turbopackFileSystemCacheForBuild: false,
    turbopackFileSystemCacheForDev: false,
  },
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
