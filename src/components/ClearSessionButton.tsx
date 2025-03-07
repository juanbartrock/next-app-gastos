'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';

interface ClearSessionButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'destructive';
  className?: string;
}

/**
 * Botón para limpiar la sesión de usuario
 * Útil cuando la base de datos se ha reiniciado y la sesión es inconsistente
 */
export default function ClearSessionButton({ 
  variant = 'outline',
  className = ''
}: ClearSessionButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleClearSession = async () => {
    if (confirm('¿Está seguro de que desea cerrar la sesión y limpiar todas las cookies?')) {
      setIsLoading(true);
      try {
        // Primero intentamos usar la API de signOut de NextAuth
        await signOut({ redirect: false });
        
        // Luego llamamos a nuestro endpoint para asegurar que se limpien todas las cookies
        await fetch('/api/auth/clear-session');
        
        // Finalmente redirigimos a login
        router.push('/login');
      } catch (error) {
        console.error('Error al limpiar la sesión:', error);
        // Si falla, intentamos redirigir directamente
        window.location.href = '/api/auth/clear-session';
      } finally {
        setIsLoading(false);
      }
    }
  };

  const buttonClasses = `
    px-4 py-2 rounded-md text-sm font-medium
    ${variant === 'primary' ? 'bg-blue-600 text-white hover:bg-blue-700' : ''}
    ${variant === 'secondary' ? 'bg-gray-200 text-gray-800 hover:bg-gray-300' : ''}
    ${variant === 'outline' ? 'border border-gray-300 text-gray-700 hover:bg-gray-100' : ''}
    ${variant === 'destructive' ? 'bg-red-600 text-white hover:bg-red-700' : ''}
    ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
    ${className}
  `;

  return (
    <button
      onClick={handleClearSession}
      disabled={isLoading}
      className={buttonClasses}
    >
      {isLoading ? 'Limpiando...' : 'Limpiar sesión'}
    </button>
  );
} 