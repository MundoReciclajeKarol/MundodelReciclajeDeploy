// Archivo: frontend/src/pages/Reportes.tsx

import React, { useState, useEffect } from 'react';
import { BarChart3, Download, Calendar, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { api, formatCurrency, formatNumber } from '../services/api';
import { Button } from '../components/ui/Button';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { useToast } from '../components/ui/Toast';

interface ReporteGanancias {
  fecha_inicio: string;
  fecha_fin: string;
  agrupacion: string;
  reporte: Array<{
    periodo: string;
    compras: number;
    ventas: number;
    gastos: number;
    ganancia_bruta: number;
    ganancia_neta: number;
    margen: number;
    kilos_vendidos: number;
  }>;
}

interface ReporteMateriales {
  fecha_inicio: string;
  fecha_fin: string;
  categoria: string;
  materiales: Array<{
    nombre: string;
    categoria: string;
    total_kilos_vendidos: number;
    total_ventas: number;
    precio_promedio_venta: number;
    total_kilos_comprados: number;
    total_compras: number;
    precio_promedio_compra: number;
    ganancia_material: number;
    margen_material: number;
    transacciones_venta: number;
    transacciones_compra: number;
  }>;
}

interface PromediosCompra {
  fecha_inicio: string;
  fecha_fin: string;
  resumen: {
    total_compras: number;
    total_transacciones: number;
    dias_totales: number;
    promedio_diario: number;
    promedio_por_transaccion: number;
  };
  compras_por_dia_semana: Array<{
    dia_semana: string;
    transacciones: number;
    total_compras: number;
    promedio_dia: number;
  }>;
}

const Reportes: React.FC = () => {
  const [activeTab, setActiveTab] = useState('ganancias');
  const [loading, setLoading] = useState(false);
  const [reporteGanancias, setReporteGanancias] = useState<ReporteGanancias | null>(null);
  const [reporteMateriales, setReporteMateriales] = useState<ReporteMateriales | null>(null);
  const [promediosCompra, setPromediosCompra] = useState<PromediosCompra | null>(null);
  const { addToast } = useToast();

  const [filtros, setFiltros] = useState({
    fecha_inicio: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 días atrás
    fecha_fin: new Date().toISOString().split('T')[0], // Hoy
    agrupar_por: 'dia',
    categoria: ''
  });

  const tabs = [
    { id: 'ganancias', name: 'Ganancias', icon: DollarSign },
    { id: 'materiales', name: 'Materiales', icon: BarChart3 },
    { id: 'promedios', name: 'Promedios Compra', icon: TrendingUp },
  ];

  useEffect(() => {
    if (activeTab === 'ganancias') {
      fetchReporteGanancias();
    } else if (activeTab === 'materiales') {
      fetchReporteMateriales();
    } else if (activeTab === 'promedios') {
      fetchPromediosCompra();
    }
  }, [activeTab, filtros]);

  const fetchReporteGanancias = async () => {
    try {
      setLoading(true);
      const response = await api.get('/reportes/ganancias', {
        params: {
          fecha_inicio: filtros.fecha_inicio,
          fecha_fin: filtros.fecha_fin,
          agrupar_por: filtros.agrupar_por
        }
      });
      setReporteGanancias(response.data);
    } catch (error) {
      console.error('Error cargando reporte de ganancias:', error);
      addToast({
        type: 'error',
        title: 'Error',
        message: 'No se pudo cargar el reporte de ganancias'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchReporteMateriales = async () => {
    try {
      setLoading(true);
      const response = await api.get('/reportes/materiales', {
        params: {
          fecha_inicio: filtros.fecha_inicio,
          fecha_fin: filtros.fecha_fin,
          categoria: filtros.categoria || undefined
        }
      });
      setReporteMateriales(response.data);
    } catch (error) {
      console.error('Error cargando reporte de materiales:', error);
      addToast({
        type: 'error',
        title: 'Error',
        message: 'No se pudo cargar el reporte de materiales'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPromediosCompra = async () => {
    try {
      setLoading(true);
      const response = await api.get('/reportes/promedios-compra', {
        params: {
          fecha_inicio: filtros.fecha_inicio,
          fecha_fin: filtros.fecha_fin
        }
      });
      setPromediosCompra(response.data);
    } catch (error) {
      console.error('Error cargando promedios de compra:', error);
      addToast({
        type: 'error',
        title: 'Error',
        message: 'No se pudo cargar el reporte de promedios'
      });
    } finally {
      setLoading(false);
    }
  };

  const exportarDatos = async () => {
    try {
      const response = await api.get('/reportes/export/backup', {
        params: {
          fecha_inicio: filtros.fecha_inicio,
          fecha_fin: filtros.fecha_fin
        }
      });
      
      const dataStr = JSON.stringify(response.data, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `backup_${filtros.fecha_inicio}_${filtros.fecha_fin}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      
      addToast({
        type: 'success',
        title: 'Exportación exitosa',
        message: 'Los datos se han exportado correctamente'
      });
    } catch (error) {
      console.error('Error exportando datos:', error);
      addToast({
        type: 'error',
        title: 'Error',
        message: 'No se pudo exportar los datos'
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Reportes
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Análisis detallado del negocio y exportación de datos
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <Button
            variant="secondary"
            onClick={exportarDatos}
            icon={<Download className="h-4 w-4" />}
          >
            Exportar Datos
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <div className="card">
        <div className="card-content">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="label">Fecha Inicio</label>
              <input
                type="date"
                className="input-field"
                value={filtros.fecha_inicio}
                onChange={(e) => setFiltros({ ...filtros, fecha_inicio: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Fecha Fin</label>
              <input
                type="date"
                className="input-field"
                value={filtros.fecha_fin}
                onChange={(e) => setFiltros({ ...filtros, fecha_fin: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Agrupar Por</label>
              <select
                className="select-field"
                value={filtros.agrupar_por}
                onChange={(e) => setFiltros({ ...filtros, agrupar_por: e.target.value })}
              >
                <option value="dia">Por Día</option>
                <option value="semana">Por Semana</option>
                <option value="mes">Por Mes</option>
              </select>
            </div>
            <div>
              <label className="label">Categoría Material</label>
              <input
                type="text"
                className="input-field"
                placeholder="Filtrar por categoría..."
                value={filtros.categoria}
                onChange={(e) => setFiltros({ ...filtros, categoria: e.target.value })}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`group inline-flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="h-5 w-5 mr-2" />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Contenido de los reportes */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <div>
          {/* Reporte de Ganancias */}
          {activeTab === 'ganancias' && reporteGanancias && (
            <div className="space-y-6">
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-medium text-gray-900">
                    Reporte de Ganancias - {reporteGanancias.agrupacion}
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="table">
                    <thead className="table-header">
                      <tr>
                        <th className="table-header-cell">Período</th>
                        <th className="table-header-cell">Compras</th>
                        <th className="table-header-cell">Ventas</th>
                        <th className="table-header-cell">Gastos</th>
                        <th className="table-header-cell">Ganancia Bruta</th>
                        <th className="table-header-cell">Ganancia Neta</th>
                        <th className="table-header-cell">Margen %</th>
                        <th className="table-header-cell">Kilos</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {reporteGanancias.reporte.map((item, index) => (
                        <tr key={index} className="table-row">
                          <td className="table-cell font-medium">{item.periodo}</td>
                          <td className="table-cell text-red-600">{formatCurrency(item.compras)}</td>
                          <td className="table-cell text-green-600">{formatCurrency(item.ventas)}</td>
                          <td className="table-cell text-orange-600">{formatCurrency(item.gastos)}</td>
                          <td className="table-cell">
                            <span className={item.ganancia_bruta >= 0 ? 'text-green-600' : 'text-red-600'}>
                              {formatCurrency(item.ganancia_bruta)}
                            </span>
                          </td>
                          <td className="table-cell">
                            <span className={`font-bold ${item.ganancia_neta >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {formatCurrency(item.ganancia_neta)}
                            </span>
                          </td>
                          <td className="table-cell">
                            <span className={item.margen >= 0 ? 'text-green-600' : 'text-red-600'}>
                              {item.margen.toFixed(1)}%
                            </span>
                          </td>
                          <td className="table-cell">{formatNumber(item.kilos_vendidos, 0)} kg</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Resumen de ganancias */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="stat-card">
                  <div className="stat-title">Total Ventas</div>
                  <div className="stat-value text-green-600">
                    {formatCurrency(reporteGanancias.reporte.reduce((sum, item) => sum + item.ventas, 0))}
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-title">Total Compras</div>
                  <div className="stat-value text-red-600">
                    {formatCurrency(reporteGanancias.reporte.reduce((sum, item) => sum + item.compras, 0))}
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-title">Total Gastos</div>
                  <div className="stat-value text-orange-600">
                    {formatCurrency(reporteGanancias.reporte.reduce((sum, item) => sum + item.gastos, 0))}
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-title">Ganancia Neta Total</div>
                  <div className={`stat-value ${reporteGanancias.reporte.reduce((sum, item) => sum + item.ganancia_neta, 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(reporteGanancias.reporte.reduce((sum, item) => sum + item.ganancia_neta, 0))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Reporte de Materiales */}
          {activeTab === 'materiales' && reporteMateriales && (
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-medium text-gray-900">
                  Reporte por Materiales - {reporteMateriales.categoria}
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="table">
                  <thead className="table-header">
                    <tr>
                      <th className="table-header-cell">Material</th>
                      <th className="table-header-cell">Categoría</th>
                      <th className="table-header-cell">Kilos Vendidos</th>
                      <th className="table-header-cell">Total Ventas</th>
                      <th className="table-header-cell">Precio Prom. Venta</th>
                      <th className="table-header-cell">Total Compras</th>
                      <th className="table-header-cell">Ganancia</th>
                      <th className="table-header-cell">Margen %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {reporteMateriales.materiales.map((material, index) => (
                      <tr key={index} className="table-row">
                        <td className="table-cell font-medium">{material.nombre}</td>
                        <td className="table-cell">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {material.categoria}
                          </span>
                        </td>
                        <td className="table-cell">{formatNumber(material.total_kilos_vendidos, 2)} kg</td>
                        <td className="table-cell text-green-600">{formatCurrency(material.total_ventas)}</td>
                        <td className="table-cell">{formatCurrency(material.precio_promedio_venta)}</td>
                        <td className="table-cell text-red-600">{formatCurrency(material.total_compras)}</td>
                        <td className="table-cell">
                          <span className={material.ganancia_material >= 0 ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
                            {formatCurrency(material.ganancia_material)}
                          </span>
                        </td>
                        <td className="table-cell">
                          <span className={material.margen_material >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {material.margen_material.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Reporte de Promedios de Compra */}
          {activeTab === 'promedios' && promediosCompra && (
            <div className="space-y-6">
              {/* Resumen general */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="stat-card">
                  <div className="stat-title">Total Compras</div>
                  <div className="stat-value">{formatCurrency(promediosCompra.resumen.total_compras)}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-title">Total Transacciones</div>
                  <div className="stat-value">{promediosCompra.resumen.total_transacciones}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-title">Días Analizados</div>
                  <div className="stat-value">{promediosCompra.resumen.dias_totales}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-title">Promedio Diario</div>
                  <div className="stat-value">{formatCurrency(promediosCompra.resumen.promedio_diario)}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-title">Promedio por Transacción</div>
                  <div className="stat-value">{formatCurrency(promediosCompra.resumen.promedio_por_transaccion)}</div>
                </div>
              </div>

              {/* Compras por día de la semana */}
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-medium text-gray-900">Compras por Día de la Semana</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="table">
                    <thead className="table-header">
                      <tr>
                        <th className="table-header-cell">Día</th>
                        <th className="table-header-cell">Transacciones</th>
                        <th className="table-header-cell">Total Compras</th>
                        <th className="table-header-cell">Promedio por Día</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {promediosCompra.compras_por_dia_semana.map((dia, index) => (
                        <tr key={index} className="table-row">
                          <td className="table-cell font-medium">{dia.dia_semana}</td>
                          <td className="table-cell">{dia.transacciones}</td>
                          <td className="table-cell">{formatCurrency(dia.total_compras)}</td>
                          <td className="table-cell">{formatCurrency(dia.promedio_dia)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Reportes;

// ================================
// Archivo: frontend/package.json
// ================================

/*
{
  "name": "sistema-reciclaje-frontend",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "@testing-library/jest-dom": "^5.16.4",
    "@testing-library/react": "^13.3.0",
    "@testing-library/user-event": "^13.5.0",
    "@types/jest": "^27.5.2",
    "@types/node": "^16.11.47",
    "@types/react": "^18.0.17",
    "@types/react-dom": "^18.0.6",
    "axios": "^1.6.0",
    "date-fns": "^2.30.0",
    "lucide-react": "^0.263.1",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.8.0",
    "react-scripts": "5.0.1",
    "typescript": "^4.7.4",
    "web-vitals": "^2.1.4"
  },
  "devDependencies": {
    "@tailwindcss/forms": "^0.5.6",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.31",
    "tailwindcss": "^3.3.5"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
  "eslintConfig": {
    "extends": [
      "react-app",
      "react-app/jest"
    ]
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  },
  "proxy": "http://localhost:5000"
}
*/

// ================================
// Archivo: frontend/postcss.config.js
// ================================

/*
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
*/

// ================================
// Archivo: frontend/src/index.tsx
// ================================

/*
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { ToastProvider } from './components/ui/Toast';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <ToastProvider>
      <App />
    </ToastProvider>
  </React.StrictMode>
);
*/

// ================================
// Archivo: frontend/src/index.css
// ================================

/*
@tailwind base;
@tailwind components;
@tailwind utilities;

@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

body {
  margin: 0;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

code {
  font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
    monospace;
}

* {
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
}
*/