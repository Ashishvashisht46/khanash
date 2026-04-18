import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, GitMerge, Copy, Check } from 'lucide-react';
import { Button } from '../ui';

/* ─────────────────────────────────────────────────────────────────────────────
   DuplicateDetectionModal
   Shown when AI extraction detects entries that could be duplicate patients.
   User can choose to merge into one record or keep them separate.

   Props:
     isOpen          — boolean
     onClose         — callback()
     patientName     — string — duplicated name
     duplicates      — array of extracted record objects with { patientName, dateOfService, billed, insPaid, patientPortion }
     onConfirm(mode) — callback with 'merge' | 'separate'
     onSkip          — callback()
───────────────────────────────────────────────────────────────────────────── */

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 320, damping: 26, delay: 0.08 },
  },
  exit: { opacity: 0, y: 10, scale: 0.97, transition: { duration: 0.16 } },
};

function currencySum(records, key) {
  const total = records.reduce((acc, r) => {
    const val = parseFloat((r[key] ?? '').toString().replace(/[^0-9.]/g, '')) || 0;
    return acc + val;
  }, 0);
  return `$${total.toFixed(2)}`;
}

function MergePreview({ duplicates }) {
  return (
    <div className="mt-3 rounded-lg bg-navy/50 border border-gold/10 px-3 py-2.5 text-xs space-y-1.5">
      <p className="text-[10px] font-semibold text-gold/70 uppercase tracking-widest mb-2">
        Merged Preview
      </p>
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Total Billed', val: currencySum(duplicates, 'billed') },
          { label: 'Ins Paid', val: currencySum(duplicates, 'insPaid') },
          { label: 'Pt Portion', val: currencySum(duplicates, 'patientPortion') },
        ].map(({ label, val }) => (
          <div key={label} className="text-center">
            <p className="text-[10px] text-text-muted">{label}</p>
            <p className="text-sm font-semibold text-emerald-400">{val}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function SeparatePreview({ duplicates }) {
  return (
    <div className="mt-3 space-y-1.5 max-h-28 overflow-y-auto rounded-lg bg-navy/50 border border-gold/10 px-3 py-2.5">
      <p className="text-[10px] font-semibold text-gold/70 uppercase tracking-widest mb-2">
        Separate Entries
      </p>
      {duplicates.map((rec, i) => (
        <div key={i} className="flex items-center justify-between text-xs py-0.5 border-b border-white/5 last:border-0">
          <span className="text-text-muted">Entry #{i + 1}</span>
          <span className="text-text-primary">{rec.dateOfService || '—'}</span>
          <span className="text-emerald-400 font-mono">${parseFloat((rec.billed ?? '0').toString().replace(/[^0-9.]/g, '')).toFixed(2)}</span>
        </div>
      ))}
    </div>
  );
}

const OPTIONS = [
  {
    id: 'merge',
    icon: GitMerge,
    title: 'Merge into One',
    description: 'Combine all entries into a single deposit with totals summed.',
    color: 'text-emerald-400',
    borderActive: 'border-emerald-400/50 bg-emerald-400/5',
  },
  {
    id: 'separate',
    icon: Copy,
    title: 'Keep Separate',
    description: 'Save each entry as an individual deposit record.',
    color: 'text-blue-400',
    borderActive: 'border-blue-400/50 bg-blue-400/5',
  },
];

export default function DuplicateDetectionModal({
  isOpen,
  onClose,
  patientName = 'Unknown Patient',
  duplicates = [],
  onConfirm,
  onSkip,
}) {
  const [selected, setSelected] = useState('merge');

  const handleConfirm = () => {
    onConfirm?.(selected);
    onClose?.();
  };

  const handleSkip = () => {
    onSkip?.();
    onClose?.();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="dup-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-navy/80 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              key="dup-content"
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl bg-gradient-to-br from-navy-light to-navy-mid border border-gold/20 shadow-2xl shadow-black/60 overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-start gap-3 px-6 py-5 border-b border-gold/10">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mt-0.5">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-text-primary leading-tight">
                    Duplicate Patient Detected
                  </h2>
                  <p className="text-xs text-text-muted mt-1">
                    <span className="text-gold font-medium">{patientName}</span> appears{' '}
                    <strong className="text-amber-400">{duplicates.length}x</strong> in this extraction. How should we handle it?
                  </p>
                </div>
              </div>

              {/* Options */}
              <div className="px-6 py-5 space-y-3">
                {OPTIONS.map((opt) => {
                  const isSelected = selected === opt.id;
                  return (
                    <motion.button
                      key={opt.id}
                      onClick={() => setSelected(opt.id)}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      className={[
                        'w-full text-left rounded-xl border p-4 transition-all duration-200 focus:outline-none',
                        isSelected
                          ? opt.borderActive
                          : 'border-gold/15 bg-white/[0.02] hover:border-gold/30 hover:bg-white/[0.04]',
                      ].join(' ')}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${isSelected ? 'bg-white/10' : 'bg-white/5'}`}>
                          <opt.icon className={`w-4 h-4 ${opt.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-text-primary">
                              {opt.title}
                            </span>
                            {isSelected && (
                              <Check className="w-3.5 h-3.5 text-gold flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-text-muted mt-0.5 leading-relaxed">
                            {opt.description}
                          </p>

                          {/* Preview section */}
                          {isSelected && duplicates.length > 0 && (
                            opt.id === 'merge'
                              ? <MergePreview duplicates={duplicates} />
                              : <SeparatePreview duplicates={duplicates} />
                          )}
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-gold/10">
                <Button variant="ghost" size="sm" onClick={handleSkip}>
                  Skip
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button variant="gold" size="sm" onClick={handleConfirm}>
                    Confirm
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
