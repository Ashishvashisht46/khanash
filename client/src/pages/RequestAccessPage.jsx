import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Send, CheckCircle } from 'lucide-react';
import { useRequestAccess } from '../hooks/useAuth.js';
import { Button } from '../components/ui/index.js';
import AppBrand from '../components/layout/AppBrand.jsx';
import { ROLE_OPTIONS } from '../lib/constants.js';

const cardVariants = {
  hidden: { opacity: 0, y: 32 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 260, damping: 22, delay: 0.08 },
  },
};

export default function RequestAccessPage() {
  const navigate = useNavigate();
  const { mutate: requestAccess, isPending, isSuccess } = useRequestAccess();

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    practice: '',
    role: '',
    message: '',
  });

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    requestAccess(form);
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-sm"
        >
          <div className="w-16 h-16 rounded-full bg-emerald-400/10 border border-emerald-400/20 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-emerald-400" />
          </div>
          <h2 className="font-brand text-xl font-semibold text-text-primary mb-2">
            Request Submitted
          </h2>
          <p className="text-text-muted text-sm mb-6">
            Your access request has been sent to the admin. You'll receive an email once it's approved.
          </p>
          <Button variant="outline" size="md" icon={ArrowLeft} onClick={() => navigate('/login')}>
            Back to Login
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg p-6">
      {/* Glow */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '-10%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '600px',
          height: '400px',
          background: 'radial-gradient(ellipse at center, rgba(201,168,76,0.07) 0%, transparent 70%)',
        }}
        aria-hidden="true"
      />

      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-lg relative z-10"
      >
        <div
          className="rounded-2xl border border-gold/20 shadow-2xl overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(13,22,35,0.97) 0%, rgba(18,32,50,0.95) 100%)',
            backdropFilter: 'blur(20px)',
          }}
        >
          {/* Header */}
          <div className="px-8 pt-8 pb-5 border-b border-gold/10">
            <div className="mb-4">
              <AppBrand />
            </div>
            <h1 className="font-display text-xl font-semibold text-text-primary">Request Portal Access</h1>
            <p className="text-xs text-text-muted mt-1">
              Fill out this form and an admin will review your request within 1 business day.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-8 py-6 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="input-label">First Name *</label>
                <input
                  type="text"
                  value={form.firstName}
                  onChange={(e) => set('firstName', e.target.value)}
                  placeholder="Jane"
                  className="input text-sm"
                  required
                />
              </div>
              <div>
                <label className="input-label">Last Name *</label>
                <input
                  type="text"
                  value={form.lastName}
                  onChange={(e) => set('lastName', e.target.value)}
                  placeholder="Smith"
                  className="input text-sm"
                  required
                />
              </div>
            </div>
            <div>
              <label className="input-label">Work Email *</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                placeholder="jane@yourpractice.com"
                className="input text-sm"
                required
              />
            </div>
            <div>
              <label className="input-label">Practice / Organization</label>
              <input
                type="text"
                value={form.practice}
                onChange={(e) => set('practice', e.target.value)}
                placeholder="Downtown Dental Group"
                className="input text-sm"
              />
            </div>
            <div>
              <label className="input-label">Requested Role</label>
              <select
                value={form.role}
                onChange={(e) => set('role', e.target.value)}
                className="input text-sm"
              >
                <option value="">Select your role…</option>
                {ROLE_OPTIONS.filter((r) => !['super_admin', 'pending'].includes(r.value)).map((r) => (
                  <option key={r.value} value={r.value}>{r.label} — {r.description}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="input-label">Message (optional)</label>
              <textarea
                value={form.message}
                onChange={(e) => set('message', e.target.value)}
                placeholder="Briefly describe your role and why you need access…"
                rows={3}
                className="input text-sm resize-none"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button
                type="button"
                variant="ghost"
                size="md"
                icon={ArrowLeft}
                onClick={() => navigate('/login')}
              >
                Back
              </Button>
              <Button
                type="submit"
                variant="gold"
                size="md"
                icon={Send}
                loading={isPending}
                className="flex-1"
              >
                {isPending ? 'Submitting…' : 'Submit Request'}
              </Button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
