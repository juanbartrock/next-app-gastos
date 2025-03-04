"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { X } from "lucide-react"

interface InvitarUsuarioFormProps {
  grupoId: string
  onUsuarioInvitado?: () => void
  onCancel?: () => void
}

export function InvitarUsuarioForm({
  grupoId,
  onUsuarioInvitado,
  onCancel
}: InvitarUsuarioFormProps) {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (!email || !email.includes('@')) {
      setError("Por favor ingresa un email válido")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/grupos/${grupoId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al invitar al usuario")
      }

      // Éxito
      toast.success(`${data.user.name || email} ha sido invitado al grupo`)
      setEmail("")
      
      if (onUsuarioInvitado) {
        onUsuarioInvitado()
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Error al invitar al usuario")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email del usuario</Label>
          <Input
            id="email"
            placeholder="correo@ejemplo.com"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        
        {error && (
          <div className="bg-destructive/20 p-3 rounded-md flex items-center text-sm">
            <X className="h-4 w-4 text-destructive mr-2" />
            <span className="text-destructive">{error}</span>
          </div>
        )}

        <div className="flex gap-2 justify-end">
          {onCancel && (
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
            >
              Cancelar
            </Button>
          )}
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Invitando..." : "Invitar usuario"}
          </Button>
        </div>
      </form>
    </div>
  )
} 