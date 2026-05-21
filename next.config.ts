import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingRoot: process.cwd(),
  experimental: {
    devtoolSegmentExplorer: false
  }
};

export default nextConfig;
