import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'glass' | 'icon';
  fullWidth?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  fullWidth = false, 
  size = 'md',
  className = '', 
  ...props 
}) => {
  
  const baseStyles = "relative font-sans font-bold tracking-wide transition-all duration-200 active:scale-[0.95] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 overflow-hidden outline-none";
  
  const sizeStyles = {
    sm: "px-3 py-1.5 text-xs rounded-xl",
    md: "px-6 py-3.5 text-sm rounded-2xl",
    lg: "px-8 py-5 text-base rounded-2xl"
  };

  const variants = {
    primary: "bg-gradient-to-r from-ai-accent to-purple-600 text-white shadow-neon border-0 hover:brightness-110",
    secondary: "bg-ai-surface border border-ai-dim/40 text-ai-text hover:border-ai-accent hover:text-white hover:bg-ai-surface/80",
    danger: "bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-neon-red border-0 hover:brightness-110",
    ghost: "bg-transparent text-ai-dim hover:text-white hover:bg-white/5",
    glass: "backdrop-blur-md bg-white/10 text-white hover:bg-white/20 border border-white/10",
    icon: "p-2 rounded-2xl bg-ai-surface border border-ai-dim/30 text-ai-text hover:border-ai-accent hover:text-white hover:shadow-neon aspect-square flex items-center justify-center"
  };

  const finalSizeStyle = variant === 'icon' ? '' : sizeStyles[size];

  return (
    <button 
      className={`${baseStyles} ${finalSizeStyle} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};