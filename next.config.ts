import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  // Keeps the dev badge out of screenshots captured from the dev server.
  devIndicators: false,
  experimental: {
    // A restored build cache once shipped stale CSS (old fonts and tokens) to production.
    // Correct output beats a faster build here.
    turbopackFileSystemCacheForBuild: false,
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
