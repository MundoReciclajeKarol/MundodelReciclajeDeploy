// Archivo: src/App.tsx

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, ProtectedRoute, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './components/ui/Toast';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Materiales from './pages/Materiales';
import ComprasGenerales from './pages/ComprasGenerales';
import ComprasMateriales from './pages/ComprasMateriales';
import Ventas from './pages/Ventas';
import Gastos from './pages/Gastos';
import Reportes from './pages/Reportes';
import './App.css';

// Componente para redirigir si ya está autenticado
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

// Layout principal con navbar
const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      <Navbar />
      <main>
        {children}
      </main>
    </div>
  );
};

// Componente de rutas principales
const AppRoutes: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* Ruta pública - Login */}
        <Route 
          path="/login" 
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } 
        />
        
        {/* Rutas protegidas */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <MainLayout>
                <Dashboard />
              </MainLayout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/materiales" 
          element={
            <ProtectedRoute>
              <MainLayout>
                <Materiales />
              </MainLayout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/compras-generales" 
          element={
            <ProtectedRoute>
              <MainLayout>
                <ComprasGenerales />
              </MainLayout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/compras-materiales" 
          element={
            <ProtectedRoute>
              <MainLayout>
                <ComprasMateriales />
              </MainLayout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/ventas" 
          element={
            <ProtectedRoute>
              <MainLayout>
                <Ventas />
              </MainLayout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/gastos" 
          element={
            <ProtectedRoute>
              <MainLayout>
                <Gastos />
              </MainLayout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/reportes" 
          element={
            <ProtectedRoute>
              <MainLayout>
                <Reportes />
              </MainLayout>
            </ProtectedRoute>
          } 
        />
        
        {/* Ruta por defecto - redirigir a dashboard si está autenticado, sino al login */}
        <Route 
          path="*" 
          element={<Navigate to="/" replace />} 
        />
      </Routes>
    </Router>
  );
};

// Componente principal de la aplicación
const App: React.FC = () => {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppRoutes />
      </ToastProvider>
    </AuthProvider>
  );
};

export default App;