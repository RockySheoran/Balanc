/** @format */
import type { NextConfig } from "next"
import  withBundleAnalyzer  from "@next/bundle-analyzer"

const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
})

const nextConfig: NextConfig = {
  reactStrictMode: true, // Recommended to keep true for development
  swcMinify: true,
  compiler: {
    styledComponents: {
      ssr: true,
      displayName: true,
      pure: true,
    },
    removeConsole: process.env.NODE_ENV === "production",
  },
  experimental: {
    optimizePackageImports: ["@radix-ui/react-*"],
    webVitalsAttribution: ["CLS", "LCP"],
    turbo: {
      rules: {
        "*.svg": {
          loaders: ["@svgr/webpack"],
          as: "react",
        },
      },
    },
    // Modern optimizations
    useLightningcss: true,
   
  
  },
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 3600, // Increased from 60 to 1 hour
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**", // Adjust this to your specific domains
      },
    ],
  },
  headers: async () => [
    {
      source: "/(.*)",
      headers: [
        {
          key: "X-DNS-Prefetch-Control",
          value: "on",
        },
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
        {
          key: "X-XSS-Protection",
          value: "1; mode=block",
        },
      ],
    },
  ],
  webpack: (config, context) => {
    // Important: return the modified config
    if (!context.isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      }
    }

    // Add your custom webpack configurations here
    config.module.rules.push({
      test: /\.svg$/i,
      issuer: /\.[jt]sx?$/,
      use: ["@svgr/webpack"],
    })

    return config
  },
}

export default bundleAnalyzer(nextConfig)
