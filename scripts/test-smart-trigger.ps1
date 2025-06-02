# Script para probar Smart Trigger localmente
param(
    [string]$Action = "help"
)

$BaseUrl = "http://localhost:3000"

Write-Host "🎯 Script de Pruebas Smart Trigger" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan

switch ($Action.ToLower()) {
    "help" {
        Write-Host "Acciones disponibles:" -ForegroundColor Yellow
        Write-Host "  stats    - Ver estadísticas del Smart Trigger" -ForegroundColor Green
        Write-Host "  execute  - Ejecutar Smart Trigger manualmente" -ForegroundColor Green
        Write-Host "  test     - Abrir página de pruebas en navegador" -ForegroundColor Green
        Write-Host "  dashboard - Abrir dashboard para probar integración" -ForegroundColor Green
        Write-Host ""
        Write-Host "Ejemplos:" -ForegroundColor Yellow
        Write-Host "  .\test-smart-trigger.ps1 stats" -ForegroundColor Gray
        Write-Host "  .\test-smart-trigger.ps1 execute" -ForegroundColor Gray
        Write-Host "  .\test-smart-trigger.ps1 test" -ForegroundColor Gray
    }
    
    "stats" {
        Write-Host "📊 Obteniendo estadísticas del Smart Trigger..." -ForegroundColor Blue
        try {
            $response = Invoke-RestMethod -Uri "$BaseUrl/api/alertas/smart-trigger" -Method GET
            
            Write-Host "✅ Estadísticas obtenidas:" -ForegroundColor Green
            Write-Host "  Estado: " -NoNewline
            if ($response.stats.isEnabled) {
                Write-Host "ACTIVO" -ForegroundColor Green
            } else {
                Write-Host "INACTIVO" -ForegroundColor Red
            }
            
            Write-Host "  Ejecuciones hoy: $($response.stats.executionsToday)/24" -ForegroundColor Cyan
            
            if ($response.stats.lastExecution) {
                $lastExecution = [DateTime]::Parse($response.stats.lastExecution)
                Write-Host "  Última ejecución: $($lastExecution.ToString('dd/MM/yyyy HH:mm:ss'))" -ForegroundColor Cyan
            } else {
                Write-Host "  Última ejecución: Nunca ejecutado" -ForegroundColor Yellow
            }
            
            $nextExecution = [DateTime]::Parse($response.stats.nextPossibleExecution)
            Write-Host "  Próxima ejecución posible: $($nextExecution.ToString('dd/MM/yyyy HH:mm:ss'))" -ForegroundColor Cyan
            
        } catch {
            Write-Host "❌ Error al obtener estadísticas: $($_.Exception.Message)" -ForegroundColor Red
            Write-Host "💡 Asegúrate de que el servidor esté ejecutándose en localhost:3000" -ForegroundColor Yellow
        }
    }
    
    "execute" {
        Write-Host "⚡ Ejecutando Smart Trigger..." -ForegroundColor Blue
        try {
            $body = @{ source = "powershell-script" } | ConvertTo-Json
            $response = Invoke-RestMethod -Uri "$BaseUrl/api/alertas/smart-trigger" -Method POST -Body $body -ContentType "application/json"
            
            if ($response.success) {
                if ($response.result.executed) {
                    Write-Host "✅ Smart Trigger ejecutado exitosamente!" -ForegroundColor Green
                    Write-Host "  Alertas creadas: $($response.result.alertasCreadas)" -ForegroundColor Cyan
                    Write-Host "  Motivo: $($response.result.reason)" -ForegroundColor Cyan
                } else {
                    Write-Host "ℹ️ Smart Trigger no se ejecutó" -ForegroundColor Yellow
                    Write-Host "  Motivo: $($response.result.reason)" -ForegroundColor Yellow
                }
                
                Write-Host ""
                Write-Host "📊 Estadísticas actualizadas:" -ForegroundColor Blue
                Write-Host "  Ejecuciones hoy: $($response.stats.executionsToday)/24" -ForegroundColor Cyan
            } else {
                Write-Host "❌ Error en la ejecución: $($response.error)" -ForegroundColor Red
            }
            
        } catch {
            Write-Host "❌ Error al ejecutar Smart Trigger: $($_.Exception.Message)" -ForegroundColor Red
            Write-Host "💡 Asegúrate de estar autenticado y que el servidor esté corriendo" -ForegroundColor Yellow
        }
    }
    
    "test" {
        Write-Host "🌐 Abriendo página de pruebas..." -ForegroundColor Blue
        Start-Process "$BaseUrl/test-smart-trigger"
        Write-Host "✅ Página de pruebas abierta en el navegador" -ForegroundColor Green
    }
    
    "dashboard" {
        Write-Host "🏠 Abriendo dashboard..." -ForegroundColor Blue
        Start-Process "$BaseUrl/dashboard"
        Write-Host "✅ Dashboard abierto en el navegador" -ForegroundColor Green
        Write-Host "💡 El Smart Trigger se ejecutará automáticamente al cargar el dashboard" -ForegroundColor Yellow
    }
    
    default {
        Write-Host "❌ Acción no reconocida: $Action" -ForegroundColor Red
        Write-Host "Use 'help' para ver las acciones disponibles" -ForegroundColor Yellow
    }
}

Write-Host "" 