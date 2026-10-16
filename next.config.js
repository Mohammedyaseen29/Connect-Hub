/** @type {import('next').NextConfig} */
// Configuration options for Next.js
const nextConfig = {
    reactStrictMode: true, // Enable React strict mode for improved error handling
    compiler: {
        removeConsole: process.env.NODE_ENV !== "development" ? { exclude: ["error", "warn"] } : false, // Remove console.log in production
    },
    eslint: {
        ignoreDuringBuilds: false,
    },
    typescript:{
        ignoreBuildErrors: false,
    },

    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'utfs.io',
                pathname: '**',
            },
        ],
    },

};

module.exports = nextConfig;
