/** @format */
import type { NextConfig } from "next"
import withBundleAnalyzer from "@next/bundle-analyzer"

const nextConfig: NextConfig = {
  reactStrictMode: true, // Recommended to keep true for development
  trailingSlash: false,
  productionBrowserSourceMaps: false, // Disable for production

  // Build optimizations
  typescript: {
    ignoreBuildErrors: true, // Only ignore in dev
  },
  eslint: {
    ignoreDuringBuilds: true, // Only ignore in dev
  },

  // Compiler optimizations
  compiler: {
    styledComponents: {
      ssr: true, // Enable for SSR support
      displayName: true,
      fileName: false,
      pure: true,
      minify: true,
      cssProp: true,
    },
    emotion: true,
    removeConsole: {
      exclude: ["error"], // Keep errors in production
    },
    reactRemoveProperties: process.env.NODE_ENV === "production",
  },

  // Experimental features
  experimental: {
    webVitalsAttribution: ["CLS", "LCP", "FID", "FCP", "TTFB"],
    turbo: {
      rules: {
        "*.svg": {
          loaders: ["@svgr/webpack"],
          as: "*.svg",
        },
      },
    },
    optimizePackageImports: ["lodash-es", "@heroicons/react", "date-fns"],
    optimizeServerReact: true,
    optimizeCss: true,

    proxyTimeout: 30000, // 30 seconds for API routes
  },

  // Image optimizations
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2560],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 86400, // 1 day
    domains: process.env.IMAGE_DOMAINS?.split(",").filter(Boolean) || [],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.example.com",
        port: "",
        pathname: "/**",
      },
    ],
    dangerouslyAllowSVG: false,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    unoptimized: process.env.NODE_ENV === "development", // Disable optimization in dev
  },

  // Webpack optimizations
  webpack: (config, { isServer, dev }) => {
    // Only cache in production
    config.cache = !dev && {
      type: "filesystem",
      cacheDirectory: `${process.cwd()}/.next/cache/webpack`,
      buildDependencies: {
        config: [__filename],
      },
    }

    // Split chunks strategy
    config.optimization.splitChunks = {
      chunks: "all",
      maxSize: 244 * 1024, // 244KB
      cacheGroups: {
        defaultVendors: {
          test: /[\\/]node_modules[\\/]/,
          priority: -10,
          reuseExistingChunk: true,
        },
        default: {
          minChunks: 2,
          priority: -20,
          reuseExistingChunk: true,
        },
      },
    }

    return config
  },

  // Modular imports for better tree-shaking
  modularizeImports: {
    "@heroicons/react/24/outline": {
      transform: "@heroicons/react/24/outline/{{member}}",
      skipDefaultConversion: true,
    },
    "lodash-es": {
      transform: "lodash-es/{{member}}",
      preventFullImport: true,
    },
  },

  // Output configuration
  output: "standalone",

  // HTTP headers for security
  headers: async () => {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ]
  },

  // Enable PWA in production
  ...(process.env.NODE_ENV === "production" && {
    pwa: {
      dest: "public",
      register: true,
      skipWaiting: true,
      disable: process.env.NODE_ENV === ("development" as string),
    },
  }),
}

export default withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
})(nextConfig)
