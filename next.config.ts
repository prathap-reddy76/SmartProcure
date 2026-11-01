import type { NextConfig } from "next";

const securityHeaders = [
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
    value: "geolocation=(self), microphone=(self), camera=(self)",
  }
];

const nextConfig: NextConfig = {
  reactCompiler: true,
  output: 'standalone',
  allowedDevOrigins: [
    "localhost:3000",
    "*.localhost:3000",
    "delivery.localhost:3000",
    "officer.localhost:3000",
  ],
  experimental: {
    cpus: 2,
    workerThreads: false,
    serverActions: {
      allowedOrigins: [
        "localhost:3000",
        "*.localhost:3000",
        "delivery.localhost:3000",
        "officer.localhost:3000",
      ],
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;

