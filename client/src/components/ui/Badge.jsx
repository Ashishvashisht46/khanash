import React from 'react';
import { motion } from 'framer-motion';

const variantStyles = {
  open: {
    container: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
    dot: 'bg-blue-400',
  },
  pending: {
    container: 'bg-yellow-500/15 text-yellow-200 border-yellow-500/30',
    dot: 'bg-yellow-400',
  },
  inprogress: {
    container: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    dot: 'bg-amber-400',
  },
  completed: {
    container: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    dot: 'bg-emerald-400',
  },
  denied: {
    container: 'bg-red-500/15 text-red-300 border-red-500/30',
    dot: 'bg-red-400',
  },
  mismatch: {
    container: 'bg-pink-500/15 text-pink-300 border-pink-500/30',
    dot: 'bg-pink-400',
  },
  appeal: {
    container: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
    dot: 'bg-orange-400',
  },
  writtenOff: {
    container: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
    dot: 'bg-slate-400',
  },
  // Aliases
  success: {
    container: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    dot: 'bg-emerald-400',
  },
  error: {
    container: 'bg-red-500/15 text-red-300 border-red-500/30',
    dot: 'bg-red-400',
  },
  warning: {
    container: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
    dot: 'bg-yellow-400',
  },
  info: {
    container: 'bg-blue-500/15 text-blue-200 border-blue-500/30',
    dot: 'bg-blue-400',
  },
  neutral: {
    container: 'bg-white/[0.05] text-text-muted border-white/10',
    dot: 'bg-text-muted',
  },
  default: {
    container: 'bg-white/5 text-text-muted border-white/10',
    dot: 'bg-text-muted',
  },
};

const sizeStyles = {
  sm: 'px-2 py-0.5 text-[10px] gap-1',
  md: 'px-2.5 py-1 text-xs gap-1.5',
};

export default function Badge({
  variant = 'default',
  size = 'md',
  dot = false,
  className = '',
  children,
}) {
  const styles = variantStyles[variant] ?? variantStyles.default;

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.15 }}
      className={[
        'inline-flex items-center rounded-full border font-medium whitespace-nowrap',
        styles.container,
        sizeStyles[size] ?? sizeStyles.md,
        className,
      ].join(' ')}
    >
      {dot && (
        <span
          className={[
            'rounded-full flex-shrink-0',
            styles.dot,
            size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2',
          ].join(' ')}
        />
      )}
      {children}
    </motion.span>
  );
}
