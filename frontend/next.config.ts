/** @format */
import type { NextConfig } from "next"
import withBundleAnalyzer from "@next/bundle-analyzer"

const nextConfig: NextConfig = {
  reactStrictMode: false,
  // Enable Incremental Static Regeneration (ISR) with Partial Prerendering
  ppr: "incremental",
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
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
    // Use Lightning CSS for faster CSS processing
    // useLightningcss: true,
    // Enable Partial Prerendering
    ppr: true,
    // Modern optimizations
    optimizePackageImports: [
      "@radix-ui/react-*",
      "lodash-es",
      "date-fns",
      "@heroicons/react",
    ],
    // Turbopack specific settings
    webVitalsAttribution: ["CLS", "LCP"],
    turbo: {
      rules: {
        "*.svg": {
          loaders: ["@svgr/webpack"],
        },
      },
    },
    // Enable worker threads for faster builds
    workerThreads: true,
    // Enable granular chunks for better caching
    granularChunks: true,
    // // Modern browser optimizations
    modern: true,
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
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Only add these optimizations in production
    if (!dev) {
      // Enable persistent caching
      config.cache = {
        type: "filesystem",
        buildDependencies: {
          config: [__filename],
        },
      }

      // Optimize moment.js locales
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /^\.\/locale$/,
          contextRegExp: /moment$/,
        })
      )
    }

    // Important: return the modified config
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
