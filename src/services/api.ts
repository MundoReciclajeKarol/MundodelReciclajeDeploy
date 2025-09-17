// Archivo: src/services/api.ts

import axios from 'axios';

// Configuración base de Axios
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token de autenticación
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 500) {
      console.error('Error del servidor:', error.response.data);
    }
    if (error.response?.status === 401) {
      // Token expirado o inválido
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Tipos de datos
export interface Material {
  id: number;
  nombre: string;
  categoria: string;
  precio_ordinario: number;
  precio_camion: number;
  precio_noche: number;
  activo: boolean;
  fecha_creacion: string;
  fecha_actualizacion: string;
}

export interface CompraGeneral {
  id: number;
  fecha: string;
  total_pesos: number;
  tipo_precio: 'ordinario' | 'camion' | 'noche';
  cliente?: string;
  observaciones?: string;
  fecha_creacion: string;
}

export interface CompraMaterial {
  id: number;
  material_id: number;
  material_nombre: string;
  material_categoria: string;
  fecha: string;
  kilos: number;
  precio_kilo: number;
  total_pesos: number;
  tipo_precio: 'ordinario' | 'camion' | 'noche';
  cliente?: string;
  observaciones?: string;
  fecha_creacion: string;
}

export interface Venta {
  id: number;
  material_id: number;
  material_nombre: string;
  material_categoria: string;
  fecha: string;
  kilos: number;
  precio_kilo: number;
  total_pesos: number;
  cliente?: string;
  observaciones?: string;
  fecha_creacion: string;
}

export interface CategoriaGasto {
  id: number;
  nombre: string;
  descripcion?: string;
  activo: boolean;
}

export interface Gasto {
  id: number;
  categoria_id: number;
  categoria_nombre: string;
  categoria_descripcion?: string;
  fecha: string;
  concepto: string;
  valor: number;
  observaciones?: string;
  fecha_creacion: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  paginacion: {
    pagina: number;
    limite: number;
    total: number;
    totalPaginas: number;
  };
}

// Servicios de API

// Materiales
export const materialesService = {
  getAll: async (params?: { activo?: boolean; categoria?: string }): Promise<Material[]> => {
    const response = await api.get('/materiales', { params });
    return response.data;
  },

  getById: async (id: number): Promise<Material> => {
    const response = await api.get(`/materiales/${id}`);
    return response.data;
  },

  create: async (data: Omit<Material, 'id' | 'fecha_creacion' | 'fecha_actualizacion'>): Promise<Material> => {
    const response = await api.post('/materiales', data);
    return response.data;
  },

  update: async (id: number, data: Partial<Material>): Promise<Material> => {
    const response = await api.put(`/materiales/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/materiales/${id}`);
  },

  getCategorias: async (): Promise<string[]> => {
    const response = await api.get('/materiales/categorias/list');
    return response.data;
  },

  buscar: async (termino: string, limite?: number): Promise<Material[]> => {
    const response = await api.get(`/materiales/buscar/${termino}`, {
      params: { limite }
    });
    return response.data;
  },
};

// Compras Generales
export const comprasGeneralesService = {
  getAll: async (params?: {
    fecha_inicio?: string;
    fecha_fin?: string;
    tipo_precio?: string;
    cliente?: string;  // ← AGREGADO
    limite?: number;
    pagina?: number;
  }): Promise<PaginatedResponse<CompraGeneral>> => {
    const response = await api.get('/compras/generales', { params });
    return {
      data: response.data.compras,
      paginacion: response.data.paginacion
    };
  },

  getById: async (id: number): Promise<CompraGeneral> => {
    const response = await api.get(`/compras/generales/${id}`);  // ← CORREGIDO
    return response.data;
  },

  create: async (data: Omit<CompraGeneral, 'id' | 'fecha_creacion'>): Promise<CompraGeneral> => {
    const response = await api.post('/compras/generales', data);
    return response.data;
  },

  update: async (id: number, data: Partial<CompraGeneral>): Promise<CompraGeneral> => {
    const response = await api.put(`/compras/generales/${id}`, data);  // ← CORREGIDO
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/compras/generales/${id}`);  // ← CORREGIDO
  },
};

// Compras por Material
export const comprasMaterialesService = {
  getAll: async (params?: {
    fecha_inicio?: string;
    fecha_fin?: string;
    material_id?: number;
    tipo_precio?: string;
    cliente?: string;  // ← AGREGADO
    limite?: number;
    pagina?: number;
  }): Promise<PaginatedResponse<CompraMaterial>> => {
    const response = await api.get('/compras/materiales', { params });
    return {
      data: response.data.compras,
      paginacion: response.data.paginacion
    };
  },

  getById: async (id: number): Promise<CompraMaterial> => {
    const response = await api.get(`/compras/materiales/${id}`);  // ← CORREGIDO
    return response.data;
  },

  create: async (data: Omit<CompraMaterial, 'id' | 'fecha_creacion' | 'material_nombre' | 'material_categoria' | 'total_pesos'>): Promise<CompraMaterial> => {
    const response = await api.post('/compras/materiales', data);
    return response.data;
  },

  update: async (id: number, data: Partial<CompraMaterial>): Promise<CompraMaterial> => {
    const response = await api.put(`/compras/materiales/${id}`, data);  // ← CORREGIDO
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/compras/materiales/${id}`);  // ← CORREGIDO
  },
};

