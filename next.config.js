/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    experimental: {
      // This helps with hydration issues
      optimizeFonts: true,
      scrollRestoration: true,
    },
    // Add any other existing configurations here
  }
  
  module.exports = nextConfig
  