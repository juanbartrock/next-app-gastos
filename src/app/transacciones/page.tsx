"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Search } from "lucide-react"
import { useRouter } from "next/navigation"

export default function TransaccionesPage() {
  const [transactions, setTransactions] = useState<any[]>([])
  const [filteredTransactions, setFilteredTransactions] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")
  const [typeFilter, setTypeFilter] = useState("")
  const [movementTypeFilter, setMovementTypeFilter] = useState("")
  const router = useRouter()

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await fetch('/api/gastos')
        if (response.ok) {
          const data = await response.json()
          setTransactions(data)
          setFilteredTransactions(data)
        }
      } catch (error) {
        console.error('Error al cargar transacciones:', error)
      }
    }

    fetchTransactions()
  }, [])

  useEffect(() => {
    let filtered = transactions

    if (searchTerm) {
      filtered = filtered.filter(t => 
        t.concepto.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.categoria.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (categoryFilter && categoryFilter !== "all") {
      filtered = filtered.filter(t => t.categoria === categoryFilter)
    }

    if (typeFilter && typeFilter !== "all") {
      filtered = filtered.filter(t => t.tipoTransaccion === typeFilter)
    }

    if (movementTypeFilter && movementTypeFilter !== "all") {
      filtered = filtered.filter(t => t.tipoMovimiento === movementTypeFilter)
    }

    setFilteredTransactions(filtered)
  }, [searchTerm, categoryFilter, typeFilter, movementTypeFilter, transactions])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <Button 
            variant="ghost" 
            className="gap-2"
            onClick={() => router.push("/?dashboard=true")}
          >
            <ArrowLeft className="w-4 h-4" />
            Volver
          </Button>
          <h1 className="text-2xl font-bold dark:text-white">Historial de Transacciones</h1>
        </div>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="search">Buscar</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    id="search"
                    placeholder="Buscar por concepto o categoría"
                    className="pl-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <Label>Categoría</Label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas las categorías" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="alimentacion">Alimentación</SelectItem>
                    <SelectItem value="transporte">Transporte</SelectItem>
                    <SelectItem value="servicios">Servicios</SelectItem>
                    <SelectItem value="ocio">Ocio</SelectItem>
                    <SelectItem value="otros">Otros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Tipo de Transacción</Label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los tipos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="income">Ingresos</SelectItem>
                    <SelectItem value="expense">Egresos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Tipo de Movimiento</Label>
                <Select value={movementTypeFilter} onValueChange={setMovementTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los movimientos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="efectivo">Efectivo</SelectItem>
                    <SelectItem value="digital">Digital</SelectItem>
                    <SelectItem value="ahorro">Ahorro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Transacciones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs text-gray-500 dark:text-gray-400">
                    <th className="pb-3 font-normal">Fecha</th>
                    <th className="pb-3 font-normal">Categoría</th>
                    <th className="pb-3 font-normal">Concepto</th>
                    <th className="pb-3 font-normal text-right">Tipo Transacción</th>
                    <th className="pb-3 font-normal text-right">Tipo Movimiento</th>
                    <th className="pb-3 font-normal text-right">Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((transaction) => (
                    <tr key={transaction.id} className="border-t border-gray-100 dark:border-gray-700">
                      <td className="py-3 text-sm">
                        {format(new Date(transaction.fecha), "dd MMM yyyy", { locale: es })}
                      </td>
                      <td className="py-3 text-sm capitalize">{transaction.categoria}</td>
                      <td className="py-3 text-sm">{transaction.concepto}</td>
                      <td className="text-right">
                        <Badge 
                          className={transaction.tipoTransaccion === "income" 
                            ? "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300" 
                            : "bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-300"
                          }
                        >
                          {transaction.tipoTransaccion === "income" ? "Ingreso" : "Egreso"}
                        </Badge>
                      </td>
                      <td className="text-right">
                        <Badge variant="outline" className="capitalize">
                          {transaction.tipoMovimiento}
                        </Badge>
                      </td>
                      <td className="text-right text-sm font-medium">
                        {new Intl.NumberFormat("es-AR", {
                          style: "currency",
                          currency: "ARS",
                        }).format(transaction.monto)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 