/** @type {import('next').NextConfig} */
const isFirebaseBuild = process.env.NEXT_PUBLIC_BUILD_MODE === 'export';

const nextConfig = {
  reactStrictMode: true,

  // Static export only when building for Firebase
  ...(isFirebaseBuild
    ? {
        output: 'export',
        images: { unoptimized: true },   // required for static export
        trailingSlash: true,             // Firebase needs this for clean URLs
      }
    : {
        // Local dev — proxy /api/* to FastAPI backend
        async rewrites() {
          return [
            {
              source: '/api/:path*',
              destination: 'http://localhost:8000/api/:path*',
            },
          ];
        },
      }),
};

module.exports = nextConfig;
