import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Ignorar errores de ESLint durante el build
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Ignorar errores de TypeScript durante el build
    ignoreBuildErrors: true,
  },
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  },
  // Optimizaciones para mejorar performance
  experimental: {
    optimizePackageImports: ['@/components/ui', 'lucide-react'],
    // Configuración específica para Turbopack (desarrollo)
    turbo: {
      // Configuración mínima para evitar warnings
      resolveAlias: {
        // Aliases si son necesarios
      },
    },
  },
  // Headers para optimizar cache
  async headers() {
    return [
      {
        source: '/api/financial-data',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, stale-while-revalidate=86400',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
