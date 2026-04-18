import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Save,
  TrendingUp,
  ChevronDown,
} from 'lucide-react';
import { Button, Input } from '../ui';

/* ─────────────────────────────────────────────────────────────────────────────
   PostPaymentPanel
   Side panel for posting payments against a deposit.
   Auto-calculates unapplied amount and suggests a status.

   Props:
     depositId           — string
     initialActual       — number — pre-fill "Actual Deposit" field
     initialPosted       — number — pre-fill "Posted Amount" field
     initialStatus       — string — current deposit status
     onSave({ actualDeposit, postedAmount, unappliedAmount, status })
     loading             — boolean
───────────────────────────────────────────────────────────────────────────── */

const STATUS_OPTIONS = [
  { value: 'fully_applied', label: '✅ Fully Applied' },
  { value: 'partially_applied', label: '🟡 Partially Applied' },
  { value: 'unapplied', label: '🔴 Unapplied' },
  { value: 'overpaid', label: '⚠️ Overpaid' },
  { value: 'pending_review', label: '🔵 Pending Review' },
  { value: 'on_hold', label: '⏸️ On Hold' },
];

function suggestStatus(actual, posted) {
  if (!actual || actual <= 0) return 'unapplied';
  const diff = actual - posted;
  if (diff === 0) return 'fully_applied';
  if (diff > 0 && posted > 0) return 'partially_applied';
  if (posted === 0) return 'unapplied';
  if (posted > actual) return 'overpaid';
  return 'unapplied';
}

function parseNum(val) {
  const n = parseFloat((val ?? '').toString().replace(/[^0-9.]/g, ''));
  return isNaN(n) ? 0 : n;
}

