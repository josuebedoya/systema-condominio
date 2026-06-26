/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@mantine/core', '@mantine/hooks', '@mantine/notifications', '@mantine/dates'],
  reactStrictMode: false,
}
export default nextConfig
