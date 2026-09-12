/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingIncludes: {
    "/api/chat": ["./knowledge-base/**/*"],
  },
};
export default nextConfig;
