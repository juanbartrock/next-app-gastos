import { ReactNode } from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'Administración - App de Gastos',
  description: 'Panel de administración para la App de Gastos',
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link href="/">
                  <span className="text-xl font-bold text-gray-800">App de Gastos</span>
                </Link>
              </div>
              <div className="ml-6 flex space-x-8">
                <Link 
                  href="/admin/categorias" 
                  className="border-indigo-500 text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Administrar Categorías
                </Link>
              </div>
            </div>
            <div className="flex items-center">
              <Link 
                href="/" 
                className="ml-4 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Volver a la App
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>

      <footer className="bg-white border-t mt-auto">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500">
            Panel de Administración - Solo para uso autorizado
          </p>
        </div>
      </footer>
    </div>
  );
} 