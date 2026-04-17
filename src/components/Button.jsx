import React from 'react';
import '../index.css';

import { Loader2 } from 'lucide-react';

const Button = ({
  children,
  onClick,
  variant = 'primary', // primary, secondary, danger, outline
  size = 'md', // sm, md, lg, block
  className = '',
  disabled = false,
  loading = false,
  type = 'button'
}) => {
  const baseStyles = {
    padding: 'var(--spacing-md) var(--spacing-lg)',
    borderRadius: 'var(--radius-md)',
    fontWeight: 'var(--font-weight-bold)',
    fontSize: 'var(--font-size-base)',
    transition: 'all 0.2s ease',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'var(--spacing-sm)',
    border: '2px solid transparent'
  };

  const variants = {
    primary: {
      backgroundColor: 'var(--primary-color)',
      color: '#fff',
    },
    secondary: {
      backgroundColor: 'var(--warning-color)',
      color: 'var(--text-primary)',
    },
    danger: {
      backgroundColor: 'var(--danger-color)',
      color: '#fff',
    },
    outline: {
      backgroundColor: 'transparent',
      borderColor: 'var(--primary-color)',
      color: 'var(--primary-color)',
    }
  };

  const sizes = {
    sm: { padding: 'var(--spacing-xs) var(--spacing-sm)', fontSize: '14px' },
    md: { padding: 'var(--spacing-sm) var(--spacing-md)' },
    lg: { padding: 'var(--spacing-md) var(--spacing-xl)', fontSize: '18px' },
    block: { width: '100%', padding: 'var(--spacing-md)' }
  };

  const style = {
    ...baseStyles,
    ...variants[variant],
    ...sizes[size],
    opacity: disabled ? 0.6 : 1,
    cursor: disabled ? 'not-allowed' : 'pointer',
  };

  return (
    <button
      type={type}
      className={className}
      style={style}
      onClick={!loading ? onClick : null}
      disabled={disabled || loading}
    >
      {loading && <Loader2 className="animate-spin" size={20} />}
      {children}
    </button>
  );
};

export { Button };
export default Button;
