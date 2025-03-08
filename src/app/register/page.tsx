"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function RegisterPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)
    const name = formData.get("name") as string
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const confirmPassword = formData.get("confirmPassword") as string
    const phoneNumber = formData.get("phoneNumber") as string

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden")
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
          phoneNumber,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Error al registrar usuario")
      }

      // Redirigir al login después de un registro exitoso
      router.push("/login?registered=true")
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message)
      } else {
        setError("Ocurrió un error durante el registro")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="w-full max-w-md space-y-8 bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Crear cuenta</h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Regístrate para comenzar</p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                name="name"
                type="text"
                required
                className="dark:bg-gray-700"
                placeholder="Tu nombre"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                className="dark:bg-gray-700"
                placeholder="tu@email.com"
              />
            </div>
            <div>
              <Label htmlFor="phoneNumber">Teléfono (con código de país)</Label>
              <Input
                id="phoneNumber"
                name="phoneNumber"
                type="tel"
                pattern="^\+[0-9]{10,15}$"
                title="Ingresa el número con código de país (ej: +54911234567)"
                className="dark:bg-gray-700"
                placeholder="+54911234567"
              />
            </div>
            <div>
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                className="dark:bg-gray-700"
                placeholder="••••••••"
              />
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                className="dark:bg-gray-700"
                placeholder="••••••••"
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700"
            disabled={isLoading}
          >
            {isLoading ? "Registrando..." : "Registrarse"}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
          ¿Ya tienes una cuenta?{" "}
          <Button
            variant="link"
            className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
            onClick={() => router.push("/login")}
          >
            Inicia sesión
          </Button>
        </p>
      </div>
    </div>
  )
} 