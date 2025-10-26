import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // swcMinify: true,
  images: {
    domains: ["res.cloudinary.com"], // allows Cloudinary image rendering
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
  eslint: {
    ignoreDuringBuilds: true, // prevents CI/CD failures due to lint warnings
  },
};

export default nextConfig;
