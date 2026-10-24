/** @type {import('next').NextConfig} */
const noindex = [{ key: "X-Robots-Tag", value: "noindex, nofollow" }];

const nextConfig = {
  async headers() {
    return [
      { source: "/admin", headers: noindex },
      { source: "/admin/:path*", headers: noindex },
      { source: "/api/:path*", headers: noindex },
    ];
  },
};
export default nextConfig;
