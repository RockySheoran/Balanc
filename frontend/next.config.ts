/** @format */
import type { NextConfig } from "next"
import withBundleAnalyzer from "@next/bundle-analyzer"

const nextConfig: NextConfig = {
  reactStrictMode: true,
  compiler: {
    styledComponents: true,
  },
  experimental: {
    // Modern optimizations (Turbopack compatible)
    optimizePackageImports: ["@radix-ui/react-*"],
    // Turbopack specific settings
    turbo: {
      rules: {
        "*.svg": {
          loaders: ["@svgr/webpack"],
        },
      },
    },
  },
  images: {
    domains: [],
  },
  // Middleware configuration
  middleware: {
    path: "./src/middleware.ts",
    enabled: true,
  },
  // Webpack optimizations (compatible with Turbopack)
  webpack: (config) => {
    config.cache = true
    return config
  },
}

export default withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
})(nextConfig)
