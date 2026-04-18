import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Check,
  Hash,
  Calendar,
  DollarSign,
  CreditCard,
  FileText,
  Building2,
  MessageSquare,
  MapPin,
} from 'lucide-react';
import { Button, Input, Select, Textarea, Dropzone } from '../ui';

/* ─────────────────────────────────────────────────────────────────────────────
   NewDepositModal
   2-step wizard modal for quickly creating a new deposit.
   Step 1: Enter deposit details
   Step 2: Upload supporting documents (with step-1 summary)

   Props:
     isOpen            — boolean
     onClose           — callback()
     onSubmit(data)    — called with { ...formData, files }
     locations         — [{ value, label }]
     loading           — boolean
───────────────────────────────────────────────────────────────────────────── */

const STEPS = [
  { id: 1, label: 'Enter Details' },
  { id: 2, label: 'Upload Documents' },
];

const EMPTY_FORM = {
  location: '',
  refId: '',
  date: '',
  totalDeposit: '',
  creditCards: '',
  efts: '',
  checks: '',
  remarks: '',
};

const slideVariants = {
  enterRight: { opacity: 0, x: 60 },
  enterLeft:  { opacity: 0, x: -60 },
  center:     { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 300, damping: 28 } },
  exitLeft:   { opacity: 0, x: -60, transition: { duration: 0.18 } },
  exitRight:  { opacity: 0, x: 60,  transition: { duration: 0.18 } },
};

