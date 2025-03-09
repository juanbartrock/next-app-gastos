"use client"

import { usePathname, useRouter } from "next/navigation"
import { 
  BarChart3, 
  CreditCard, 
  Grid, 
  PanelLeft, 
  PanelLeftClose, 
  PieChart, 
  Repeat, 
  Users,
  LightbulbIcon,
  TrendingUp,
  Tag,
  Wallet,
  DollarSign
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useSidebar } from "@/contexts/SidebarContext"

export function Sidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const { isOpen, toggle } = useSidebar()

  const isActive = (path: string) => {
    return pathname === path
  }
  
  // Función para manejar la navegación
  const handleNavigation = (path: string) => {
    if (pathname !== path) {
      router.push(path)
    }
  }

  return (
    <div className={`${isOpen ? 'w-64' : 'w-20'} transition-all duration-300 border-r border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg flex flex-col fixed h-screen z-10`}>
      {/* Botón toggle */}
      <Button 
        variant="outline" 
        size="icon" 
        onClick={(e) => {
          e.stopPropagation();
          toggle();
        }}
        className="absolute -right-3 top-20 h-6 w-6 rounded-full shadow-md border-gray-200 bg-white dark:bg-gray-700 dark:border-gray-600 p-0"
      >
        {isOpen ? <PanelLeftClose className="h-3 w-3" /> : <PanelLeft className="h-3 w-3" />}
      </Button>

      {/* Logo y título */}
      <div className="p-4 flex items-center mb-6">
        <div className="w-10 h-10 flex items-center justify-center bg-green-100 dark:bg-green-900 rounded-lg">
          <Wallet className="w-6 h-6 text-green-600 dark:text-green-300" />
        </div>
        {isOpen && (
          <div className="ml-3">
            <h1 className="font-bold text-gray-900 dark:text-white">Ayudante Financiero</h1>
          </div>
        )}
      </div>

      {/* Navegación */}
      <nav className="flex-1 px-2">
        <Button 
          variant={isActive("/") ? "secondary" : "ghost"}
          className="w-full flex items-center justify-center py-5 text-gray-500 dark:text-gray-400 mb-1"
          style={{ justifyContent: isOpen ? 'flex-start' : 'center' }}
          onClick={() => handleNavigation('/?dashboard=true')}
        >
          <Grid className="w-5 h-5" />
          {isOpen && <span className="ml-3">Dashboard</span>}
        </Button>
        
        <Button 
          variant={isActive("/inversiones") ? "secondary" : "ghost"}
          className="w-full flex items-center justify-center py-5 text-gray-500 dark:text-gray-400 mb-1"
          style={{ justifyContent: isOpen ? 'flex-start' : 'center' }}
          onClick={() => handleNavigation('/inversiones')}
        >
          <TrendingUp className="w-5 h-5 text-green-500" />
          {isOpen && <span className="ml-3">Inversiones</span>}
        </Button>
        
        <Button 
          variant={isActive("/voz") ? "secondary" : "ghost"}
          className="w-full flex items-center justify-center py-5 text-gray-500 dark:text-gray-400 mb-1"
          style={{ justifyContent: isOpen ? 'flex-start' : 'center' }}
          onClick={() => handleNavigation('/voz')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500 dark:text-gray-400">
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
            <line x1="12" x2="12" y1="19" y2="22"></line>
          </svg>
          {isOpen && <span className="ml-3">Gastos por Voz</span>}
        </Button>
        
        <Button 
          variant={isActive("/recurrentes") ? "secondary" : "ghost"}
          className="w-full flex items-center justify-center py-5 text-gray-500 dark:text-gray-400 mb-1"
          style={{ justifyContent: isOpen ? 'flex-start' : 'center' }}
          onClick={() => handleNavigation('/recurrentes')}
        >
          <Repeat className="w-5 h-5" />
          {isOpen && <span className="ml-3">Recurrentes</span>}
        </Button>
        
        <Button 
          variant={isActive("/financiacion") ? "secondary" : "ghost"}
          className="w-full flex items-center justify-center py-5 text-gray-500 dark:text-gray-400 mb-1"
          style={{ justifyContent: isOpen ? 'flex-start' : 'center' }}
          onClick={() => handleNavigation('/financiacion')}
        >
          <CreditCard className="w-5 h-5" />
          {isOpen && <span className="ml-3">Financiación</span>}
        </Button>
        
        <Button 
          variant={isActive("/presupuestos") ? "secondary" : "ghost"}
          className="w-full flex items-center justify-center py-5 text-gray-500 dark:text-gray-400 mb-1"
          style={{ justifyContent: isOpen ? 'flex-start' : 'center' }}
          onClick={() => handleNavigation('/presupuestos')}
        >
          <PieChart className="w-5 h-5" />
          {isOpen && <span className="ml-3">Presupuestos</span>}
        </Button>
        
        <Button 
          variant={isActive("/informes") ? "secondary" : "ghost"}
          className="w-full flex items-center justify-center py-5 text-gray-500 dark:text-gray-400 mb-1"
          style={{ justifyContent: isOpen ? 'flex-start' : 'center' }}
          onClick={() => handleNavigation('/informes')}
        >
          <BarChart3 className="w-5 h-5" />
          {isOpen && <span className="ml-3">Informes</span>}
        </Button>
        
        <Button 
          variant={isActive("/grupos") ? "secondary" : "ghost"}
          className="w-full flex items-center justify-center py-5 text-gray-500 dark:text-gray-400 mb-1"
          style={{ justifyContent: isOpen ? 'flex-start' : 'center' }}
          onClick={() => handleNavigation('/grupos')}
        >
          <Users className="w-5 h-5" />
          {isOpen && <span className="ml-3">Grupos</span>}
        </Button>
        
        <Button 
          variant={isActive("/recomendaciones-ahorro") ? "secondary" : "ghost"}
          className="w-full flex items-center justify-center py-5 text-gray-500 dark:text-gray-400 mb-1"
          style={{ justifyContent: isOpen ? 'flex-start' : 'center' }}
          onClick={() => handleNavigation('/recomendaciones-ahorro')}
        >
          <LightbulbIcon className="w-5 h-5" />
          {isOpen && <span className="ml-3">Recomendaciones</span>}
        </Button>
        
        <Button 
          variant={isActive("/seguimiento-precios") ? "secondary" : "ghost"}
          className="w-full flex items-center justify-center py-5 text-gray-500 dark:text-gray-400 mb-1"
          style={{ justifyContent: isOpen ? 'flex-start' : 'center' }}
          onClick={() => handleNavigation('/seguimiento-precios')}
        >
          <Tag className="w-5 h-5 text-orange-500" />
          {isOpen && <span className="ml-3">Seguimiento Precios</span>}
        </Button>
      </nav>
    </div>
  )
} 