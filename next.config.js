/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost'],
    unoptimized: true,
  },
  sassOptions: {
    includePaths: ['./src/styles'],
  }
}

module.exports = nextConfig 