// Ventas
export const ventasService = {
  getAll: async (params?: {
    fecha_inicio?: string;
    fecha_fin?: string;
    material_id?: number;
    cliente?: string;
    limite?: number;
    pagina?: number;
  }): Promise<PaginatedResponse<Venta>> => {
    const response = await api.get('/ventas', { params });
    return {
      data: response.data.ventas,
      paginacion: response.data.paginacion
    };
  },

  getById: async (id: number): Promise<Venta> => {
    const response = await api.get(`/ventas/${id}`);
    return response.data;
  },

  create: async (data: Omit<Venta, 'id' | 'fecha_creacion' | 'material_nombre' | 'material_categoria' | 'total_pesos'>): Promise<Venta> => {
    const response = await api.post('/ventas', data);
    return response.data;
  },

  update: async (id: number, data: Partial<Venta>): Promise<Venta> => {
    const response = await api.put(`/ventas/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/ventas/${id}`);
  },
};

// Gastos
export const gastosService = {
  getAll: async (params?: {
    fecha_inicio?: string;
    fecha_fin?: string;
    categoria_id?: number;
    limite?: number;
    pagina?: number;
  }): Promise<PaginatedResponse<Gasto>> => {
    const response = await api.get('/gastos', { params });
    return {
      data: response.data.gastos,
      paginacion: response.data.paginacion
    };
  },

  getById: async (id: number): Promise<Gasto> => {
    const response = await api.get(`/gastos/${id}`);
    return response.data;
  },

  create: async (data: Omit<Gasto, 'id' | 'fecha_creacion' | 'categoria_nombre' | 'categoria_descripcion'>): Promise<Gasto> => {
    const response = await api.post('/gastos', data);
    return response.data;
  },

  update: async (id: number, data: Partial<Gasto>): Promise<Gasto> => {
    const response = await api.put(`/gastos/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/gastos/${id}`);
  },

  getCategorias: async (): Promise<CategoriaGasto[]> => {
    const response = await api.get('/gastos/categorias');
    return response.data;
  },

  createCategoria: async (data: Omit<CategoriaGasto, 'id' | 'activo'>): Promise<CategoriaGasto> => {
    const response = await api.post('/gastos/categorias', data);
    return response.data;
  },
};

// Servicio para clientes (autocompletado)
export const clientesService = {
  buscar: async (busqueda: string, tipo?: 'general' | 'material'): Promise<string[]> => {
    const params: any = { buscar: busqueda };
    
    // Agregar el parámetro tipo si se proporciona
    if (tipo) {
      params.tipo = tipo;
    }
    
    const response = await api.get(`/compras/clientes/lista`, { params });
    return response.data;
  },
};

// Dashboard y Reportes
export const dashboardService = {
  getDashboard: async (periodo?: string) => {
    const response = await api.get('/reportes/dashboard', {
      params: { periodo }
    });
    return response.data;
  },

  getHealth: async () => {
    const response = await api.get('/health');
    return response.data;
  },
};

// Utilidades
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatNumber = (number: number, decimals: number = 2): string => {
  return new Intl.NumberFormat('es-CO', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(number);
};

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('es-CO');
};

export const formatDateTime = (dateString: string): string => {
  return new Date(dateString).toLocaleString('es-CO');
};
