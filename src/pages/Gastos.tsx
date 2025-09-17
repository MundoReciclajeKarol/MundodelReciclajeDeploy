// Archivo: src/pages/Gastos.tsx

import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Receipt, CreditCard, Settings } from 'lucide-react';
import { Gasto, CategoriaGasto, gastosService, formatCurrency } from '../services/api';
import { Button } from '../components/ui/Button';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';

const Gastos: React.FC = () => {
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [categorias, setCategorias] = useState<CategoriaGasto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showCategoriaModal, setShowCategoriaModal] = useState(false);
  const [editingGasto, setEditingGasto] = useState<Gasto | null>(null);
  const [filtros, setFiltros] = useState({
    fecha_inicio: '',
    fecha_fin: '',
    categoria_id: ''
  });
  const { addToast } = useToast();

  // Estados para el formulario de gastos
  const [formData, setFormData] = useState({
    categoria_id: '',
    fecha: new Date().toISOString().split('T')[0],
    concepto: '',
    valor: 0,
    observaciones: '',
  });

  // Estados para el formulario de categorías
  const [categoriaData, setCategoriaData] = useState({
    nombre: '',
    descripcion: '',
  });

  useEffect(() => {
    fetchGastos();
    fetchCategorias();
  }, [filtros]);

  const fetchGastos = async () => {
    try {
      setLoading(true);
      const response = await gastosService.getAll({
        ...filtros,
        categoria_id: filtros.categoria_id ? parseInt(filtros.categoria_id) : undefined,
        limite: 100,
        pagina: 1
      });
      setGastos(response.data);
    } catch (error) {
      console.error('Error cargando gastos:', error);
      addToast({
        type: 'error',
        title: 'Error',
        message: 'No se pudieron cargar los gastos'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCategorias = async () => {
    try {
      const data = await gastosService.getCategorias();
      setCategorias(data);
    } catch (error) {
      console.error('Error cargando categorías:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.categoria_id || !formData.concepto || formData.valor <= 0) {
      addToast({
        type: 'warning',
        title: 'Datos inválidos',
        message: 'Categoría, concepto y valor son requeridos'
      });
      return;
    }
    
    try {
      const submitData = {
        ...formData,
        categoria_id: parseInt(formData.categoria_id)
      };

      if (editingGasto) {
        await gastosService.update(editingGasto.id, submitData);
        addToast({
          type: 'success',
          title: 'Gasto actualizado',
          message: 'El gasto se ha actualizado correctamente'
        });
      } else {
        await gastosService.create(submitData);
        addToast({
          type: 'success',
          title: 'Gasto registrado',
          message: 'El gasto se ha registrado correctamente'
        });
      }
      
      setShowModal(false);
      setEditingGasto(null);
      resetForm();
      fetchGastos();
    } catch (error: any) {
      console.error('Error guardando gasto:', error);
      addToast({
        type: 'error',
        title: 'Error',
        message: error.response?.data?.error || 'Error al guardar el gasto'
      });
    }
  };

  const handleCategoriaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!categoriaData.nombre) {
      addToast({
        type: 'warning',
        title: 'Datos inválidos',
        message: 'El nombre de la categoría es requerido'
      });
      return;
    }
    
    try {
      await gastosService.createCategoria(categoriaData);
      addToast({
        type: 'success',
        title: 'Categoría creada',
        message: 'La categoría se ha creado correctamente'
      });
      
      setShowCategoriaModal(false);
      setCategoriaData({ nombre: '', descripcion: '' });
      fetchCategorias();
    } catch (error: any) {
      console.error('Error creando categoría:', error);
      addToast({
        type: 'error',
        title: 'Error',
        message: error.response?.data?.error || 'Error al crear la categoría'
      });
    }
  };

  const resetForm = () => {
    setFormData({
      categoria_id: '',
      fecha: new Date().toISOString().split('T')[0],
      concepto: '',
      valor: 0,
      observaciones: '',
    });
  };

  const handleEdit = (gasto: Gasto) => {
    setEditingGasto(gasto);
    setFormData({
      categoria_id: gasto.categoria_id.toString(),
      fecha: gasto.fecha,
      concepto: gasto.concepto,
      valor: gasto.valor,
      observaciones: gasto.observaciones || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (gasto: Gasto) => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar el gasto "${gasto.concepto}"?`)) {
      try {
        await gastosService.delete(gasto.id);
        addToast({
          type: 'success',
          title: 'Gasto eliminado',
          message: 'El gasto se ha eliminado correctamente'
        });
        fetchGastos();
      } catch (error: any) {
        console.error('Error eliminando gasto:', error);
        addToast({
          type: 'error',
          title: 'Error',
          message: 'Error al eliminar el gasto'
        });
      }
    }
  };

  const getCategoriaColor = (categoria: string) => {
    const colors: { [key: string]: { bg: string; text: string } } = {
      'Sueldos': { bg: '#dbeafe', text: '#1e40af' },
      'Gas Camión': { bg: '#fed7aa', text: '#ea580c' },
      'Alimentación': { bg: '#dcfce7', text: '#166534' },
      'Mantenimiento': { bg: '#fef3c7', text: '#92400e' },
      'Servicios': { bg: '#e9d5ff', text: '#7c3aed' },
      'Otros': { bg: '#f3f4f6', text: '#374151' }
    };
    return colors[categoria] || colors['Otros'];
  };

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
            Gastos
          </h1>
          <p style={{ 
            fontSize: '14px', 
            color: '#6b7280', 
            margin: 0 
          }}>
            Controla y categoriza todos los gastos del negocio
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Button
            variant="secondary"
            onClick={() => setShowCategoriaModal(true)}
            icon={<Settings size={16} />}
          >
            Nueva Categoría
          </Button>
          <Button
            onClick={() => setShowModal(true)}
            icon={<Plus size={16} />}
          >
            Nuevo Gasto
          </Button>
        </div>
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
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
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
              Fecha Inicio
            </label>
            <input
              type="date"
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }}
              value={filtros.fecha_inicio}
              onChange={(e) => setFiltros({ ...filtros, fecha_inicio: e.target.value })}
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
              Fecha Fin
            </label>
            <input
              type="date"
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }}
              value={filtros.fecha_fin}
              onChange={(e) => setFiltros({ ...filtros, fecha_fin: e.target.value })}
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
              Categoría
            </label>
            <select
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                backgroundColor: 'white',
                fontSize: '14px'
              }}
              value={filtros.categoria_id}
              onChange={(e) => setFiltros({ ...filtros, categoria_id: e.target.value })}
            >
              <option value="">Todas las categorías</option>
              {categorias.map(categoria => (
                <option key={categoria.id} value={categoria.id}>
                  {categoria.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Estadísticas por categoría */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: '20px', 
        marginBottom: '32px' 
      }}>
        {categorias.map(categoria => {
          const gastosCategoria = gastos.filter(g => g.categoria_id === categoria.id);
          const total = gastosCategoria.reduce((sum, g) => sum + g.valor, 0);
          const color = getCategoriaColor(categoria.nombre);
          
          return (
            <div key={categoria.id} style={{
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
                {categoria.nombre}
              </div>
              <div style={{ 
                fontSize: '24px', 
                fontWeight: 'bold', 
                color: '#111827',
                margin: '0 0 8px 0'
              }}>
                {formatCurrency(total)}
              </div>
              <div style={{ 
                fontSize: '14px', 
                fontWeight: '500',
                color: '#6b7280',
                margin: 0
              }}>
                {gastosCategoria.length} transacciones
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabla de gastos */}
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
            Gastos Registrados ({gastos.length})
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
                  Fecha
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
                  Concepto
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
                  Valor
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
              {gastos.map((gasto) => {
                const color = getCategoriaColor(gasto.categoria_nombre);
                return (
                  <tr 
                    key={gasto.id} 
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
                      {new Date(gasto.fecha).toLocaleDateString('es-CO')}
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: '14px', color: '#111827' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        padding: '4px 8px',
                        borderRadius: '9999px',
                        fontSize: '12px',
                        fontWeight: '500',
                        backgroundColor: color.bg,
                        color: color.text
                      }}>
                        {gasto.categoria_nombre}
                      </span>
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: '14px', color: '#111827' }}>
                      <div>
                        <div style={{ fontWeight: '500' }}>{gasto.concepto}</div>
                        {gasto.observaciones && (
                          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                            {gasto.observaciones}
                          </div>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: '14px' }}>
                      <span style={{ 
                        fontSize: '16px', 
                        fontWeight: '600', 
                        color: '#ef4444' 
                      }}>
                        {formatCurrency(gasto.valor)}
                      </span>
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: '14px', color: '#111827' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleEdit(gasto)}
                          icon={<Edit size={14} />}
                        >
                          Editar
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDelete(gasto)}
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
          
          {gastos.length === 0 && (
            <div style={{ textAlign: 'center', padding: '48px' }}>
              <Receipt size={48} style={{ color: '#9ca3af', margin: '0 auto 16px' }} />
              <p style={{ color: '#6b7280', margin: '0 0 4px 0' }}>No hay gastos registrados</p>
              <p style={{ fontSize: '14px', color: '#9ca3af', margin: 0 }}>
                Usa el botón "Nuevo Gasto" para empezar
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal de formulario de gastos */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingGasto(null);
          resetForm();
        }}
        title={editingGasto ? 'Editar Gasto' : 'Nuevo Gasto'}
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
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
                Categoría *
              </label>
              <select
                required
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  backgroundColor: 'white',
                  fontSize: '14px'
                }}
                value={formData.categoria_id}
                onChange={(e) => setFormData({ ...formData, categoria_id: e.target.value })}
              >
                <option value="">Seleccionar categoría</option>
                {categorias.map(categoria => (
                  <option key={categoria.id} value={categoria.id}>
                    {categoria.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ 
                display: 'block', 
                fontSize: '14px', 
                fontWeight: '500', 
                color: '#374151', 
                marginBottom: '4px' 
              }}>
                Fecha *
              </label>
              <input
                type="date"
                required
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
                value={formData.fecha}
                onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label style={{ 
              display: 'block', 
              fontSize: '14px', 
              fontWeight: '500', 
              color: '#374151', 
              marginBottom: '4px' 
            }}>
              Concepto *
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
              value={formData.concepto}
              onChange={(e) => setFormData({ ...formData, concepto: e.target.value })}
              placeholder="Descripción del gasto"
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
              Valor *
            </label>
            <input
              type="number"
              required
              min="0.01"
              step="0.01"
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }}
              value={formData.valor}
              onChange={(e) => setFormData({ ...formData, valor: parseFloat(e.target.value) || 0 })}
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
              Observaciones
            </label>
            <textarea
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                minHeight: '80px',
                resize: 'vertical'
              }}
              rows={3}
              value={formData.observaciones}
              onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
              placeholder="Detalles adicionales del gasto..."
            />
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
              {editingGasto ? 'Actualizar' : 'Registrar'} Gasto
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal de nueva categoría */}
      <Modal
        isOpen={showCategoriaModal}
        onClose={() => {
          setShowCategoriaModal(false);
          setCategoriaData({ nombre: '', descripcion: '' });
        }}
        title="Nueva Categoría de Gasto"
      >
        <form onSubmit={handleCategoriaSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ 
              display: 'block', 
              fontSize: '14px', 
              fontWeight: '500', 
              color: '#374151', 
              marginBottom: '4px' 
            }}>
              Nombre de la Categoría *
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
              value={categoriaData.nombre}
              onChange={(e) => setCategoriaData({ ...categoriaData, nombre: e.target.value })}
              placeholder="Ej: Mantenimiento Vehículos"
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
              Descripción
            </label>
            <textarea
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                minHeight: '80px',
                resize: 'vertical'
              }}
              rows={3}
              value={categoriaData.descripcion}
              onChange={(e) => setCategoriaData({ ...categoriaData, descripcion: e.target.value })}
              placeholder="Descripción opcional de la categoría..."
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowCategoriaModal(false)}
            >
              Cancelar
            </Button>
            <Button type="submit">
              Crear Categoría
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Gastos;