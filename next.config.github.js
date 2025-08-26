/** @type {import('next').NextConfig} */
const nextConfig = {
  // GitHub Pages static export configuration
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  // GitHub Pages configuration
  basePath: '/mingcare-intranet',
  assetPrefix: '/mingcare-intranet/',
  experimental: {
    missingSuspenseWithCSRBailout: false,
  }
}

module.exports = nextConfig
