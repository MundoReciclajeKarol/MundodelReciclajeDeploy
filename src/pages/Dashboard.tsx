// Archivo: src/pages/Dashboard.tsx

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Package, 
  ShoppingCart, 
  Receipt,
  Calendar,
  Filter
} from 'lucide-react';
import { dashboardService, formatCurrency } from '../services/api';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

interface DashboardData {
  periodo: string;
  fecha_inicio: string;
  fecha_fin: string;
  resumen?: {
    total_compras: number;
    total_ventas: number;
    total_gastos: number;
    ganancia_bruta: number;
    ganancia_neta: number;
    margen_ganancia?: number;
    total_kilos_vendidos?: number;
  };
  estadisticas?: {
    total_compras: number;
    total_ventas: number;
    total_gastos: number;
    ganancia_bruta: number;
    ganancia_neta: number;
  };
  materiales_mas_vendidos: Array<{
    nombre: string;
    total_kilos: number;
    total_pesos: number;
  }>;
}

const Dashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [periodo, setPeriodo] = useState('mes');
  const [usarFechasPersonalizadas, setUsarFechasPersonalizadas] = useState(false);
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

  // Inicializar fechas por defecto
  useEffect(() => {
    const hoy = new Date();
    const haceUnMes = new Date();
    haceUnMes.setMonth(hoy.getMonth() - 1);
    
    setFechaFin(hoy.toISOString().split('T')[0]);
    setFechaInicio(haceUnMes.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        let response;
        
        if (usarFechasPersonalizadas && fechaInicio && fechaFin) {
          // Usar endpoint de reportes con fechas personalizadas
          console.log('Cargando con fechas personalizadas:', fechaInicio, fechaFin);
          response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/reportes/ganancias?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}&agrupar_por=dia`);
          const reporteData = await response.json();
          
          // Calcular totales del reporte
          const totales = reporteData.reporte?.reduce((acc: any, item: any) => ({
            total_compras: acc.total_compras + (item.compras || 0),
            total_ventas: acc.total_ventas + (item.ventas || 0),
            total_gastos: acc.total_gastos + (item.gastos || 0),
            ganancia_bruta: acc.ganancia_bruta + (item.ganancia_bruta || 0),
            ganancia_neta: acc.ganancia_neta + (item.ganancia_neta || 0),
            total_kilos_vendidos: acc.total_kilos_vendidos + (item.kilos_vendidos || 0)
          }), {
            total_compras: 0,
            total_ventas: 0,
            total_gastos: 0,
            ganancia_bruta: 0,
            ganancia_neta: 0,
            total_kilos_vendidos: 0
          });

          // Obtener materiales más vendidos para el período personalizado
          const materialesResponse = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/reportes/materiales?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`);
          const materialesData = await materialesResponse.json();
          
          response = {
            periodo: `${fechaInicio} a ${fechaFin}`,
            fecha_inicio: fechaInicio,
            fecha_fin: fechaFin,
            resumen: totales,
            materiales_mas_vendidos: materialesData.materiales?.slice(0, 5) || []
          };
        } else {
          // Usar endpoint normal del dashboard
          console.log('Cargando con período predefinido:', periodo);
          response = await dashboardService.getDashboard(periodo);
        }
        
        console.log('Respuesta de la API:', response);
        
        if (!response) {
          throw new Error('No se recibió respuesta de la API');
        }
        
        // Normalizar estructura de datos
        const estadisticas = response.resumen || response.estadisticas || {
          total_compras: 0,
          total_ventas: 0,
          total_gastos: 0,
          ganancia_bruta: 0,
          ganancia_neta: 0
        };

        const materialesVendidos = response.materiales_mas_vendidos || [];
        
        setData({
          ...response,
          estadisticas,
          materiales_mas_vendidos: materialesVendidos
        });
      } catch (error) {
        console.error('Error cargando dashboard:', error);
        setError(error instanceof Error ? error.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [periodo, usarFechasPersonalizadas, fechaInicio, fechaFin]);

  const handleFiltroChange = () => {
    setUsarFechasPersonalizadas(!usarFechasPersonalizadas);
  };

  const aplicarFiltroFechas = () => {
    if (!fechaInicio || !fechaFin) {
      alert('Por favor selecciona ambas fechas');
      return;
    }
    if (fechaInicio > fechaFin) {
      alert('La fecha de inicio no puede ser mayor que la fecha de fin');
      return;
    }
    // El useEffect se ejecutará automáticamente al cambiar las fechas
  };

  // Estados de carga y error
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
          onClick={() => window.location.reload()}
          style={{
            padding: '8px 16px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Recargar
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ textAlign: 'center', padding: '48px' }}>
        <p style={{ color: '#6b7280' }}>Los datos del dashboard no están disponibles</p>
      </div>
    );
  }

  // Usar resumen o estadisticas según qué esté disponible
  const estadisticas = data.resumen || data.estadisticas || {
    total_compras: 0,
    total_ventas: 0,
    total_gastos: 0,
    ganancia_bruta: 0,
    ganancia_neta: 0
  };

  const materiales = data.materiales_mas_vendidos || [];

  // Crear las estadísticas después de verificar que los datos existen
  const stats = [
    {
      name: 'Total Ventas',
      value: formatCurrency(estadisticas.total_ventas),
      change: '+12%',
      changeType: 'positive' as const,
      icon: TrendingUp,
      color: '#10b981',
      bg: '#f0fdf4',
    },
    {
      name: 'Total Compras',
      value: formatCurrency(estadisticas.total_compras),
      change: '+8%',
      changeType: 'positive' as const,
      icon: ShoppingCart,
      color: '#3b82f6',
      bg: '#eff6ff',
    },
    {
      name: 'Ganancia Neta',
      value: formatCurrency(estadisticas.ganancia_neta),
      change: estadisticas.ganancia_neta >= 0 ? '+15%' : '-5%',
      changeType: estadisticas.ganancia_neta >= 0 ? 'positive' : 'negative' as const,
      icon: DollarSign,
      color: estadisticas.ganancia_neta >= 0 ? '#10b981' : '#ef4444',
      bg: estadisticas.ganancia_neta >= 0 ? '#f0fdf4' : '#fef2f2',
    },
    {
      name: 'Total Gastos',
      value: formatCurrency(estadisticas.total_gastos),
      change: '-3%',
      changeType: 'negative' as const,
      icon: Receipt,
      color: '#ef4444',
      bg: '#fef2f2',
    },
  ];

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
            Dashboard
          </h1>
          <p style={{ 
            fontSize: '14px', 
            color: '#6b7280', 
            margin: 0 
          }}>
            Resumen de actividades - {data.periodo || periodo}
          </p>
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
          display: 'flex', 
          alignItems: 'center', 
          gap: '16px', 
          marginBottom: '16px',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter size={20} style={{ color: '#6b7280' }} />
            <span style={{ fontSize: '16px', fontWeight: '600', color: '#374151' }}>
              Filtros
            </span>
          </div>
          <label style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            color: '#374151'
          }}>
            <input
              type="checkbox"
              checked={usarFechasPersonalizadas}
              onChange={handleFiltroChange}
              style={{ cursor: 'pointer' }}
            />
            Usar fechas personalizadas
          </label>
        </div>

        {!usarFechasPersonalizadas ? (
          <div>
            <label style={{ 
              display: 'block', 
              fontSize: '14px', 
              fontWeight: '500', 
              color: '#374151', 
              marginBottom: '4px' 
            }}>
              Período
            </label>
            <select
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value)}
              style={{
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                backgroundColor: 'white',
                fontSize: '14px',
                minWidth: '200px'
              }}
            >
              <option value="dia">Hoy</option>
              <option value="semana">Esta semana</option>
              <option value="mes">Este mes</option>
              <option value="trimestre">Este trimestre</option>
              <option value="año">Este año</option>
            </select>
          </div>
        ) : (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '16px',
            alignItems: 'end'
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
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
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
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
            </div>
            <div>
              <button
                onClick={aplicarFiltroFechas}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <Calendar size={16} />
                Aplicar Filtro
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
        gap: '20px', 
        marginBottom: '32px' 
      }}>
        {stats.map((stat) => (
          <div 
            key={stat.name} 
            style={{
              backgroundColor: 'white',
              padding: '24px',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              border: '1px solid #e5e7eb'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                padding: '12px',
                borderRadius: '8px',
                backgroundColor: stat.bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <stat.icon size={24} style={{ color: stat.color }} />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ 
                  fontSize: '14px', 
                  color: '#6b7280', 
                  fontWeight: '500',
                  margin: '0 0 4px 0',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  {stat.name}
                </p>
                <p style={{ 
                  fontSize: '24px', 
                  fontWeight: 'bold', 
                  color: '#111827',
                  margin: '0 0 8px 0'
                }}>
                  {stat.value}
                </p>
                <p style={{ 
                  fontSize: '14px', 
                  fontWeight: '500',
                  color: stat.changeType === 'positive' ? '#10b981' : '#ef4444',
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  {stat.changeType === 'positive' ? (
                    <TrendingUp size={16} />
                  ) : (
                    <TrendingDown size={16} />
                  )}
                  {stat.change}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Margen de Ganancia */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        border: '1px solid #e5e7eb',
        marginBottom: '32px'
      }}>
        <div style={{
          padding: '16px 24px',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', margin: 0 }}>
            Análisis de Rentabilidad
          </h3>
        </div>
        <div style={{ padding: '24px' }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '24px' 
          }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 8px 0' }}>
                Margen de Ganancia
              </p>
              <p style={{ 
                fontSize: '28px', 
                fontWeight: 'bold', 
                color: estadisticas.ganancia_bruta >= 0 ? '#10b981' : '#ef4444',
                margin: 0
              }}>
                {estadisticas.total_ventas > 0 
                  ? ((estadisticas.ganancia_bruta / estadisticas.total_ventas) * 100).toFixed(1) 
                  : '0'
                }%
              </p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 8px 0' }}>
                Ganancia Bruta
              </p>
              <p style={{ 
                fontSize: '28px', 
                fontWeight: 'bold', 
                color: estadisticas.ganancia_bruta >= 0 ? '#10b981' : '#ef4444',
                margin: 0
              }}>
                {formatCurrency(estadisticas.ganancia_bruta)}
              </p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 8px 0' }}>
                Eficiencia
              </p>
              <p style={{ 
                fontSize: '28px', 
                fontWeight: 'bold', 
                color: '#3b82f6',
                margin: 0
              }}>
                {estadisticas.total_compras > 0 
                  ? ((estadisticas.total_ventas / estadisticas.total_compras) * 100).toFixed(0) 
                  : '0'
                }%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Materiales más vendidos */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
        gap: '24px' 
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{
            padding: '16px 24px',
            borderBottom: '1px solid #e5e7eb'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', margin: 0 }}>
              Materiales Más Vendidos
            </h3>
          </div>
          <div style={{ padding: '24px' }}>
            {materiales.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {materiales.slice(0, 5).map((material, index) => (
                  <div key={`${material.nombre}-${index}`} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between' 
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '14px',
                        fontWeight: '600',
                        backgroundColor: 
                          index === 0 ? '#f59e0b' : 
                          index === 1 ? '#9ca3af' : 
                          index === 2 ? '#ea580c' : '#3b82f6'
                      }}>
                        {index + 1}
                      </div>
                      <div>
                        <p style={{ 
                          fontSize: '14px', 
                          fontWeight: '600', 
                          color: '#111827', 
                          margin: '0 0 2px 0' 
                        }}>
                          {material.nombre || 'Sin nombre'}
                        </p>
                        <p style={{ 
                          fontSize: '12px', 
                          color: '#6b7280', 
                          margin: 0 
                        }}>
                          {(material.total_kilos || 0).toLocaleString('es-CO')} kg
                        </p>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ 
                        fontSize: '14px', 
                        fontWeight: '600', 
                        color: '#111827', 
                        margin: 0 
                      }}>
                        {formatCurrency(material.total_pesos || 0)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: '#6b7280', textAlign: 'center' }}>
                No hay datos de materiales disponibles
              </p>
            )}
          </div>
        </div>

        {/* Resumen del período */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{
            padding: '16px 24px',
            borderBottom: '1px solid #e5e7eb'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', margin: 0 }}>
              Resumen del Período
            </h3>
          </div>
          <div style={{ padding: '24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                paddingBottom: '12px',
                borderBottom: '1px solid #f3f4f6'
              }}>
                <span style={{ fontSize: '14px', color: '#6b7280' }}>Período analizado</span>
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>
                  {usarFechasPersonalizadas ? (
                    `${fechaInicio} - ${fechaFin}`
                  ) : (
                    periodo
                  )}
                </span>
              </div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                paddingBottom: '12px',
                borderBottom: '1px solid #f3f4f6'
              }}>
                <span style={{ fontSize: '14px', color: '#6b7280' }}>Materiales vendidos</span>
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>
                  {materiales.length} tipos
                </span>
              </div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                paddingBottom: '12px',
                borderBottom: '1px solid #f3f4f6'
              }}>
                <span style={{ fontSize: '14px', color: '#6b7280' }}>Estado general</span>
                <span style={{ 
                  fontSize: '14px', 
                  fontWeight: '600', 
                  color: estadisticas.ganancia_neta >= 0 ? '#10b981' : '#ef4444'
                }}>
                  {estadisticas.ganancia_neta >= 0 ? 'Rentable' : 'Pérdidas'}
                </span>
              </div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center'
              }}>
                <span style={{ fontSize: '14px', color: '#6b7280' }}>Balance final</span>
                <span style={{ 
                  fontSize: '16px', 
                  fontWeight: 'bold', 
                  color: estadisticas.ganancia_neta >= 0 ? '#10b981' : '#ef4444'
                }}>
                  {formatCurrency(estadisticas.ganancia_neta)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;