// Archivo: src/pages/Materiales.tsx

import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Package, Tag } from 'lucide-react';
import { Material, materialesService, formatCurrency } from '../services/api';
import { Button } from '../components/ui/Button';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';

interface FormDataType {
  nombre: string;
  categoria: string;
  precio_ordinario: number;
  precio_camion: number;
  precio_noche: number;
  activo: boolean;
}

const Materiales: React.FC = () => {
  const [materiales, setMateriales] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const { addToast } = useToast();

  // Estados para el formulario
  const [formData, setFormData] = useState<FormDataType>({
    nombre: '',
    categoria: '',
    precio_ordinario: 0,
    precio_camion: 0,
    precio_noche: 0,
    activo: true,
  });

  useEffect(() => {
    fetchMateriales();
    fetchCategories();
  }, []);

  const fetchMateriales = async () => {
    try {
      setLoading(true);
      const data = await materialesService.getAll({ activo: true });
      setMateriales(data);
    } catch (error) {
      console.error('Error cargando materiales:', error);
      addToast({
        type: 'error',
        title: 'Error',
        message: 'No se pudieron cargar los materiales'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await materialesService.getCategorias();
      setCategories(data);
    } catch (error) {
      console.error('Error cargando categorías:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nombre.trim() || !formData.categoria.trim()) {
      addToast({
        type: 'warning',
        title: 'Datos inválidos',
        message: 'Nombre y categoría son requeridos'
      });
      return;
    }
    
    try {
      if (editingMaterial) {
        await materialesService.update(editingMaterial.id, formData);
        addToast({
          type: 'success',
          title: 'Material actualizado',
          message: 'El material se ha actualizado correctamente'
        });
      } else {
        await materialesService.create(formData);
        addToast({
          type: 'success',
          title: 'Material creado',
          message: 'El material se ha creado correctamente'
        });
      }
      
      setShowModal(false);
      setEditingMaterial(null);
      resetForm();
      fetchMateriales();
      fetchCategories();
    } catch (error: any) {
      console.error('Error guardando material:', error);
      addToast({
        type: 'error',
        title: 'Error',
        message: error.response?.data?.error || 'Error al guardar el material'
      });
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      categoria: '',
      precio_ordinario: 0,
      precio_camion: 0,
      precio_noche: 0,
      activo: true,
    });
  };

  const handleEdit = (material: Material) => {
    setEditingMaterial(material);
    setFormData({
      nombre: material.nombre,
      categoria: material.categoria,
      precio_ordinario: material.precio_ordinario,
      precio_camion: material.precio_camion,
      precio_noche: material.precio_noche,
      activo: material.activo,
    });
    setShowModal(true);
  };

  const handleDelete = async (material: Material) => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar el material "${material.nombre}"?`)) {
      try {
        await materialesService.delete(material.id);
        addToast({
          type: 'success',
          title: 'Material eliminado',
          message: 'El material se ha eliminado correctamente'
        });
        fetchMateriales();
      } catch (error: any) {
        console.error('Error eliminando material:', error);
        addToast({
          type: 'error',
          title: 'Error',
          message: error.response?.data?.error || 'Error al eliminar el material'
        });
      }
    }
  };

  const getCategoryColor = (categoria: string) => {
    const colors: { [key: string]: { bg: string; text: string } } = {
      'Plástico': { bg: '#dbeafe', text: '#1e40af' },
      'Metal': { bg: '#f3f4f6', text: '#374151' },
      'Papel': { bg: '#dcfce7', text: '#166534' },
      'Cartón': { bg: '#fef3c7', text: '#92400e' },
      'Vidrio': { bg: '#e9d5ff', text: '#7c3aed' },
      'Electrónicos': { bg: '#fed7aa', text: '#ea580c' },
      'Otros': { bg: '#f1f5f9', text: '#475569' }
    };
    return colors[categoria] || colors['Otros'];
  };

  const filteredMateriales = materiales.filter(material => {
    const matchesSearch = material.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         material.categoria.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || material.categoria === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px' }}>
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '32px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <h1 style={{ 
            fontSize: '28px', 
            fontWeight: 'bold', 
            color: '#111827', 
            margin: '0 0 8px 0' 
          }}>
            Materiales
          </h1>
          <p style={{ 
            fontSize: '14px', 
            color: '#6b7280', 
            margin: 0 
          }}>
            Gestiona los materiales de reciclaje y sus precios por tipo
          </p>
        </div>
        <Button
          onClick={() => setShowModal(true)}
          icon={<Plus size={16} />}
        >
          Nuevo Material
        </Button>
      </div>

      {/* Filtros */}
      <div style={{
        backgroundColor: 'white',
        padding: '24px',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        border: '1px solid #e5e7eb',
        marginBottom: '24px'
      }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '16px' 
        }}>
          <div style={{ position: 'relative' }}>
            <div style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'none'
            }}>
              <Search size={16} style={{ color: '#9ca3af' }} />
            </div>
            <input
              type="text"
              placeholder="Buscar materiales..."
              style={{
                width: '100%',
                paddingLeft: '40px',
                paddingRight: '12px',
                paddingTop: '8px',
                paddingBottom: '8px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div>
            <select
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                backgroundColor: 'white',
                fontSize: '14px'
              }}
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">Todas las categorías</option>
              {categories.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '20px', 
        marginBottom: '32px' 
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '24px',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ 
            fontSize: '14px', 
            color: '#6b7280', 
            fontWeight: '500',
            margin: '0 0 4px 0',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            Total Materiales
          </div>
          <div style={{ 
            fontSize: '24px', 
            fontWeight: 'bold', 
            color: '#111827',
            margin: '0 0 8px 0'
          }}>
            {materiales.length}
          </div>
          <div style={{ 
            fontSize: '14px', 
            fontWeight: '500',
            color: '#6b7280',
            margin: 0
          }}>
            {categories.length} categorías
          </div>
        </div>

        <div style={{
          backgroundColor: 'white',
          padding: '24px',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ 
            fontSize: '14px', 
            color: '#6b7280', 
            fontWeight: '500',
            margin: '0 0 4px 0',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            Precio Promedio
          </div>
          <div style={{ 
            fontSize: '24px', 
            fontWeight: 'bold', 
            color: '#111827',
            margin: '0 0 8px 0'
          }}>
            {materiales.length > 0 
              ? formatCurrency(materiales.reduce((sum, m) => sum + m.precio_ordinario, 0) / materiales.length)
              : formatCurrency(0)
            }
          </div>
          <div style={{ 
            fontSize: '14px', 
            fontWeight: '500',
            color: '#6b7280',
            margin: 0
          }}>
            Precio ordinario
          </div>
        </div>

        <div style={{
          backgroundColor: 'white',
          padding: '24px',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ 
            fontSize: '14px', 
            color: '#6b7280', 
            fontWeight: '500',
            margin: '0 0 4px 0',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            Precio Más Alto
          </div>
          <div style={{ 
            fontSize: '24px', 
            fontWeight: 'bold', 
            color: '#111827',
            margin: '0 0 8px 0'
          }}>
            {materiales.length > 0 
              ? formatCurrency(Math.max(...materiales.map(m => m.precio_ordinario)))
              : formatCurrency(0)
            }
          </div>
        </div>
      </div>

      {/* Tabla de materiales */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        border: '1px solid #e5e7eb',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: '16px 24px',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', margin: 0 }}>
            Materiales Registrados ({filteredMateriales.length})
          </h3>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ backgroundColor: '#f9fafb' }}>
              <tr>
                <th style={{ 
                  padding: '12px 24px', 
                  textAlign: 'left', 
                  fontSize: '12px', 
                  fontWeight: '500', 
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  Material
                </th>
                <th style={{ 
                  padding: '12px 24px', 
                  textAlign: 'left', 
                  fontSize: '12px', 
                  fontWeight: '500', 
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  Categoría
                </th>
                <th style={{ 
                  padding: '12px 24px', 
                  textAlign: 'left', 
                  fontSize: '12px', 
                  fontWeight: '500', 
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  Precio Ordinario
                </th>
                <th style={{ 
                  padding: '12px 24px', 
                  textAlign: 'left', 
                  fontSize: '12px', 
                  fontWeight: '500', 
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  Precio Camión
                </th>
                <th style={{ 
                  padding: '12px 24px', 
                  textAlign: 'left', 
                  fontSize: '12px', 
                  fontWeight: '500', 
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  Precio Noche
                </th>
                <th style={{ 
                  padding: '12px 24px', 
                  textAlign: 'left', 
                  fontSize: '12px', 
                  fontWeight: '500', 
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  Estado
                </th>
                <th style={{ 
                  padding: '12px 24px', 
                  textAlign: 'left', 
                  fontSize: '12px', 
                  fontWeight: '500', 
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredMateriales.map((material) => {
                const categoryColor = getCategoryColor(material.categoria);
                return (
                  <tr 
                    key={material.id} 
                    style={{ 
                      borderBottom: '1px solid #f3f4f6',
                      transition: 'background-color 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f9fafb';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'white';
                    }}
                  >
                    <td style={{ padding: '16px 24px', fontSize: '14px', color: '#111827' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Package size={20} style={{ color: '#9ca3af' }} />
                        <div>
                          <div style={{ fontWeight: '500', color: '#111827' }}>{material.nombre}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: '14px', color: '#111827' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        padding: '4px 8px',
                        borderRadius: '9999px',
                        fontSize: '12px',
                        fontWeight: '500',
                        backgroundColor: categoryColor.bg,
                        color: categoryColor.text
                      }}>
                        <Tag size={12} style={{ marginRight: '4px' }} />
                        {material.categoria}
                      </span>
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: '14px', color: '#111827' }}>
                      <span style={{ fontWeight: '500' }}>
                        {formatCurrency(material.precio_ordinario)}
                      </span>
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: '14px', color: '#111827' }}>
                      <span style={{ fontWeight: '500', color: '#059669' }}>
                        {formatCurrency(material.precio_camion)}
                      </span>
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: '14px', color: '#111827' }}>
                      <span style={{ fontWeight: '500', color: '#7c3aed' }}>
                        {formatCurrency(material.precio_noche)}
                      </span>
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: '14px', color: '#111827' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        padding: '4px 8px',
                        borderRadius: '9999px',
                        fontSize: '12px',
                        fontWeight: '500',
                        backgroundColor: material.activo ? '#dcfce7' : '#fef2f2',
                        color: material.activo ? '#166534' : '#dc2626'
                      }}>
                        {material.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: '14px', color: '#111827' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleEdit(material)}
                          icon={<Edit size={14} />}
                        >
                          Editar
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDelete(material)}
                          icon={<Trash2 size={14} />}
                        >
                          Eliminar
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          {filteredMateriales.length === 0 && (
            <div style={{ textAlign: 'center', padding: '48px' }}>
              <Package size={48} style={{ color: '#9ca3af', margin: '0 auto 16px' }} />
              <p style={{ color: '#6b7280', margin: '0 0 4px 0' }}>
                {searchTerm || selectedCategory ? 'No se encontraron materiales' : 'No hay materiales registrados'}
              </p>
              <p style={{ fontSize: '14px', color: '#9ca3af', margin: 0 }}>
                {searchTerm || selectedCategory 
                  ? 'Intenta ajustar los filtros de búsqueda'
                  : 'Usa el botón "Nuevo Material" para empezar'
                }
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal de formulario */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingMaterial(null);
          resetForm();
        }}
        title={editingMaterial ? 'Editar Material' : 'Nuevo Material'}
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ 
              display: 'block', 
              fontSize: '14px', 
              fontWeight: '500', 
              color: '#374151', 
              marginBottom: '4px' 
            }}>
              Nombre del Material *
            </label>
            <input
              type="text"
              required
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }}
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              placeholder="Ej: Botellas PET, Chatarra de hierro..."
            />
          </div>

          <div>
            <label style={{ 
              display: 'block', 
              fontSize: '14px', 
              fontWeight: '500', 
              color: '#374151', 
              marginBottom: '4px' 
            }}>
              Categoría *
            </label>
            <input
              type="text"
              required
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }}
              value={formData.categoria}
              onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
              placeholder="Ej: Plástico, Metal, Papel..."
              list="categorias"
            />
            <datalist id="categorias">
              {categories.map(category => (
                <option key={category} value={category} />
              ))}
            </datalist>
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
            gap: '16px' 
          }}>
            <div>
              <label style={{ 
                display: 'block', 
                fontSize: '14px', 
                fontWeight: '500', 
                color: '#374151', 
                marginBottom: '4px' 
              }}>
                Precio Ordinario
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
                value={formData.precio_ordinario}
                onChange={(e) => setFormData({ ...formData, precio_ordinario: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
              />
            </div>

            <div>
              <label style={{ 
                display: 'block', 
                fontSize: '14px', 
                fontWeight: '500', 
                color: '#374151', 
                marginBottom: '4px' 
              }}>
                Precio Camión
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
                value={formData.precio_camion}
                onChange={(e) => setFormData({ ...formData, precio_camion: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
              />
            </div>

            <div>
              <label style={{ 
                display: 'block', 
                fontSize: '14px', 
                fontWeight: '500', 
                color: '#374151', 
                marginBottom: '4px' 
              }}>
                Precio Noche
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
                value={formData.precio_noche}
                onChange={(e) => setFormData({ ...formData, precio_noche: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
              />
            </div>
          </div>

          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            padding: '12px',
            backgroundColor: '#f9fafb',
            borderRadius: '6px',
            border: '1px solid #e5e7eb'
          }}>
            <input
              type="checkbox"
              id="activo"
              style={{ margin: 0 }}
              checked={formData.activo}
              onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
            />
            <label 
              htmlFor="activo" 
              style={{ 
                fontSize: '14px', 
                fontWeight: '500', 
                color: '#374151', 
                margin: 0,
                cursor: 'pointer'
              }}
            >
              Material activo
            </label>
            <span style={{ 
              fontSize: '12px', 
              color: '#6b7280',
              marginLeft: '8px'
            }}>
              (Solo los materiales activos aparecen en ventas)
            </span>
          </div>

          <div style={{
            backgroundColor: '#f0f9ff',
            padding: '12px',
            borderRadius: '6px',
            border: '1px solid #bae6fd',
            fontSize: '14px',
            color: '#0c4a6e'
          }}>
            💡 <strong>Tip:</strong> Los precios por camión y noche suelen ser más altos que el precio ordinario
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowModal(false)}
            >
              Cancelar
            </Button>
            <Button type="submit">
              {editingMaterial ? 'Actualizar' : 'Crear'} Material
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Materiales;