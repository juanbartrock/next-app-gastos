import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { options as authOptions } from '@/app/api/auth/[...nextauth]/options'
import * as XLSX from 'xlsx'
import { z } from 'zod'

// Esquemas de validación para cada tipo de dato
const GastoSchema = z.object({
  concepto: z.string().min(1, 'El concepto es obligatorio'),
  monto: z.number().positive('El monto debe ser positivo'),
  fecha: z.string().min(1, 'La fecha es obligatoria'),
  categoria: z.string().min(1, 'La categoría es obligatoria'),
  tipoTransaccion: z.enum(['income', 'expense']).default('expense'),
  tipoMovimiento: z.enum(['efectivo', 'digital', 'ahorro', 'tarjeta']).default('efectivo'),
})

const GastoRecurrenteSchema = z.object({
  concepto: z.string().min(1, 'El concepto es obligatorio'),
  monto: z.number().positive('El monto debe ser positivo'),
  periodicidad: z.enum(['mensual', 'anual', 'trimestral', 'semestral']),
  categoria: z.string().min(1, 'La categoría es obligatoria'),
  proximaFecha: z.string().optional(),
  comentario: z.string().optional(),
})

const PresupuestoSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  monto: z.number().positive('El monto debe ser positivo'),
  categoria: z.string().min(1, 'La categoría es obligatoria'),
  mes: z.number().min(1).max(12),
  año: z.number().min(2020).max(2030),
})

const PrestamoSchema = z.object({
  entidadFinanciera: z.string().min(1, 'La entidad financiera es obligatoria'),
  tipoCredito: z.string().min(1, 'El tipo de crédito es obligatorio'),
  montoSolicitado: z.number().positive('El monto debe ser positivo'),
  montoAprobado: z.number().positive('El monto debe ser positivo'),
  montoDesembolsado: z.number().positive('El monto debe ser positivo'),
  tasaInteres: z.number().positive('La tasa de interés debe ser positiva'),
  plazoMeses: z.number().positive('El plazo debe ser positivo'),
  cuotaMensual: z.number().positive('La cuota mensual debe ser positiva'),
  fechaDesembolso: z.string().min(1, 'La fecha de desembolso es obligatoria'),
  fechaPrimeraCuota: z.string().min(1, 'La fecha de primera cuota es obligatoria'),
  fechaVencimiento: z.string().min(1, 'La fecha de vencimiento es obligatoria'),
  proposito: z.string().optional(),
})

