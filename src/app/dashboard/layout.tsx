import { PageLayout } from "@/components/PageLayout"
import { ReactNode } from "react"

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <PageLayout>{children}</PageLayout>
} 