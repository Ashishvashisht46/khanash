import React, { forwardRef } from 'react';
import { AlertCircle } from 'lucide-react';

const Input = forwardRef(function Input(
  { label, error, icon: Icon, className = '', id, ...rest },
  ref
) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-[10px] font-semibold uppercase tracking-[0.22em] text-text-soft"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
            <Icon className="w-4 h-4" />
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          className={[
            'w-full rounded-2xl border bg-white/[0.04] px-3 py-3 text-sm text-text-primary backdrop-blur-sm',
            'placeholder:text-text-muted/60',
            'transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand/50',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            error
              ? 'border-red-500/60 focus:border-red-500/80 focus:ring-red-500/30'
              : 'border-white/10 hover:border-white/20',
            Icon ? 'pl-9' : '',
            className,
          ].join(' ')}
          {...rest}
        />
      </div>
      {error && (
        <p className="flex items-center gap-1.5 text-xs text-red-400">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
});

export default Input;
