import { NextResponse } from 'next/server';

// Función para cachear resultados
let cachedData: any = null;
let cachedTime: number = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hora en milisegundos

export async function GET() {
  try {
    // Verificar si tenemos datos en caché válidos
    const now = Date.now();
    if (cachedData && (now - cachedTime < CACHE_DURATION)) {
      return NextResponse.json(cachedData);
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
    
    return NextResponse.json(financialData);
  } catch (error) {
    console.error('Error al obtener datos financieros:', error);
    return NextResponse.json(
      { error: 'Error al obtener datos financieros' },
      { status: 500 }
    );
  }
}

// Función para obtener cotizaciones del dólar
async function fetchDollarData() {
  try {
    // Para demostración, usaremos la API del dólar de Argentina
    // En producción, deberías usar una API adecuada para tu país/región
    const response = await fetch('https://api.bluelytics.com.ar/v2/latest');
    
    if (!response.ok) {
      throw new Error('Error al obtener datos del dólar');
    }
    
    const data = await response.json();
    
    return {
      oficial: {
        compra: data.oficial.value_buy,
        venta: data.oficial.value_sell,
        variacion: data.oficial.value_sell - data.oficial.value_buy
      },
      blue: {
        compra: data.blue.value_buy,
        venta: data.blue.value_sell,
        variacion: data.blue.value_sell - data.blue.value_buy
      }
    };
  } catch (error) {
    console.error('Error al obtener cotización del dólar:', error);
    // Retornar datos de ejemplo en caso de error
    return {
      oficial: { compra: 0, venta: 0, variacion: 0 },
      blue: { compra: 0, venta: 0, variacion: 0 }
    };
  }
}

// Función para obtener índices financieros
async function fetchFinancialIndices() {
  try {
    // En una implementación real, aquí harías una llamada a una API financiera
    // Para este ejemplo, usaremos datos simulados
    
    // Simular una llamada API con un pequeño delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Datos de ejemplo (en producción, estos vendrían de una API real)
    return {
      inflacionMensual: 4.2,
      inflacionAnual: 52.3,
      merval: {
        valor: 985324.45,
        variacion: 2.3 // porcentaje
      },
      riesgoPais: 1432
    };
  } catch (error) {
    console.error('Error al obtener índices financieros:', error);
    return {
      inflacionMensual: 0,
      inflacionAnual: 0,
      merval: { valor: 0, variacion: 0 },
      riesgoPais: 0
    };
  }
} 