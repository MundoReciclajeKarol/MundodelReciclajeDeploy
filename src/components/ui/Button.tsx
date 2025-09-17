// Archivo: src/components/ui/Button.tsx

import React from 'react';
import { LoadingSpinner } from './LoadingSpinner';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

interface VariantStyle {
  backgroundColor: string;
  color: string;
  ':hover': {
    backgroundColor: string;
  };
}

interface VariantStyles {
  primary: VariantStyle;
  secondary: VariantStyle;
  success: VariantStyle;
  danger: VariantStyle;
  warning: VariantStyle;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  className = '',
  disabled,
  style,
  ...props
}) => {
  const baseStyles: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '500',
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    gap: '8px'
  };

  const variantStyles: VariantStyles = {
    primary: {
      backgroundColor: '#3b82f6',
      color: 'white',
      ':hover': { backgroundColor: '#2563eb' }
    },
    secondary: {
      backgroundColor: '#f3f4f6',
      color: '#374151',
      ':hover': { backgroundColor: '#e5e7eb' }
    },
    success: {
      backgroundColor: '#10b981',
      color: 'white',
      ':hover': { backgroundColor: '#059669' }
    },
    danger: {
      backgroundColor: '#ef4444',
      color: 'white',
      ':hover': { backgroundColor: '#dc2626' }
    },
    warning: {
      backgroundColor: '#f59e0b',
      color: 'white',
      ':hover': { backgroundColor: '#d97706' }
    },
  };

  const sizeStyles = {
    sm: { padding: '6px 12px', fontSize: '14px' },
    md: { padding: '8px 16px', fontSize: '14px' },
    lg: { padding: '12px 24px', fontSize: '16px' },
  };

  const isDisabled = disabled || loading;

  const buttonStyle: React.CSSProperties = {
    ...baseStyles,
    backgroundColor: variantStyles[variant].backgroundColor,
    color: variantStyles[variant].color,
    ...sizeStyles[size],
    opacity: isDisabled ? 0.6 : 1,
    cursor: isDisabled ? 'not-allowed' : 'pointer',
    ...style
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!isDisabled) {
      const hoverStyle = variantStyles[variant][':hover'];
      e.currentTarget.style.backgroundColor = hoverStyle.backgroundColor;
    }
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!isDisabled) {
      e.currentTarget.style.backgroundColor = variantStyles[variant].backgroundColor;
    }
  };

  return (
    <button
      {...props}
      className={className}
      style={buttonStyle}
      disabled={isDisabled}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {loading && <LoadingSpinner size="sm" />}
      {!loading && icon && <span>{icon}</span>}
      {children}
    </button>
  );
};