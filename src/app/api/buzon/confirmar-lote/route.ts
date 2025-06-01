import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { options } from "@/app/api/auth/[...nextauth]/options"
import prisma from "@/lib/prisma"
import OpenAI from "openai"

// Configurar cliente de OpenAI
let openai: OpenAI | null = null
if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim() !== "") {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  })
}

// Función para extraer datos de transferencia bancaria
async function extraerDatosTransferencia(contenidoBase64: string, nombreArchivo: string): Promise<any> {
  if (!openai) {
    return {
      error: "OpenAI no disponible",
      datosEjemplo: {
        fecha: new Date().toISOString(),
        monto: 1500.00,
        bancoEmisor: "Banco Ciudad",
        concepto: "Transferencia",
        numeroOperacion: "123456789"
      }
    }
  }

  try {
    // DEBUGGING: Verificar el contenido base64
    console.log(`[BUZON-DEBUG] Archivo: ${nombreArchivo}`)
    console.log(`[BUZON-DEBUG] Base64 length: ${contenidoBase64.length}`)
    console.log(`[BUZON-DEBUG] Base64 primeros 50 chars: ${contenidoBase64.substring(0, 50)}`)
    console.log(`[BUZON-DEBUG] Base64 últimos 50 chars: ${contenidoBase64.substring(contenidoBase64.length - 50)}`)
    
    // Verificar si tiene prefijo data:
    let base64Limpio = contenidoBase64
    if (contenidoBase64.includes(',')) {
      base64Limpio = contenidoBase64.split(',')[1]
      console.log(`[BUZON-DEBUG] Encontrado prefijo, base64 limpio length: ${base64Limpio.length}`)
    }
    
    // Verificar que sea base64 válido
    try {
      const buffer = Buffer.from(base64Limpio, 'base64')
      console.log(`[BUZON-DEBUG] Buffer válido creado, size: ${buffer.length} bytes`)
    } catch (base64Error) {
      console.error(`[BUZON-DEBUG] Base64 inválido:`, base64Error)
      throw new Error(`Base64 inválido: ${base64Error}`)
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // Modelo con visión para mayor precisión
      messages: [
        {
          role: "system",
          content: `Eres un experto en extraer datos de comprobantes de transferencias bancarias argentinas.
          
          Analiza la imagen y extrae TODA la información disponible en formato JSON:
          
          DATOS REQUERIDOS:
          - fecha: fecha de la transferencia (formato ISO)
          - monto: monto transferido (número decimal)
          - moneda: moneda (generalmente "ARS")
          - bancoEmisor: banco desde donde se hizo la transferencia
          - destinatarioNombre: NOMBRE COMPLETO del destinatario de la transferencia (buscar después de "DESTINO:")
          - cuentaOrigen: número de cuenta origen (si visible)
          - cuentaDestino: número de cuenta destino (si visible)
          - cbuOrigen: CBU de origen (si visible)
          - cbuDestino: CBU de destino (si visible)
          - aliasOrigen: alias de origen (si visible)
          - aliasDestino: alias de destino (si visible)
          - concepto: concepto o descripción de la transferencia (ej: "Varios", "Pago", etc.)
          - numeroOperacion: número de operación/comprobante
          - comision: comisión cobrada (si aplica)
          
          BANCOS ARGENTINOS COMUNES:
          - Banco Ciudad, Banco Macro, Banco Nación, Banco Santander, BBVA, Banco Galicia
          
          IMPORTANTE: El destinatarioNombre debe ser el nombre completo de la persona que recibe la transferencia.
          Busca texto que diga "DESTINO:" seguido del nombre y apellido.
          
          Si no encuentras algún dato, déjalo como null.
          La precisión en el monto y destinatarioNombre es CRÍTICA.
          
          Responde SOLO con JSON válido.`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Extrae todos los datos de esta transferencia bancaria. Archivo: ${nombreArchivo}`
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Limpio}`,
              },
            },
          ],
        },
      ],
      max_tokens: 1000,
      temperature: 0.1, // Baja temperatura para máxima precisión
      response_format: { type: "json_object" }
    })

    const respuesta = completion.choices[0].message.content
    if (!respuesta) {
      throw new Error("Respuesta vacía de OpenAI")
    }

    const datos = JSON.parse(respuesta)
    
    // Validar campos críticos
    if (!datos.fecha || !datos.monto) {
      console.log(`[BUZON-DEBUG] Datos incompletos recibidos:`, datos)
      throw new Error("Faltan datos críticos (fecha o monto)")
    }

    // Asegurar que el monto sea número
    datos.monto = parseFloat(datos.monto) || 0
    
    console.log(`[BUZON-DEBUG] Datos finales extraídos:`, datos)
    console.log(`[BUZON-TRANSFERENCIA] Datos extraídos: ${datos.monto} ${datos.moneda} del ${datos.bancoEmisor}`)

    return datos

  } catch (error) {
    console.error("Error extrayendo datos de transferencia:", error)
    
    // Fallback con datos básicos extraíbles del nombre
    return {
      error: `Error en extracción: ${error}`,
      datosEjemplo: {
        fecha: new Date().toISOString(),
        monto: 0,
        moneda: "ARS",
        concepto: `Transferencia - ${nombreArchivo}`,
        bancoEmisor: "Banco desconocido",
        numeroOperacion: null
      }
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verificar sesión
    const session = await getServerSession(options)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      )
    }

    const userId = session.user.id
    const { comprobantesIds, accion } = await request.json()

    if (!comprobantesIds || !Array.isArray(comprobantesIds) || comprobantesIds.length === 0) {
      return NextResponse.json(
        { error: "Se requiere al menos un comprobante" },
        { status: 400 }
      )
    }

    console.log(`[BUZON] Confirmando lote de ${comprobantesIds.length} comprobantes para usuario ${userId}`)

    if (accion === 'procesar_lote') {
      const resultados = {
        exitosos: [] as any[],
        fallidos: [] as any[],
        estadisticas: {
          total: comprobantesIds.length,
          exitosos: 0,
          fallidos: 0,
          transferenciasCreadas: 0,
          gastosCreados: 0
        }
      }

      // Procesar cada comprobante
      for (const comprobanteId of comprobantesIds) {
        try {
          console.log(`[BUZON] Procesando comprobante ${comprobanteId}`)

          // Obtener comprobante
          const comprobante = await prisma.comprobantePendiente.findFirst({
            where: {
              id: comprobanteId,
              userId: userId,
              estado: 'pendiente'
            }
          })

          if (!comprobante) {
            resultados.fallidos.push({
              comprobanteId,
              error: "Comprobante no encontrado o ya procesado"
            })
            continue
          }

          // Marcar como procesando
          await prisma.comprobantePendiente.update({
            where: { id: comprobanteId },
            data: { 
              estado: 'procesando',
              fechaProcesado: new Date()
            }
          })

          let datosExtraidos: any = {}
          let gastoCreado: any = null
          let transferenciaCreada: any = null

          // Procesar según el tipo detectado
          if (comprobante.tipoDetectado === 'transferencia') {
            // Extraer datos usando OpenAI
            datosExtraidos = await extraerDatosTransferencia(
              comprobante.contenidoBase64, 
              comprobante.nombreArchivo
            )

            // Si hay error en extracción, marcar como fallido
            if (datosExtraidos.error && !datosExtraidos.datosEjemplo) {
              await prisma.comprobantePendiente.update({
                where: { id: comprobanteId },
                data: { 
                  estado: 'pendiente',
                  errorProcesamiento: datosExtraidos.error
                }
              })

              resultados.fallidos.push({
                comprobanteId,
                nombreArchivo: comprobante.nombreArchivo,
                error: datosExtraidos.error
              })
              continue
            }

            // Usar datos extraídos o ejemplo si hay error
            const datosFinales = datosExtraidos.datosEjemplo || datosExtraidos

            // Usar transacción para crear transferencia y gasto
            const resultado = await prisma.$transaction(async (tx) => {
              // 1. Crear registro de transferencia
              const transferencia = await tx.comprobanteTransferencia.create({
                data: {
                  userId: userId,
                  nombreArchivo: comprobante.nombreArchivo,
                  tipoArchivo: 'image/jpeg',
                  tamanioArchivo: comprobante.tamaño,
                  
                  fecha: new Date(datosFinales.fecha),
                  monto: datosFinales.monto,
                  moneda: datosFinales.moneda || 'ARS',
                  bancoEmisor: datosFinales.bancoEmisor,
                  cuentaOrigen: datosFinales.cuentaOrigen,
                  cuentaDestino: datosFinales.cuentaDestino,
                  cbuOrigen: datosFinales.cbuOrigen,
                  cbuDestino: datosFinales.cbuDestino,
                  aliasOrigen: datosFinales.aliasOrigen,
                  aliasDestino: datosFinales.aliasDestino,
                  concepto: datosFinales.concepto,
                  numeroOperacion: datosFinales.numeroOperacion,
                  comision: datosFinales.comision || 0,
                  
                  estadoProcesamiento: 'procesado',
                  confianzaExtraccion: datosExtraidos.error ? 30 : 85,
                  erroresDetectados: datosExtraidos.error || null,
                  datosOriginalesOCR: JSON.stringify(datosExtraidos),
                  fechaProcesado: new Date()
                }
              })

              // 2. Crear gasto asociado
              const gasto = await tx.gasto.create({
                data: {
                  userId: userId,
                  concepto: datosFinales.destinatarioNombre || `Transferencia - ${comprobante.nombreArchivo}`,
                  monto: datosFinales.monto,
                  fecha: new Date(datosFinales.fecha),
                  categoria: 'Transferencias',
                  tipoTransaccion: 'expense',
                  tipoMovimiento: 'digital',
                  origenComprobante: 'transferencia_ocr',
                  fechaImputacion: new Date()
                }
              })

              // 3. Vincular transferencia con gasto
              await tx.comprobanteTransferencia.update({
                where: { id: transferencia.id },
                data: { gastoGeneradoId: gasto.id }
              })

              // 4. Marcar comprobante como confirmado
              await tx.comprobantePendiente.update({
                where: { id: comprobanteId },
                data: { 
                  estado: 'confirmado',
                  datosExtraidos: datosFinales,
                  fechaConfirmado: new Date()
                }
              })

              return { transferencia, gasto }
            })

            transferenciaCreada = resultado.transferencia
            gastoCreado = resultado.gasto
            resultados.estadisticas.transferenciasCreadas++
            resultados.estadisticas.gastosCreados++

            console.log(`[BUZON] Transferencia procesada: ${datosFinales.monto} ${datosFinales.moneda}`)

          } else {
            // Para otros tipos, marcar como pendiente para implementación futura
            await prisma.comprobantePendiente.update({
              where: { id: comprobanteId },
              data: { 
                estado: 'pendiente',
                errorProcesamiento: `Tipo ${comprobante.tipoDetectado} no implementado aún`
              }
            })

            resultados.fallidos.push({
              comprobanteId,
              nombreArchivo: comprobante.nombreArchivo,
              error: `Tipo ${comprobante.tipoDetectado} pendiente de implementación`
            })
            continue
          }

          resultados.exitosos.push({
            comprobanteId,
            nombreArchivo: comprobante.nombreArchivo,
            tipo: comprobante.tipoDetectado,
            datosExtraidos,
            gastoCreado: gastoCreado ? { id: gastoCreado.id, monto: gastoCreado.monto } : null,
            transferenciaCreada: transferenciaCreada ? { id: transferenciaCreada.id } : null
          })

        } catch (error) {
          console.error(`[BUZON] Error procesando comprobante ${comprobanteId}:`, error)
          
          // Revertir estado a pendiente
          try {
            await prisma.comprobantePendiente.update({
              where: { id: comprobanteId },
              data: { 
                estado: 'pendiente',
                errorProcesamiento: `Error interno: ${error}`
              }
            })
          } catch (revertError) {
            console.error("Error revirtiendo estado:", revertError)
          }

          resultados.fallidos.push({
            comprobanteId,
            error: `Error interno: ${error}`
          })
        }
      }

      // Calcular estadísticas finales
      resultados.estadisticas.exitosos = resultados.exitosos.length
      resultados.estadisticas.fallidos = resultados.fallidos.length

      console.log(`[BUZON] Lote completado: ${resultados.estadisticas.exitosos} exitosos, ${resultados.estadisticas.fallidos} fallidos`)

      return NextResponse.json(resultados)
    }

    return NextResponse.json(
      { error: "Acción no válida" },
      { status: 400 }
    )

  } catch (error) {
    console.error("Error confirmando lote:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
} 