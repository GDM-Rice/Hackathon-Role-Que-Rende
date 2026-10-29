/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // As texturas do planeta são grandes e não mudam: cache longo.
  async headers() {
    return [{ source: '/terra/:path*', headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }] }];
  },
};
export default nextConfig;
