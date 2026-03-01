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
  Crown,
  Bug
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/ui/logo"
import { useSidebar } from "@/contexts/SidebarContext"
import { cn } from "@/lib/utils"

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

  const navBtnClass = (path: string) => cn(
    "w-full flex items-center py-5 rounded-lg transition-colors",
    isOpen ? "justify-start" : "justify-center",
    isActive(path)
      ? "bg-violet-600/20 text-violet-300 border border-violet-500/20 hover:bg-violet-600/25"
      : "text-white/50 hover:bg-white/[0.06] hover:text-white/80 border border-transparent"
  )

  return (
    <div className={`${isOpen ? 'w-64' : 'w-20'} transition-all duration-300 border-r border-white/[0.06] bg-[#0D0B1E]/95 backdrop-blur-xl shadow-lg flex flex-col fixed h-screen z-10`} data-tour="sidebar">
      {/* Botón toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={(e) => {
          e.stopPropagation();
          toggle();
        }}
        className="absolute -right-3 top-20 h-6 w-6 rounded-full shadow-md border border-white/[0.12] bg-[#1A1535] hover:bg-violet-600/30 p-0"
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
              background: rgba(139, 92, 246, 0.25);
            }

            .dark .sidebar-scroll::-webkit-scrollbar-thumb:hover {
              background: rgba(139, 92, 246, 0.4);
            }

            /* Para Firefox */
            .sidebar-scroll {
              scrollbar-width: thin;
              scrollbar-color: rgba(156, 163, 175, 0.3) transparent;
            }

            .dark .sidebar-scroll {
              scrollbar-color: rgba(139, 92, 246, 0.25) transparent;
            }
          `}</style>
          
          {/* 1. Dashboard */}
          <Button
            variant="ghost"
            className={navBtnClass("/")}
            onClick={() => handleNavigation('/?dashboard=true')}
          >
            <Grid className="w-5 h-5 shrink-0" />
            {isOpen && <span className="ml-3">Dashboard</span>}
          </Button>

          {/* 2. Informes */}
          <Button
            variant="ghost"
            className={navBtnClass("/informes")}
            onClick={() => handleNavigation('/informes')}
          >
            <BarChart3 className="w-5 h-5 shrink-0" />
            {isOpen && <span className="ml-3">Informes</span>}
          </Button>

          {/* 3. Transacciones */}
          <Button
            variant="ghost"
            className={navBtnClass("/transacciones")}
            onClick={() => handleNavigation('/transacciones')}
          >
            <DollarSign className="w-5 h-5 shrink-0 text-blue-400" />
            {isOpen && <span className="ml-3">Transacciones</span>}
          </Button>

          {/* 4. Recurrentes */}
          <Button
            variant="ghost"
            className={navBtnClass("/recurrentes")}
            onClick={() => handleNavigation('/recurrentes')}
            data-tour="recurring"
          >
            <Repeat className="w-5 h-5 shrink-0" />
            {isOpen && <span className="ml-3">Recurrentes</span>}
          </Button>

          {/* 5. Financiación */}
          <Button
            variant="ghost"
            className={navBtnClass("/financiacion")}
            onClick={() => handleNavigation('/financiacion')}
          >
            <CreditCard className="w-5 h-5 shrink-0" />
            {isOpen && <span className="ml-3">Financiación</span>}
          </Button>

          {/* 6. Inversiones */}
          <Button
            variant="ghost"
            className={navBtnClass("/inversiones")}
            onClick={() => handleNavigation('/inversiones')}
          >
            <TrendingUp className="w-5 h-5 shrink-0 text-emerald-400" />
            {isOpen && <span className="ml-3">Inversiones</span>}
          </Button>

          {/* 7. Préstamos */}
          <Button
            variant="ghost"
            className={navBtnClass("/prestamos")}
            onClick={() => handleNavigation('/prestamos')}
          >
            <Building2 className="w-5 h-5 shrink-0 text-blue-400" />
            {isOpen && <span className="ml-3">Préstamos</span>}
          </Button>

          {/* 8. Presupuestos */}
          <Button
            variant="ghost"
            className={navBtnClass("/presupuestos")}
            onClick={() => handleNavigation('/presupuestos')}
            data-tour="budgets"
          >
            <PieChart className="w-5 h-5 shrink-0" />
            {isOpen && <span className="ml-3">Presupuestos</span>}
          </Button>

          {/* 9. Grupos */}
          <Button
            variant="ghost"
            className={navBtnClass("/grupos")}
            onClick={() => handleNavigation('/grupos')}
          >
            <Users className="w-5 h-5 shrink-0" />
            {isOpen && <span className="ml-3">Grupos</span>}
          </Button>

          {/* 10. Tareas */}
          <Button
            variant="ghost"
            className={navBtnClass("/tareas")}
            onClick={() => handleNavigation('/tareas')}
          >
            <CheckSquare2 className="w-5 h-5 shrink-0 text-violet-400" />
            {isOpen && <span className="ml-3">Tareas</span>}
          </Button>

          {/* 11. Alertas */}
          <Button
            variant="ghost"
            className={navBtnClass("/alertas")}
            onClick={() => handleNavigation('/alertas')}
          >
            <Bell className="w-5 h-5 shrink-0 text-amber-400" />
            {isOpen && <span className="ml-3">Alertas</span>}
          </Button>

          {/* 12. IA Financiero */}
          <Button
            variant="ghost"
            className={navBtnClass("/ai-financiero")}
            onClick={() => handleNavigation('/ai-financiero')}
            data-tour="ai"
          >
            <LightbulbIcon className="w-5 h-5 shrink-0 text-cyan-400" />
            {isOpen && <span className="ml-3">IA Financiero</span>}
          </Button>

          {/* 13. Buzón de Comprobantes */}
          <Button
            variant="ghost"
            className={navBtnClass("/buzon")}
            onClick={() => handleNavigation('/buzon')}
          >
            <Archive className="w-5 h-5 shrink-0 text-indigo-400" />
            {isOpen && <span className="ml-3">Buzón Comprobantes</span>}
          </Button>

          {/* 14. Beta Feedback */}
          <Button
            variant="ghost"
            className={navBtnClass("/beta-feedback")}
            onClick={() => handleNavigation('/beta-feedback')}
          >
            <Bug className="w-5 h-5 shrink-0 text-blue-400" />
            {isOpen && <span className="ml-3">Beta Feedback</span>}
          </Button>

          {/* 15. Recomendaciones - DESHABILITADO: Funcionalidad deprecada */}
          {false && (
            <Button
              variant="ghost"
              className={navBtnClass("/recomendaciones-ahorro")}
              onClick={() => handleNavigation('/recomendaciones-ahorro')}
            >
              <LightbulbIcon className="w-5 h-5 shrink-0" />
              {isOpen && <span className="ml-3">Recomendaciones</span>}
            </Button>
          )}

          {/* 16. Seguimiento Precios - DESHABILITADO: Funcionalidad deprecada */}
          {false && (
            <Button
              variant="ghost"
              className={navBtnClass("/seguimiento-precios")}
              onClick={() => handleNavigation('/seguimiento-precios')}
            >
              <Tag className="w-5 h-5 shrink-0 text-orange-400" />
              {isOpen && <span className="ml-3">Seguimiento Precios</span>}
            </Button>
          )}

          {/* Separador visual */}
          {isOpen && (
            <div className="my-4 border-t border-white/[0.06] pt-2">
              <span className="text-xs text-white/25 px-3 font-medium uppercase tracking-wider">
                Gestión de Datos
              </span>
            </div>
          )}

          {/* 17. Importar Datos */}
          <Button
            variant="ghost"
            className={navBtnClass("/importar-datos")}
            onClick={() => handleNavigation('/importar-datos')}
          >
            <Upload className="w-5 h-5 shrink-0 text-blue-400" />
            {isOpen && <span className="ml-3">Importar Datos</span>}
          </Button>

          {/* 18. Exportar Datos */}
          <Button
            variant="ghost"
            className={navBtnClass("/exportar-datos")}
            onClick={() => handleNavigation('/exportar-datos')}
          >
            <Download className="w-5 h-5 shrink-0 text-emerald-400" />
            {isOpen && <span className="ml-3">Exportar Datos</span>}
          </Button>
        </div>
      </nav>
    </div>
  )
} 