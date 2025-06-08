"use client"

import { ReactNode } from "react"
import { usePathname } from "next/navigation"
import { Sidebar } from "@/components/Sidebar"
import { useSidebar } from "@/contexts/SidebarContext"
import { FloatingAdvisor } from "@/components/FloatingAdvisor"
import { NotificationCenter } from "@/components/alertas/NotificationCenter"
import { Button } from "@/components/ui/button"
import { User, Settings, Crown, CreditCard } from "lucide-react"
import { useSession, signOut } from "next-auth/react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useTheme } from "next-themes"
import { Sun, Moon } from "lucide-react"

interface PageLayoutProps {
  children: ReactNode
}

export function PageLayout({ children }: PageLayoutProps) {
  const { isOpen } = useSidebar()
  const pathname = usePathname()
  const { data: session } = useSession()
  const { theme, setTheme } = useTheme()
  
  // No mostrar header en dashboard ya que tiene el suyo propio
  const showHeader = !pathname?.includes('/dashboard') && pathname !== '/'

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ${isOpen ? 'ml-64' : 'ml-20'}`}>
        {/* Header condicional */}
        {showHeader && (
          <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 flex items-center justify-end shadow-sm">
            <div className="flex items-center gap-4">
              {/* Notification Center */}
              <NotificationCenter />
              
              {/* Theme Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="rounded-full"
              >
                {theme === "dark" ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </Button>
              
              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="text-sm">
                      <div className="font-medium">
                        {session?.user?.name || "Usuario"}
                      </div>
                      <div className="text-gray-500 dark:text-gray-400">
                        {session?.user?.email}
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => window.location.href = "/perfil"}>
                    <User className="mr-2 h-4 w-4" />
                    Perfil
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => window.location.href = "/configuracion"}>
                    <Settings className="mr-2 h-4 w-4" />
                    Configuración
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => window.location.href = "/planes"}>
                    <Crown className="mr-2 h-4 w-4 text-yellow-500" />
                    Ver Planes
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => window.location.href = "/suscripcion"}>
                    <CreditCard className="mr-2 h-4 w-4 text-blue-500" />
                    Mi Suscripción
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signOut()}>
                    Cerrar Sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
        )}
        
        {/* Page Content */}
        <main className="p-4">
          {children}
        </main>
      </div>

      {/* Asesor Financiero Flotante */}
      <FloatingAdvisor />
    </div>
  )
} 