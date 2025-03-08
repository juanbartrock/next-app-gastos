import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Administración de Scrapers",
  description: "Panel de administración para monitorear y ejecutar scrapers de recomendaciones de ahorro",
}

export default function ScrapingAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  )
} 