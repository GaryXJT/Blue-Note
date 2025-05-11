/** @type {import('next').NextConfig} */
const path = require("path");

const nextConfig = {
  reactStrictMode: false,
  images: {
    domains: ["localhost"],
    unoptimized: true,
  },
  sassOptions: {
    includePaths: ["./src/styles"],
  },
  webpack: (config) => {
    config.resolve.alias["@"] = path.join(__dirname, "src");
    config.resolve.alias["@api"] = path.resolve(__dirname, "src/api");
    return config;
  },
};
module.exports = nextConfig;
