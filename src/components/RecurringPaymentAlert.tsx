"use client"

import { useState, useEffect } from "react"
import { Bell, CalendarIcon, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import Link from "next/link"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"

interface RecurringPayment {
  id: string | number
  nombre?: string
  concepto?: string
  monto: number
  proximoPago?: Date | string
  proximaFecha?: Date | string
  categoria?: string | any
  categoriaId?: string | number
  periodicidad?: string
  estado?: string
  comentario?: string
}

export function RecurringPaymentAlert() {
  const [paymentsToAlert, setPaymentsToAlert] = useState<RecurringPayment[]>([])
  const [debugInfo, setDebugInfo] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rawData, setRawData] = useState<any[]>([])

  useEffect(() => {
    // Función para extraer MES/DÍA de una fecha (ignorando el año)
    const getMonthDay = (dateStr: string): string => {
      try {
        // Para manejar formatos ISO completos (con T)
        if (dateStr.includes('T')) {
          dateStr = dateStr.split('T')[0]; // Tomar solo la parte de fecha
        }
        
        // Ahora extraer MM-DD de YYYY-MM-DD
        const parts = dateStr.split('-');
        if (parts.length >= 3) {
          // Devolver solo mes-día (ignorando el año)
          return `${parts[1]}-${parts[2]}`;
        }
        return "";
      } catch (e) {
        console.error("Error en getMonthDay:", e);
        return "";
      }
    };

    const fetchRecurringPayments = async () => {
      let logs: string[] = [];
      try {
        setLoading(true);
        setError(null);
        logs.push("🔍 Iniciando búsqueda de pagos recurrentes...");
        
        const response = await fetch("/api/recurrentes");
        if (!response.ok) {
          throw new Error("Error al obtener pagos recurrentes");
        }

        const data = await response.json();
        setRawData(data);
        logs.push(`📊 Recibidos ${data.length} pagos recurrentes`);
        
        // Fechas de referencia (hoy, mañana y pasado mañana) - solo MES/DÍA
        const today = new Date();
        const todayMonthDay = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        logs.push(`📅 Hoy (MM-DD): ${todayMonthDay}`);
        
        const tomorrow = new Date();
        tomorrow.setDate(today.getDate() + 1);
        const tomorrowMonthDay = `${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
        logs.push(`📅 Mañana (MM-DD): ${tomorrowMonthDay}`);
        
        const inTwoDays = new Date();
        inTwoDays.setDate(today.getDate() + 2);
        const inTwoDaysMonthDay = `${String(inTwoDays.getMonth() + 1).padStart(2, '0')}-${String(inTwoDays.getDate()).padStart(2, '0')}`;
        logs.push(`📅 Pasado mañana (MM-DD): ${inTwoDaysMonthDay}`);
        
        // Revisión detallada de cada pago con depuración - Comparando solo MES/DÍA
        let debugDetails: string[] = [];
        const upcomingPayments = data.filter((payment: any, index: number) => {
          try {
            const paymentInfo = `📝 [${index}] Pago '${payment.nombre || "Sin nombre"}':`;
            debugDetails.push(paymentInfo);
            
            // Registros completos para depuración
            debugDetails.push(`   🔍 Registro completo: ${JSON.stringify(payment)}`);
            
            // Verificar el campo correcto de fecha (proximaFecha en lugar de proximoPago)
            const fechaVencimiento = payment.proximaFecha || payment.proximoPago;

            if (!fechaVencimiento) {
              debugDetails.push(`   ❌ No tiene fecha de vencimiento`);
              return false;
            }
            
            // Intentar extraer la fecha
            let dateObj: Date;
            try {
              dateObj = new Date(fechaVencimiento);
              if (isNaN(dateObj.getTime())) {
                debugDetails.push(`   ❌ Fecha inválida: ${fechaVencimiento}`);
                return false;
              }
            } catch (e) {
              debugDetails.push(`   ❌ Error al parsear fecha: ${e}`);
              return false;
            }
            
            // Convertir a ISO y extraer solo mes-día
            const isoDate = dateObj.toISOString();
            debugDetails.push(`   ℹ️ Fecha ISO: ${isoDate}`);
            const paymentMonthDay = getMonthDay(isoDate);
            debugDetails.push(`   ✅ Fecha parseada (MM-DD): ${paymentMonthDay}`);
            
            // Comparar solo mes-día, ignorando el año
            const isUpcoming = 
              paymentMonthDay === todayMonthDay || 
              paymentMonthDay === tomorrowMonthDay || 
              paymentMonthDay === inTwoDaysMonthDay;
            
            debugDetails.push(`   ℹ️ Comparando: ${paymentMonthDay} con ${todayMonthDay}/${tomorrowMonthDay}/${inTwoDaysMonthDay}`);
            
            // Añadir resultado detallado
            if (isUpcoming) {
              debugDetails.push(`   ✅ ES PRÓXIMO a vencer`);
              
              // Detalles exactos de coincidencia
              if (paymentMonthDay === todayMonthDay) {
                debugDetails.push(`   📌 Coincide con HOY`);
              } else if (paymentMonthDay === tomorrowMonthDay) {
                debugDetails.push(`   📌 Coincide con MAÑANA`);
              } else {
                debugDetails.push(`   📌 Coincide con PASADO MAÑANA`);
              }
            } else {
              debugDetails.push(`   ❌ NO es próximo a vencer`);
            }
            
            return isUpcoming;
          } catch (err) {
            debugDetails.push(`❌ Error al procesar pago: ${err}`);
            return false;
          }
        });
        
        // Añadir detalles al log
        logs = [...logs, ...debugDetails];
        logs.push(`🔍 Se encontraron ${upcomingPayments.length} pagos próximos a vencer`);
        
        setPaymentsToAlert(upcomingPayments);
      } catch (error) {
        const errorMsg = `Error: ${error instanceof Error ? error.message : 'Desconocido'}`;
        logs.push(`❌ ${errorMsg}`);
        setError(errorMsg);
      } finally {
        setLoading(false);
        setDebugInfo(logs);
      }
    };

    fetchRecurringPayments();
  }, []);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-full">
          <Bell className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          {paymentsToAlert.length > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center bg-red-500 text-white" 
              variant="destructive"
            >
              {paymentsToAlert.length}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[350px] max-h-[500px] overflow-y-auto">
        <DropdownMenuLabel className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
          <Bell className="h-4 w-4 text-amber-500" />
          Pagos recurrentes próximos
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {loading ? (
          <div className="py-2 px-4 text-sm text-gray-500">Cargando...</div>
        ) : error ? (
          <div className="py-2 px-4 text-sm text-red-500">{error}</div>
        ) : paymentsToAlert.length === 0 ? (
          <>
            <div className="py-2 px-4 text-sm text-gray-500">No hay pagos próximos a vencer</div>
          </>
        ) : (
          paymentsToAlert.map((payment) => (
            <DropdownMenuItem key={payment.id} asChild className="py-2 px-4 cursor-pointer">
              <Link href={`/recurrentes/${payment.id}`}>
                <div className="flex flex-col w-full">
                  <div className="flex items-center justify-between w-full">
                    <span className="font-medium">{payment.nombre || payment.concepto || "Sin nombre"}</span>
                    <span className="font-medium text-amber-600">
                      ${typeof payment.monto === 'number' 
                        ? payment.monto.toLocaleString("es-AR") 
                        : Number(payment.monto).toLocaleString("es-AR")}
                    </span>
                  </div>
                  <div className="flex items-center text-xs text-gray-500 mt-1 gap-1">
                    <CalendarIcon className="h-3 w-3" />
                    {(payment.proximaFecha || payment.proximoPago) ? 
                      format(new Date(payment.proximaFecha || payment.proximoPago || ''), "dd 'de' MMMM", { locale: es }) : 
                      "Fecha no disponible"
                    }
                  </div>
                </div>
              </Link>
            </DropdownMenuItem>
          ))
        )}
        
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="cursor-pointer">
          <Link href="/recurrentes" className="flex justify-center text-sm text-blue-600 dark:text-blue-400">
            Ver todos los pagos recurrentes
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 