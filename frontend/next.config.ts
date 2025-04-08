/** @format */
import type { NextConfig } from "next"
import withBundleAnalyzer from "@next/bundle-analyzer"

const nextConfig: NextConfig = {
  reactStrictMode: true,
  ppr: "incremental",
  compiler: {
    styledComponents: true,
  },
  experimental: {
    useLightningcss: true,
    useCache: true,
    // Modern optimizations (Turbopack compatible)
    optimizePackageImports: ["@radix-ui/react-*"],
    // Turbopack specific settings
    webVitalsAttribution: ["CLS", "LCP"],
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
  webpack: (
    config,
    { buildId, dev, isServer, defaultLoaders, nextRuntime, webpack }
  ) => {
    // Important: return the modified config
    return config
  },
}

export default withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
})(nextConfig)
