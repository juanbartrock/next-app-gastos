import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Nuevo Presupuesto',
  description: 'Crear un nuevo presupuesto para controlar gastos',
}

export default function NuevoPresupuestoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
} 