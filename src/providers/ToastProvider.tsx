"use client"

import { ToastProvider as UIToastProvider } from "@/components/ui/use-toast"
import { Toaster } from "sonner"

export function ToastProvider({ children }: { children?: React.ReactNode }) {
  return (
    <UIToastProvider>
      {children}
      <Toaster 
        position="top-right"
        expand={true}
        richColors
        closeButton
      />
    </UIToastProvider>
  )
} 