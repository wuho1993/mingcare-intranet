/** @type {import('next').NextConfig} */
const nextConfig = {
  // Local development configuration (without basePath)
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  // No basePath for local testing
  experimental: {
    missingSuspenseWithCSRBailout: false,
  }
}

module.exports = nextConfig