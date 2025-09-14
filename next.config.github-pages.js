/** @type {import('next').NextConfig} */
const nextConfig = {
  // GitHub Pages deployment with custom domain
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  // NO basePath or assetPrefix for custom domain
  // Custom domain should work without path prefix
  experimental: {
    missingSuspenseWithCSRBailout: false,
  }
}

module.exports = nextConfig
