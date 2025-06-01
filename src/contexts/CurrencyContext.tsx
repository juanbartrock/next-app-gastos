"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { usePathname } from 'next/navigation'

// Tipos de moneda y cambio disponibles
export type CurrencyType = 'ARS' | 'USD';
export type ExchangeRateType = 'oficial' | 'blue' | 'cripto';

// Tasas de cambio que se obtendrán de APIs reales
interface ExchangeRates {
  oficial: number;
  blue: number;
  cripto: number;
}

interface CurrencyContextType {
  currency: CurrencyType;
  exchangeRateType: ExchangeRateType;
  exchangeRate: number;
  exchangeRates: ExchangeRates;
  setCurrency: (currency: CurrencyType) => void;
  setExchangeRateType: (exchangeRateType: ExchangeRateType) => void;
  convertAmount: (amount: number) => number;
  formatMoney: (amount: number) => string;
  isLoading: boolean;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

// Páginas donde NO necesitamos cargar cotizaciones
const SKIP_FETCH_PAGES = ['/login', '/register', '/api', '/_next'];

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [currency, setCurrency] = useState<CurrencyType>('ARS');
  const [exchangeRateType, setExchangeRateType] = useState<ExchangeRateType>('oficial');
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates>({
    oficial: 1050, // Valores por defecto realistas para Argentina
    blue: 1200,
    cripto: 1200
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Verificar si debemos saltear el fetch en esta página
  const shouldSkipFetch = SKIP_FETCH_PAGES.some(skipPath => 
    pathname?.startsWith(skipPath)
  );

  // Función para obtener las tasas de cambio desde la API
  const fetchExchangeRates = async () => {
    // No hacer fetch en páginas donde no es necesario
    if (shouldSkipFetch) {
      return;
    }

    try {
      setIsLoading(true);
      
      // Agregar timeout y mejores controles de error
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos timeout
      
      const response = await fetch('/api/financial-data', {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('La respuesta no es JSON válido');
      }
      
      const data = await response.json();
      
      // Validar que los datos tengan la estructura esperada
      if (data && data.dollar && typeof data.dollar === 'object') {
        // Actualizar las tasas de cambio con los datos de la API
        const newRates = {
          oficial: data.dollar?.oficial?.venta || exchangeRates.oficial,
          blue: data.dollar?.blue?.venta || exchangeRates.blue,
          cripto: data.dollar?.blue?.venta || exchangeRates.cripto // Usar blue como fallback para cripto
        };
        
        // Solo actualizar si los valores son números válidos
        if (newRates.oficial > 0 && newRates.blue > 0) {
          setExchangeRates(newRates);
        }
      }
      
    } catch (error) {
      // Solo mostrar warnings en desarrollo y en páginas que necesitan las cotizaciones
      if (process.env.NODE_ENV === 'development' && !shouldSkipFetch) {
        // Manejo más detallado de errores
        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            console.warn('Timeout al obtener tasas de cambio - usando valores por defecto');
          } else {
            console.warn('Error al obtener tasas de cambio:', error.message, '- usando valores por defecto');
          }
        } else {
          console.warn('Error desconocido al obtener tasas de cambio - usando valores por defecto');
        }
      }
      
      // Mantener los valores actuales en caso de error
      // No sobreescribir con ceros
    } finally {
      setIsLoading(false);
    }
  };

  // Obtener tasas de cambio solo cuando es necesario
  useEffect(() => {
    // No ejecutar en páginas donde no es necesario
    if (shouldSkipFetch) {
      return;
    }

    // Delay inicial para no bloquear la carga de la página
    const initialDelay = setTimeout(() => {
      fetchExchangeRates();
    }, 3000); // 3 segundos de delay para páginas que sí necesitan cotizaciones
    
    // Actualizar tasas cada 30 minutos (reducir frecuencia)
    const interval = setInterval(fetchExchangeRates, 30 * 60 * 1000);
    
    // Limpiar timeouts e intervalos al desmontar
    return () => {
      clearTimeout(initialDelay);
      clearInterval(interval);
    };
  }, [pathname, shouldSkipFetch]); // Agregar pathname como dependencia

  // Obtener la tasa de cambio actual según el tipo seleccionado
  const getCurrentExchangeRate = (): number => {
    if (currency === 'ARS') return 1;
    
    switch (exchangeRateType) {
      case 'oficial':
        return exchangeRates.oficial;
      case 'blue':
        return exchangeRates.blue;
      case 'cripto':
        return exchangeRates.cripto;
      default:
        return exchangeRates.oficial;
    }
  };

  const exchangeRate = getCurrentExchangeRate();

  // Función para convertir montos de ARS a USD según el tipo de cambio seleccionado
  const convertAmount = (amount: number): number => {
    if (currency === 'ARS' || exchangeRate === 0) {
      return amount;
    }
    
    // Convertir de ARS a USD
    return amount / exchangeRate;
  };

  // Función para formatear valores monetarios
  const formatMoney = (amount: number): string => {
    const convertedAmount = currency === 'ARS' ? amount : convertAmount(amount);
    
    return new Intl.NumberFormat(currency === 'ARS' ? 'es-AR' : 'en-US', { 
      style: 'currency', 
      currency: currency 
    }).format(convertedAmount);
  };

  return (
    <CurrencyContext.Provider value={{
      currency,
      exchangeRateType,
      exchangeRate,
      exchangeRates,
      setCurrency,
      setExchangeRateType,
      convertAmount,
      formatMoney,
      isLoading
    }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
} 