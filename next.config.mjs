/** @type {import('next').NextConfig} */
const nextConfig = {
 async rewrites() {
    return [
      {
        source: '/api/proxy/:path*', // We create a fake local path
        destination: 'https://endodermal-tiffaney-scalelike.ngrok-free.dev/api/:path*', // And redirect it to the real backend
      },
      ];
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
