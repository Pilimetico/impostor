import React from 'react';

interface TransitionWrapperProps {
  children: React.ReactNode;
  className?: string;
}

export const TransitionWrapper: React.FC<TransitionWrapperProps> = ({ children, className = '' }) => {
  return (
    <div className={`animate-fade-in w-full max-w-md mx-auto min-h-screen flex flex-col relative ${className}`}>
      {children}
    </div>
  );
};