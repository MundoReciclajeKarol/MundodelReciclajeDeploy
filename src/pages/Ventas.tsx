// Archivo: src/pages/Ventas.tsx

import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, TrendingUp, Calculator, User } from 'lucide-react';
import { Venta, Material, ventasService, materialesService, formatCurrency, formatNumber } from '../services/api';
import { Button } from '../components/ui/Button';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';

const Ventas: React.FC = () => {
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [materiales, setMateriales] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingVenta, setEditingVenta] = useState<Venta | null>(null);
  const [filtros, setFiltros] = useState({
    fecha_inicio: '',
    fecha_fin: '',
    material_id: '',
    cliente: ''
  });
  const { addToast } = useToast();

  // Estados para el formulario
  const [formData, setFormData] = useState({
    material_id: '',
    fecha: new Date().toISOString().split('T')[0],
    kilos: 0,
    precio_kilo: 0,
    cliente: '',
    observaciones: '',
  });

  useEffect(() => {
    fetchVentas();
    fetchMateriales();
  }, [filtros]);

  const fetchVentas = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await ventasService.getAll({
        ...filtros,
        material_id: filtros.material_id ? parseInt(filtros.material_id) : undefined,
        limite: 100,
        pagina: 1
      });
      
      // Debug: Log para ver qué está devolviendo la API
      console.log('Respuesta de ventas API:', response);
      
      // Verificar que la respuesta tenga la estructura esperada
      if (response && response.data && Array.isArray(response.data)) {
        setVentas(response.data);
      } else if (Array.isArray(response)) {
        // Si la respuesta es directamente un array
        setVentas(response);
      } else {
        console.warn('Estructura de respuesta inesperada:', response);
        setVentas([]);
      }
    } catch (error) {
      console.error('Error cargando ventas:', error);
      setError('No se pudieron cargar las ventas');
      setVentas([]); // Asegurar que ventas sea un array vacío en caso de error
      addToast({
        type: 'error',
        title: 'Error',
        message: 'No se pudieron cargar las ventas'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMateriales = async () => {
    try {
      const data = await materialesService.getAll({ activo: true });
      setMateriales(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error cargando materiales:', error);
      setMateriales([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.material_id || formData.kilos <= 0 || formData.precio_kilo <= 0) {
      addToast({
        type: 'warning',
        title: 'Datos inválidos',
        message: 'Material, kilos y precio por kilo son requeridos y deben ser mayores a cero'
      });
      return;
    }
    
    try {
      const submitData = {
        ...formData,
        material_id: parseInt(formData.material_id)
      };

      if (editingVenta) {
        await ventasService.update(editingVenta.id, submitData);
        addToast({
          type: 'success',
          title: 'Venta actualizada',
          message: 'La venta se ha actualizado correctamente'
        });
      } else {
        await ventasService.create(submitData);
        addToast({
          type: 'success',
          title: 'Venta registrada',
          message: 'La venta se ha registrado correctamente'
        });
      }
      
      setShowModal(false);
      setEditingVenta(null);
      resetForm();
      fetchVentas();
    } catch (error: any) {
  console.error('Error guardando venta:', error);
  console.error('Error response data:', error.response?.data);
  console.error('Error response status:', error.response?.status);
  
  
  addToast({
    type: 'error',
    title: 'Error',
    message: `Error: ${error.response?.data?.error || error.message}. Datos: ${JSON.stringify(error.response?.data)}`
  });
}
  };

  const resetForm = () => {
    setFormData({
      material_id: '',
      fecha: new Date().toISOString().split('T')[0],
      kilos: 0,
      precio_kilo: 0,
      cliente: '',
      observaciones: '',
    });
  };

  const handleEdit = (venta: Venta) => {
    setEditingVenta(venta);
    setFormData({
      material_id: venta.material_id.toString(),
      fecha: venta.fecha,
      kilos: venta.kilos,
      precio_kilo: venta.precio_kilo,
      cliente: venta.cliente || '',
      observaciones: venta.observaciones || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (venta: Venta) => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar esta venta de ${venta.material_nombre}?`)) {
      try {
        await ventasService.delete(venta.id);
        addToast({
          type: 'success',
          title: 'Venta eliminada',
          message: 'La venta se ha eliminado correctamente'
        });
        fetchVentas();
      } catch (error: any) {
        console.error('Error eliminando venta:', error);
        addToast({
          type: 'error',
          title: 'Error',
          message: 'Error al eliminar la venta'
        });
      }
    }
  };

  // Verificar que ventas sea un array válido antes de hacer cálculos
  const ventasSeguras = Array.isArray(ventas) ? ventas : [];
  
  // Cálculos seguros
  const totalVentas = ventasSeguras.reduce((sum, venta) => sum + (venta.total_pesos || 0), 0);
  const totalKilos = ventasSeguras.reduce((sum, venta) => sum + (venta.kilos || 0), 0);
  const precioPromedio = ventasSeguras.length > 0 
    ? ventasSeguras.reduce((sum, venta) => sum + (venta.precio_kilo || 0), 0) / ventasSeguras.length
    : 0;

  const totalCalculado = formData.kilos * formData.precio_kilo;

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px' }}>
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '48px' }}>
        <p style={{ color: '#ef4444', marginBottom: '16px' }}>Error: {error}</p>
        <button 
          onClick={() => {
            setError(null);
            fetchVentas();
          }}
          style={{
            padding: '8px 16px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Reintentar
        </button>
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
            Ventas
          </h1>
          <p style={{ 
            fontSize: '14px', 
            color: '#6b7280', 
            margin: 0 
          }}>
            Registra las ventas de materiales reciclables
          </p>
        </div>
        <Button
          onClick={() => setShowModal(true)}
          icon={<Plus size={16} />}
        >
          Nueva Venta
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
              Material
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
              value={filtros.material_id}
              onChange={(e) => setFiltros({ ...filtros, material_id: e.target.value })}
            >
              <option value="">Todos los materiales</option>
              {materiales.map(material => (
                <option key={material.id} value={material.id}>
                  {material.nombre}
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
              Cliente
            </label>
            <input
              type="text"
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }}
              placeholder="Buscar por cliente..."
              value={filtros.cliente}
              onChange={(e) => setFiltros({ ...filtros, cliente: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
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
            Total Ventas
          </div>
          <div style={{ 
            fontSize: '24px', 
            fontWeight: 'bold', 
            color: '#111827',
            margin: '0 0 8px 0'
          }}>
            {formatCurrency(totalVentas)}
          </div>
          <div style={{ 
            display: 'flex',
            alignItems: 'center',
            fontSize: '14px', 
            fontWeight: '500',
            color: '#059669',
            margin: 0
          }}>
            <TrendingUp size={16} style={{ marginRight: '4px' }} />
            Ingresos
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
            Total Kilos
          </div>
          <div style={{ 
            fontSize: '24px', 
            fontWeight: 'bold', 
            color: '#111827',
            margin: '0 0 8px 0'
          }}>
            {formatNumber(totalKilos, 0)} kg
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
            Precio Promedio/Kg
          </div>
          <div style={{ 
            fontSize: '24px', 
            fontWeight: 'bold', 
            color: '#111827',
            margin: '0 0 8px 0'
          }}>
            {formatCurrency(precioPromedio)}
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
            Transacciones
          </div>
          <div style={{ 
            fontSize: '24px', 
            fontWeight: 'bold', 
            color: '#111827',
            margin: '0 0 8px 0'
          }}>
            {ventasSeguras.length}
          </div>
        </div>
      </div>

      {/* Tabla de ventas */}
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
            Ventas Registradas ({ventasSeguras.length})
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
                  Cliente
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
                  Kilos
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
                  Precio/Kg
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
                  Total
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
              {ventasSeguras.map((venta) => (
                <tr 
                  key={venta.id} 
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
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <TrendingUp size={16} style={{ color: '#10b981', marginRight: '8px' }} />
                      <div>
                        <div style={{ fontWeight: '500', color: '#111827' }}>
                          {venta.material_nombre || 'Sin nombre'}
                        </div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>
                          {venta.material_categoria || 'Sin categoría'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '16px 24px', fontSize: '14px', color: '#111827' }}>
                    {new Date(venta.fecha).toLocaleDateString('es-CO')}
                  </td>
                  <td style={{ padding: '16px 24px', fontSize: '14px', color: '#111827' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <User size={16} style={{ color: '#9ca3af', marginRight: '4px' }} />
                      <span>{venta.cliente || 'No especificado'}</span>
                    </div>
                  </td>
                  <td style={{ padding: '16px 24px', fontSize: '14px', color: '#111827' }}>
                    <span style={{ fontWeight: '500' }}>
                      {formatNumber(venta.kilos || 0, 2)} kg
                    </span>
                  </td>
                  <td style={{ padding: '16px 24px', fontSize: '14px', color: '#111827' }}>
                    {formatCurrency(venta.precio_kilo || 0)}
                  </td>
                  <td style={{ padding: '16px 24px', fontSize: '14px' }}>
                    <span style={{ 
                      fontSize: '16px', 
                      fontWeight: '600', 
                      color: '#059669' 
                    }}>
                      {formatCurrency(venta.total_pesos || 0)}
                    </span>
                  </td>
                  <td style={{ padding: '16px 24px', fontSize: '14px', color: '#111827' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleEdit(venta)}
                        icon={<Edit size={14} />}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDelete(venta)}
                        icon={<Trash2 size={14} />}
                      >
                        Eliminar
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {ventasSeguras.length === 0 && (
            <div style={{ textAlign: 'center', padding: '48px' }}>
              <TrendingUp size={48} style={{ color: '#9ca3af', margin: '0 auto 16px' }} />
              <p style={{ color: '#6b7280', margin: '0 0 4px 0' }}>No hay ventas registradas</p>
              <p style={{ fontSize: '14px', color: '#9ca3af', margin: 0 }}>
                Usa el botón "Nueva Venta" para empezar
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
          setEditingVenta(null);
          resetForm();
        }}
        title={editingVenta ? 'Editar Venta' : 'Nueva Venta'}
        size="lg"
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
                Material *
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
                value={formData.material_id}
                onChange={(e) => setFormData({ ...formData, material_id: e.target.value })}
              >
                <option value="">Seleccionar material</option>
                {materiales.map(material => (
                  <option key={material.id} value={material.id}>
                    {material.nombre} - {material.categoria}
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
              Cliente
            </label>
            <input
              type="text"
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }}
              value={formData.cliente}
              onChange={(e) => setFormData({ ...formData, cliente: e.target.value })}
              placeholder="Nombre del cliente (opcional)"
            />
          </div>

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
                Kilos *
              </label>
              <input
                type="number"
                required
                min="0.001"
                step="0.001"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
                value={formData.kilos}
                onChange={(e) => setFormData({ ...formData, kilos: parseFloat(e.target.value) || 0 })}
                placeholder="0.000"
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
                Precio por Kilo *
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
                value={formData.precio_kilo}
                onChange={(e) => setFormData({ ...formData, precio_kilo: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Calculadora de total */}
          <div style={{
            backgroundColor: '#f0fdf4',
            padding: '16px',
            borderRadius: '6px',
            border: '1px solid #bbf7d0'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <Calculator size={20} style={{ color: '#059669', marginRight: '8px' }} />
                <span style={{ fontSize: '14px', color: '#065f46', fontWeight: '500' }}>
                  Total de la venta:
                </span>
              </div>
              <span style={{ 
                fontSize: '20px', 
                fontWeight: 'bold', 
                color: '#059669' 
              }}>
                {formatCurrency(totalCalculado)}
              </span>
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
              placeholder="Notas adicionales sobre esta venta..."
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
            <Button type="submit" variant="success">
              {editingVenta ? 'Actualizar' : 'Registrar'} Venta
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Ventas;