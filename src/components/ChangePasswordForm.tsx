'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Eye, EyeOff, Lock, Loader2, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'

interface PasswordStrength {
  score: number
  feedback: string[]
}

export function ChangePasswordForm() {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })
  const [loading, setLoading] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({ score: 0, feedback: [] })

  // Evaluar la fortaleza de la contraseña
  const evaluatePassword = (password: string): PasswordStrength => {
    let score = 0
    const feedback: string[] = []

    if (password.length >= 8) {
      score += 1
    } else {
      feedback.push('Usar al menos 8 caracteres')
    }

    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) {
      score += 1
    } else {
      feedback.push('Incluir mayúsculas y minúsculas')
    }

    if (/\d/.test(password)) {
      score += 1
    } else {
      feedback.push('Incluir al menos un número')
    }

    if (/[^a-zA-Z0-9]/.test(password)) {
      score += 1
    } else {
      feedback.push('Incluir al menos un carácter especial')
    }

    return { score, feedback }
  }

  const handlePasswordChange = (value: string) => {
    setFormData(prev => ({ ...prev, newPassword: value }))
    setPasswordStrength(evaluatePassword(value))
  }

  const getPasswordStrengthColor = (score: number) => {
    if (score <= 1) return 'bg-red-500'
    if (score === 2) return 'bg-orange-500'
    if (score === 3) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const getPasswordStrengthText = (score: number) => {
    if (score <= 1) return 'Débil'
    if (score === 2) return 'Regular'
    if (score === 3) return 'Buena'
    return 'Fuerte'
  }

  const validateForm = (): string | null => {
    if (!formData.currentPassword) {
      return 'La contraseña actual es requerida'
    }

    if (!formData.newPassword) {
      return 'La nueva contraseña es requerida'
    }

    if (formData.newPassword.length < 6) {
      return 'La nueva contraseña debe tener al menos 6 caracteres'
    }

    if (formData.newPassword !== formData.confirmPassword) {
      return 'Las contraseñas no coinciden'
    }

    if (formData.currentPassword === formData.newPassword) {
      return 'La nueva contraseña debe ser diferente a la actual'
    }

    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const validationError = validateForm()
    if (validationError) {
      toast.error(validationError)
      return
    }

    try {
      setLoading(true)
      
      const response = await fetch('/api/user/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Contraseña actualizada con éxito')
        setFormData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        })
        setPasswordStrength({ score: 0, feedback: [] })
      } else {
        toast.error(data.error || 'Error al cambiar la contraseña')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cambiar la contraseña')
    } finally {
      setLoading(false)
    }
  }

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="h-5 w-5" />
          Cambiar Contraseña
        </CardTitle>
        <CardDescription>
          Actualiza tu contraseña para mantener tu cuenta segura
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Contraseña actual */}
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Contraseña Actual</Label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showPasswords.current ? 'text' : 'password'}
                value={formData.currentPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, currentPassword: e.target.value }))}
                placeholder="Ingresa tu contraseña actual"
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => togglePasswordVisibility('current')}
              >
                {showPasswords.current ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Nueva contraseña */}
          <div className="space-y-2">
            <Label htmlFor="newPassword">Nueva Contraseña</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showPasswords.new ? 'text' : 'password'}
                value={formData.newPassword}
                onChange={(e) => handlePasswordChange(e.target.value)}
                placeholder="Ingresa tu nueva contraseña"
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => togglePasswordVisibility('new')}
              >
                {showPasswords.new ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            
            {/* Indicador de fortaleza */}
            {formData.newPassword && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrengthColor(passwordStrength.score)}`}
                      style={{ width: `${(passwordStrength.score / 4) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">
                    {getPasswordStrengthText(passwordStrength.score)}
                  </span>
                </div>
                
                {passwordStrength.feedback.length > 0 && (
                  <Alert>
                    <AlertDescription>
                      Para mejorar la seguridad: {passwordStrength.feedback.join(', ')}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </div>

          {/* Confirmar nueva contraseña */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar Nueva Contraseña</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showPasswords.confirm ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                placeholder="Confirma tu nueva contraseña"
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => togglePasswordVisibility('confirm')}
              >
                {showPasswords.confirm ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            
            {/* Indicador de coincidencia */}
            {formData.confirmPassword && (
              <div className="flex items-center gap-2 text-sm">
                {formData.newPassword === formData.confirmPassword ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-green-600">Las contraseñas coinciden</span>
                  </>
                ) : (
                  <>
                    <div className="h-4 w-4 rounded-full bg-red-500" />
                    <span className="text-red-600">Las contraseñas no coinciden</span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Botón de envío */}
          <div className="pt-4">
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {loading ? 'Actualizando...' : 'Cambiar Contraseña'}
            </Button>
          </div>
        </form>

        {/* Consejos de seguridad */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Consejos de seguridad:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Usa al menos 8 caracteres</li>
            <li>• Combina mayúsculas, minúsculas, números y símbolos</li>
            <li>• No uses información personal como fechas de nacimiento</li>
            <li>• No reutilices contraseñas de otras cuentas</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
} 