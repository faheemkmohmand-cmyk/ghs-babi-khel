/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Permanently ignore ALL TypeScript errors during build
    ignoreBuildErrors: true,
  },
  eslint: {
    // Permanently ignore ALL ESLint errors during build
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'eawydjemssunkkjairzn.supabase.co' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
    ],
  },
}
module.exports = nextConfig
