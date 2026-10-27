import type { NextConfig } from "next";

import { getSecurityHeaders } from "./src/server/security/headers";

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: getSecurityHeaders(),
      },
      // Next's configured headers can overwrite Route Handler headers. Keep
      // this later rule so binary files retain their stricter sandbox policy.
      {
        source: "/api/sister/file/:path*",
        headers: [{ key: "Content-Security-Policy", value: "sandbox; default-src 'none'" }],
      },
    ];
  },
};

export default nextConfig;
