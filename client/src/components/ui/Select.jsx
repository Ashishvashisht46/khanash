import React, { forwardRef } from 'react';
import { ChevronDown, AlertCircle } from 'lucide-react';

const Select = forwardRef(function Select(
  { label, options = [], error, className = '', id, placeholder, ...rest },
  ref
) {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={selectId}
          className="text-[10px] font-semibold text-gold/80 uppercase tracking-widest"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          className={[
            'w-full appearance-none rounded-lg bg-navy-mid border px-3 py-2.5 pr-9 text-sm text-text-primary',
            'transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold/60',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            error
              ? 'border-red-500/60 focus:border-red-500/80 focus:ring-red-500/30'
              : 'border-gold/20 hover:border-gold/30',
            className,
          ].join(' ')}
          {...rest}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option
              key={opt.value}
              value={opt.value}
              className="bg-navy-mid text-text-primary"
            >
              {opt.label}
            </option>
          ))}
        </select>
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
          <ChevronDown className="w-4 h-4" />
        </span>
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

export default Select;
