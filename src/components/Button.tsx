import React, { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children?: ReactNode;
  className?: string;
  disabled?: boolean;
  type?: 'submit' | 'reset' | 'button';
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

export function Button({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  ...props 
}: ButtonProps) {
  const base = "inline-flex items-center justify-center font-extrabold transition-all rounded-full active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none focus-visible:outline focus-visible:outline-4 focus-visible:outline-brand-2/30 focus-visible:outline-offset-2";
  
  const variants = {
    primary: "bg-gradient-to-br from-brand to-brand-2 text-white hover:shadow-[0_10px_26px_rgba(11,42,111,.18)] border border-transparent",
    secondary: "bg-white text-slate-700 hover:text-brand hover:bg-brand-light/60 border border-[#d6deeb] shadow-[0_4px_12px_rgba(11,42,111,.08)]",
    ghost: "text-slate-600 hover:text-brand hover:bg-brand-light/60 border border-transparent",
    danger: "bg-red-50 text-red-600 hover:bg-red-100 border border-red-100"
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-5 py-2.5 text-sm",
    lg: "px-6 py-3 text-base"
  };

  return (
    <button 
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
