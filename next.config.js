/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    domains: [],
  },
  async rewrites() {
    return [];
  },
};

module.exports = nextConfig;
