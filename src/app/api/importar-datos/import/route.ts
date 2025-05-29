import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { options as authOptions } from '@/app/api/auth/[...nextauth]/options'
import * as XLSX from 'xlsx'
import { z } from 'zod'
import prisma from '@/lib/prisma'

// Reutilizar los esquemas de validación de la API preview
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

// Función para convertir fecha DD/MM/YYYY a Date
function parseDate(dateString: string): Date {
  if (!dateString) return new Date()
  
  const [day, month, year] = dateString.split('/')
  return new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
}

// Función para parsear fechas de Excel (reutilizada de preview)
function parseExcelDate(value: any): string {
  if (!value) return ''
  
  if (typeof value === 'string') {
    const dateFormats = [
      /^\d{1,2}\/\d{1,2}\/\d{4}$/,
      /^\d{4}-\d{1,2}-\d{1,2}$/,
    ]
    
    if (dateFormats.some(format => format.test(value))) {
      if (value.includes('-')) {
        const [year, month, day] = value.split('-')
        return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`
      }
      return value
    }
  }
  
  if (typeof value === 'number') {
    const date = XLSX.SSF.parse_date_code(value)
    if (date) {
      return `${date.d.toString().padStart(2, '0')}/${date.m.toString().padStart(2, '0')}/${date.y}`
    }
  }
  
  if (value instanceof Date) {
    const day = value.getDate().toString().padStart(2, '0')
    const month = (value.getMonth() + 1).toString().padStart(2, '0')
    const year = value.getFullYear()
    return `${day}/${month}/${year}`
  }
  
  return value.toString()
}

function cleanCellData(data: any): any {
  if (data === null || data === undefined) return undefined
  if (typeof data === 'string') return data.trim()
  return data
}

// Funciones de procesamiento (reutilizadas de preview pero simplificadas)
function processGastosSheet(worksheet: XLSX.WorkSheet): { data: any[], errors: string[] } {
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
  const data: any[] = []
  const errors: string[] = []
  
  if (jsonData.length < 2) return { data, errors }
  
  for (let i = 1; i < jsonData.length; i++) {
    const row = jsonData[i] as any[]
    if (!row || row.every(cell => !cell)) continue
    
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

function processGastosRecurrentesSheet(worksheet: XLSX.WorkSheet): { data: any[], errors: string[] } {
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
  const data: any[] = []
  const errors: string[] = []
  
  if (jsonData.length < 2) return { data, errors }
  
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

function processPresupuestosSheet(worksheet: XLSX.WorkSheet): { data: any[], errors: string[] } {
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
  const data: any[] = []
  const errors: string[] = []
  
  if (jsonData.length < 2) return { data, errors }
  
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

function processPrestamosSheet(worksheet: XLSX.WorkSheet): { data: any[], errors: string[] } {
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
  const data: any[] = []
  const errors: string[] = []
  
  if (jsonData.length < 2) return { data, errors }
  
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

// Función para obtener o crear una categoría
async function getOrCreateCategory(categoryName: string): Promise<number> {
  let category = await prisma.categoria.findFirst({
    where: {
      descripcion: {
        equals: categoryName,
        mode: 'insensitive'
      }
    }
  })

  if (!category) {
    category = await prisma.categoria.create({
      data: {
        descripcion: categoryName,
        status: true,
        grupo_categoria: 'Importado'
      }
    })
  }

  return category.id
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const userId = session.user.id
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No se encontró archivo' }, { status: 400 })
    }

    // Leer el archivo Excel
    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    const sheets = workbook.SheetNames

    const result = {
      success: true,
      errors: [] as string[],
      imported: {
        gastos: 0,
        gastosRecurrentes: 0,
        presupuestos: 0,
        prestamos: 0
      }
    }

    // Usar transacción para garantizar atomicidad
    await prisma.$transaction(async (tx) => {
      // Procesar gastos
      const gastosSheet = sheets.find(name => 
        name.toLowerCase().includes('gasto') && !name.toLowerCase().includes('recurrente')
      )
      if (gastosSheet && workbook.Sheets[gastosSheet]) {
        const gastosResult = processGastosSheet(workbook.Sheets[gastosSheet])
        result.errors.push(...gastosResult.errors)

        for (const gasto of gastosResult.data) {
          try {
            const categoriaId = await getOrCreateCategory(gasto.categoria)
            
            await tx.gasto.create({
              data: {
                concepto: gasto.concepto,
                monto: gasto.monto,
                fecha: parseDate(gasto.fecha),
                categoria: gasto.categoria,
                tipoTransaccion: gasto.tipoTransaccion,
                tipoMovimiento: gasto.tipoMovimiento,
                categoriaId,
                userId
              }
            })
            result.imported.gastos++
          } catch (error) {
            result.errors.push(`Error al importar gasto "${gasto.concepto}": ${error instanceof Error ? error.message : 'Error desconocido'}`)
          }
        }
      }

      // Procesar gastos recurrentes
      const recurrentesSheet = sheets.find(name => 
        name.toLowerCase().includes('recurrente') || name.toLowerCase().includes('mensual')
      )
      if (recurrentesSheet && workbook.Sheets[recurrentesSheet]) {
        const recurrentesResult = processGastosRecurrentesSheet(workbook.Sheets[recurrentesSheet])
        result.errors.push(...recurrentesResult.errors)

        for (const recurrente of recurrentesResult.data) {
          try {
            const categoriaId = await getOrCreateCategory(recurrente.categoria)
            
            await tx.gastoRecurrente.create({
              data: {
                concepto: recurrente.concepto,
                monto: recurrente.monto,
                periodicidad: recurrente.periodicidad,
                categoriaId,
                userId,
                proximaFecha: recurrente.proximaFecha ? parseDate(recurrente.proximaFecha) : null,
                comentario: recurrente.comentario,
                estado: 'pendiente'
              }
            })
            result.imported.gastosRecurrentes++
          } catch (error) {
            result.errors.push(`Error al importar gasto recurrente "${recurrente.concepto}": ${error instanceof Error ? error.message : 'Error desconocido'}`)
          }
        }
      }

      // Procesar presupuestos
      const presupuestosSheet = sheets.find(name => 
        name.toLowerCase().includes('presupuesto')
      )
      if (presupuestosSheet && workbook.Sheets[presupuestosSheet]) {
        const presupuestosResult = processPresupuestosSheet(workbook.Sheets[presupuestosSheet])
        result.errors.push(...presupuestosResult.errors)

        for (const presupuesto of presupuestosResult.data) {
          try {
            const categoriaId = await getOrCreateCategory(presupuesto.categoria)
            
            // Verificar si ya existe un presupuesto para esa categoría en ese mes/año
            const existingPresupuesto = await tx.presupuesto.findFirst({
              where: {
                userId,
                categoriaId,
                mes: presupuesto.mes,
                año: presupuesto.año
              }
            })

            if (existingPresupuesto) {
              result.errors.push(`Ya existe un presupuesto para "${presupuesto.categoria}" en ${presupuesto.mes}/${presupuesto.año}`)
              continue
            }
            
            await tx.presupuesto.create({
              data: {
                nombre: presupuesto.nombre,
                monto: presupuesto.monto,
                mes: presupuesto.mes,
                año: presupuesto.año,
                categoriaId,
                userId
              }
            })
            result.imported.presupuestos++
          } catch (error) {
            result.errors.push(`Error al importar presupuesto "${presupuesto.nombre}": ${error instanceof Error ? error.message : 'Error desconocido'}`)
          }
        }
      }

      // Procesar préstamos
      const prestamosSheet = sheets.find(name => 
        name.toLowerCase().includes('prestamo') || name.toLowerCase().includes('credito')
      )
      if (prestamosSheet && workbook.Sheets[prestamosSheet]) {
        const prestamosResult = processPrestamosSheet(workbook.Sheets[prestamosSheet])
        result.errors.push(...prestamosResult.errors)

        for (const prestamo of prestamosResult.data) {
          try {
            const saldoActual = prestamo.montoDesembolsado
            const cuotasPendientes = prestamo.plazoMeses
            
            await tx.prestamo.create({
              data: {
                entidadFinanciera: prestamo.entidadFinanciera,
                tipoCredito: prestamo.tipoCredito,
                montoSolicitado: prestamo.montoSolicitado,
                montoAprobado: prestamo.montoAprobado,
                montoDesembolsado: prestamo.montoDesembolsado,
                saldoActual,
                tasaInteres: prestamo.tasaInteres,
                plazoMeses: prestamo.plazoMeses,
                cuotaMensual: prestamo.cuotaMensual,
                cuotasPagadas: 0,
                cuotasPendientes,
                fechaDesembolso: parseDate(prestamo.fechaDesembolso),
                fechaPrimeraCuota: parseDate(prestamo.fechaPrimeraCuota),
                fechaVencimiento: parseDate(prestamo.fechaVencimiento),
                proposito: prestamo.proposito,
                estado: 'activo',
                userId
              }
            })
            result.imported.prestamos++
          } catch (error) {
            result.errors.push(`Error al importar préstamo de "${prestamo.entidadFinanciera}": ${error instanceof Error ? error.message : 'Error desconocido'}`)
          }
        }
      }
    })

    return NextResponse.json(result)

  } catch (error) {
    console.error('Error en importación:', error)
    return NextResponse.json({ 
      error: 'Error al importar los datos' 
    }, { status: 500 })
  }
} 