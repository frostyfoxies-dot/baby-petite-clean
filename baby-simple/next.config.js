/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['bcryptjs'],
  },
  webpack: (config, { defaultLoaders }) => {
    config.resolve.alias['@'] = require('path').join(__dirname, 'src');
    return config;
  },
}

module.exports = nextConfig