function StepIndicator({ currentStep }) {
  return (
    <div className="flex items-center gap-0">
      {STEPS.map((step, i) => {
        const done = step.id < currentStep;
        const active = step.id === currentStep;
        return (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center gap-1">
              <div
                className={[
                  'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300',
                  done
                    ? 'bg-gold text-navy'
                    : active
                    ? 'bg-gold/20 border-2 border-gold text-gold'
                    : 'bg-white/5 border border-white/10 text-text-muted',
                ].join(' ')}
              >
                {done ? <Check className="w-3.5 h-3.5" /> : step.id}
              </div>
              <span
                className={`text-[10px] font-medium whitespace-nowrap ${
                  active ? 'text-gold' : done ? 'text-gold/60' : 'text-text-muted'
                }`}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`h-0.5 w-14 mb-5 mx-1 rounded transition-all duration-300 ${
                  done ? 'bg-gold/70' : 'bg-white/10'
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function Step1Summary({ form }) {
  const items = [
    { icon: MapPin, label: 'Location', val: form.location },
    { icon: Hash, label: 'Ref ID', val: form.refId },
    { icon: Calendar, label: 'Date', val: form.date },
    { icon: DollarSign, label: 'Total', val: form.totalDeposit ? `$${parseFloat(form.totalDeposit).toFixed(2)}` : '' },
    { icon: CreditCard, label: 'Cards', val: form.creditCards ? `$${parseFloat(form.creditCards).toFixed(2)}` : '' },
    { icon: Building2, label: 'EFTs', val: form.efts ? `$${parseFloat(form.efts).toFixed(2)}` : '' },
    { icon: FileText, label: 'Checks', val: form.checks ? `$${parseFloat(form.checks).toFixed(2)}` : '' },
  ].filter((i) => i.val);

  return (
    <div className="rounded-xl bg-gold/5 border border-gold/15 p-4">
      <p className="text-[10px] font-bold text-gold/70 uppercase tracking-widest mb-3">
        Deposit Summary
      </p>
      <div className="grid grid-cols-2 gap-x-6 gap-y-2">
        {items.map(({ icon: Icon, label, val }) => (
          <div key={label} className="flex items-center gap-2">
            <Icon className="w-3.5 h-3.5 text-gold/50 flex-shrink-0" />
            <span className="text-[11px] text-text-muted">{label}:</span>
            <span className="text-[11px] text-text-primary font-medium truncate">{val}</span>
          </div>
        ))}
      </div>
      {form.remarks && (
        <div className="mt-3 pt-3 border-t border-gold/10 flex items-start gap-2">
          <MessageSquare className="w-3.5 h-3.5 text-gold/50 flex-shrink-0 mt-0.5" />
          <p className="text-[11px] text-text-muted leading-relaxed">{form.remarks}</p>
        </div>
      )}
    </div>
  );
}

export default function NewDepositModal({
  isOpen,
  onClose,
  onSubmit,
  locations = [],
  loading = false,
}) {
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = backward
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [files, setFiles] = useState([]);

  const setField = (key) => (e) => {
    const val = e?.target ? e.target.value : e;
    setForm((prev) => ({ ...prev, [key]: val }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const validateStep1 = () => {
    const errs = {};
    if (!form.location.trim()) errs.location = 'Required';
    if (!form.refId.trim()) errs.refId = 'Required';
    if (!form.date) errs.date = 'Required';
    if (!form.totalDeposit) errs.totalDeposit = 'Required';
    return errs;
  };

  const goNext = () => {
    if (step === 1) {
      const errs = validateStep1();
      if (Object.keys(errs).length) {
        setErrors(errs);
        return;
      }
    }
    setDirection(1);
    setStep((s) => s + 1);
  };

  const goBack = () => {
    setDirection(-1);
    setStep((s) => s - 1);
  };

  const handleSubmit = () => {
    onSubmit?.({ ...form, files });
  };

  const handleClose = () => {
    setStep(1);
    setDirection(1);
    setForm(EMPTY_FORM);
    setErrors({});
    setFiles([]);
    onClose?.();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="ndm-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-navy/80 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              key="ndm-content"
              initial={{ opacity: 0, y: 28, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 320, damping: 26, delay: 0.04 } }}
              exit={{ opacity: 0, y: 20, scale: 0.97, transition: { duration: 0.16 } }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg rounded-2xl bg-gradient-to-br from-navy-light to-navy-mid border border-gold/20 shadow-2xl shadow-black/60 overflow-hidden flex flex-col"
              style={{ maxHeight: 'calc(100vh - 48px)' }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gold/10 flex-shrink-0">
                <div>
                  <h2 className="text-base font-semibold text-text-primary">New Deposit</h2>
                  <p className="text-xs text-text-muted mt-0.5">Quick-add a deposit in 2 steps</p>
                </div>
                <button
                  onClick={handleClose}
                  className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/5 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Step Indicator */}
              <div className="flex justify-center px-6 py-5 border-b border-gold/10 flex-shrink-0">
                <StepIndicator currentStep={step} />
              </div>

              {/* Step Content */}
              <div className="flex-1 overflow-y-auto px-6 py-5">
                <AnimatePresence mode="wait" initial={false} custom={direction}>
                  {step === 1 && (
                    <motion.div
                      key="step1"
                      custom={direction}
                      variants={slideVariants}
                      initial={direction > 0 ? 'enterRight' : 'enterLeft'}
                      animate="center"
                      exit={direction > 0 ? 'exitLeft' : 'exitRight'}
                    >
                      <div className="grid grid-cols-2 gap-4">
                        {/* Location */}
                        <div className="col-span-full flex flex-col gap-1.5">
                          <label className="text-[10px] font-semibold text-gold/80 uppercase tracking-widest">
                            Location *
                          </label>
                          {locations.length > 0 ? (
                            <Select
                              value={form.location}
                              onChange={(val) => {
                                setForm((p) => ({ ...p, location: val }));
                                if (errors.location) setErrors((p) => ({ ...p, location: '' }));
                              }}
                              options={[{ value: '', label: 'Select location…' }, ...locations]}
                              error={errors.location}
                            />
                          ) : (
                            <Input
                              icon={MapPin}
                              value={form.location}
                              onChange={setField('location')}
                              placeholder="e.g. Main Street Office"
                              error={errors.location}
                            />
                          )}
                        </div>

                        <Input
                          label="Reference ID *"
                          icon={Hash}
                          value={form.refId}
                          onChange={setField('refId')}
                          placeholder="DEP-2024-001"
                          error={errors.refId}
                        />
                        <Input
                          label="Deposit Date *"
                          icon={Calendar}
                          type="date"
                          value={form.date}
                          onChange={setField('date')}
                          error={errors.date}
                        />
                        <Input
                          label="Total Deposit *"
                          icon={DollarSign}
                          type="number"
                          step="0.01"
                          min="0"
                          value={form.totalDeposit}
                          onChange={setField('totalDeposit')}
                          placeholder="0.00"
                          error={errors.totalDeposit}
                        />
                        <Input
                          label="Credit Cards"
                          icon={CreditCard}
                          type="number"
                          step="0.01"
                          min="0"
                          value={form.creditCards}
                          onChange={setField('creditCards')}
                          placeholder="0.00"
                        />
                        <Input
                          label="EFTs"
                          icon={Building2}
                          type="number"
                          step="0.01"
                          min="0"
                          value={form.efts}
                          onChange={setField('efts')}
                          placeholder="0.00"
                        />
                        <Input
                          label="Checks"
                          icon={FileText}
                          type="number"
                          step="0.01"
                          min="0"
                          value={form.checks}
                          onChange={setField('checks')}
                          placeholder="0.00"
                        />

                        <div className="col-span-full flex flex-col gap-1.5">
                          <label className="text-[10px] font-semibold text-gold/80 uppercase tracking-widest flex items-center gap-1.5">
                            <MessageSquare className="w-3 h-3" />
                            Remarks
                          </label>
                          <Textarea
                            value={form.remarks}
                            onChange={setField('remarks')}
                            placeholder="Optional notes…"
                            rows={2}
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {step === 2 && (
                    <motion.div
                      key="step2"
                      custom={direction}
                      variants={slideVariants}
                      initial={direction > 0 ? 'enterRight' : 'enterLeft'}
                      animate="center"
                      exit={direction > 0 ? 'exitLeft' : 'exitRight'}
                      className="flex flex-col gap-5"
                    >
                      <Step1Summary form={form} />
                      <div>
                        <p className="text-[10px] font-bold text-gold/70 uppercase tracking-widest mb-3">
                          Supporting Documents
                        </p>
                        <Dropzone
                          onFiles={setFiles}
                          accept=".pdf,.png,.jpg,.jpeg,.webp"
                          maxSizeMB={20}
                          multiple
                        />
                        <p className="text-[11px] text-text-muted mt-2">
                          Attach EOBs, remittance advice, or any supporting files. (Optional)
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-gold/10 flex-shrink-0">
                <Button variant="ghost" size="sm" onClick={handleClose}>
                  Cancel
                </Button>
                <div className="flex items-center gap-2">
                  {step > 1 && (
                    <Button variant="outline" size="sm" icon={ChevronLeft} onClick={goBack}>
                      Back
                    </Button>
                  )}
                  {step < STEPS.length ? (
                    <Button variant="primary" size="sm" onClick={goNext}>
                      Next
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  ) : (
                    <Button
                      variant="gold"
                      size="sm"
                      loading={loading}
                      disabled={loading}
                      onClick={handleSubmit}
                    >
                      Submit Deposit
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
