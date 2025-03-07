'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

// Definición del tipo Categoria
interface Categoria {
  id: number;
  descripcion: string;
  grupo_categoria: string | null;
  status: boolean;
  createdAt: string;
  updatedAt: string;
}

// Componente principal
export default function AdminCategorias() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estado para la categoría que se está editando
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    descripcion: '',
    grupo_categoria: '',
    status: true
  });
  
  // Estado para indicar si estamos creando o editando
  const [isCreating, setIsCreating] = useState(false);
  
  const router = useRouter();
  
  // Cargar categorías al montar el componente
  useEffect(() => {
    fetchCategorias();
  }, []);
  
  // Función para cargar las categorías
  const fetchCategorias = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/categorias');
      if (!res.ok) {
        throw new Error(`Error: ${res.status}`);
      }
      const data = await res.json();
      setCategorias(data);
    } catch (err) {
      setError('Error al cargar las categorías');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  // Función para iniciar la edición de una categoría
  const handleEdit = (categoria: Categoria) => {
    setEditingId(categoria.id);
    setFormData({
      descripcion: categoria.descripcion,
      grupo_categoria: categoria.grupo_categoria || '',
      status: categoria.status
    });
    setIsCreating(false);
  };
  
  // Función para iniciar la creación de una categoría
  const handleCreate = () => {
    setEditingId(null);
    setFormData({
      descripcion: '',
      grupo_categoria: '',
      status: true
    });
    setIsCreating(true);
  };
  
  // Función para guardar los cambios (crear o actualizar)
  const handleSave = async () => {
    try {
      let res;
      
      // Validar que la descripción no esté vacía
      if (!formData.descripcion.trim()) {
        toast.error('La descripción es obligatoria');
        return;
      }
      
      if (isCreating) {
        // Crear nueva categoría
        res = await fetch('/api/categorias', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });
      } else if (editingId !== null) {
        // Actualizar categoría existente
        res = await fetch('/api/categorias', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: editingId,
            ...formData,
          }),
        });
      }
      
      if (!res || !res.ok) {
        throw new Error(`Error: ${res?.status}`);
      }
      
      toast.success(isCreating ? 'Categoría creada con éxito' : 'Categoría actualizada con éxito');
      
      // Recargar las categorías y limpiar el formulario
      await fetchCategorias();
      setEditingId(null);
      setIsCreating(false);
    } catch (err) {
      toast.error('Error al guardar la categoría');
      console.error(err);
    }
  };
  
  // Función para eliminar una categoría
  const handleDelete = async (id: number) => {
    if (!confirm('¿Está seguro de que desea eliminar esta categoría?')) {
      return;
    }
    
    try {
      const res = await fetch(`/api/categorias?id=${id}`, {
        method: 'DELETE',
      });
      
      if (!res.ok) {
        throw new Error(`Error: ${res.status}`);
      }
      
      toast.success('Categoría eliminada con éxito');
      
      // Recargar las categorías
      await fetchCategorias();
    } catch (err) {
      toast.error('Error al eliminar la categoría');
      console.error(err);
    }
  };
  
  // Manejar cambios en el formulario
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    // Para checkboxes, usamos checked en lugar de value
    if (type === 'checkbox') {
      const { checked } = e.target as HTMLInputElement;
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  // Cancelar la edición
  const handleCancel = () => {
    setEditingId(null);
    setIsCreating(false);
    setFormData({
      descripcion: '',
      grupo_categoria: '',
      status: true
    });
  };
  
  // Si está cargando, mostrar indicador
  if (loading && categorias.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Administración de Categorías</h1>
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-500">Cargando categorías...</p>
        </div>
      </div>
    );
  }
  
  // Si hay error, mostrar mensaje
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Administración de Categorías</h1>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
          <button 
            onClick={fetchCategorias}
            className="mt-2 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Administración de Categorías</h1>
        <button
          onClick={handleCreate}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Nueva Categoría
        </button>
      </div>
      
      {/* Formulario de creación/edición */}
      {(isCreating || editingId !== null) && (
        <div className="bg-white p-4 rounded shadow-md mb-8">
          <h2 className="text-xl font-semibold mb-4">
            {isCreating ? 'Crear Categoría' : 'Editar Categoría'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción *
              </label>
              <input
                type="text"
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                placeholder="Nombre de la categoría"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Grupo de Categoría
              </label>
              <input
                type="text"
                name="grupo_categoria"
                value={formData.grupo_categoria}
                onChange={handleChange}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: Hogar, Transporte, etc."
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                name="status"
                checked={formData.status}
                onChange={handleChange}
                id="status"
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="status" className="ml-2 block text-sm text-gray-700">
                Activa
              </label>
            </div>
          </div>
          <div className="mt-4 flex justify-end space-x-2">
            <button
              onClick={handleCancel}
              className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Guardar
            </button>
          </div>
        </div>
      )}
      
      {/* Tabla de categorías */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Descripción
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Grupo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {categorias.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                  No hay categorías disponibles
                </td>
              </tr>
            ) : (
              categorias.map((categoria) => (
                <tr key={categoria.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {categoria.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {categoria.descripcion}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {categoria.grupo_categoria || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        categoria.status 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {categoria.status ? 'Activa' : 'Inactiva'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEdit(categoria)}
                      className="text-indigo-600 hover:text-indigo-900 mr-4"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(categoria.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
} 