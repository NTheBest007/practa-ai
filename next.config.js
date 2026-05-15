/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  /** Hides the bottom-left “Rendering…” dev bubble (Next 15+). Errors still show. */
  devIndicators: false,
};

module.exports = nextConfig;
