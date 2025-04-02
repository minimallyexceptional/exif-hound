import React from 'react';
import { Tooltip } from './Tooltip';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  icon?: React.ReactNode;
  fullWidth?: boolean;
  size?: 'sm' | 'md' | 'lg';
  tooltip?: string;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  icon,
  fullWidth = false,
  size = 'md',
  className = '',
  tooltip,
  ...props
}) => {
  const baseClasses = 'flex items-center justify-center rounded-lg transition-all duration-300';
  
  const variantClasses = {
    primary: 'bg-app-white text-app-black hover:bg-app-accent hover:translate-y-[1px]',
    secondary: 'bg-app-gray-light text-app-white hover:bg-app-gray-lighter hover:translate-y-[1px]',
    ghost: 'text-app-accent-dim hover:text-app-white hover:bg-app-gray-light'
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg'
  };

  const button = (
    <button 
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {icon && (
        <span className="w-4 h-4 flex-shrink-0">
          {icon}
        </span>
      )}
      {icon && children && <span className="ml-2">{children}</span>}
      {!icon && children}
    </button>
  );

  if (tooltip) {
    return (
      <Tooltip content={tooltip}>
        {button}
      </Tooltip>
    );
  }

  return button;
}; 