"use client"

import { ToastProvider as UIToastProvider } from "@/components/ui/use-toast"

export function ToastProvider({ children }: { children?: React.ReactNode }) {
  return <UIToastProvider>{children}</UIToastProvider>
} 