/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Allow LAN dev origin so HMR websocket isn't rejected (403).
  allowedDevOrigins: ["10.180.1.224"],
}

export default nextConfig
