/** @type {import('next').NextConfig} */
const nextConfig = {
    // 静的エクスポートは使用しない（APIルートが必要なため）
    output: undefined,

    // 画像最適化
    images: {
        unoptimized: true
    },

    // 実験的機能
    experimental: {
        serverActions: true
    }
};

module.exports = nextConfig;
