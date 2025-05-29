import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

export async function GET(request: NextRequest) {
  try {
    // Crear un nuevo workbook
    const workbook = XLSX.utils.book_new()

    // Definir los datos de ejemplo y headers para cada hoja

    // Hoja de Gastos
    const gastosHeaders = [
      'concepto', 'monto', 'fecha', 'categoria', 'tipoTransaccion', 'tipoMovimiento'
    ]
    const gastosExample = [
      ['Supermercado Carrefour', 15000, '15/01/2025', 'Alimentación', 'expense', 'tarjeta'],
      ['Sueldo enero', 500000, '01/01/2025', 'Salario', 'income', 'digital'],
      ['Nafta YPF', 25000, '10/01/2025', 'Transporte', 'expense', 'efectivo'],
      ['Factura de luz', 18000, '05/01/2025', 'Servicios', 'expense', 'digital'],
      ['Cena restaurant', 35000, '12/01/2025', 'Entretenimiento', 'expense', 'tarjeta']
    ]
    
    const gastosData = [gastosHeaders, ...gastosExample]
    const gastosSheet = XLSX.utils.aoa_to_sheet(gastosData)
    
    // Ajustar ancho de columnas
    gastosSheet['!cols'] = [
      { width: 25 }, // concepto
      { width: 12 }, // monto
      { width: 12 }, // fecha
      { width: 15 }, // categoria
      { width: 15 }, // tipoTransaccion
      { width: 15 }  // tipoMovimiento
    ]

    XLSX.utils.book_append_sheet(workbook, gastosSheet, 'Gastos')

    // Hoja de Gastos Recurrentes
    const recurrentesHeaders = [
      'concepto', 'monto', 'periodicidad', 'categoria', 'proximaFecha', 'comentario'
    ]
    const recurrentesExample = [
      ['Netflix', 2500, 'mensual', 'Entretenimiento', '15/02/2025', 'Suscripción premium'],
      ['Alquiler', 180000, 'mensual', 'Vivienda', '01/02/2025', 'Depto 2 amb'],
      ['Seguro auto', 45000, 'trimestral', 'Transporte', '15/03/2025', 'Cobertura completa'],
      ['Spotify', 1200, 'mensual', 'Entretenimiento', '20/02/2025', 'Plan individual']
    ]
    
    const recurrentesData = [recurrentesHeaders, ...recurrentesExample]
    const recurrentesSheet = XLSX.utils.aoa_to_sheet(recurrentesData)
    
    recurrentesSheet['!cols'] = [
      { width: 20 }, // concepto
      { width: 12 }, // monto
      { width: 15 }, // periodicidad
      { width: 15 }, // categoria
      { width: 15 }, // proximaFecha
      { width: 30 }  // comentario
    ]

    XLSX.utils.book_append_sheet(workbook, recurrentesSheet, 'Gastos Recurrentes')

    // Hoja de Presupuestos
    const presupuestosHeaders = [
      'nombre', 'monto', 'categoria', 'mes', 'año'
    ]
    const presupuestosExample = [
      ['Presupuesto Alimentación Enero', 80000, 'Alimentación', 1, 2025],
      ['Presupuesto Transporte Enero', 50000, 'Transporte', 1, 2025],
      ['Presupuesto Entretenimiento Enero', 30000, 'Entretenimiento', 1, 2025],
      ['Presupuesto Servicios Enero', 60000, 'Servicios', 1, 2025]
    ]
    
    const presupuestosData = [presupuestosHeaders, ...presupuestosExample]
    const presupuestosSheet = XLSX.utils.aoa_to_sheet(presupuestosData)
    
    presupuestosSheet['!cols'] = [
      { width: 30 }, // nombre
      { width: 12 }, // monto
      { width: 15 }, // categoria
      { width: 8 },  // mes
      { width: 8 }   // año
    ]

    XLSX.utils.book_append_sheet(workbook, presupuestosSheet, 'Presupuestos')

    // Hoja de Préstamos
    const prestamosHeaders = [
      'entidadFinanciera', 'tipoCredito', 'montoSolicitado', 'montoAprobado', 
      'montoDesembolsado', 'tasaInteres', 'plazoMeses', 'cuotaMensual',
      'fechaDesembolso', 'fechaPrimeraCuota', 'fechaVencimiento', 'proposito'
    ]
    const prestamosExample = [
      [
        'Banco Nación', 'Personal', 500000, 450000, 450000, 
        65.5, 36, 18500, '15/12/2024', '15/01/2025', '15/12/2027', 
        'Refacción de vivienda'
      ],
      [
        'Banco Galicia', 'Vehicular', 2000000, 1800000, 1800000, 
        55.2, 60, 48000, '10/11/2024', '10/12/2024', '10/11/2029', 
        'Compra de automóvil'
      ]
    ]
    
    const prestamosData = [prestamosHeaders, ...prestamosExample]
    const prestamosSheet = XLSX.utils.aoa_to_sheet(prestamosData)
    
    prestamosSheet['!cols'] = [
      { width: 20 }, // entidadFinanciera
      { width: 15 }, // tipoCredito
      { width: 15 }, // montoSolicitado
      { width: 15 }, // montoAprobado
      { width: 15 }, // montoDesembolsado
      { width: 12 }, // tasaInteres
      { width: 12 }, // plazoMeses
      { width: 15 }, // cuotaMensual
      { width: 15 }, // fechaDesembolso
      { width: 15 }, // fechaPrimeraCuota
      { width: 15 }, // fechaVencimiento
      { width: 25 }  // proposito
    ]

    XLSX.utils.book_append_sheet(workbook, prestamosSheet, 'Prestamos')

    // Hoja de Instrucciones
    const instruccionesData = [
      ['🚀 PLANTILLA DE IMPORTACIÓN DE DATOS FINANCIEROS'],
      [''],
      ['📋 INSTRUCCIONES GENERALES:'],
      ['• Complete solo las hojas que necesite importar'],
      ['• No elimine ni modifique los nombres de las columnas (primera fila)'],
      ['• Puede eliminar las filas de ejemplo y agregar sus propios datos'],
      ['• Los campos obligatorios están marcados con * en cada hoja'],
      [''],
      ['📅 FORMATO DE FECHAS:'],
      ['• Use formato DD/MM/AAAA (ejemplo: 15/01/2025)'],
      ['• Excel puede convertir automáticamente las fechas al formato correcto'],
      [''],
      ['💰 FORMATO DE MONTOS:'],
      ['• Use números sin separadores de miles'],
      ['• Use punto (.) como separador decimal si es necesario'],
      ['• Ejemplo correcto: 15000.50'],
      ['• Ejemplo incorrecto: 15,000.50'],
      [''],
      ['🏷️ CATEGORÍAS:'],
      ['• Las categorías se crearán automáticamente si no existen'],
      ['• Use nombres descriptivos y consistentes'],
      ['• Ejemplos: "Alimentación", "Transporte", "Servicios", "Entretenimiento"'],
      [''],
      ['📊 HOJA "GASTOS":'],
      ['• concepto*: Descripción del gasto o ingreso'],
      ['• monto*: Cantidad en pesos argentinos'],
      ['• fecha*: Fecha de la transacción (DD/MM/AAAA)'],
      ['• categoria*: Categoría del gasto'],
      ['• tipoTransaccion: "expense" (gasto) o "income" (ingreso)'],
      ['• tipoMovimiento: "efectivo", "digital", "ahorro", "tarjeta"'],
      [''],
      ['🔄 HOJA "GASTOS RECURRENTES":'],
      ['• concepto*: Descripción del gasto recurrente'],
      ['• monto*: Monto del gasto'],
      ['• periodicidad*: "mensual", "anual", "trimestral", "semestral"'],
      ['• categoria*: Categoría del gasto'],
      ['• proximaFecha: Próxima fecha de pago (opcional)'],
      ['• comentario: Observaciones adicionales (opcional)'],
      [''],
      ['💵 HOJA "PRESUPUESTOS":'],
      ['• nombre*: Nombre descriptivo del presupuesto'],
      ['• monto*: Monto presupuestado'],
      ['• categoria*: Categoría asociada'],
      ['• mes*: Número del mes (1-12)'],
      ['• año*: Año del presupuesto (2020-2030)'],
      [''],
      ['🏦 HOJA "PRESTAMOS":'],
      ['• entidadFinanciera*: Banco o entidad que otorga el préstamo'],
      ['• tipoCredito*: Tipo de crédito (personal, hipotecario, vehicular, etc.)'],
      ['• montoSolicitado*: Monto solicitado original'],
      ['• montoAprobado*: Monto aprobado por la entidad'],
      ['• montoDesembolsado*: Monto efectivamente recibido'],
      ['• tasaInteres*: Tasa de interés anual (%)'],
      ['• plazoMeses*: Plazo total en meses'],
      ['• cuotaMensual*: Valor de la cuota mensual'],
      ['• fechaDesembolso*: Fecha de recepción del dinero'],
      ['• fechaPrimeraCuota*: Fecha de la primera cuota'],
      ['• fechaVencimiento*: Fecha de finalización del préstamo'],
      ['• proposito: Para qué se destinó el préstamo (opcional)'],
      [''],
      ['⚠️ NOTAS IMPORTANTES:'],
      ['• Los campos marcados con * son obligatorios'],
      ['• Si hay errores en alguna fila, solo se importarán los datos válidos'],
      ['• Puede ver una vista previa de los datos antes de confirmar la importación'],
      ['• Las categorías nuevas se crearán automáticamente con el grupo "Importado"'],
      ['• Los presupuestos duplicados (misma categoría, mes y año) no se importarán'],
      [''],
      ['🎯 CONSEJOS:'],
      ['• Empiece con pocos registros para probar el sistema'],
      ['• Revise los datos antes de importar'],
      ['• Mantenga una copia de respaldo de sus datos'],
      ['• Si tiene dudas, contacte al soporte técnico'],
      [''],
      ['¡Gracias por usar nuestro sistema de gestión financiera! 🚀']
    ]

    const instruccionesSheet = XLSX.utils.aoa_to_sheet(instruccionesData)
    instruccionesSheet['!cols'] = [{ width: 80 }]
    XLSX.utils.book_append_sheet(workbook, instruccionesSheet, 'Instrucciones')

    // Generar el archivo Excel
    const excelBuffer = XLSX.write(workbook, { 
      type: 'buffer', 
      bookType: 'xlsx',
      compression: true 
    })

    // Configurar headers para la descarga
    const headers = new Headers()
    headers.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    headers.set('Content-Disposition', 'attachment; filename="plantilla-gastos-inicial.xlsx"')
    headers.set('Content-Length', excelBuffer.length.toString())

    return new NextResponse(excelBuffer, {
      status: 200,
      headers
    })

  } catch (error) {
    console.error('Error generando plantilla:', error)
    return NextResponse.json({ 
      error: 'Error al generar la plantilla Excel' 
    }, { status: 500 })
  }
} 