import type { NextConfig } from "next";

const apiProxyOrigin =
  process.env.API_PROXY_ORIGIN ??
  (process.env.NODE_ENV === "development" ? "http://localhost:3001" : undefined);

const nextConfig: NextConfig = {
  transpilePackages: ["@fragment/shared"],
  ...(apiProxyOrigin
    ? {
        async rewrites() {
          return [
            {
              source: "/api/:path*",
              destination: `${apiProxyOrigin.replace(/\/$/, "")}/api/:path*`,
            },
          ];
        },
      }
    : {}),
};

export default nextConfig;
