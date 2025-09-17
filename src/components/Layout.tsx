// Archivo: frontend/src/components/Layout.tsx

import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  TrendingUp,
  Receipt,
  BarChart3,
  Menu,
  X,
  Recycle
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Materiales', href: '/materiales', icon: Package },
    { 
      name: 'Compras', 
      icon: ShoppingCart,
      children: [
        { name: 'Generales', href: '/compras/generales' },
        { name: 'Por Material', href: '/compras/materiales' }
      ]
    },
    { name: 'Ventas', href: '/ventas', icon: TrendingUp },
    { name: 'Gastos', href: '/gastos', icon: Receipt },
    { name: 'Reportes', href: '/reportes', icon: BarChart3 },
  ];

  const isActiveRoute = (href: string) => {
    return location.pathname === href;
  };

  const isActiveParent = (children: { href: string }[]) => {
    return children.some(child => location.pathname === child.href);
  };

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#f9fafb' }}>
      {/* Sidebar */}
      <div style={{
        width: sidebarOpen ? '256px' : '0',
        backgroundColor: 'white',
        borderRight: '1px solid #e5e7eb',
        transition: 'width 0.3s ease',
        overflow: 'hidden',
        position: 'fixed',
        height: '100%',
        zIndex: 40
      }}>
        <div style={{ padding: '16px', borderBottom: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Recycle size={32} style={{ color: '#059669' }} />
            <h1 style={{
              fontSize: '20px',
              fontWeight: 'bold',
              color: '#111827',
              margin: 0
            }}>
              Mundo Reciclaje
            </h1>
          </div>
        </div>

        <nav style={{ padding: '16px 0' }}>
          {navigation.map((item) => (
            <div key={item.name}>
              {item.children ? (
                <div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '12px 16px',
                    color: isActiveParent(item.children) ? '#059669' : '#6b7280',
                    backgroundColor: isActiveParent(item.children) ? '#f0fdf4' : 'transparent',
                    fontSize: '14px',
                    fontWeight: '500',
                    borderRight: isActiveParent(item.children) ? '3px solid #059669' : 'none'
                  }}>
                    <item.icon size={20} style={{ marginRight: '12px' }} />
                    {item.name}
                  </div>
                  <div style={{ marginLeft: '32px' }}>
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        to={child.href}
                        style={{
                          display: 'block',
                          padding: '8px 16px',
                          color: isActiveRoute(child.href) ? '#059669' : '#6b7280',
                          backgroundColor: isActiveRoute(child.href) ? '#f0fdf4' : 'transparent',
                          fontSize: '14px',
                          textDecoration: 'none',
                          borderRight: isActiveRoute(child.href) ? '3px solid #059669' : 'none',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          if (!isActiveRoute(child.href)) {
                            e.currentTarget.style.backgroundColor = '#f9fafb';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isActiveRoute(child.href)) {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }
                        }}
                      >
                        {child.name}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : (
                <Link
                  to={item.href}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '12px 16px',
                    color: isActiveRoute(item.href) ? '#059669' : '#6b7280',
                    backgroundColor: isActiveRoute(item.href) ? '#f0fdf4' : 'transparent',
                    fontSize: '14px',
                    fontWeight: '500',
                    textDecoration: 'none',
                    borderRight: isActiveRoute(item.href) ? '3px solid #059669' : 'none',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActiveRoute(item.href)) {
                      e.currentTarget.style.backgroundColor = '#f9fafb';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActiveRoute(item.href)) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <item.icon size={20} style={{ marginRight: '12px' }} />
                  {item.name}
                </Link>
              )}
            </div>
          ))}
        </nav>
      </div>

      {/* Main content */}
      <div style={{
        flex: 1,
        marginLeft: sidebarOpen ? '256px' : '0',
        transition: 'margin-left 0.3s ease',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <header style={{
          backgroundColor: 'white',
          borderBottom: '1px solid #e5e7eb',
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              padding: '8px',
              borderRadius: '6px',
              border: '1px solid #e5e7eb',
              backgroundColor: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <div style={{
            fontSize: '18px',
            fontWeight: '600',
            color: '#111827'
          }}>
            Sistema de Gestión - Mundo del Reciclaje
          </div>
        </header>

        {/* Content */}
        <main style={{
          flex: 1,
          overflow: 'auto',
          backgroundColor: '#f9fafb'
        }}>
          {children}
        </main>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 30
          }}
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default Layout;