"use client"

import { DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CurrencyType, ExchangeRateType, useCurrency } from "@/contexts/CurrencyContext"

export function CurrencySelector() {
  const { 
    currency, 
    exchangeRateType, 
    exchangeRate,
    exchangeRates,
    setCurrency, 
    setExchangeRateType,
    isLoading
  } = useCurrency()

  // Mostrar etiqueta según la moneda y tipo de cambio seleccionados
  const getLabel = () => {
    if (currency === 'ARS') {
      return 'ARS'
    }
    
    // Si es dólar, mostrar el tipo de dólar seleccionado
    return `USD (${exchangeRateType})`
  }

  // Formatear tasa de cambio para mostrar
  const formatRate = (rate: number) => {
    if (rate === 0) return 'N/A'
    return rate.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-1" disabled={isLoading}>
          <DollarSign className="h-4 w-4" />
          <span>{getLabel()}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel>Seleccionar moneda</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuRadioGroup value={currency} onValueChange={(value) => setCurrency(value as CurrencyType)}>
          <DropdownMenuRadioItem value="ARS">
            Pesos (ARS)
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="USD">
            Dólares (USD)
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>

        {currency === 'USD' && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Tipo de cambio</DropdownMenuLabel>
            <DropdownMenuRadioGroup 
              value={exchangeRateType} 
              onValueChange={(value) => setExchangeRateType(value as ExchangeRateType)}
            >
              <DropdownMenuRadioItem value="oficial">
                Dólar oficial (ARS {formatRate(exchangeRates.oficial)})
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="blue">
                Dólar blue (ARS {formatRate(exchangeRates.blue)})
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="cripto">
                Dólar cripto (ARS {formatRate(exchangeRates.cripto)})
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 