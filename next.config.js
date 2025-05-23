/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Ensure we're using the App Router
  experimental: {
    // Any experimental features can go here
  },
  // Added from next.config.ts
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
    ],
  },
  // Disable TypeScript build errors
  typescript: {
    ignoreBuildErrors: true,
  },
  // Disable ESLint during builds
  eslint: {
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig 