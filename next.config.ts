import type { NextConfig } from "next";

const projectBasePath = process.env.NODE_ENV === "production" ? "/ImperialWarRoom" : "";

const nextConfig: NextConfig = {
  output: "export",
  basePath: projectBasePath,
  assetPrefix: projectBasePath,
  cacheComponents: false,
  partialPrefetching: false,
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
