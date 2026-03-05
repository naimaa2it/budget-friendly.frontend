/** @type {import('next').NextConfig} */
import path from 'path';

const nextConfig = {
  // output:'export',
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

  // add a webpack alias so '@' always resolves correctly
  webpack(config) {
    config.resolve.alias = config.resolve.alias || {};
    config.resolve.alias['@'] = path.resolve(__dirname);
    return config;
  },

  // Turbopack is enabled by default in Next 16; we still need to provide an
  // explicit placeholder since we are customizing webpack above.
  turbopack: {},

  /* other config options here */
};

export default nextConfig;
