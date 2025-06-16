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
  DollarSign,
  Building2,
  CheckSquare2,
  Bell,
  Upload,
  Download,
  Archive,
  Crown
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/ui/logo"
import { useSidebar } from "@/contexts/SidebarContext"

export function Sidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const { isOpen, toggle } = useSidebar()

  const isActive = (path: string) => {
    // Caso especial para transacciones: considerar activo tanto /transacciones como /transacciones/nuevo
    if (path === "/transacciones") {
      return pathname === "/transacciones" || pathname === "/transacciones/nuevo" || pathname.startsWith("/transacciones/")
    }
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
        <Logo 
          size="lg" 
          showText={isOpen}
          className={!isOpen ? "justify-center" : ""}
        />
      </div>

      {/* Navegación con scroll */}
      <nav className="flex-1 px-2 overflow-y-auto sidebar-scroll">
        <div className="space-y-1 pb-4">
          {/* Estilos CSS personalizados para scroll sutil */}
          <style jsx>{`
            .sidebar-scroll::-webkit-scrollbar {
              width: 4px;
            }
            
            .sidebar-scroll::-webkit-scrollbar-track {
              background: transparent;
            }
            
            .sidebar-scroll::-webkit-scrollbar-thumb {
              background: rgba(156, 163, 175, 0.3);
              border-radius: 20px;
              transition: all 0.2s ease;
            }
            
            .sidebar-scroll::-webkit-scrollbar-thumb:hover {
              background: rgba(156, 163, 175, 0.5);
            }
            
            .dark .sidebar-scroll::-webkit-scrollbar-thumb {
              background: rgba(75, 85, 99, 0.4);
            }
            
            .dark .sidebar-scroll::-webkit-scrollbar-thumb:hover {
              background: rgba(75, 85, 99, 0.6);
            }
            
            /* Para Firefox */
            .sidebar-scroll {
              scrollbar-width: thin;
              scrollbar-color: rgba(156, 163, 175, 0.3) transparent;
            }
            
            .dark .sidebar-scroll {
              scrollbar-color: rgba(75, 85, 99, 0.4) transparent;
            }
          `}</style>
          
          {/* 1. Dashboard */}
          <Button 
            variant={isActive("/") ? "secondary" : "ghost"}
            className="w-full flex items-center justify-center py-5 text-gray-500 dark:text-gray-400"
            style={{ justifyContent: isOpen ? 'flex-start' : 'center' }}
            onClick={() => handleNavigation('/?dashboard=true')}
          >
            <Grid className="w-5 h-5" />
            {isOpen && <span className="ml-3">Dashboard</span>}
          </Button>
          
          {/* 2. Informes */}
          <Button 
            variant={isActive("/informes") ? "secondary" : "ghost"}
            className="w-full flex items-center justify-center py-5 text-gray-500 dark:text-gray-400"
            style={{ justifyContent: isOpen ? 'flex-start' : 'center' }}
            onClick={() => handleNavigation('/informes')}
          >
            <BarChart3 className="w-5 h-5" />
            {isOpen && <span className="ml-3">Informes</span>}
          </Button>
          
          {/* 3. Transacciones */}
          <Button 
            variant={isActive("/transacciones") ? "secondary" : "ghost"}
            className="w-full flex items-center justify-center py-5 text-gray-500 dark:text-gray-400"
            style={{ justifyContent: isOpen ? 'flex-start' : 'center' }}
            onClick={() => handleNavigation('/transacciones')}
          >
            <DollarSign className="w-5 h-5 text-blue-500" />
            {isOpen && <span className="ml-3">Transacciones</span>}
          </Button>
          
          {/* 4. Recurrentes */}
          <Button 
            variant={isActive("/recurrentes") ? "secondary" : "ghost"}
            className="w-full flex items-center justify-center py-5 text-gray-500 dark:text-gray-400"
            style={{ justifyContent: isOpen ? 'flex-start' : 'center' }}
            onClick={() => handleNavigation('/recurrentes')}
          >
            <Repeat className="w-5 h-5" />
            {isOpen && <span className="ml-3">Recurrentes</span>}
          </Button>
          
          {/* 5. Financiación */}
          <Button 
            variant={isActive("/financiacion") ? "secondary" : "ghost"}
            className="w-full flex items-center justify-center py-5 text-gray-500 dark:text-gray-400"
            style={{ justifyContent: isOpen ? 'flex-start' : 'center' }}
            onClick={() => handleNavigation('/financiacion')}
          >
            <CreditCard className="w-5 h-5" />
            {isOpen && <span className="ml-3">Financiación</span>}
          </Button>
          
          {/* 6. Inversiones */}
          <Button 
            variant={isActive("/inversiones") ? "secondary" : "ghost"}
            className="w-full flex items-center justify-center py-5 text-gray-500 dark:text-gray-400"
            style={{ justifyContent: isOpen ? 'flex-start' : 'center' }}
            onClick={() => handleNavigation('/inversiones')}
          >
            <TrendingUp className="w-5 h-5 text-green-500" />
            {isOpen && <span className="ml-3">Inversiones</span>}
          </Button>
          
          {/* 7. Préstamos */}
          <Button 
            variant={isActive("/prestamos") ? "secondary" : "ghost"}
            className="w-full flex items-center justify-center py-5 text-gray-500 dark:text-gray-400"
            style={{ justifyContent: isOpen ? 'flex-start' : 'center' }}
            onClick={() => handleNavigation('/prestamos')}
          >
            <Building2 className="w-5 h-5 text-blue-500" />
            {isOpen && <span className="ml-3">Préstamos</span>}
          </Button>
          
          {/* 8. Presupuestos */}
          <Button 
            variant={isActive("/presupuestos") ? "secondary" : "ghost"}
            className="w-full flex items-center justify-center py-5 text-gray-500 dark:text-gray-400"
            style={{ justifyContent: isOpen ? 'flex-start' : 'center' }}
            onClick={() => handleNavigation('/presupuestos')}
          >
            <PieChart className="w-5 h-5" />
            {isOpen && <span className="ml-3">Presupuestos</span>}
          </Button>
          
          {/* 9. Grupos */}
          <Button 
            variant={isActive("/grupos") ? "secondary" : "ghost"}
            className="w-full flex items-center justify-center py-5 text-gray-500 dark:text-gray-400"
            style={{ justifyContent: isOpen ? 'flex-start' : 'center' }}
            onClick={() => handleNavigation('/grupos')}
          >
            <Users className="w-5 h-5" />
            {isOpen && <span className="ml-3">Grupos</span>}
          </Button>
          
          {/* 10. Tareas */}
          <Button 
            variant={isActive("/tareas") ? "secondary" : "ghost"}
            className="w-full flex items-center justify-center py-5 text-gray-500 dark:text-gray-400"
            style={{ justifyContent: isOpen ? 'flex-start' : 'center' }}
            onClick={() => handleNavigation('/tareas')}
          >
            <CheckSquare2 className="w-5 h-5 text-purple-500" />
            {isOpen && <span className="ml-3">Tareas</span>}
          </Button>
          
          {/* 11. Alertas */}
          <Button 
            variant={isActive("/alertas") ? "secondary" : "ghost"}
            className="w-full flex items-center justify-center py-5 text-gray-500 dark:text-gray-400"
            style={{ justifyContent: isOpen ? 'flex-start' : 'center' }}
            onClick={() => handleNavigation('/alertas')}
          >
            <Bell className="w-5 h-5 text-amber-500" />
            {isOpen && <span className="ml-3">Alertas</span>}
          </Button>
          
          {/* 12. Buzón de Comprobantes */}
          <Button 
            variant={isActive("/buzon") ? "secondary" : "ghost"}
            className="w-full flex items-center justify-center py-5 text-gray-500 dark:text-gray-400"
            style={{ justifyContent: isOpen ? 'flex-start' : 'center' }}
            onClick={() => handleNavigation('/buzon')}
          >
            <Archive className="w-5 h-5 text-indigo-500" />
            {isOpen && <span className="ml-3">Buzón Comprobantes</span>}
          </Button>
          
          {/* 13. Recomendaciones - DESHABILITADO: Funcionalidad deprecada */}
          {false && (
            <Button 
              variant={isActive("/recomendaciones-ahorro") ? "secondary" : "ghost"}
              className="w-full flex items-center justify-center py-5 text-gray-500 dark:text-gray-400"
              style={{ justifyContent: isOpen ? 'flex-start' : 'center' }}
              onClick={() => handleNavigation('/recomendaciones-ahorro')}
            >
              <LightbulbIcon className="w-5 h-5" />
              {isOpen && <span className="ml-3">Recomendaciones</span>}
            </Button>
          )}
          
          {/* 14. Seguimiento Precios - DESHABILITADO: Funcionalidad deprecada */}
          {false && (
            <Button 
              variant={isActive("/seguimiento-precios") ? "secondary" : "ghost"}
              className="w-full flex items-center justify-center py-5 text-gray-500 dark:text-gray-400"
              style={{ justifyContent: isOpen ? 'flex-start' : 'center' }}
              onClick={() => handleNavigation('/seguimiento-precios')}
            >
              <Tag className="w-5 h-5 text-orange-500" />
              {isOpen && <span className="ml-3">Seguimiento Precios</span>}
            </Button>
          )}

          {/* Separador visual */}
          {isOpen && (
            <div className="my-4 border-t border-gray-200 dark:border-gray-600 pt-2">
              <span className="text-xs text-gray-400 dark:text-gray-500 px-3 font-medium">
                Gestión de Datos
              </span>
            </div>
          )}
          
          {/* 13. Importar Datos */}
          <Button 
            variant={isActive("/importar-datos") ? "secondary" : "ghost"}
            className="w-full flex items-center justify-center py-5 text-gray-500 dark:text-gray-400"
            style={{ justifyContent: isOpen ? 'flex-start' : 'center' }}
            onClick={() => handleNavigation('/importar-datos')}
          >
            <Upload className="w-5 h-5 text-blue-500" />
            {isOpen && <span className="ml-3">Importar Datos</span>}
          </Button>
          
          {/* 14. Exportar Datos */}
          <Button 
            variant={isActive("/exportar-datos") ? "secondary" : "ghost"}
            className="w-full flex items-center justify-center py-5 text-gray-500 dark:text-gray-400"
            style={{ justifyContent: isOpen ? 'flex-start' : 'center' }}
            onClick={() => handleNavigation('/exportar-datos')}
          >
            <Download className="w-5 h-5 text-green-500" />
            {isOpen && <span className="ml-3">Exportar Datos</span>}
          </Button>
        </div>
      </nav>
    </div>
  )
} 