import Link from 'next/link';

export default function AdminPage() {
  return (
    <div className="py-8">
      <div className="max-w-3xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="px-6 py-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Panel de Administración</h1>
          
          <p className="text-gray-600 mb-8">
            Bienvenido al panel de administración. Desde aquí puedes gestionar diferentes aspectos de la aplicación.
          </p>
          
          <div className="space-y-4">
            <div className="border rounded-lg p-6 bg-gray-50 hover:bg-gray-100 transition">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Gestión de Categorías</h2>
              <p className="text-gray-600 mb-4">
                Administra las categorías disponibles para clasificar gastos e ingresos.
              </p>
              <Link 
                href="/admin/categorias"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Ir a Categorías
              </Link>
            </div>
            
            {/* Puedes añadir más secciones de administración aquí en el futuro */}
          </div>
        </div>
        
        <div className="px-6 py-4 bg-gray-50 border-t">
          <p className="text-sm text-gray-500">
            Esta área es solo para administradores. No está enlazada desde el resto de la aplicación.
          </p>
        </div>
      </div>
    </div>
  );
} 