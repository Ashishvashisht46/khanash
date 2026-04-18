import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Loader2, Upload } from 'lucide-react';

/* ─────────────────────────────────────────────────────────────────────────────
   AIExtractButton
   Gold gradient button that triggers a hidden file input.
   On file selection it calls the AI extraction endpoint and returns structured
   deposit data to the parent via the onExtracted callback.

   Props:
     onExtracted(data)  — called with extracted field values
     onError(msg)       — called on failure
     className          — extra class overrides
───────────────────────────────────────────────────────────────────────────── */

export default function AIExtractButton({ onExtracted, onError, className = '' }) {
  const fileInputRef = useRef(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState('');

  const handleClick = () => {
    if (processing) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset so the same file can be re-selected
    e.target.value = '';

    setProcessing(true);
    setProgress('Reading document…');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'deposit');

      setProgress('AI is analyzing your document…');

      // Dynamic import keeps api available without circular deps
      const { default: api } = await import('../../lib/api');

      const { data } = await api.post('/ai/extract', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60_000,
      });

      setProgress('Filling in fields…');
      await new Promise((r) => setTimeout(r, 400)); // brief visual pause

      onExtracted?.(data?.extracted ?? data);
    } catch (err) {
      const msg =
        err?.response?.data?.message ??
        err.message ??
        'AI extraction failed. Please try again.';
      onError?.(msg);
    } finally {
      setProcessing(false);
      setProgress('');
    }
  };

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <motion.button
        onClick={handleClick}
        disabled={processing}
        whileHover={!processing ? { y: -2, boxShadow: '0 8px 32px rgba(212,175,55,0.5)' } : {}}
        whileTap={!processing ? { scale: 0.97 } : {}}
        transition={{ type: 'spring', stiffness: 350, damping: 22 }}
        className="relative w-full flex items-center gap-3 px-5 py-3.5 rounded-xl font-semibold text-navy text-sm focus:outline-none focus:ring-2 focus:ring-gold/50 focus:ring-offset-2 focus:ring-offset-navy disabled:opacity-60 disabled:cursor-not-allowed overflow-hidden"
        style={{
          background: processing
            ? 'linear-gradient(135deg, #8A7009 0%, #A89020 100%)'
            : 'linear-gradient(135deg, #B8960C 0%, #D4AF37 55%, #F0D060 100%)',
          boxShadow: '0 4px 20px rgba(212,175,55,0.3)',
        }}
      >
        {/* Shimmer sweep when idle */}
        {!processing && (
          <motion.span
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.18) 50%, transparent 60%)',
            }}
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'linear', repeatDelay: 1.5 }}
          />
        )}

        {/* Icon */}
        <span className="relative flex-shrink-0 w-8 h-8 rounded-lg bg-navy/20 flex items-center justify-center">
          {processing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" strokeWidth={2.5} />
          )}
        </span>

        {/* Text */}
        <span className="relative text-left leading-snug">
          {processing ? (
            <>
              <span className="block text-sm font-bold">AI is reading your document…</span>
              <span className="block text-[11px] text-navy/70 font-normal mt-0.5">{progress}</span>
            </>
          ) : (
            <>
              <span className="block text-sm font-bold">AI Auto-Fill from Document</span>
              <span className="block text-[11px] text-navy/70 font-normal mt-0.5">
                Upload a PDF/image and AI fills all fields instantly
              </span>
            </>
          )}
        </span>

        {/* Upload icon on right */}
        {!processing && (
          <Upload className="relative w-4 h-4 ml-auto flex-shrink-0 opacity-60" />
        )}
      </motion.button>

      {/* Processing progress bar */}
      {processing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="h-1 rounded-full bg-navy-mid overflow-hidden"
        >
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, #B8960C, #F0D060)' }}
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 1.3, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.png,.jpg,.jpeg,.webp,.tiff,.bmp"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