// Función para convertir fechas de Excel a formato DD/MM/YYYY
function parseExcelDate(value: any): string {
  if (!value) return ''
  
  // Si ya es una cadena, asumimos que está en formato correcto
  if (typeof value === 'string') {
    // Intentar parsear diferentes formatos
    const dateFormats = [
      /^\d{1,2}\/\d{1,2}\/\d{4}$/, // DD/MM/YYYY
      /^\d{4}-\d{1,2}-\d{1,2}$/, // YYYY-MM-DD
    ]
    
    if (dateFormats.some(format => format.test(value))) {
      if (value.includes('-')) {
        // Convertir YYYY-MM-DD a DD/MM/YYYY
        const [year, month, day] = value.split('-')
        return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`
      }
      return value
    }
  }
  
  // Si es un número (fecha serial de Excel)
  if (typeof value === 'number') {
    const date = XLSX.SSF.parse_date_code(value)
    if (date) {
      return `${date.d.toString().padStart(2, '0')}/${date.m.toString().padStart(2, '0')}/${date.y}`
    }
  }
  
  // Si es un objeto Date
  if (value instanceof Date) {
    const day = value.getDate().toString().padStart(2, '0')
    const month = (value.getMonth() + 1).toString().padStart(2, '0')
    const year = value.getFullYear()
    return `${day}/${month}/${year}`
  }
  
  return value.toString()
}

// Función para limpiar y convertir datos de las celdas
function cleanCellData(data: any): any {
  if (data === null || data === undefined) return undefined
  if (typeof data === 'string') return data.trim()
  return data
}

// Función para procesar hoja de gastos
function processGastosSheet(worksheet: XLSX.WorkSheet): { data: any[], errors: string[] } {
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
  const data: any[] = []
  const errors: string[] = []
  
  if (jsonData.length < 2) {
    return { data, errors: ['La hoja de gastos está vacía o no tiene datos'] }
  }
  
  const headers = jsonData[0] as string[]
  const expectedHeaders = ['concepto', 'monto', 'fecha', 'categoria', 'tipoTransaccion', 'tipoMovimiento']
  
  // Verificar headers
  const missingHeaders = expectedHeaders.filter(h => 
    !headers.some(header => header && header.toLowerCase().includes(h.toLowerCase()))
  )
  
  if (missingHeaders.length > 0) {
    errors.push(`Faltan columnas en la hoja de gastos: ${missingHeaders.join(', ')}`)
  }
  
  // Procesar filas de datos
  for (let i = 1; i < jsonData.length; i++) {
    const row = jsonData[i] as any[]
    if (!row || row.every(cell => !cell)) continue // Saltar filas vacías
    
    try {
      const rowData = {
        concepto: cleanCellData(row[0]),
        monto: typeof row[1] === 'number' ? row[1] : parseFloat(row[1]?.toString().replace(',', '.') || '0'),
        fecha: parseExcelDate(row[2]),
        categoria: cleanCellData(row[3]),
        tipoTransaccion: cleanCellData(row[4]) || 'expense',
        tipoMovimiento: cleanCellData(row[5]) || 'efectivo',
      }
      
      const validation = GastoSchema.safeParse(rowData)
      if (validation.success) {
        data.push(validation.data)
      } else {
        errors.push(`Fila ${i + 1} en gastos: ${validation.error.errors.map(e => e.message).join(', ')}`)
      }
    } catch (error) {
      errors.push(`Error en fila ${i + 1} de gastos: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    }
  }
  
  return { data, errors }
}

// Función para procesar hoja de gastos recurrentes
function processGastosRecurrentesSheet(worksheet: XLSX.WorkSheet): { data: any[], errors: string[] } {
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
  const data: any[] = []
  const errors: string[] = []
  
  if (jsonData.length < 2) {
    return { data, errors: ['La hoja de gastos recurrentes está vacía o no tiene datos'] }
  }
  
  // Procesar filas de datos
  for (let i = 1; i < jsonData.length; i++) {
    const row = jsonData[i] as any[]
    if (!row || row.every(cell => !cell)) continue
    
    try {
      const rowData = {
        concepto: cleanCellData(row[0]),
        monto: typeof row[1] === 'number' ? row[1] : parseFloat(row[1]?.toString().replace(',', '.') || '0'),
        periodicidad: cleanCellData(row[2]) || 'mensual',
        categoria: cleanCellData(row[3]),
        proximaFecha: parseExcelDate(row[4]),
        comentario: cleanCellData(row[5]),
      }
      
      const validation = GastoRecurrenteSchema.safeParse(rowData)
      if (validation.success) {
        data.push(validation.data)
      } else {
        errors.push(`Fila ${i + 1} en gastos recurrentes: ${validation.error.errors.map(e => e.message).join(', ')}`)
      }
    } catch (error) {
      errors.push(`Error en fila ${i + 1} de gastos recurrentes: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    }
  }
  
  return { data, errors }
}

// Función para procesar hoja de presupuestos
function processPresupuestosSheet(worksheet: XLSX.WorkSheet): { data: any[], errors: string[] } {
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
  const data: any[] = []
  const errors: string[] = []
  
  if (jsonData.length < 2) {
    return { data, errors: ['La hoja de presupuestos está vacía o no tiene datos'] }
  }
  
  for (let i = 1; i < jsonData.length; i++) {
    const row = jsonData[i] as any[]
    if (!row || row.every(cell => !cell)) continue
    
    try {
      const rowData = {
        nombre: cleanCellData(row[0]),
        monto: typeof row[1] === 'number' ? row[1] : parseFloat(row[1]?.toString().replace(',', '.') || '0'),
        categoria: cleanCellData(row[2]),
        mes: typeof row[3] === 'number' ? row[3] : parseInt(row[3]?.toString() || '1'),
        año: typeof row[4] === 'number' ? row[4] : parseInt(row[4]?.toString() || new Date().getFullYear().toString()),
      }
      
      const validation = PresupuestoSchema.safeParse(rowData)
      if (validation.success) {
        data.push(validation.data)
      } else {
        errors.push(`Fila ${i + 1} en presupuestos: ${validation.error.errors.map(e => e.message).join(', ')}`)
      }
    } catch (error) {
      errors.push(`Error en fila ${i + 1} de presupuestos: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    }
  }
  
  return { data, errors }
}

// Función para procesar hoja de préstamos
function processPrestamosSheet(worksheet: XLSX.WorkSheet): { data: any[], errors: string[] } {
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
  const data: any[] = []
  const errors: string[] = []
  
  if (jsonData.length < 2) {
    return { data, errors: ['La hoja de préstamos está vacía o no tiene datos'] }
  }
  
  for (let i = 1; i < jsonData.length; i++) {
    const row = jsonData[i] as any[]
    if (!row || row.every(cell => !cell)) continue
    
    try {
      const monto = typeof row[2] === 'number' ? row[2] : parseFloat(row[2]?.toString().replace(',', '.') || '0')
      
      const rowData = {
        entidadFinanciera: cleanCellData(row[0]),
        tipoCredito: cleanCellData(row[1]),
        montoSolicitado: monto,
        montoAprobado: typeof row[3] === 'number' ? row[3] : parseFloat(row[3]?.toString().replace(',', '.') || monto.toString()),
        montoDesembolsado: typeof row[4] === 'number' ? row[4] : parseFloat(row[4]?.toString().replace(',', '.') || monto.toString()),
        tasaInteres: typeof row[5] === 'number' ? row[5] : parseFloat(row[5]?.toString().replace(',', '.') || '0'),
        plazoMeses: typeof row[6] === 'number' ? row[6] : parseInt(row[6]?.toString() || '12'),
        cuotaMensual: typeof row[7] === 'number' ? row[7] : parseFloat(row[7]?.toString().replace(',', '.') || '0'),
        fechaDesembolso: parseExcelDate(row[8]),
        fechaPrimeraCuota: parseExcelDate(row[9]),
        fechaVencimiento: parseExcelDate(row[10]),
        proposito: cleanCellData(row[11]),
      }
      
      const validation = PrestamoSchema.safeParse(rowData)
      if (validation.success) {
        data.push(validation.data)
      } else {
        errors.push(`Fila ${i + 1} en préstamos: ${validation.error.errors.map(e => e.message).join(', ')}`)
      }
    } catch (error) {
      errors.push(`Error en fila ${i + 1} de préstamos: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    }
  }
  
  return { data, errors }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No se encontró archivo' }, { status: 400 })
    }

    // Leer el archivo Excel
    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: 'buffer' })

    const preview = {
      gastos: [] as any[],
      gastosRecurrentes: [] as any[],
      presupuestos: [] as any[],
      prestamos: [] as any[]
    }

    const allErrors: string[] = []

    // Procesar cada hoja si existe
    const sheets = workbook.SheetNames

    // Buscar hoja de gastos
    const gastosSheet = sheets.find(name => 
      name.toLowerCase().includes('gasto') && !name.toLowerCase().includes('recurrente')
    )
    if (gastosSheet && workbook.Sheets[gastosSheet]) {
      const result = processGastosSheet(workbook.Sheets[gastosSheet])
      preview.gastos = result.data
      allErrors.push(...result.errors)
    }

    // Buscar hoja de gastos recurrentes
    const recurrentesSheet = sheets.find(name => 
      name.toLowerCase().includes('recurrente') || name.toLowerCase().includes('mensual')
    )
    if (recurrentesSheet && workbook.Sheets[recurrentesSheet]) {
      const result = processGastosRecurrentesSheet(workbook.Sheets[recurrentesSheet])
      preview.gastosRecurrentes = result.data
      allErrors.push(...result.errors)
    }

    // Buscar hoja de presupuestos
    const presupuestosSheet = sheets.find(name => 
      name.toLowerCase().includes('presupuesto')
    )
    if (presupuestosSheet && workbook.Sheets[presupuestosSheet]) {
      const result = processPresupuestosSheet(workbook.Sheets[presupuestosSheet])
      preview.presupuestos = result.data
      allErrors.push(...result.errors)
    }

    // Buscar hoja de préstamos
    const prestamosSheet = sheets.find(name => 
      name.toLowerCase().includes('prestamo') || name.toLowerCase().includes('credito')
    )
    if (prestamosSheet && workbook.Sheets[prestamosSheet]) {
      const result = processPrestamosSheet(workbook.Sheets[prestamosSheet])
      preview.prestamos = result.data
      allErrors.push(...result.errors)
    }

    // Si no se encontraron hojas válidas
    if (sheets.length === 0) {
      return NextResponse.json({ 
        error: 'El archivo Excel no contiene hojas válidas' 
      }, { status: 400 })
    }

    return NextResponse.json({
      preview,
      errors: allErrors,
      sheetsFound: sheets
    })

  } catch (error) {
    console.error('Error en preview:', error)
    return NextResponse.json({ 
      error: 'Error al procesar el archivo Excel' 
    }, { status: 500 })
  }
} 