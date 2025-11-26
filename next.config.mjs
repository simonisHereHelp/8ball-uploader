
/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'drive.google.com',
        // 如果需要，也可以指定 pathnamePattern
        // pathnamePattern: '/uc/**', 
      },
    ],
  },
};

export default config;
