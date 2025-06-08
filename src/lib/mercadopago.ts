import { MercadoPagoConfig, Payment, Preference } from 'mercadopago'

// ✅ CONFIGURACIÓN MERCADOPAGO ARGENTINA (OPCIONAL)
const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN
const publicKey = process.env.MERCADOPAGO_PUBLIC_KEY

// Solo inicializar si las variables están configuradas
let client: MercadoPagoConfig | null = null
let payment: Payment | null = null
let preference: Preference | null = null

if (accessToken) {
  // Cliente de MercadoPago con configuración para Argentina
  client = new MercadoPagoConfig({
    accessToken: accessToken,
    options: {
      timeout: 5000, // 5 segundos timeout
      idempotencyKey: undefined // Se configura por operación
    }
  })

  // Instancias de APIs principales
  payment = new Payment(client)
  preference = new Preference(client)
} else {
  console.warn('⚠️ MERCADOPAGO_ACCESS_TOKEN no configurado - funcionalidades de MercadoPago deshabilitadas')
}

// ✅ CONFIGURACIÓN ARGENTINA ESPECÍFICA
export const MercadoPagoAR = {
  client,
  payment,
  preference,
  publicKey,
  
  // Flag para verificar si está habilitado
  isEnabled: !!accessToken,
  
  // Configuración específica de Argentina
  config: {
    // Moneda argentina
    currency: 'ARS',
    
    // URLs base (se completan en cada implementación)
    baseUrls: {
      success: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/mercadopago/success`,
      failure: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/mercadopago/failure`,
      pending: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/mercadopago/pending`,
      webhook: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/mercadopago/webhook`
    },
    
    // Métodos de pago argentinos
    paymentMethods: {
      excluded: [], // Ninguno excluido por defecto
      
      // Métodos principales en Argentina
      creditCard: ['visa', 'mastercard', 'amex', 'naranja', 'shopping', 'cabal'],
      debitCard: ['visa_debit', 'mastercard_debit'],
      cash: ['pagofacil', 'rapipago', 'bapropagos'],
      bankTransfer: ['pse'],
      digitalWallet: ['account_money'] // Dinero en cuenta MP
    },
    
    // Configuración de notificaciones
    notifications: {
      webhook: true,
      redirect: true
    }
  }
}

// ✅ TIPOS TYPESCRIPT PARA SUSCRIPCIONES
export interface PagoSuscripcionMP {
  id: string
  userId: string
  suscripcionId: string
  planId: string
  concepto: string
  monto: number
  
  // Datos específicos de MercadoPago
  mpPaymentId?: number
  mpPreferenceId?: string
  mpStatus?: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'in_process'
  mpPaymentType?: 'credit_card' | 'debit_card' | 'cash' | 'bank_transfer' | 'digital_wallet'
  mpPaymentMethod?: string
  
  // Metadatos de suscripción
  tipoPago: 'inicial' | 'renovacion' | 'upgrade' | 'downgrade'
  mesFacturado: number
  añoFacturado: number
  fechaVencimiento?: Date
  
  // Timestamps
  fechaCreacion: Date
  fechaPago?: Date
  fechaProcesado?: Date
}

// ✅ UTILIDADES PARA SUSCRIPCIONES
export const MPSuscripciones = {
  // Crear preference para suscripción
  async crearPreferenciaSuscripcion(datos: {
    planNombre: string
    planPrecio: number
    usuarioId: string
    suscripcionId: string
    planId: string
    tipoPago: 'inicial' | 'renovacion' | 'upgrade' | 'downgrade'
    mesFacturado: number
    añoFacturado: number
  }) {
    try {
      if (!MercadoPagoAR.isEnabled || !MercadoPagoAR.preference) {
        throw new Error('MercadoPago no está configurado')
      }

      const referencia = `SUSCRIPCION_${datos.suscripcionId}_${datos.tipoPago}_${datos.mesFacturado}_${datos.añoFacturado}`
      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
      
      console.log('🔧 Configuración MercadoPago:', {
        baseUrl,
        success_url: `${baseUrl}/suscripcion/exito`,
        failure_url: `${baseUrl}/suscripcion/fallo`,
        pending_url: `${baseUrl}/suscripcion/pendiente`
      })
      
      const body = {
        items: [
          {
            id: `plan_${datos.planId}`,
            title: `Suscripción ${datos.planNombre}`,
            quantity: 1,
            unit_price: datos.planPrecio,
            description: `Plan ${datos.planNombre} - ${datos.mesFacturado}/${datos.añoFacturado}`,
            currency_id: 'ARS'
          }
        ],
        external_reference: referencia,
        metadata: {
          usuario_id: datos.usuarioId,
          suscripcion_id: datos.suscripcionId,
          plan_id: datos.planId,
          tipo_pago: datos.tipoPago,
          mes_facturado: datos.mesFacturado,
          año_facturado: datos.añoFacturado
        },
        payment_methods: {
          excluded_payment_types: [],
          excluded_payment_methods: [],
          installments: 1 // Suscripciones solo pago único
        },
        back_urls: {
          success: `${baseUrl}/suscripcion/exito`,
          failure: `${baseUrl}/suscripcion/fallo`,
          pending: `${baseUrl}/suscripcion/pendiente`
        },
        // auto_return: 'approved', // Comentado para testing local
        binary_mode: false,
        statement_descriptor: 'App Gastos - Suscripcion'
      }
      
      console.log('📤 Body enviado a MercadoPago:', JSON.stringify(body, null, 2))
      
      const response = await MercadoPagoAR.preference.create({ body })
      return response
    } catch (error) {
      console.error('Error creando preferencia suscripción:', error)
      throw error
    }
  },

  // Formatear monto para Argentina (sin decimales menores a 1 peso)
  formatearMonto: (monto: number): number => {
    return Math.round(monto * 100) / 100 // Redondear a 2 decimales
  },
  
  // Validar monto mínimo en Argentina (1 peso)
  validarMontoMinimo: (monto: number): boolean => {
    return monto >= 1
  },
  
  // Generar external_reference para suscripciones
  generarExternalReference: (suscripcionId: string, tipoPago: string, mes: number, año: number): string => {
    const timestamp = Date.now()
    return `SUSCRIPCION_${suscripcionId}_${tipoPago}_${mes}_${año}_${timestamp}`
  },
  
  // Parsear external_reference de suscripciones
  parsearExternalReference: (externalRef: string) => {
    const parts = externalRef.split('_')
    if (parts.length >= 5 && parts[0] === 'SUSCRIPCION') {
      return {
        tipo: 'suscripcion',
        suscripcionId: parts[1],
        tipoPago: parts[2],
        mes: parseInt(parts[3]),
        año: parseInt(parts[4]),
        timestamp: parts[5] ? parseInt(parts[5]) : undefined
      }
    }
    return null
  }
}

export default MercadoPagoAR 