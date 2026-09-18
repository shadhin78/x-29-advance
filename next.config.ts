import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  pageExtensions: ['tsx', 'ts'],
  serverExternalPackages: ['firebase-admin'],
  agentRules: false,
};

export default nextConfig;
