"use client"

import PresupuestosList from '@/components/PresupuestosList'

export default function PresupuestosPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="px-4 py-6 md:px-6 bg-background border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">Presupuestos de Gastos</h1>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4">
        <PresupuestosList />
      </main>
    </div>
  )
} 