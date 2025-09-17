// Archivo: src/components/Navbar.tsx

import React, { useState, useEffect } from 'react';
import { 
  Home, 
  Package, 
  ShoppingCart, 
  TrendingUp, 
  Receipt, 
  BarChart3,
  Menu,
  X,
  User,
  LogOut,
  Settings,
  Recycle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { usuario, logout, isAdmin } = useAuth();

  // Detectar si es mobile
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // Cerrar menús al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.user-menu') && !target.closest('.user-menu-button')) {
        setShowUserMenu(false);
      }
      if (!target.closest('.mobile-menu') && !target.closest('.mobile-menu-button')) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleMenu = () => setIsOpen(!isOpen);
  const toggleUserMenu = () => setShowUserMenu(!showUserMenu);

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
  };

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: Home },
    { name: 'Materiales', path: '/materiales', icon: Package },
    { name: 'Compras Generales', path: '/compras-generales', icon: ShoppingCart },
    { name: 'Compras Materiales', path: '/compras-materiales', icon: ShoppingCart },
    { name: 'Ventas', path: '/ventas', icon: TrendingUp },
    { name: 'Gastos', path: '/gastos', icon: Receipt },
    { name: 'Reportes', path: '/reportes', icon: BarChart3 },
  ];

  const isCurrentPath = (path: string) => {
    return window.location.pathname === path;
  };

  const handleNavigation = (path: string) => {
    window.location.href = path;
    setIsOpen(false);
  };

  return (
    <>
      <nav style={{
        backgroundColor: 'white',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 16px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: '64px'
          }}>
            {/* Logo */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              cursor: 'pointer'
            }}
            onClick={() => handleNavigation('/')}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '40px',
                height: '40px',
                backgroundColor: '#10b981',
                borderRadius: '8px'
              }}>
                <Recycle size={24} style={{ color: 'white' }} />
              </div>
              <div style={{ display: isMobile ? 'none' : 'block' }}>
                <h1 style={{
                  fontSize: '20px',
                  fontWeight: 'bold',
                  color: '#111827',
                  margin: 0
                }}>
                  Sistema Reciclaje
                </h1>
                <p style={{
                  fontSize: '12px',
                  color: '#6b7280',
                  margin: 0
                }}>
                  Gestión de materiales
                </p>
              </div>
            </div>

            {/* Desktop Menu */}
            {!isMobile && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                {menuItems.map((item) => {
                  const isActive = isCurrentPath(item.path);
                  return (
                    <button
                      key={item.name}
                      onClick={() => handleNavigation(item.path)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: 'none',
                        background: 'none',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500',
                        transition: 'all 0.15s ease',
                        backgroundColor: isActive ? '#f0fdf4' : 'transparent',
                        color: isActive ? '#059669' : '#6b7280'
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = '#f9fafb';
                          e.currentTarget.style.color = '#374151';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.color = '#6b7280';
                        }
                      }}
                    >
                      <item.icon size={16} />
                      {item.name}
                    </button>
                  );
                })}
              </div>
            )}

            {/* User Menu & Mobile Menu Button */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              {/* User Menu */}
              <div style={{ position: 'relative' }} className="user-menu">
                <button
                  className="user-menu-button"
                  onClick={toggleUserMenu}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 12px',
                    backgroundColor: '#f9fafb',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    color: '#374151'
                  }}
                >
                  <div style={{
                    width: '32px',
                    height: '32px',
                    backgroundColor: '#10b981',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}>
                    {usuario?.nombre?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  {!isMobile && (
                    <div>
                      <div style={{ fontWeight: '500' }}>{usuario?.nombre}</div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>
                        {isAdmin ? 'Administrador' : 'Usuario'}
                      </div>
                    </div>
                  )}
                </button>

                {/* User Dropdown Menu */}
                {showUserMenu && (
                  <div style={{
                    position: 'absolute',
                    right: 0,
                    top: '100%',
                    marginTop: '8px',
                    width: '200px',
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                    zIndex: 100
                  }}>
                    <div style={{
                      padding: '12px 16px',
                      borderBottom: '1px solid #f3f4f6'
                    }}>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>
                        {usuario?.nombre}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>
                        {usuario?.email}
                      </div>
                      <div style={{ 
                        fontSize: '11px', 
                        color: '#059669',
                        fontWeight: '500',
                        marginTop: '2px'
                      }}>
                        {isAdmin ? 'Administrador' : 'Usuario'}
                      </div>
                    </div>
                    
                    <div style={{ padding: '8px' }}>
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          // Aquí podrías abrir un modal de perfil
                        }}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px 12px',
                          backgroundColor: 'transparent',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '14px',
                          color: '#374151',
                          cursor: 'pointer',
                          textAlign: 'left'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#f9fafb';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        <User size={16} />
                        Mi Perfil
                      </button>
                      
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          // Aquí podrías abrir configuración
                        }}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px 12px',
                          backgroundColor: 'transparent',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '14px',
                          color: '#374151',
                          cursor: 'pointer',
                          textAlign: 'left'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#f9fafb';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        <Settings size={16} />
                        Configuración
                      </button>

                      <hr style={{ margin: '8px 0', border: 'none', borderTop: '1px solid #f3f4f6' }} />
                      
                      <button
                        onClick={handleLogout}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px 12px',
                          backgroundColor: 'transparent',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '14px',
                          color: '#dc2626',
                          cursor: 'pointer',
                          textAlign: 'left'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#fef2f2';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        <LogOut size={16} />
                        Cerrar Sesión
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile Menu Button */}
              {isMobile && (
                <button
                  className="mobile-menu-button"
                  onClick={toggleMenu}
                  style={{
                    padding: '8px',
                    backgroundColor: 'transparent',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    color: '#6b7280'
                  }}
                >
                  {isOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMobile && isOpen && (
        <div 
          className="mobile-menu"
          style={{
            position: 'fixed',
            top: '64px',
            left: 0,
            right: 0,
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            zIndex: 40,
            maxHeight: 'calc(100vh - 64px)',
            overflowY: 'auto'
          }}
        >
          <div style={{ padding: '16px' }}>
            {menuItems.map((item) => {
              const isActive = isCurrentPath(item.path);
              return (
                <button
                  key={item.name}
                  onClick={() => handleNavigation(item.path)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 16px',
                    marginBottom: '8px',
                    backgroundColor: isActive ? '#f0fdf4' : 'transparent',
                    border: isActive ? '1px solid #bbf7d0' : '1px solid transparent',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: '500',
                    color: isActive ? '#059669' : '#374151',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <item.icon size={20} />
                  {item.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Overlay para cerrar menú mobile */}
      {isMobile && isOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            zIndex: 30
          }}
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};

export default Navbar;