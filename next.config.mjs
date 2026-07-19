/** @type {import('next').NextConfig} */
import path from "path";
import { fileURLToPath } from "url";

// __dirname is not available in ES-module (.mjs) files — compute it manually
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const nextConfig = {
  // output: "export",
  trailingSlash: true,

  // redirects() and headers() are not supported with output: "export" — both
  // are set via public/.htaccess instead (RewriteRule block + mod_headers).
  // The /checkout/success and /thankyou legacy redirects live there too.
  // async redirects() { ... }
  // async headers() { ... }
  images: {
    // Custom loader adds Cloudinary f_auto/q_auto so old browsers (no WebP
    // support) get JPEG instead of broken images. Non-Cloudinary srcs pass
    // through unchanged, so this stays compatible with output: "export".
    loader: "custom",
    loaderFile: "./lib/imageLoader.js",
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "download.logo.wine" },
      { protocol: "https", hostname: "img.icons8.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },

  // Webpack alias (fallback for non-Turbopack builds)
  webpack(config) {
    config.resolve.alias = config.resolve.alias || {};
    config.resolve.alias["@"] = __dirname;
    return config;
  },

  // Turbopack alias (Next.js 15/16 default bundler)
  turbopack: {
    resolveAlias: {
      "@/components": path.join(__dirname, "components"),
      "@/app": path.join(__dirname, "app"),
      "@/lib": path.join(__dirname, "lib"),
      "@/public": path.join(__dirname, "public"),
    },
  },
};

export default nextConfig;
