"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Bell, CheckCircle, AlertTriangle, XCircle, RefreshCw } from "lucide-react"
import Link from "next/link"

interface TestResult {
  id: string
  title: string
  content: string
  type: 'success' | 'error' | 'info'
  timestamp: Date
}

export default function TestAlertasPage() {
  const [results, setResults] = useState<TestResult[]>([])
  const [loading, setLoading] = useState(false)

  const addResult = (title: string, content: string, type: TestResult['type'] = 'info') => {
    const newResult: TestResult = {
      id: Date.now().toString(),
      title,
      content,
      type,
      timestamp: new Date()
    }
    setResults(prev => [newResult, ...prev])
  }

  const clearResults = () => {
    setResults([])
  }

  const testServer = async () => {
    setLoading(true)
    try {
      const response = await fetch(window.location.origin)
      if (response.ok) {
        addResult('✅ Servidor', `Estado: ${response.status} - Servidor funcionando correctamente`, 'success')
      } else {
        addResult('❌ Servidor', `Estado: ${response.status} - ${response.statusText}`, 'error')
      }
    } catch (error) {
      addResult('❌ Servidor', `Error: ${error instanceof Error ? error.message : 'Error desconocido'}`, 'error')
    } finally {
      setLoading(false)
    }
  }

  const testCreateAlerts = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/alertas/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      const data = await response.json()
      
      if (response.ok) {
        addResult('✅ Crear Alertas', JSON.stringify(data, null, 2), 'success')
      } else {
        addResult('❌ Crear Alertas', `Error ${response.status}: ${JSON.stringify(data, null, 2)}`, 'error')
      }
    } catch (error) {
      addResult('❌ Crear Alertas', `Error: ${error instanceof Error ? error.message : 'Error desconocido'}`, 'error')
    } finally {
      setLoading(false)
    }
  }

  const testGetAlerts = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/alertas')
      const data = await response.json()
      
      if (response.ok) {
        addResult('✅ Obtener Alertas', JSON.stringify(data, null, 2), 'success')
      } else {
        addResult('❌ Obtener Alertas', `Error ${response.status}: ${JSON.stringify(data, null, 2)}`, 'error')
      }
    } catch (error) {
      addResult('❌ Obtener Alertas', `Error: ${error instanceof Error ? error.message : 'Error desconocido'}`, 'error')
    } finally {
      setLoading(false)
    }
  }

  const getResultIcon = (type: TestResult['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <AlertTriangle className="h-5 w-5 text-blue-500" />
    }
  }

  const getResultColor = (type: TestResult['type']) => {
    switch (type) {
      case 'success':
        return 'border-l-green-500 bg-green-50 dark:bg-green-950/20'
      case 'error':
        return 'border-l-red-500 bg-red-50 dark:bg-red-950/20'
      default:
        return 'border-l-blue-500 bg-blue-50 dark:bg-blue-950/20'
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
          <Bell className="h-8 w-8 text-amber-500" />
          Test Sistema de Alertas
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Página de pruebas integrada para el sistema de alertas
        </p>
      </div>

      {/* Instrucciones */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>📋 Instrucciones</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>El servidor ya está funcionando (estás viendo esta página)</li>
            <li>Si no estás autenticado, las alertas se crearán para un usuario demo</li>
            <li>Usa los botones abajo para probar las APIs</li>
            <li>Ve a <Link href="/alertas" className="text-blue-600 hover:underline">/alertas</Link> para ver las alertas creadas</li>
          </ol>
        </CardContent>
      </Card>

      {/* Botones de prueba */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>🧪 Pruebas de API</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 mb-4">
            <Button 
              onClick={testServer} 
              disabled={loading}
              variant="outline"
            >
              {loading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : '🚀'}
              Verificar Servidor
            </Button>
            
            <Button 
              onClick={testCreateAlerts} 
              disabled={loading}
              variant="default"
            >
              {loading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : '📝'}
              Crear Alertas de Prueba
            </Button>
            
            <Button 
              onClick={testGetAlerts} 
              disabled={loading}
              variant="outline"
            >
              {loading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : '📋'}
              Obtener Alertas
            </Button>
            
            <Button 
              onClick={clearResults} 
              disabled={loading}
              variant="destructive"
            >
              🧹 Limpiar Resultados
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Enlaces útiles */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>📝 Enlaces Útiles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/" className="text-blue-600 hover:underline flex items-center">
              🏠 Dashboard Principal
            </Link>
            <Link href="/alertas" className="text-blue-600 hover:underline flex items-center">
              🔔 Página de Alertas
            </Link>
            <Link href="/login" className="text-blue-600 hover:underline flex items-center">
              🔑 Login
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Resultados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            📊 Resultados de Pruebas
            <Badge variant="outline">
              {results.length} resultados
            </Badge>
          </CardTitle>
          <CardDescription>
            Resultados de las pruebas ejecutadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {results.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No hay resultados aún. Ejecuta algunas pruebas para ver los resultados aquí.
            </div>
          ) : (
            <div className="space-y-4">
              {results.map((result) => (
                <div 
                  key={result.id} 
                  className={`border-l-4 p-4 rounded-lg ${getResultColor(result.type)}`}
                >
                  <div className="flex items-start gap-3">
                    {getResultIcon(result.type)}
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold">{result.title}</h4>
                        <span className="text-xs text-gray-500">
                          {result.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                      <pre className="mt-2 text-sm bg-white dark:bg-gray-800 p-3 rounded border overflow-x-auto">
                        {result.content}
                      </pre>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 