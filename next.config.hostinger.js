/** @type {import('next').NextConfig} */
const nextConfig = {
  // Hostinger deployment configuration - NO basePath or assetPrefix
  images: {
    unoptimized: true,
    domains: ['www.mingcarehome.net', 'mingcarehome.net', 'localhost']
  },
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
  // Security headers
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
