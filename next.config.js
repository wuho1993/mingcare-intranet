/** @type {import('next').NextConfig} */
const nextConfig = {
  // Development mode configuration
  images: {
    unoptimized: true
  },
  experimental: {
    missingSuspenseWithCSRBailout: false,
  }
}

module.exports = nextConfig