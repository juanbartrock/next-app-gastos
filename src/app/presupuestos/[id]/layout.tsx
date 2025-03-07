import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Editar Presupuesto',
  description: 'Modificar un presupuesto existente',
}

export default function EditarPresupuestoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
} 