// Archivo: src/contexts/AuthContext.tsx

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../services/api';

interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: string;
}

interface AuthContextType {
  usuario: Usuario | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (nombre: string, email: string, password: string, confirmarPassword: string) => Promise<void>;
  logout: () => void;
  actualizarPerfil: (nombre: string) => Promise<void>;
  cambiarPassword: (passwordActual: string, passwordNuevo: string, confirmarPasswordNuevo: string) => Promise<void>;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Cargar token desde localStorage al inicializar
  useEffect(() => {
    const tokenGuardado = localStorage.getItem('token');
    const refreshTokenGuardado = localStorage.getItem('refreshToken');
    
    if (tokenGuardado) {
      setToken(tokenGuardado);
      // Configurar header de autorización por defecto
      api.defaults.headers.common['Authorization'] = `Bearer ${tokenGuardado}`;
      
      // Verificar si el token es válido
      verificarToken(tokenGuardado, refreshTokenGuardado);
    } else {
      setLoading(false);
    }
  }, []);

  // Verificar validez del token
  const verificarToken = async (tokenActual: string, refreshToken: string | null) => {
    try {
      const response = await api.get('/auth/verificar');
      setUsuario(response.data.usuario);
    } catch (error: any) {
      console.log('Token inválido o expirado, intentando renovar...');
      
      if (refreshToken) {
        try {
          await renovarToken(refreshToken);
        } catch (refreshError) {
          console.log('No se pudo renovar el token, cerrando sesión');
          limpiarSesion();
        }
      } else {
        limpiarSesion();
      }
    } finally {
      setLoading(false);
    }
  };

  // Renovar token usando refresh token
  const renovarToken = async (refreshToken: string) => {
    try {
      const response = await api.post('/auth/refresh', { refreshToken });
      const { token: nuevoToken, refreshToken: nuevoRefreshToken, usuario } = response.data;
      
      setToken(nuevoToken);
      setUsuario(usuario);
      
      // Guardar nuevos tokens
      localStorage.setItem('token', nuevoToken);
      localStorage.setItem('refreshToken', nuevoRefreshToken);
      
      // Actualizar header de autorización
      api.defaults.headers.common['Authorization'] = `Bearer ${nuevoToken}`;
      
    } catch (error) {
      throw error;
    }
  };

  // Función para limpiar sesión localmente
  const limpiarSesion = () => {
    setUsuario(null);
    setToken(null);
    
    // Limpiar localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    
    // Limpiar header de autorización
    delete api.defaults.headers.common['Authorization'];
  };

  // Login
  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      const response = await api.post('/auth/login', { email, password });
      const { token: nuevoToken, refreshToken, usuario } = response.data;
      
      setToken(nuevoToken);
      setUsuario(usuario);
      
      // Guardar tokens en localStorage
      localStorage.setItem('token', nuevoToken);
      localStorage.setItem('refreshToken', refreshToken);
      
      // Configurar header de autorización por defecto
      api.defaults.headers.common['Authorization'] = `Bearer ${nuevoToken}`;
      
    } catch (error: any) {
      const mensaje = error.response?.data?.error || 'Error en el login';
      throw new Error(mensaje);
    } finally {
      setLoading(false);
    }
  };

  // Registro
  const register = async (nombre: string, email: string, password: string, confirmarPassword: string) => {
    try {
      setLoading(true);
      const response = await api.post('/auth/registro', {
        nombre,
        email,
        password,
        confirmarPassword
      });
      
      const { token: nuevoToken, refreshToken, usuario } = response.data;
      
      setToken(nuevoToken);
      setUsuario(usuario);
      
      // Guardar tokens en localStorage
      localStorage.setItem('token', nuevoToken);
      localStorage.setItem('refreshToken', refreshToken);
      
      // Configurar header de autorización por defecto
      api.defaults.headers.common['Authorization'] = `Bearer ${nuevoToken}`;
      
    } catch (error: any) {
      const mensaje = error.response?.data?.error || 'Error en el registro';
      throw new Error(mensaje);
    } finally {
      setLoading(false);
    }
  };

  // Logout (corregido para evitar bucle infinito)
  const logout = () => {
    // Limpiar estado local primero
    limpiarSesion();
    
    // Llamar endpoint de logout solo si hay token (opcional y sin esperar respuesta)
    const tokenActual = localStorage.getItem('token');
    if (tokenActual) {
      try {
        // Hacer la petición en segundo plano, sin bloquear el logout
        api.post('/auth/logout').catch(() => {
          // No importa si falla, ya limpiamos el estado local
        });
      } catch (error) {
        // No importa si falla, ya limpiamos el estado local
      }
    }
  };

  // Actualizar perfil
  const actualizarPerfil = async (nombre: string) => {
    try {
      const response = await api.put('/auth/perfil', { nombre });
      setUsuario(response.data.usuario);
    } catch (error: any) {
      const mensaje = error.response?.data?.error || 'Error actualizando perfil';
      throw new Error(mensaje);
    }
  };

  // Cambiar contraseña
  const cambiarPassword = async (passwordActual: string, passwordNuevo: string, confirmarPasswordNuevo: string) => {
    try {
      await api.put('/auth/cambiar-password', {
        passwordActual,
        passwordNuevo,
        confirmarPasswordNuevo
      });
    } catch (error: any) {
      const mensaje = error.response?.data?.error || 'Error cambiando contraseña';
      throw new Error(mensaje);
    }
  };

  // Interceptor para manejar tokens expirados automáticamente
  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        
        if (error.response?.status === 401 && !originalRequest._retry && token) {
          originalRequest._retry = true;
          
          const refreshToken = localStorage.getItem('refreshToken');
          
          if (refreshToken) {
            try {
              await renovarToken(refreshToken);
              // Reintentar la petición original con el nuevo token
              originalRequest.headers['Authorization'] = `Bearer ${localStorage.getItem('token')}`;
              return api(originalRequest);
            } catch (refreshError) {
              limpiarSesion();
              return Promise.reject(refreshError);
            }
          } else {
            limpiarSesion();
          }
        }
        
        return Promise.reject(error);
      }
    );

    // Limpiar interceptor al desmontar
    return () => {
      api.interceptors.response.eject(interceptor);
    };
  }, [token]); // Agregar token como dependencia

  const value: AuthContextType = {
    usuario,
    token,
    loading,
    login,
    register,
    logout,
    actualizarPerfil,
    cambiarPassword,
    isAuthenticated: !!usuario && !!token,
    isAdmin: usuario?.rol === 'administrador'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook personalizado para usar el contexto
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

// Componente para rutas protegidas
interface ProtectedRouteProps {
  children: ReactNode;
  requiereAdmin?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiereAdmin = false 
}) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #f3f4f6',
            borderTop: '4px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <p style={{ color: '#6b7280' }}>Cargando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirigir al login si no está autenticado
    window.location.href = '/login';
    return null;
  }

  if (requiereAdmin && !isAdmin) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        textAlign: 'center'
      }}>
        <div>
          <h2 style={{ color: '#ef4444', marginBottom: '16px' }}>Acceso Denegado</h2>
          <p style={{ color: '#6b7280' }}>No tienes permisos para acceder a esta página</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};