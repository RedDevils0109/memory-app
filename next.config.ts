import type { NextConfig } from "next";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || undefined;

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  images: { unoptimized: true },
  reactStrictMode: true,
  turbopack: { root: process.cwd() },
};

export default nextConfig;
