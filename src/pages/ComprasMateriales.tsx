// Archivo: src/pages/ComprasMateriales.tsx

import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Package, Calculator, User } from 'lucide-react';
import { CompraMaterial, Material, comprasMaterialesService, materialesService, clientesService, formatCurrency, formatNumber } from '../services/api';
import { Button } from '../components/ui/Button';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';

const ComprasMateriales: React.FC = () => {
  const [compras, setCompras] = useState<CompraMaterial[]>([]);
  const [materiales, setMateriales] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCompra, setEditingCompra] = useState<CompraMaterial | null>(null);
  const [filtros, setFiltros] = useState({
    fecha_inicio: '',
    fecha_fin: '',
    material_id: '',
    tipo_precio: '',
    cliente: ''
  });
  
  // Estados para autocompletado de clientes
  const [clientesSugeridos, setClientesSugeridos] = useState<string[]>([]);
  const [mostrarSugerenciasFormulario, setMostrarSugerenciasFormulario] = useState(false);
  const [mostrarSugerenciasFiltro, setMostrarSugerenciasFiltro] = useState(false);
  
  const { addToast } = useToast();

  // Estados para el formulario
  const [formData, setFormData] = useState({
    material_id: '',
    fecha: new Date().toISOString().split('T')[0],
    kilos: 0,
    precio_kilo: 0,
    tipo_precio: 'ordinario' as 'ordinario' | 'camion' | 'noche',
    cliente: '',
    observaciones: '',
  });

  useEffect(() => {
    fetchCompras();
    fetchMateriales();
  }, [filtros]);

  // Buscar clientes con debounce para formulario
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.cliente && formData.cliente.length >= 2) {
        buscarClientes(formData.cliente, 'formulario');
      } else {
        setClientesSugeridos([]);
        setMostrarSugerenciasFormulario(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [formData.cliente]);

  // Buscar clientes con debounce para filtros
  useEffect(() => {
    const timer = setTimeout(() => {
      if (filtros.cliente && filtros.cliente.length >= 2) {
        buscarClientes(filtros.cliente, 'filtro');
      } else {
        setMostrarSugerenciasFiltro(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [filtros.cliente]);

  const buscarClientes = async (busqueda: string, origen: 'formulario' | 'filtro') => {
  try {
    // Especificar que es tipo 'material' ya que estamos en ComprasMateriales
    const clientes = await clientesService.buscar(busqueda, 'material');
    setClientesSugeridos(clientes);
    
    if (origen === 'formulario') {
      setMostrarSugerenciasFormulario(true);
    } else {
      setMostrarSugerenciasFiltro(true);
    }
  } catch (error) {
    console.error('Error buscando clientes:', error);
    setClientesSugeridos([]);
  }
};

  const seleccionarClienteFormulario = (cliente: string) => {
    setFormData({ ...formData, cliente });
    setMostrarSugerenciasFormulario(false);
    setClientesSugeridos([]);
  };

  const seleccionarClienteFiltro = (cliente: string) => {
    setFiltros({ ...filtros, cliente });
    setMostrarSugerenciasFiltro(false);
    setClientesSugeridos([]);
  };

  const fetchCompras = async () => {
    try {
      setLoading(true);
      const response = await comprasMaterialesService.getAll({
        ...filtros,
        material_id: filtros.material_id ? parseInt(filtros.material_id) : undefined,
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

  const fetchMateriales = async () => {
    try {
      const data = await materialesService.getAll({ activo: true });
      setMateriales(data);
    } catch (error) {
      console.error('Error cargando materiales:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.material_id || formData.kilos <= 0 || formData.precio_kilo <= 0) {
      addToast({
        type: 'warning',
        title: 'Datos inválidos',
        message: 'Todos los campos son requeridos y deben ser mayores a cero'
      });
      return;
    }
    
    try {
      const submitData = {
        ...formData,
        material_id: parseInt(formData.material_id)
      };

      if (editingCompra) {
        await comprasMaterialesService.update(editingCompra.id, submitData);
        addToast({
          type: 'success',
          title: 'Compra actualizada',
          message: 'La compra se ha actualizado correctamente'
        });
      } else {
        await comprasMaterialesService.create(submitData);
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
      material_id: '',
      fecha: new Date().toISOString().split('T')[0],
      kilos: 0,
      precio_kilo: 0,
      tipo_precio: 'ordinario',
      cliente: '',
      observaciones: '',
    });
  };

  const handleEdit = (compra: CompraMaterial) => {
    setEditingCompra(compra);
    setFormData({
      material_id: compra.material_id.toString(),
      fecha: compra.fecha,
      kilos: compra.kilos,
      precio_kilo: compra.precio_kilo,
      tipo_precio: compra.tipo_precio,
      cliente: (compra as any).cliente || '',
      observaciones: compra.observaciones || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (compra: CompraMaterial) => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar esta compra de ${compra.material_nombre}?`)) {
      try {
        await comprasMaterialesService.delete(compra.id);
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

  // Auto-completar precio cuando se selecciona material y tipo
  const handleMaterialOrTipoChange = (materialId: string, tipoPrecio: string) => {
    const material = materiales.find(m => m.id.toString() === materialId);
    if (material) {
      let precio = 0;
      switch (tipoPrecio) {
        case 'ordinario': precio = material.precio_ordinario; break;
        case 'camion': precio = material.precio_camion; break;
        case 'noche': precio = material.precio_noche; break;
      }
      setFormData(prev => ({ ...prev, precio_kilo: precio }));
    }
  };

  const totalCalculado = formData.kilos * formData.precio_kilo;

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
            Compras por Material
          </h1>
          <p style={{ 
            fontSize: '14px', 
            color: '#6b7280', 
            margin: 0 
          }}>
            Registra compras específicas por tipo de material
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
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
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
          <div style={{ position: 'relative' }}>
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
              value={filtros.cliente}
              onChange={(e) => setFiltros({ ...filtros, cliente: e.target.value })}
              onBlur={() => setTimeout(() => setMostrarSugerenciasFiltro(false), 200)}
              placeholder="Buscar por cliente..."
            />
            
            {mostrarSugerenciasFiltro && clientesSugeridos.length > 0 && (
              <ul style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                backgroundColor: 'white',
                border: '1px solid #d1d5db',
                borderTop: 'none',
                borderRadius: '0 0 6px 6px',
                maxHeight: '200px',
                overflowY: 'auto',
                zIndex: 1000,
                listStyle: 'none',
                margin: 0,
                padding: 0,
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
              }}>
                {clientesSugeridos.map((cliente, index) => (
                  <li
                    key={index}
                    onClick={() => seleccionarClienteFiltro(cliente)}
                    style={{
                      padding: '8px 12px',
                      cursor: 'pointer',
                      borderBottom: '1px solid #f3f4f6',
                      fontSize: '14px',
                      transition: 'background-color 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f9fafb';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'white';
                    }}
                  >
                    {cliente}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Estadísticas */}
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
            {formatNumber(compras.reduce((sum, compra) => sum + compra.kilos, 0), 0)} kg
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
            {compras.length > 0 
              ? formatCurrency(compras.reduce((sum, compra) => sum + compra.precio_kilo, 0) / compras.length)
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
            Transacciones
          </div>
          <div style={{ 
            fontSize: '24px', 
            fontWeight: 'bold', 
            color: '#111827',
            margin: '0 0 8px 0'
          }}>
            {compras.length}
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
                  Tipo
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
                        <Package size={16} style={{ color: '#9ca3af' }} />
                        <div>
                          <div style={{ fontWeight: '500' }}>{compra.material_nombre}</div>
                          <div style={{ fontSize: '12px', color: '#6b7280' }}>{compra.material_categoria}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: '14px', color: '#111827' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <User size={16} style={{ color: '#9ca3af' }} />
                        <span>{(compra as any).cliente || 'Sin cliente'}</span>
                      </div>
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: '14px', color: '#111827' }}>
                      {new Date(compra.fecha).toLocaleDateString('es-CO')}
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: '14px', color: '#111827' }}>
                      <span style={{ fontWeight: '500' }}>{formatNumber(compra.kilos, 2)} kg</span>
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: '14px', color: '#111827' }}>
                      {formatCurrency(compra.precio_kilo)}
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
              <Package size={48} style={{ color: '#9ca3af', margin: '0 auto 16px' }} />
              <p style={{ color: '#6b7280', margin: '0 0 4px 0' }}>No hay compras por material registradas</p>
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
        title={editingCompra ? 'Editar Compra por Material' : 'Nueva Compra por Material'}
        size="lg"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
                onChange={(e) => {
                  setFormData({ ...formData, material_id: e.target.value });
                  if (e.target.value) {
                    handleMaterialOrTipoChange(e.target.value, formData.tipo_precio);
                  }
                }}
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

            <div style={{ position: 'relative' }}>
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
                onBlur={() => setTimeout(() => setMostrarSugerenciasFormulario(false), 200)}
                placeholder="Nombre del cliente (opcional)"
                maxLength={100}
              />
              
              {mostrarSugerenciasFormulario && clientesSugeridos.length > 0 && (
                <ul style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  backgroundColor: 'white',
                  border: '1px solid #d1d5db',
                  borderTop: 'none',
                  borderRadius: '0 0 6px 6px',
                  maxHeight: '200px',
                  overflowY: 'auto',
                  zIndex: 1000,
                  listStyle: 'none',
                  margin: 0,
                  padding: 0,
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                }}>
                  {clientesSugeridos.map((cliente, index) => (
                    <li
                      key={index}
                      onClick={() => seleccionarClienteFormulario(cliente)}
                      style={{
                        padding: '8px 12px',
                        cursor: 'pointer',
                        borderBottom: '1px solid #f3f4f6',
                        fontSize: '14px',
                        transition: 'background-color 0.15s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f9fafb';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'white';
                      }}
                    >
                      {cliente}
                    </li>
                  ))}
                </ul>
              )}
            </div>
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

            <div>
              <label style={{ 
                display: 'block', 
                fontSize: '14px', 
                fontWeight: '500', 
                color: '#374151', 
                marginBottom: '4px' 
              }}>
                Tipo de Precio *
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
                onChange={(e) => {
                  const tipoPrecio = e.target.value as 'ordinario' | 'camion' | 'noche';
                  setFormData({ ...formData, tipo_precio: tipoPrecio });
                  if (formData.material_id) {
                    handleMaterialOrTipoChange(formData.material_id, tipoPrecio);
                  }
                }}
              >
                <option value="ordinario">Ordinario</option>
                <option value="camion">Camión</option>
                <option value="noche">Noche</option>
              </select>
            </div>
          </div>

          {/* Calculadora de total */}
          <div style={{
            backgroundColor: '#f9fafb',
            padding: '16px',
            borderRadius: '8px',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calculator size={20} style={{ color: '#6b7280' }} />
                <span style={{ fontSize: '14px', color: '#6b7280' }}>Total calculado:</span>
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
            <Button 
              type="button"
              onClick={handleSubmit}
            >
              {editingCompra ? 'Actualizar' : 'Registrar'} Compra
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ComprasMateriales;
