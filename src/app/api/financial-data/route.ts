import { NextResponse } from 'next/server';

// Función para cachear resultados
let cachedData: any = null;
let cachedTime: number = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hora en milisegundos

// Valores por defecto en caso de que fallen las APIs externas
const DEFAULT_RATES = {
  dollar: {
    oficial: {
      compra: 1040,
      venta: 1050,
      variacion: 10
    },
    blue: {
      compra: 1190,
      venta: 1200,
      variacion: 10
    }
  },
  indices: {
    inflacionMensual: 4.2,
    inflacionAnual: 211.4,
    merval: { valor: 2150000, variacion: -0.5 },
    riesgoPais: 750
  },
  lastUpdated: new Date().toISOString()
};

export async function GET() {
  try {
    // Verificar si tenemos datos en caché válidos
    const now = Date.now();
    if (cachedData && (now - cachedTime < CACHE_DURATION)) {
      return NextResponse.json(cachedData, {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=3600' // Cache por 1 hora
        }
      });
    }

    // Si no hay caché o expiró, obtener datos nuevos
    const dollarData = await fetchDollarData();
    const financialIndices = await fetchFinancialIndices();
    
    // Combinar los datos
    const financialData = {
      dollar: dollarData,
      indices: financialIndices,
      lastUpdated: new Date().toISOString()
    };
    
    // Validar que tenemos datos válidos antes de cachear
    if (financialData.dollar && financialData.dollar.oficial && financialData.dollar.blue) {
      // Actualizar caché solo si los datos son válidos
      cachedData = financialData;
      cachedTime = now;
    }
    
    return NextResponse.json(financialData, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600'
      }
    });
  } catch (error) {
    console.error('Error al obtener datos financieros:', error);
    
    // Si hay datos en caché, usarlos aunque estén expirados
    if (cachedData) {
      console.warn('Usando datos en caché debido a error en API externa');
      return NextResponse.json(cachedData, {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=300' // Cache más corto para datos de emergencia
        }
      });
    }
    
    // Si no hay caché, usar valores por defecto
    console.warn('Usando valores por defecto debido a error en API externa');
    return NextResponse.json(DEFAULT_RATES, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300'
      }
    });
  }
}

// Función para obtener cotizaciones del dólar
async function fetchDollarData() {
  try {
    // Crear AbortController para timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 segundos timeout
    
    // Para demostración, usaremos la API del dólar de Argentina
    const response = await fetch('https://api.bluelytics.com.ar/v2/latest', {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'FinancialApp/1.0'
      }
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    // Verificar que la respuesta sea JSON válido
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('La respuesta de la API externa no es JSON válido');
    }
    
    const data = await response.json();
    
    // Validar estructura de datos
    if (!data || !data.oficial || !data.blue) {
      throw new Error('Estructura de datos inválida de la API externa');
    }
    
    return {
      oficial: {
        compra: data.oficial.value_buy || DEFAULT_RATES.dollar.oficial.compra,
        venta: data.oficial.value_sell || DEFAULT_RATES.dollar.oficial.venta,
        variacion: (data.oficial.value_sell || 0) - (data.oficial.value_buy || 0)
      },
      blue: {
        compra: data.blue.value_buy || DEFAULT_RATES.dollar.blue.compra,
        venta: data.blue.value_sell || DEFAULT_RATES.dollar.blue.venta,
        variacion: (data.blue.value_sell || 0) - (data.blue.value_buy || 0)
      }
    };
  } catch (error) {
    console.error('Error al obtener cotización del dólar:', error);
    
    // Retornar datos por defecto en caso de error
    return DEFAULT_RATES.dollar;
  }
}

// Función para obtener índices financieros
async function fetchFinancialIndices() {
  try {
    // TODO: Implementar llamada a API real para obtener índices financieros
    // Por ahora, retornar datos por defecto
    return DEFAULT_RATES.indices;
  } catch (error) {
    console.error('Error al obtener índices financieros:', error);
    return DEFAULT_RATES.indices;
  }
} 