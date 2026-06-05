import type { NextConfig } from "next";

// 后端地址（服务端代理用，默认本机）
const API_BACKEND = process.env.API_BACKEND ?? "http://localhost:3001";

const nextConfig: NextConfig = {
  async rewrites() {
    // 把 /api/* 转发到后端，前端只暴露一个端口（解决手机跨端口访问）
    return [
      { source: "/api/:path*", destination: `${API_BACKEND}/:path*` },
    ];
  },
};

export default nextConfig;
