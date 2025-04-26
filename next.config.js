/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable TypeScript type checking on production build
  typescript: {
    ignoreBuildErrors: true,
  },
  // Disable ESLint during builds
  eslint: {
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig 