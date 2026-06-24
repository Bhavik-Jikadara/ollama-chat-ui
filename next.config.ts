import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    async headers() {
        return [
            {
                // Prevent browsers from caching API responses
                source: '/api/:path*',
                headers: [{ key: 'Cache-Control', value: 'no-store' }],
            },
        ];
    },
};

export default nextConfig;
