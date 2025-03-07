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
    setExchangeRateType 
  } = useCurrency()

  // Mostrar etiqueta según la moneda y tipo de cambio seleccionados
  const getLabel = () => {
    if (currency === 'ARS') {
      return 'ARS'
    }
    
    // Si es dólar, mostrar el tipo de dólar seleccionado
    return `USD (${exchangeRateType})`
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-1">
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
                Dólar oficial (ARS {exchangeRates.oficial})
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="blue">
                Dólar blue (ARS {exchangeRates.blue})
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="cripto">
                Dólar cripto (ARS {exchangeRates.cripto})
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 