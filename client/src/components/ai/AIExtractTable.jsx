import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trash2,
  ChevronDown,
  ChevronUp,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Save,
  X,
} from 'lucide-react';
import { Button, Badge } from '../ui';

/* ─────────────────────────────────────────────────────────────────────────────
   AIExtractTable
   Displays extracted multi-patient data in an editable table.
   Each cell is an inline-editable input. Rows can be deleted or expanded.
   Stagger animation for row entrance.

   Props:
     rows            — array of extracted patient objects
     onRowsChange    — callback(updatedRows) when rows change
     onSaveAll       — callback(rows) to persist all rows
     onDiscard       — callback() to clear everything
     extracting      — boolean — shows progress bar
     progress        — 0-100 progress percentage
───────────────────────────────────────────────────────────────────────────── */

const COLUMNS = [
  { key: 'source', label: 'Source', width: 90 },
  { key: 'patientName', label: 'Patient Name', width: 140 },
  { key: 'dateOfService', label: 'DOS', width: 100 },
  { key: 'billed', label: 'Billed', width: 90 },
  { key: 'insPaid', label: 'Ins Paid', width: 90 },
  { key: 'patientPortion', label: 'Pt Portion', width: 95 },
  { key: 'insurance', label: 'Insurance', width: 120 },
  { key: 'provider', label: 'Provider', width: 110 },
  { key: 'cdtCodes', label: 'CDT Codes', width: 110 },
];

function EditableCell({ value, onChange, type = 'text', placeholder = '' }) {
  return (
    <input
      type={type}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-transparent text-text-primary text-xs px-1.5 py-1 rounded focus:outline-none focus:bg-white/5 focus:ring-1 focus:ring-gold/40 transition-all placeholder:text-text-muted/40 min-w-0"
    />
  );
}

function ExpandedRow({ row, onUpdate }) {
  return (
    <motion.tr
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
    >
      <td colSpan={COLUMNS.length + 2} className="px-6 py-4 bg-navy/40 border-b border-gold/10">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { key: 'remarks', label: 'Remarks' },
            { key: 'location', label: 'Location' },
            { key: 'office', label: 'Office' },
            { key: 'refId', label: 'Ref ID' },
          ].map(({ key, label }) => (
            <div key={key} className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold text-gold/70 uppercase tracking-widest">
                {label}
              </label>
              <input
                type="text"
                value={row[key] ?? ''}
                onChange={(e) => onUpdate(key, e.target.value)}
                className="bg-navy-mid border border-gold/15 rounded-lg px-3 py-1.5 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-gold/40"
              />
            </div>
          ))}
        </div>
      </td>
    </motion.tr>
  );
}

