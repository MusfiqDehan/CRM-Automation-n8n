import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  skipTrailingSlashRedirect: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },
  async rewrites() {
    const backendInternal =
      process.env.BACKEND_INTERNAL_URL || "http://backend:8017";

    return [
      {
        source: "/api/v1/:path*/",
        destination: `${backendInternal}/api/v1/:path*/`,
      },
      {
        source: "/api/v1/:path*",
        destination: `${backendInternal}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
