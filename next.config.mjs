/** @type {import('next').NextConfig} */
import path from 'path';
import { fileURLToPath } from 'url';

// __dirname is not available in ES-module (.mjs) files — compute it manually
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const nextConfig = {
  images: {
    domains: [
      'res.cloudinary.com',
      'ssl-commerz.com',
      'download.logo.wine',
      'static.vecteezy.com',
      'img.icons8.com',
      'lh3.googleusercontent.com',
    ],
  },

  // Webpack alias (fallback for non-Turbopack builds)
  webpack(config) {
    config.resolve.alias = config.resolve.alias || {};
    config.resolve.alias['@'] = __dirname;
    return config;
  },

  // Turbopack alias (Next.js 15/16 default bundler)
  turbopack: {
    resolveAlias: {
      '@/components': path.join(__dirname, 'components'),
      '@/app': path.join(__dirname, 'app'),
      '@/lib': path.join(__dirname, 'lib'),
      '@/public': path.join(__dirname, 'public'),
    },
  },
};

export default nextConfig;
