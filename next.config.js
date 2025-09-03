/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    VITE_DOTLOOP_CLIENT_ID: process.env.VITE_DOTLOOP_CLIENT_ID,
    VITE_DOTLOOP_CLIENT_SECRET: process.env.VITE_DOTLOOP_CLIENT_SECRET,
    VITE_DOTLOOP_AUTH_URL: process.env.VITE_DOTLOOP_AUTH_URL,
    VITE_DOTLOOP_API_URL: process.env.VITE_DOTLOOP_API_URL,
    VITE_REDIRECT_URI: process.env.VITE_REDIRECT_URI,
  },
  async rewrites() {
    return [
      {
        source: '/callback',
        destination: '/oauth-callback',
      },
    ];
  },
};

module.exports = nextConfig;