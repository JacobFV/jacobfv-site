/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    viewTransition: true,
  },
  images: {
    formats: ["image/avif", "image/webp"],
  },
  // 301 redirects from the old Jekyll URLs are added during cutover (Phase 9).
  // See docs/ROADMAP.md.
  async redirects() {
    return [];
  },
};

export default nextConfig;