function StatusBar({ actual, posted }) {
  const pct = actual > 0 ? Math.min((posted / actual) * 100, 100) : 0;
  const isOver = posted > actual && actual > 0;
  const isFull = posted === actual && actual > 0;

  const barColor = isOver
    ? 'from-red-500 to-red-400'
    : isFull
    ? 'from-emerald-500 to-emerald-400'
    : posted > 0
    ? 'from-amber-500 to-amber-400'
    : 'from-text-muted/30 to-text-muted/20';

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-text-muted">Payment Coverage</span>
        <span
          className={`font-semibold ${
            isOver ? 'text-red-400' : isFull ? 'text-emerald-400' : 'text-amber-400'
          }`}
        >
          {pct.toFixed(0)}%{isOver ? ' (Exceeds!)' : isFull ? ' (Fully Applied)' : ''}
        </span>
      </div>
      <div className="h-3 rounded-full bg-navy/60 border border-white/5 overflow-hidden">
        <motion.div
          className={`h-full rounded-full bg-gradient-to-r ${barColor}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
      {/* Legend */}
      <div className="flex items-center justify-between text-[10px] text-text-muted">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
          Fully Applied
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
          Unapplied
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
          Exceeds
        </span>
      </div>
    </div>
  );
}

function StatusIcon({ status }) {
  const map = {
    fully_applied: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
    partially_applied: <AlertTriangle className="w-4 h-4 text-amber-400" />,
    unapplied: <XCircle className="w-4 h-4 text-red-400" />,
    overpaid: <AlertTriangle className="w-4 h-4 text-orange-400" />,
    pending_review: <TrendingUp className="w-4 h-4 text-blue-400" />,
    on_hold: <AlertTriangle className="w-4 h-4 text-text-muted" />,
  };
  return map[status] ?? null;
}

export default function PostPaymentPanel({
  depositId,
  initialActual = 0,
  initialPosted = 0,
  initialStatus = 'unapplied',
  onSave,
  loading = false,
}) {
  const [actual, setActual] = useState(initialActual > 0 ? String(initialActual) : '');
  const [posted, setPosted] = useState(initialPosted > 0 ? String(initialPosted) : '');
  const [status, setStatus] = useState(initialStatus);
  const [statusOpen, setStatusOpen] = useState(false);
  const [dirty, setDirty] = useState(false);

  const actualNum = parseNum(actual);
  const postedNum = parseNum(posted);
  const unapplied = actualNum - postedNum;

  const suggested = useMemo(() => suggestStatus(actualNum, postedNum), [actualNum, postedNum]);

  // Auto-suggest status when amounts change
  useEffect(() => {
    if (dirty) {
      setStatus(suggested);
    }
  }, [suggested, dirty]);

  const handleActualChange = (e) => {
    setActual(e.target.value);
    setDirty(true);
  };

  const handlePostedChange = (e) => {
    setPosted(e.target.value);
    setDirty(true);
  };

  const handleSave = () => {
    onSave?.({
      depositId,
      actualDeposit: actualNum,
      postedAmount: postedNum,
      unappliedAmount: unapplied,
      status,
    });
    setDirty(false);
  };

  const selectedStatusOption = STATUS_OPTIONS.find((o) => o.value === status) ?? STATUS_OPTIONS[0];

  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col gap-5 rounded-2xl bg-gradient-to-br from-navy-light to-navy-mid border border-gold/20 p-5 shadow-xl"
    >
      {/* Panel Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gold/10 border border-gold/25 flex items-center justify-center flex-shrink-0">
          <DollarSign className="w-4 h-4 text-gold" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-text-primary">Post Payment</h3>
          <p className="text-[11px] text-text-muted">Apply amounts to this deposit</p>
        </div>
      </div>

      <div className="h-px bg-gold/10" />

      {/* Actual Deposit */}
      <Input
        label="Actual Deposit"
        icon={DollarSign}
        type="number"
        step="0.01"
        min="0"
        value={actual}
        onChange={handleActualChange}
        placeholder="0.00"
      />

      {/* Posted Amount */}
      <Input
        label="Posted Amount"
        icon={DollarSign}
        type="number"
        step="0.01"
        min="0"
        value={posted}
        onChange={handlePostedChange}
        placeholder="0.00"
      />

      {/* Unapplied Amount (read-only, auto-calculated) */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-semibold text-gold/80 uppercase tracking-widest">
          Unapplied Amount
        </label>
        <div
          className={[
            'rounded-lg border px-3 py-2.5 flex items-center gap-2 text-sm font-semibold',
            unapplied < 0
              ? 'border-red-500/40 bg-red-500/5 text-red-400'
              : unapplied === 0 && actualNum > 0
              ? 'border-emerald-500/40 bg-emerald-500/5 text-emerald-400'
              : 'border-amber-500/30 bg-amber-500/5 text-amber-400',
          ].join(' ')}
        >
          <DollarSign className="w-4 h-4 flex-shrink-0" />
          {unapplied < 0 ? '-' : ''}${Math.abs(unapplied).toFixed(2)}
          {unapplied < 0 && (
            <span className="ml-auto text-[10px] font-normal text-red-400/80">Exceeds deposit</span>
          )}
          {unapplied === 0 && actualNum > 0 && (
            <span className="ml-auto text-[10px] font-normal text-emerald-400/80">Balanced</span>
          )}
        </div>
      </div>

      {/* Visual Status Bar */}
      <StatusBar actual={actualNum} posted={postedNum} />

      {/* Status dropdown */}
      <div className="flex flex-col gap-1.5 relative">
        <label className="text-[10px] font-semibold text-gold/80 uppercase tracking-widest">
          Set Status
        </label>
        <button
          onClick={() => setStatusOpen((v) => !v)}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg bg-navy-mid border border-gold/20 hover:border-gold/40 text-sm text-text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-gold/35"
        >
          <StatusIcon status={status} />
          <span className="flex-1 text-left">{selectedStatusOption.label}</span>
          <motion.div animate={{ rotate: statusOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown className="w-4 h-4 text-text-muted" />
          </motion.div>
        </button>

        <AnimatePresence>
          {statusOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full left-0 right-0 mt-1 rounded-xl bg-navy-mid border border-gold/20 shadow-2xl z-20 overflow-hidden"
            >
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    setStatus(opt.value);
                    setStatusOpen(false);
                  }}
                  className={[
                    'w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-white/5 transition-colors text-left',
                    opt.value === status ? 'text-gold bg-gold/5' : 'text-text-primary',
                  ].join(' ')}
                >
                  <StatusIcon status={opt.value} />
                  {opt.label}
                  {opt.value === suggested && opt.value !== status && (
                    <span className="ml-auto text-[9px] text-gold/60 bg-gold/10 px-1.5 py-0.5 rounded-full">
                      Suggested
                    </span>
                  )}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Auto-suggestion notice */}
      <AnimatePresence>
        {dirty && suggested !== initialStatus && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="text-[11px] text-gold/70 flex items-center gap-1.5"
          >
            <TrendingUp className="w-3 h-3 flex-shrink-0" />
            Status auto-suggested based on amounts
          </motion.p>
        )}
      </AnimatePresence>

      {/* Save button */}
      <Button
        variant="gold"
        size="md"
        icon={Save}
        loading={loading}
        disabled={loading || (!dirty && actualNum === initialActual && postedNum === initialPosted)}
        onClick={handleSave}
        className="w-full"
      >
        Save &amp; Post
      </Button>
    </motion.div>
  );
}
