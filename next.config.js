/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove static export for API routes to work
  // output: 'export',  // Commented out to enable API routes
  // trailingSlash: true,  // Commented out to fix API routing
  images: {
    unoptimized: true
  },
  // Only use basePath for GitHub Pages static deployment
  // Comment out for Vercel deployment
  // ...(process.env.NODE_ENV === 'production' && {
  //   basePath: '/mingcare-intranet',
  //   assetPrefix: '/mingcare-intranet/',
  // }),
  experimental: {
    missingSuspenseWithCSRBailout: false,
  }
}

module.exports = nextConfig
