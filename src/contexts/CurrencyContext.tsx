"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

// Tipos de moneda y cambio disponibles
export type CurrencyType = 'ARS' | 'USD';
export type ExchangeRateType = 'oficial' | 'blue' | 'cripto';

// Definir tasas de cambio estáticas (hasta que implementemos la API)
const EXCHANGE_RATES = {
  oficial: 900,
  blue: 1050,
  cripto: 1000
};

interface CurrencyContextType {
  currency: CurrencyType;
  exchangeRateType: ExchangeRateType;
  exchangeRate: number;
  exchangeRates: typeof EXCHANGE_RATES;
  setCurrency: (currency: CurrencyType) => void;
  setExchangeRateType: (exchangeRateType: ExchangeRateType) => void;
  convertAmount: (amount: number) => number;
  formatMoney: (amount: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState<CurrencyType>('ARS');
  const [exchangeRateType, setExchangeRateType] = useState<ExchangeRateType>('oficial');
  const [exchangeRate, setExchangeRate] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Función para obtener el tipo de cambio actual
  useEffect(() => {
    const fetchExchangeRate = async () => {
      if (currency === 'ARS') {
        setExchangeRate(1);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        // Aquí implementaríamos la lógica para obtener el tipo de cambio desde una API
        // Por ahora, usamos valores estáticos definidos en EXCHANGE_RATES
        setExchangeRate(EXCHANGE_RATES[exchangeRateType]);
      } catch (error) {
        console.error('Error al obtener el tipo de cambio:', error);
        setExchangeRate(EXCHANGE_RATES.oficial); // Valor por defecto en caso de error
      } finally {
        setIsLoading(false);
      }
    };

    fetchExchangeRate();
  }, [currency, exchangeRateType]);

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
    return new Intl.NumberFormat(currency === 'ARS' ? 'es-AR' : 'en-US', { 
      style: 'currency', 
      currency: currency 
    }).format(currency === 'ARS' ? amount : convertAmount(amount));
  };

  return (
    <CurrencyContext.Provider value={{
      currency,
      exchangeRateType,
      exchangeRate,
      exchangeRates: EXCHANGE_RATES,
      setCurrency,
      setExchangeRateType,
      convertAmount,
      formatMoney
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