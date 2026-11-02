import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Produces a self-contained server bundle in .next/standalone for the Docker image.
  output: "standalone",
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
