/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3001',
      },
      {
        protocol: 'http',
        hostname: '138.197.78.36',
        port: '3001',
      },
    ],
  },
  // Proxy media requests to CMS so they work from any hostname
  async rewrites() {
    return [
      {
        source: '/cms-media/:path*',
        destination: 'http://localhost:3001/api/media/:path*',
      },
    ];
  },
};

export default nextConfig;
