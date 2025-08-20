/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  basePath: '/mingcare-intranet',
  assetPrefix: '/mingcare-intranet/'
}

module.exports = nextConfig
