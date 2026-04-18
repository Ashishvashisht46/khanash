import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { useUiStore } from '../../stores/uiStore';
import { BRAND } from '../../lib/brand.js';

/* ─────────────────────────────────────────────────────────────────────────────
   AIChatBubble
   Floating action button fixed at bottom-right. Pulses with a gold glow.
   Clicking toggles the AI chat window via uiStore.chatOpen.
───────────────────────────────────────────────────────────────────────────── */

export default function AIChatBubble() {
  const { chatOpen, toggleChat } = useUiStore();

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      {/* Tooltip label — only when chat is closed */}
      {!chatOpen && (
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 10 }}
          transition={{ delay: 0.6, duration: 0.25 }}
          className="rounded-lg border border-brand/20 bg-navy-mid px-3 py-1.5 text-xs font-medium text-text-primary shadow-lg whitespace-nowrap pointer-events-none select-none"
        >
          Ask {BRAND.shortName} AI
        </motion.div>
      )}

      {/* Main button */}
      <div className="relative">
        {/* Pulsing ring */}
        <motion.span
          animate={{ scale: [1, 1.55, 1], opacity: [0.45, 0, 0.45] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute inset-0 rounded-full bg-brand/30 pointer-events-none"
        />

        {/* Online dot */}
        <span className="absolute top-0.5 right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-navy z-10 shadow-[0_0_6px_rgba(52,211,153,0.7)]" />

        {/* Button */}
        <motion.button
          onClick={toggleChat}
          whileHover={{ y: -4, scale: 1.08 }}
          whileTap={{ scale: 0.93 }}
          transition={{ type: 'spring', stiffness: 380, damping: 22 }}
          aria-label="Toggle AI chat"
          style={{
            width: 52,
            height: 52,
            background: 'var(--brand-gradient)',
            boxShadow: chatOpen
              ? '0 0 0 3px rgb(var(--brand-rgb) / 0.4), 0 8px 32px rgb(var(--brand-rgb) / 0.35)'
              : '0 0 20px rgb(var(--brand-rgb) / 0.22), 0 4px 16px rgba(0,0,0,0.5)',
          }}
          className="relative flex items-center justify-center rounded-full transition-shadow duration-300 focus:outline-none focus:ring-2 focus:ring-brand/60 focus:ring-offset-2 focus:ring-offset-navy"
        >
          <motion.div
            animate={{ rotate: chatOpen ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <Sparkles className="w-5 h-5 text-navy" strokeWidth={2.5} />
          </motion.div>
        </motion.button>
      </div>
    </div>
  );
}

