/** @type {import('next').NextConfig} */
const nextConfig = {
  // Development mode configuration
  images: {
    unoptimized: true
  },
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
  env: {
    // Expose service role key for admin operations
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  }
}

module.exports = nextConfig