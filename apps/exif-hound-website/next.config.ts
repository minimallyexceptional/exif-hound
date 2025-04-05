import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Disable ESLint during builds
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Disable TypeScript checking during builds
    ignoreBuildErrors: true,
  },
  output: 'standalone', // Enable standalone output for Docker
  serverExternalPackages: ['stripe'], // Enable external packages for server components
  
  // Add runtime config for Stripe publishable key
  publicRuntimeConfig: {
    stripePublishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
  },
};

export default nextConfig;
