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
            
            <div className="border rounded-lg p-6 bg-gray-50 hover:bg-gray-100 transition">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Gestión de Scrapers</h2>
              <p className="text-gray-600 mb-4">
                Supervisa y ejecuta los scrapers para obtener recomendaciones de ahorro en tiempo real.
              </p>
              <Link 
                href="/admin/scraping"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Ir a Scrapers
              </Link>
            </div>
            
            <div className="border rounded-lg p-6 bg-gray-50 hover:bg-gray-100 transition">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Planes y Servicios</h2>
              <p className="text-gray-600 mb-4">
                Administra los planes disponibles y configura qué servicios están incluidos en cada plan.
              </p>
              <Link 
                href="/admin/planes"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
              >
                Ir a Planes
              </Link>
            </div>
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