/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [],
  },
  transpilePackages: ['react-plotly.js', 'plotly.js'],
}

module.exports = nextConfig
