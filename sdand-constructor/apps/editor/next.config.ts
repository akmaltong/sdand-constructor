import type { NextConfig } from 'next'
import path from 'node:path'

const nextConfig: NextConfig = {
  // Standalone build — самодостаточная папка .next/standalone,
  // запуск: node server.js (нужен только Node 20+).
  output: 'standalone',
  // Sdand: явно указываем корень monorepo — иначе Turbopack на Vercel
  // не может найти next/package.json из apps/editor/app.
  outputFileTracingRoot: path.join(__dirname, '../..'),
  // Sdand: скрываем "N" dev-indicator внизу-слева — на демо заказчику
  // это выглядит неаккуратно.
  devIndicators: false,
  logging: {
    browserToTerminal: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  transpilePackages: [
    'three',
    '@pascal-app/viewer',
    '@pascal-app/core',
    '@pascal-app/editor',
    '@pascal-app/mcp',
  ],
  turbopack: {
    root: path.join(__dirname, '../..'),
    resolveAlias: {
      react: './node_modules/react',
      three: './node_modules/three',
      '@react-three/fiber': './node_modules/@react-three/fiber',
      '@react-three/drei': './node_modules/@react-three/drei',
    },
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '100mb',
    },
  },
  images: {
    unoptimized: process.env.NEXT_PUBLIC_ASSETS_CDN_URL?.startsWith('http://localhost') ?? false,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
}

export default nextConfig
