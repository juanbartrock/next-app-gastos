import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Presupuestos de Gastos',
  description: 'Gestiona tus presupuestos y controla tus gastos',
}

export default function PresupuestosLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
} 