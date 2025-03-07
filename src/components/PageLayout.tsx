"use client"

import { ReactNode } from "react"
import { Sidebar } from "@/components/Sidebar"
import { useSidebar } from "@/contexts/SidebarContext"

interface PageLayoutProps {
  children: ReactNode
}

export function PageLayout({ children }: PageLayoutProps) {
  const { isOpen } = useSidebar()

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 p-4 ${isOpen ? 'ml-64' : 'ml-20'}`}>
        {children}
      </div>
    </div>
  )
} 