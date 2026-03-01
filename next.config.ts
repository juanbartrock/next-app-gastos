import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  eslint: {
    // Ignorar errores de ESLint durante el build
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Ignorar errores de TypeScript durante el build
    ignoreBuildErrors: true,
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
