"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

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

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState<CurrencyType>('ARS');
  const [exchangeRateType, setExchangeRateType] = useState<ExchangeRateType>('oficial');
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates>({
    oficial: 0,
    blue: 0,
    cripto: 0
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Función para obtener las tasas de cambio desde la API
  const fetchExchangeRates = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/financial-data');
      
      if (!response.ok) {
        throw new Error('Error al obtener datos financieros');
      }
      
      const data = await response.json();
      
      // Actualizar las tasas de cambio con los datos de la API
      const newRates = {
        oficial: data.dollar?.oficial?.venta || 0,
        blue: data.dollar?.blue?.venta || 0,
        cripto: data.dollar?.blue?.venta || 0 // Usar blue como fallback para cripto
      };
      
      setExchangeRates(newRates);
      
    } catch (error) {
      console.error('Error al obtener tasas de cambio:', error);
      // En caso de error, usar valores por defecto
      setExchangeRates({
        oficial: 0,
        blue: 0,
        cripto: 0
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Obtener tasas de cambio al montar el componente
  useEffect(() => {
    fetchExchangeRates();
    
    // Actualizar tasas cada 15 minutos
    const interval = setInterval(fetchExchangeRates, 15 * 60 * 1000);
    
    // Limpiar intervalo al desmontar
    return () => clearInterval(interval);
  }, []);

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