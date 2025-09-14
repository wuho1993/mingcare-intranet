/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove static export for API routes to work
  // output: 'export',  // Commented out to enable API routes
  // trailingSlash: true,  // Commented out to fix API routing
  images: {
    unoptimized: true,
    domains: ['www.mingcarehome.net', 'mingcarehome.net']
  },
  // Only use basePath for GitHub Pages static deployment
  // Comment out for Vercel/Hostinger deployment
  // ...(process.env.NODE_ENV === 'production' && {
  //   basePath: '/mingcare-intranet',
  //   assetPrefix: '/mingcare-intranet/',
  // }),
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
  // Ensure proper asset handling for custom domain
  assetPrefix: process.env.NODE_ENV === 'production' ? 'https://www.mingcarehome.net' : '',
  // Add security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
