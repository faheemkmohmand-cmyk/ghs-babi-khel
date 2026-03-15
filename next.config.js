/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
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