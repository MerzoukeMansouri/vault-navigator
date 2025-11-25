/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Handle trailing slashes consistently
  trailingSlash: false,
  // Optimize for production
  poweredByHeader: false,
  // Ensure proper handling of API routes
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: '*' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
