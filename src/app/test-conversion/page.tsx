"use client"

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useCurrency } from "@/contexts/CurrencyContext"
import { CurrencySelector } from "@/components/CurrencySelector"

export default function TestConversionPage() {
  const [testAmount, setTestAmount] = useState("1000")
  const { 
    currency, 
    exchangeRateType, 
    exchangeRate, 
    exchangeRates, 
    formatMoney, 
    convertAmount,
    isLoading 
  } = useCurrency()

  const amount = parseFloat(testAmount) || 0

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Test de Conversión de Monedas</h1>
          <p className="text-muted-foreground">Prueba el sistema de conversión ARS ↔ USD</p>
        </div>
        <CurrencySelector />
      </div>

      <div className="grid gap-6">
        {/* Información del estado actual */}
        <Card>
          <CardHeader>
            <CardTitle>Estado Actual</CardTitle>
            <CardDescription>Configuración y tasas de cambio</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Moneda Seleccionada</Label>
                <p className="text-2xl font-bold">{currency}</p>
              </div>
              <div>
                <Label>Tipo de Cambio</Label>
                <p className="text-2xl font-bold">{exchangeRateType}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Dólar Oficial</Label>
                <p className="text-lg font-semibold">
                  {isLoading ? 'Cargando...' : `ARS ${exchangeRates.oficial.toLocaleString()}`}
                </p>
              </div>
              <div>
                <Label>Dólar Blue</Label>
                <p className="text-lg font-semibold">
                  {isLoading ? 'Cargando...' : `ARS ${exchangeRates.blue.toLocaleString()}`}
                </p>
              </div>
              <div>
                <Label>Dólar Cripto</Label>
                <p className="text-lg font-semibold">
                  {isLoading ? 'Cargando...' : `ARS ${exchangeRates.cripto.toLocaleString()}`}
                </p>
              </div>
            </div>

            <div>
              <Label>Tasa Actual Seleccionada</Label>
              <p className="text-xl font-bold text-blue-600">
                {currency === 'ARS' ? 'ARS 1' : `ARS ${exchangeRate.toLocaleString()}`}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Prueba de conversión */}
        <Card>
          <CardHeader>
            <CardTitle>Prueba de Conversión</CardTitle>
            <CardDescription>Ingresa un monto para ver cómo se convierte</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="amount">Monto en ARS</Label>
              <Input
                id="amount"
                type="number"
                value={testAmount}
                onChange={(e) => setTestAmount(e.target.value)}
                placeholder="1000"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <Label>Valor Original (ARS)</Label>
                <p className="text-2xl font-bold text-green-600">
                  ARS {amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              
              <div className="p-4 border rounded-lg">
                <Label>Valor Convertido</Label>
                <p className="text-2xl font-bold text-blue-600">
                  {formatMoney(amount)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="p-3 border rounded-lg text-center">
                <Label className="text-sm">Con Dólar Oficial</Label>
                <p className="text-lg font-semibold">
                  {exchangeRates.oficial > 0 
                    ? `USD ${(amount / exchangeRates.oficial).toLocaleString('en-US', { 
                        minimumFractionDigits: 2, 
                        maximumFractionDigits: 2 
                      })}`
                    : 'N/A'
                  }
                </p>
              </div>
              
              <div className="p-3 border rounded-lg text-center">
                <Label className="text-sm">Con Dólar Blue</Label>
                <p className="text-lg font-semibold">
                  {exchangeRates.blue > 0 
                    ? `USD ${(amount / exchangeRates.blue).toLocaleString('en-US', { 
                        minimumFractionDigits: 2, 
                        maximumFractionDigits: 2 
                      })}`
                    : 'N/A'
                  }
                </p>
              </div>
              
              <div className="p-3 border rounded-lg text-center">
                <Label className="text-sm">Con Dólar Cripto</Label>
                <p className="text-lg font-semibold">
                  {exchangeRates.cripto > 0 
                    ? `USD ${(amount / exchangeRates.cripto).toLocaleString('en-US', { 
                        minimumFractionDigits: 2, 
                        maximumFractionDigits: 2 
                      })}`
                    : 'N/A'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Información de depuración */}
        <Card>
          <CardHeader>
            <CardTitle>Información de Depuración</CardTitle>
            <CardDescription>Detalles técnicos para debugging</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded text-sm overflow-auto">
              {JSON.stringify({
                currency,
                exchangeRateType,
                exchangeRate,
                exchangeRates,
                isLoading,
                convertedAmount: convertAmount(amount),
                formattedAmount: formatMoney(amount)
              }, null, 2)}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 