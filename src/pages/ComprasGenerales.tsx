// Archivo: src/pages/ComprasGenerales.tsx

import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, ShoppingCart, Calendar } from 'lucide-react';
import { CompraGeneral, comprasGeneralesService, formatCurrency } from '../services/api';
import { Button } from '../components/ui/Button';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';

const ComprasGenerales: React.FC = () => {
  const [compras, setCompras] = useState<CompraGeneral[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCompra, setEditingCompra] = useState<CompraGeneral | null>(null);
  const [filtros, setFiltros] = useState({
    fecha_inicio: '',
    fecha_fin: '',
    tipo_precio: ''
  });
  const { addToast } = useToast();

  // Estados para el formulario
  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split('T')[0],
    total_pesos: 0,
    tipo_precio: 'ordinario' as 'ordinario' | 'camion' | 'noche',
    observaciones: '',
  });

  useEffect(() => {
    fetchCompras();
  }, [filtros]);

  const fetchCompras = async () => {
    try {
      setLoading(true);
      const response = await comprasGeneralesService.getAll({
        ...filtros,
        limite: 100,
        pagina: 1
      });
      setCompras(response.data);
    } catch (error) {
      console.error('Error cargando compras:', error);
      addToast({
        type: 'error',
        title: 'Error',
        message: 'No se pudieron cargar las compras'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.total_pesos <= 0) {
      addToast({
        type: 'warning',
        title: 'Datos inválidos',
        message: 'El total debe ser mayor a cero'
      });
      return;
    }
    
    try {
      if (editingCompra) {
        await comprasGeneralesService.update(editingCompra.id, formData);
        addToast({
          type: 'success',
          title: 'Compra actualizada',
          message: 'La compra se ha actualizado correctamente'
        });
      } else {
        await comprasGeneralesService.create(formData);
        addToast({
          type: 'success',
          title: 'Compra registrada',
          message: 'La compra se ha registrado correctamente'
        });
      }
      
      setShowModal(false);
      setEditingCompra(null);
      resetForm();
      fetchCompras();
    } catch (error: any) {
      console.error('Error guardando compra:', error);
      addToast({
        type: 'error',
        title: 'Error',
        message: error.response?.data?.error || 'Error al guardar la compra'
      });
    }
  };

  const resetForm = () => {
    setFormData({
      fecha: new Date().toISOString().split('T')[0],
      total_pesos: 0,
      tipo_precio: 'ordinario',
      observaciones: '',
    });
  };

  const handleEdit = (compra: CompraGeneral) => {
    setEditingCompra(compra);
    setFormData({
      fecha: compra.fecha,
      total_pesos: compra.total_pesos,
      tipo_precio: compra.tipo_precio,
      observaciones: compra.observaciones || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (compra: CompraGeneral) => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar esta compra de ${formatCurrency(compra.total_pesos)}?`)) {
      try {
        await comprasGeneralesService.delete(compra.id);
        addToast({
          type: 'success',
          title: 'Compra eliminada',
          message: 'La compra se ha eliminado correctamente'
        });
        fetchCompras();
      } catch (error: any) {
        console.error('Error eliminando compra:', error);
        addToast({
          type: 'error',
          title: 'Error',
          message: 'Error al eliminar la compra'
        });
      }
    }
  };

  const getTipoPrecioColor = (tipo: string) => {
    const colors: { [key: string]: { bg: string; text: string } } = {
      'ordinario': { bg: '#dbeafe', text: '#1e40af' },
      'camion': { bg: '#dcfce7', text: '#166534' },
      'noche': { bg: '#e9d5ff', text: '#7c3aed' }
    };
    return colors[tipo] || colors['ordinario'];
  };

  const getTipoPrecioLabel = (tipo: string) => {
    const labels: { [key: string]: string } = {
      'ordinario': 'Ordinario',
      'camion': 'Camión', 
      'noche': 'Noche'
    };
    return labels[tipo] || tipo;
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
            Compras Generales
          </h1>
          <p style={{ 
            fontSize: '14px', 
            color: '#6b7280', 
            margin: 0 
          }}>
            Registra compras cuando no se pueda separar por material específico
          </p>
        </div>
        <Button
          onClick={() => setShowModal(true)}
          icon={<Plus size={16} />}
        >
          Nueva Compra
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
              Tipo de Precio
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
              value={filtros.tipo_precio}
              onChange={(e) => setFiltros({ ...filtros, tipo_precio: e.target.value })}
            >
              <option value="">Todos los tipos</option>
              <option value="ordinario">Ordinario</option>
              <option value="camion">Camión</option>
              <option value="noche">Noche</option>
            </select>
          </div>
        </div>
      </div>

      {/* Estadísticas rápidas */}
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
            Total Compras
          </div>
          <div style={{ 
            fontSize: '24px', 
            fontWeight: 'bold', 
            color: '#111827',
            margin: '0 0 8px 0'
          }}>
            {formatCurrency(compras.reduce((sum, compra) => sum + compra.total_pesos, 0))}
          </div>
          <div style={{ 
            fontSize: '14px', 
            fontWeight: '500',
            color: '#6b7280',
            margin: 0
          }}>
            {compras.length} transacciones
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
            Promedio por Compra
          </div>
          <div style={{ 
            fontSize: '24px', 
            fontWeight: 'bold', 
            color: '#111827',
            margin: '0 0 8px 0'
          }}>
            {compras.length > 0 
              ? formatCurrency(compras.reduce((sum, compra) => sum + compra.total_pesos, 0) / compras.length)
              : formatCurrency(0)
            }
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
            Última Compra
          </div>
          <div style={{ 
            fontSize: '20px', 
            fontWeight: 'bold', 
            color: '#111827',
            margin: '0 0 8px 0'
          }}>
            {compras.length > 0 
              ? new Date(compras[0].fecha).toLocaleDateString('es-CO')
              : 'N/A'
            }
          </div>
        </div>
      </div>

      {/* Tabla de compras */}
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
            Compras Registradas ({compras.length})
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
                  Tipo Precio
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
                  Observaciones
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
              {compras.map((compra) => {
                const color = getTipoPrecioColor(compra.tipo_precio);
                return (
                  <tr 
                    key={compra.id} 
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Calendar size={16} style={{ color: '#9ca3af' }} />
                        <span>{new Date(compra.fecha).toLocaleDateString('es-CO')}</span>
                      </div>
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: '14px' }}>
                      <span style={{ 
                        fontSize: '16px', 
                        fontWeight: '600', 
                        color: '#059669' 
                      }}>
                        {formatCurrency(compra.total_pesos)}
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
                        backgroundColor: color.bg,
                        color: color.text
                      }}>
                        {getTipoPrecioLabel(compra.tipo_precio)}
                      </span>
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: '14px', color: '#6b7280' }}>
                      <span>
                        {compra.observaciones || '-'}
                      </span>
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: '14px', color: '#111827' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleEdit(compra)}
                          icon={<Edit size={14} />}
                        >
                          Editar
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDelete(compra)}
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
          
          {compras.length === 0 && (
            <div style={{ textAlign: 'center', padding: '48px' }}>
              <ShoppingCart size={48} style={{ color: '#9ca3af', margin: '0 auto 16px' }} />
              <p style={{ color: '#6b7280', margin: '0 0 4px 0' }}>No hay compras registradas</p>
              <p style={{ fontSize: '14px', color: '#9ca3af', margin: 0 }}>
                Usa el botón "Nueva Compra" para empezar
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
          setEditingCompra(null);
          resetForm();
        }}
        title={editingCompra ? 'Editar Compra General' : 'Nueva Compra General'}
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
              Fecha
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

          <div>
            <label style={{ 
              display: 'block', 
              fontSize: '14px', 
              fontWeight: '500', 
              color: '#374151', 
              marginBottom: '4px' 
            }}>
              Total en Pesos
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
              value={formData.total_pesos}
              onChange={(e) => setFormData({ ...formData, total_pesos: parseFloat(e.target.value) || 0 })}
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
              Tipo de Precio
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
              value={formData.tipo_precio}
              onChange={(e) => setFormData({ ...formData, tipo_precio: e.target.value as 'ordinario' | 'camion' | 'noche' })}
            >
              <option value="ordinario">Ordinario</option>
              <option value="camion">Camión</option>
              <option value="noche">Noche</option>
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
              Observaciones (Opcional)
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
              placeholder="Notas adicionales sobre esta compra..."
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
              {editingCompra ? 'Actualizar' : 'Registrar'} Compra
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ComprasGenerales;
