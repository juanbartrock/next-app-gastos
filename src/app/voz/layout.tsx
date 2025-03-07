import { PageLayout } from "@/components/PageLayout"
import { ReactNode } from "react"

export default function VozLayout({ children }: { children: ReactNode }) {
  return <PageLayout>{children}</PageLayout>
} 