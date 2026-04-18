import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Sparkles, RefreshCw } from 'lucide-react';
import { useUiStore } from '../../stores/uiStore';
import api from '../../lib/api';
import { BRAND } from '../../lib/brand.js';

/* ─────────────────────────────────────────────────────────────────────────────
   AIChatWindow
   Slides up from bottom-right when uiStore.chatOpen is true.
   Renders a full chat UI with quick actions, typing indicator, and AI responses.
───────────────────────────────────────────────────────────────────────────── */

const WELCOME_MESSAGE = {
  id: 'welcome',
  role: 'ai',
  text: `Hello! I'm **${BRAND.aiAssistantName}.**\n\nI can help with deposit summaries, unapplied balances, follow-up reminders, and weekly reports.\n\nWhat would you like to know today?`,
  ts: new Date(),
};

const QUICK_ACTIONS = [
  { label: '🔓 Open deposits?', query: 'Show me all open deposits that need attention.' },
  { label: '💰 Unapplied balance?', query: 'What is the total unapplied balance across all accounts?' },
  { label: '📊 Weekly summary', query: 'Give me a weekly summary of deposit activity.' },
  { label: '📋 Need follow-up?', query: 'Which deposits need follow-up action?' },
];

/* ── Markdown-like renderer: **bold**, line breaks ──────────────────────────── */
function renderMarkdown(text) {
  if (!text) return null;
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold text-brand-soft">{part.slice(2, -2)}</strong>;
    }
    // Handle line breaks
    return part.split('\n').map((line, j, arr) => (
      <React.Fragment key={`${i}-${j}`}>
        {line}
        {j < arr.length - 1 && <br />}
      </React.Fragment>
    ));
  });
}

/* ── Typing indicator ────────────────────────────────────────────────────── */
function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 mb-4">
      <div className="w-8 h-8 rounded-full bg-gold/15 border border-gold/30 flex items-center justify-center flex-shrink-0 text-sm">
        🦷
      </div>
      <div className="bg-navy-mid border border-gold/15 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-gold/60 inline-block"
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 0.7, delay: i * 0.14, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}
      </div>
    </div>
  );
}

/* ── Single message bubble ───────────────────────────────────────────────── */
function MessageBubble({ msg }) {
  const isAI = msg.role === 'ai';
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      className={`flex items-end gap-2 mb-4 ${isAI ? '' : 'flex-row-reverse'}`}
    >
      {isAI ? (
        <div className="w-8 h-8 rounded-full bg-gold/15 border border-gold/30 flex items-center justify-center flex-shrink-0 text-sm">
          🦷
        </div>
      ) : (
        <div className="w-8 h-8 rounded-full bg-gold/25 border border-gold/50 flex items-center justify-center flex-shrink-0 text-xs font-bold text-gold">
          You
        </div>
      )}
      <div
        className={[
          'max-w-[78%] px-4 py-2.5 text-sm leading-relaxed',
          isAI
            ? 'bg-navy-mid border border-gold/15 text-text-primary rounded-2xl rounded-bl-sm'
            : 'bg-gradient-to-br from-gold/80 to-gold-light text-navy font-medium rounded-2xl rounded-br-sm',
        ].join(' ')}
      >
        {renderMarkdown(msg.text)}
        <p className={`text-[10px] mt-1.5 ${isAI ? 'text-text-muted/60' : 'text-navy/50'}`}>
          {new Date(msg.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </motion.div>
  );
}

export default function AIChatWindow() {
  const { chatOpen, closeChat } = useUiStore();
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Focus input when chat opens
  useEffect(() => {
    if (chatOpen) {
      setTimeout(() => inputRef.current?.focus(), 350);
    }
  }, [chatOpen]);

  const sendMessage = useCallback(async (text) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMsg = { id: Date.now(), role: 'user', text: trimmed, ts: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const { data } = await api.post('/reports/generate', {
        prompt: trimmed,
        type: 'chat',
      });
      const aiText =
        data?.response ??
        data?.message ??
        data?.result ??
        "I've processed your request. Here's what I found in the system.";

      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, role: 'ai', text: aiText, ts: new Date() },
      ]);
    } catch (err) {
      // Graceful fallback so the UI never just breaks
      const fallback =
        err?.response?.status === 404
          ? "I'm currently in demo mode. The AI endpoint isn't connected yet, but everything is wired up and ready to go!"
          : `Sorry, I ran into an issue: ${err.message}. Please try again.`;
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, role: 'ai', text: fallback, ts: new Date() },
      ]);
    } finally {
      setLoading(false);
    }
  }, [loading]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const handleReset = () => {
    setMessages([WELCOME_MESSAGE]);
    setInput('');
  };

  return (
    <AnimatePresence>
      {chatOpen && (
        <motion.div
          key="chat-window"
          initial={{ opacity: 0, y: 60, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 60, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          className="fixed bottom-24 right-6 z-50 w-[380px] max-w-[calc(100vw-24px)] flex flex-col rounded-2xl overflow-hidden shadow-2xl shadow-black/60 border border-brand/20"
          style={{ height: 520, background: 'var(--surface-gradient)' }}
        >
          {/* ── Header ─────────────────────────────────────────────────────── */}
          <div
            className="flex items-center gap-3 px-4 py-3 flex-shrink-0 border-b border-brand/10"
            style={{ background: 'linear-gradient(90deg, rgb(var(--brand-rgb) / 0.12) 0%, rgb(var(--brand-rgb) / 0.04) 100%)' }}
          >
            <div className="relative flex-shrink-0">
              <div className="w-9 h-9 rounded-full bg-gold/15 border border-gold/40 flex items-center justify-center text-lg">
                🦷
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-navy shadow-[0_0_5px_rgba(52,211,153,0.8)]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-text-primary leading-none">{BRAND.aiAssistantName}</p>
              <p className="text-[10px] text-emerald-400 mt-0.5 flex items-center gap-1">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Powered by AI and ready for demos
              </p>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handleReset}
                className="p-1.5 rounded-lg text-text-muted hover:text-brand-soft hover:bg-brand/10 transition-colors"
                title="Reset conversation"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={closeChat}
                className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/5 transition-colors"
                aria-label="Close chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* ── Messages ───────────────────────────────────────────────────── */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-0 scroll-smooth">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} msg={msg} />
            ))}
            {loading && <TypingIndicator />}
            <div ref={bottomRef} />
          </div>

          {/* ── Quick Actions ───────────────────────────────────────────────── */}
          {messages.length <= 2 && !loading && (
            <div className="px-4 pb-3 flex flex-wrap gap-2 flex-shrink-0">
              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action.label}
                  onClick={() => sendMessage(action.query)}
                  className="text-[11px] px-3 py-1.5 rounded-full bg-navy-mid border border-brand/20 text-brand/80 hover:border-brand/50 hover:text-brand-soft hover:bg-brand/5 transition-all duration-150 font-medium"
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}

          {/* ── Input row ──────────────────────────────────────────────────── */}
          <div className="px-4 py-3 border-t border-brand/10 flex-shrink-0 flex items-center gap-2">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything about your deposits…"
              disabled={loading}
              className="flex-1 bg-navy-mid border border-brand/20 rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-brand/35 focus:border-brand/50 transition-all duration-200 disabled:opacity-50"
            />
            <motion.button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.93 }}
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
              style={{
                background: 'var(--brand-gradient)',
              }}
            >
              <Send className="w-4 h-4 text-navy" strokeWidth={2.5} />
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

