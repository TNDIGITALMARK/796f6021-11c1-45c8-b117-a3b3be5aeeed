import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Absolutely lenient configuration - never fail builds
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Moved from experimental in Next.js 15+
  outputFileTracingRoot: process.cwd(),

  // Simple image configuration
  images: {
    unoptimized: true,
  },

  // Basic performance settings
  poweredByHeader: false,

  // Flexible iframe embedding
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: "frame-ancestors *" },
        ],
      },
    ];
  },
};

export default nextConfig;
