import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  pageExtensions: ['tsx', 'ts'],
  serverExternalPackages: ['firebase-admin'],
};

export default nextConfig;
