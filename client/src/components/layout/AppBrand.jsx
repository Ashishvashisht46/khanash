import React from 'react';
import luxLogo from '../../assets/lux-logo.png';
import { BRAND } from '../../lib/brand.js';

export default function AppBrand({ compact = false }) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border border-brand/25 bg-white shadow-lg shadow-brand/10 ring-1 ring-white/10">
        <img src={luxLogo} alt={`${BRAND.name} logo`} className="h-full w-full object-cover" />
      </div>
      {!compact && (
        <div>
          <p className="font-display text-base font-bold leading-none text-text-primary">{BRAND.name}</p>
          <p className="mt-1 text-[0.68rem] uppercase tracking-[0.26em] text-text-soft">{BRAND.descriptor}</p>
        </div>
      )}
    </div>
  );
}
