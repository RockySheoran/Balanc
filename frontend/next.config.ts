/** @format */
import type { NextConfig } from "next"
import withBundleAnalyzer from "@next/bundle-analyzer"

const nextConfig: NextConfig = {
  reactStrictMode: false,
  // Enable Incremental Static Regeneration (ISR) with Partial Prerendering

  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  compiler: {
    styledComponents: {
      // Enable better debugging and smaller production bundles
      ssr: true,
      displayName: true,
      fileName: false,
      pure: true,
      minify: true,
    },
    // Enable SWC for faster compilation (replaces Babel)
    emotion: true,
    removeConsole: process.env.NODE_ENV === "production",
  },

  experimental: {
    webVitalsAttribution: ["CLS", "LCP"],
    turbo: {
      rules: {
        "*.svg": {
          loaders: ["@svgr/webpack"],
        },
      },
    },
    // Enable worker threads for faster builds
    workerThreads: false, // Disable if causing issues
    // Enable granular chunks for better caching
  },

  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    minimumCacheTTL: 86400, // 1 day
    // Enable on-demand image optimization
    domains: process.env.IMAGE_DOMAINS?.split(",") || [],
    // Enable remote patterns if using external images
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.example.com",
      },
    ],
  },

  // Webpack optimizations
  webpack: (config) => {
    config.cache = false // Temporary fix for caching issues
    return config
  },

  // Enable production browser source maps
  productionBrowserSourceMaps: false,

  // Configure modularize imports for better tree-shaking
  modularizeImports: {
    "@heroicons/react/24/outline": {
      transform: "@heroicons/react/24/outline/{{member}}",
    },
    "lodash-es": {
      transform: "lodash-es/{{member}}",
    },
  },

  // Enable output file tracing for smaller Lambda functions
  output: "standalone",
}

export default withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
})(nextConfig)
