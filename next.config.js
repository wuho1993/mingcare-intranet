/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  // GitHub Pages config - only apply in production
  ...(process.env.NODE_ENV === 'production' && {
    basePath: '/mingcare-intranet',
    assetPrefix: '/mingcare-intranet/',
  }),
  // For GitHub Pages static export
  experimental: {
    missingSuspenseWithCSRBailout: false,
  }
}

module.exports = nextConfig