export default function AIExtractTable({
  rows = [],
  onRowsChange,
  onSaveAll,
  onDiscard,
  extracting = false,
  progress = 0,
}) {
  const [expandedRows, setExpandedRows] = useState(new Set());

  const updateCell = useCallback(
    (rowIndex, key, value) => {
      const updated = rows.map((r, i) => (i === rowIndex ? { ...r, [key]: value } : r));
      onRowsChange?.(updated);
    },
    [rows, onRowsChange]
  );

  const deleteRow = useCallback(
    (rowIndex) => {
      const updated = rows.filter((_, i) => i !== rowIndex);
      onRowsChange?.(updated);
      setExpandedRows((prev) => {
        const next = new Set(prev);
        next.delete(rowIndex);
        return next;
      });
    },
    [rows, onRowsChange]
  );

  const toggleExpand = (index) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const rowVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: (i) => ({
      opacity: 1,
      x: 0,
      transition: { delay: i * 0.06, duration: 0.25, ease: 'easeOut' },
    }),
    exit: { opacity: 0, x: 20, transition: { duration: 0.15 } },
  };

  return (
    <div className="flex flex-col gap-4">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/25 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4 text-gold" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-text-primary">
              Extracted Patients
            </h3>
            <p className="text-xs text-text-muted">Review &amp; edit before saving</p>
          </div>
        </div>
        <Badge variant="outline" className="text-gold border-gold/30 bg-gold/5 text-xs px-3 py-1 rounded-full">
          {rows.length} {rows.length === 1 ? 'record' : 'records'}
        </Badge>
      </div>

      {/* ── Progress bar ────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {extracting && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-col gap-1.5"
          >
            <div className="flex items-center justify-between text-xs">
              <span className="text-text-muted flex items-center gap-1.5">
                <motion.span
                  className="inline-block w-2 h-2 rounded-full bg-gold"
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
                Extracting patients…
              </span>
              <span className="text-gold font-semibold">{progress}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-navy-mid overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: 'linear-gradient(90deg, #B8960C, #F0D060)' }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Table ───────────────────────────────────────────────────────────── */}
      {rows.length > 0 ? (
        <div className="rounded-xl border border-gold/15 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gradient-to-r from-gold/10 to-transparent border-b border-gold/15">
                  <th className="text-left text-[10px] font-semibold text-gold/80 uppercase tracking-widest px-3 py-2.5 w-8">#</th>
                  {COLUMNS.map((col) => (
                    <th
                      key={col.key}
                      className="text-left text-[10px] font-semibold text-gold/80 uppercase tracking-widest px-3 py-2.5 whitespace-nowrap"
                      style={{ minWidth: col.width }}
                    >
                      {col.label}
                    </th>
                  ))}
                  <th className="text-left text-[10px] font-semibold text-gold/80 uppercase tracking-widest px-3 py-2.5">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence initial={false}>
                  {rows.map((row, index) => (
                    <React.Fragment key={row._id ?? index}>
                      <motion.tr
                        custom={index}
                        variants={rowVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        layout
                        className="border-b border-gold/8 hover:bg-white/[0.025] transition-colors group"
                      >
                        {/* Row number */}
                        <td className="px-3 py-2 text-xs text-text-muted font-mono">
                          {index + 1}
                        </td>

                        {/* Editable cells */}
                        {COLUMNS.map((col) => (
                          <td key={col.key} className="px-2 py-1.5">
                            <EditableCell
                              value={row[col.key]}
                              onChange={(val) => updateCell(index, col.key, val)}
                              placeholder={col.label}
                            />
                          </td>
                        ))}

                        {/* Actions */}
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-1">
                            {/* PDF preview */}
                            {row.fileUrl && (
                              <a
                                href={row.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 rounded-lg text-text-muted hover:text-gold hover:bg-gold/10 transition-colors"
                                title="Preview PDF"
                              >
                                <FileText className="w-3.5 h-3.5" />
                              </a>
                            )}

                            {/* Expand */}
                            <button
                              onClick={() => toggleExpand(index)}
                              className="p-1.5 rounded-lg text-text-muted hover:text-gold hover:bg-gold/10 transition-colors"
                              title="Expand row"
                            >
                              {expandedRows.has(index) ? (
                                <ChevronUp className="w-3.5 h-3.5" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5" />
                              )}
                            </button>

                            {/* Delete */}
                            <button
                              onClick={() => deleteRow(index)}
                              className="p-1.5 rounded-lg text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
                              title="Delete row"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>

                      {/* Expanded detail row */}
                      <AnimatePresence>
                        {expandedRows.has(index) && (
                          <ExpandedRow
                            key={`exp-${index}`}
                            row={row}
                            onUpdate={(key, val) => updateCell(index, key, val)}
                          />
                        )}
                      </AnimatePresence>
                    </React.Fragment>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 gap-3 border border-dashed border-gold/20 rounded-xl">
          <AlertTriangle className="w-8 h-8 text-gold/30" />
          <p className="text-sm text-text-muted">No extracted records yet</p>
        </div>
      )}

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      {rows.length > 0 && (
        <div className="flex items-center justify-between pt-2">
          <Button
            variant="ghost"
            size="sm"
            icon={X}
            onClick={onDiscard}
            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
          >
            Discard All
          </Button>
          <Button
            variant="gold"
            size="md"
            icon={Save}
            onClick={() => onSaveAll?.(rows)}
          >
            Save All Deposits
          </Button>
        </div>
      )}
    </div>
  );
}
