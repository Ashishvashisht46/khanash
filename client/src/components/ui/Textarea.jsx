import React, { forwardRef } from 'react';
import { AlertCircle } from 'lucide-react';

const Textarea = forwardRef(function Textarea(
  { label, error, className = '', id, rows = 4, ...rest },
  ref
) {
  const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={textareaId}
          className="text-[10px] font-semibold text-gold/80 uppercase tracking-widest"
        >
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={textareaId}
        rows={rows}
        className={[
          'w-full rounded-lg bg-navy-mid border px-3 py-2.5 text-sm text-text-primary',
          'placeholder:text-text-muted/50 resize-y',
          'transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold/60',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          error
            ? 'border-red-500/60 focus:border-red-500/80 focus:ring-red-500/30'
            : 'border-gold/20 hover:border-gold/30',
          className,
        ].join(' ')}
        {...rest}
      />
      {error && (
        <p className="flex items-center gap-1.5 text-xs text-red-400">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
});

export default Textarea;
