/** @format */
import type { NextConfig } from "next"
import withBundleAnalyzer from "@next/bundle-analyzer"

const nextConfig: NextConfig = {
  reactStrictMode: false,
  ppr: "incremental",
  compiler: {
    styledComponents: true,
  },
  experimental: {
    useLightningcss: true,

    ppr: true,
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
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    minimumCacheTTL: 86400, // 1 day
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
