/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/index.html',
        destination: '/',
        permanent: false,
      },
      {
        source: '/card.html',
        has: [{ type: 'query', key: 'id', value: '(?<id>.*)' }],
        destination: '/card/:id',
        permanent: false,
      },
      {
        source: '/card.html',
        destination: '/',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
