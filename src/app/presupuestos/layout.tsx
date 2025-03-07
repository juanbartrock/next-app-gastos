import { Metadata } from 'next'
import { PageLayout } from "@/components/PageLayout"
import { ReactNode } from "react"

export const metadata: Metadata = {
  title: 'Presupuestos de Gastos',
  description: 'Gestiona tus presupuestos y controla tus gastos',
}

export default function PresupuestosLayout({
  children,
}: {
  children: ReactNode
}) {
  return <PageLayout>{children}</PageLayout>
} 