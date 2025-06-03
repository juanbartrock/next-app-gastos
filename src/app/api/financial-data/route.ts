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
    
    // Actualizar caché
    cachedData = financialData;
    cachedTime = now;
    
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
    console.warn('Usando valores por defecto debido a error en API externa:', (error as Error).message);
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
    // Usar Promise.race para implementar timeout más robusto
    const fetchPromise = fetch('https://api.bluelytics.com.ar/v2/latest', {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'FinancialApp/1.0'
      }
    });

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Timeout')), 5000) // 5 segundos timeout
    );

    const response = await Promise.race([fetchPromise, timeoutPromise]) as Response;
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Validar y transformar datos
    if (data && (data.oficial || data.blue)) {
      return {
        oficial: {
          compra: data.oficial?.value_buy || DEFAULT_RATES.dollar.oficial.compra,
          venta: data.oficial?.value_sell || DEFAULT_RATES.dollar.oficial.venta,
          variacion: (data.oficial?.value_sell || DEFAULT_RATES.dollar.oficial.venta) - (data.oficial?.value_buy || DEFAULT_RATES.dollar.oficial.compra)
        },
        blue: {
          compra: data.blue?.value_buy || DEFAULT_RATES.dollar.blue.compra,
          venta: data.blue?.value_sell || DEFAULT_RATES.dollar.blue.venta,
          variacion: (data.blue?.value_sell || DEFAULT_RATES.dollar.blue.venta) - (data.blue?.value_buy || DEFAULT_RATES.dollar.blue.compra)
        }
      };
    }
    
    throw new Error('Datos inválidos de la API externa');
    
  } catch (error) {
    console.warn('API externa no disponible, usando valores por defecto:', (error as Error).message);
    
    // Retornar datos por defecto en caso de error
    return DEFAULT_RATES.dollar;
  }
}

// Función para obtener índices financieros
async function fetchFinancialIndices() {
  try {
    // Por ahora, retornar datos por defecto (se puede implementar API real después)
    return DEFAULT_RATES.indices;
  } catch (error) {
    console.error('Error al obtener índices financieros:', error);
    return DEFAULT_RATES.indices;
  }
} 