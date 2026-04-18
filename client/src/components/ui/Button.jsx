import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

const variantClasses = {
  primary:
    'bg-gradient-to-r from-brand via-brand-strong to-accent text-slate-950 font-semibold shadow-lg shadow-brand/20 hover:shadow-brand/40',
  outline:
    'bg-transparent border border-white/15 text-text-primary hover:border-brand/45 hover:bg-brand/10',
  secondary:
    'bg-white/[0.05] border border-white/10 text-text-primary hover:bg-white/[0.08] hover:border-white/20',
  danger:
    'bg-gradient-to-r from-rose-500 to-red-400 text-white font-semibold shadow-lg shadow-red-500/20 hover:shadow-red-500/40',
  ghost:
    'bg-transparent text-text-muted hover:text-text-primary hover:bg-white/5',
};

const sizeClasses = {
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-6 py-3 text-base gap-2.5',
};

const iconSizeClasses = {
  sm: 'w-3.5 h-3.5',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon: Icon,
  className = '',
  children,
  ...rest
}) {
  const isDisabled = disabled || loading;

  return (
    <motion.button
      whileHover={!isDisabled ? { y: -1, scale: 1.01 } : {}}
      whileTap={!isDisabled ? { y: 0, scale: 0.98 } : {}}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      disabled={isDisabled}
      className={[
        'inline-flex items-center justify-center rounded-2xl transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-brand/50 focus:ring-offset-2 focus:ring-offset-bg',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
        variantClasses[variant] ?? variantClasses.primary,
        sizeClasses[size] ?? sizeClasses.md,
        className,
      ].join(' ')}
      {...rest}
    >
      {loading ? (
        <Loader2 className={`${iconSizeClasses[size]} animate-spin`} />
      ) : Icon ? (
        <Icon className={iconSizeClasses[size]} />
      ) : null}
      {children && <span>{children}</span>}
    </motion.button>
  );
}
