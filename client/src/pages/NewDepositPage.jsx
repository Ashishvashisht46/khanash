import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Upload,
  Sparkles,
  X,
  FileText,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import { Button, Card, Skeleton } from '../components/ui/index.js';
import { useCreateDeposit } from '../hooks/useDeposits.js';
import { useLocations, useOffices } from '../hooks/useLocations.js';
import { useAuthStore } from '../stores/authStore.js';
import { fmt$, generateDepositId } from '../lib/utils.js';
import toast from 'react-hot-toast';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../lib/api.js';

/* ─── Animation variants ────────────────────────────────────────────────── */
const pageVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const sectionVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
};

const rowVariants = {
  hidden: { opacity: 0, x: -12 },
  visible: (i) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.06, duration: 0.25 },
  }),
  exit: { opacity: 0, x: 12, transition: { duration: 0.18 } },
};

/* ─── Default empty form ────────────────────────────────────────────────── */
function buildEmptyForm() {
  return {
    locationId: '',
    officeId: '',
    referenceId: generateDepositId(),
    depositDate: new Date().toISOString().slice(0, 10),
    depositTotal: '',
    creditCards: '',
    efts: '',
    checks: '',
    patientName: '',
    dateOfService: '',
    billedAmount: '',
    insurancePaid: '',
    patientPortion: '',
    cdtCodes: '',
    provider: '',
    insuranceCompany: '',
    remarks: '',
  };
}

function buildDemoAiPatients(sourceFiles = []) {
  return sourceFiles.map((file, index) => ({
    patientName: `Demo Patient ${index + 1}`,
    dateOfService: new Date().toISOString().slice(0, 10),
    billedAmount: 245 + index * 75,
    insurancePaid: 180 + index * 40,
    patientPortion: 65 + index * 35,
    cdtCodes: index % 2 === 0 ? 'D0150, D1110' : 'D2392, D0274',
    provider: 'Dr. Sarah Thompson',
    insuranceCompany: index % 2 === 0 ? 'Delta Dental' : 'MetLife Dental',
    _source: file?.name ?? `Demo File ${index + 1}`,
  }));
}

/* ─── Section header ─────────────────────────────────────────────────────── */
function SectionTitle({ children }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <span
        className="text-[12.5px] font-semibold tracking-widest uppercase text-gold"
        style={{ fontFamily: 'inherit' }}
      >
        {children}
      </span>
      <div className="flex-1 border-b border-gold/25" />
    </div>
  );
}

/* ─── Field wrapper ──────────────────────────────────────────────────────── */
function Field({ label, required, error, className = '', children }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label className="text-[11px] font-semibold uppercase tracking-widest text-text-muted">
          {label}
          {required && <span className="text-red-400 ml-0.5">*</span>}
        </label>
      )}
      {children}
      <AnimatePresence>
        {error && (
          <motion.span
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="text-xs text-red-400 flex items-center gap-1"
          >
            <AlertCircle className="w-3 h-3 flex-shrink-0" />
            {error}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Styled input ───────────────────────────────────────────────────────── */
function StyledInput({ hasError, ...props }) {
  return (
    <input
      {...props}
      className={[
        'w-full rounded-xl px-3.5 py-2.5 text-sm bg-navy/60 border text-text-primary placeholder:text-text-muted/50',
        'focus:outline-none focus:ring-2 focus:ring-gold/30 transition-all duration-200',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        hasError ? 'border-red-500/50' : 'border-gold/15 hover:border-gold/30',
      ]
        .filter(Boolean)
        .join(' ')}
    />
  );
}

/* ─── Styled select ──────────────────────────────────────────────────────── */
function StyledSelect({ hasError, children, ...props }) {
  return (
    <select
      {...props}
      className={[
        'w-full rounded-xl px-3.5 py-2.5 text-sm bg-navy/60 border text-text-primary appearance-none',
        'focus:outline-none focus:ring-2 focus:ring-gold/30 transition-all duration-200',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        hasError ? 'border-red-500/50' : 'border-gold/15 hover:border-gold/30',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </select>
  );
}

/* ─── Styled textarea ────────────────────────────────────────────────────── */
function StyledTextarea({ hasError, ...props }) {
  return (
    <textarea
      {...props}
      className={[
        'w-full rounded-xl px-3.5 py-2.5 text-sm bg-navy/60 border text-text-primary placeholder:text-text-muted/50 resize-none',
        'focus:outline-none focus:ring-2 focus:ring-gold/30 transition-all duration-200',
        hasError ? 'border-red-500/50' : 'border-gold/15 hover:border-gold/30',
      ]
        .filter(Boolean)
        .join(' ')}
    />
  );
}

/* ─── File chip ──────────────────────────────────────────────────────────── */
function FileChip({ file, onRemove }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="flex items-center gap-2.5 px-3 py-2 rounded-xl border border-gold/10 bg-navy/40 text-sm"
    >
      <FileText className="w-4 h-4 text-gold/60 flex-shrink-0" />
      <span className="flex-1 truncate text-text-primary text-xs">{file.name}</span>
      <span className="text-[10px] text-text-muted flex-shrink-0 tabular-nums">
        {(file.size / 1024).toFixed(0)} KB
      </span>
      <button
        type="button"
        onClick={onRemove}
        className="p-0.5 rounded text-text-muted hover:text-red-400 transition-colors flex-shrink-0"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  );
}

/* ─── AI extracted patient row ────────────────────────────────────────────── */
function AiPatientRow({ patient, index, onChange, onRemove }) {
  function update(field, value) {
    onChange(index, { ...patient, [field]: value });
  }

  return (
    <motion.tr
      custom={index}
      variants={rowVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="border-b border-gold/[0.06] hover:bg-gold/[0.03] transition-colors"
    >
      <td className="py-2 px-3 text-xs text-text-muted tabular-nums">{index + 1}</td>
      <td className="py-2 px-3 text-xs text-text-muted truncate max-w-[100px]">
        {patient._source ?? '—'}
      </td>
      <td className="py-2 px-2 min-w-[130px]">
        <input
          type="text"
          value={patient.patientName ?? ''}
          onChange={(e) => update('patientName', e.target.value)}
          className="w-full bg-transparent border-b border-gold/20 text-xs text-text-primary focus:outline-none focus:border-gold/50 py-0.5 transition-colors"
        />
      </td>
      <td className="py-2 px-2 min-w-[110px]">
        <input
          type="date"
          value={patient.dateOfService ?? ''}
          onChange={(e) => update('dateOfService', e.target.value)}
          className="w-full bg-transparent border-b border-gold/20 text-xs text-text-primary focus:outline-none focus:border-gold/50 py-0.5 transition-colors"
        />
      </td>
      <td className="py-2 px-2 min-w-[90px]">
        <input
          type="number"
          step="0.01"
          value={patient.billedAmount ?? ''}
          onChange={(e) => update('billedAmount', e.target.value)}
          className="w-full bg-transparent border-b border-gold/20 text-xs text-text-primary tabular-nums focus:outline-none focus:border-gold/50 py-0.5 transition-colors"
        />
      </td>
      <td className="py-2 px-2 min-w-[90px]">
        <input
          type="number"
          step="0.01"
          value={patient.insurancePaid ?? ''}
          onChange={(e) => update('insurancePaid', e.target.value)}
          className="w-full bg-transparent border-b border-gold/20 text-xs text-emerald-400 tabular-nums focus:outline-none focus:border-gold/50 py-0.5 transition-colors"
        />
      </td>
      <td className="py-2 px-2 min-w-[90px]">
        <input
          type="number"
          step="0.01"
          value={patient.patientPortion ?? ''}
          onChange={(e) => update('patientPortion', e.target.value)}
          className="w-full bg-transparent border-b border-gold/20 text-xs text-amber-400 tabular-nums focus:outline-none focus:border-gold/50 py-0.5 transition-colors"
        />
      </td>
      <td className="py-2 px-2 min-w-[80px]">
        <input
          type="text"
          value={patient.insuranceCompany ?? ''}
          onChange={(e) => update('insuranceCompany', e.target.value)}
          className="w-full bg-transparent border-b border-gold/20 text-xs text-text-primary focus:outline-none focus:border-gold/50 py-0.5 transition-colors"
        />
      </td>
      <td className="py-2 px-2 min-w-[80px]">
        <input
          type="text"
          value={patient.provider ?? ''}
          onChange={(e) => update('provider', e.target.value)}
          className="w-full bg-transparent border-b border-gold/20 text-xs text-text-primary focus:outline-none focus:border-gold/50 py-0.5 transition-colors"
        />
      </td>
      <td className="py-2 px-2 min-w-[110px]">
        <input
          type="text"
          value={patient.cdtCodes ?? ''}
          onChange={(e) => update('cdtCodes', e.target.value)}
          className="w-full bg-transparent border-b border-gold/20 text-xs text-text-primary font-mono focus:outline-none focus:border-gold/50 py-0.5 transition-colors"
        />
      </td>
      <td className="py-2 px-3 text-center">
        <button
          type="button"
          onClick={() => onRemove(index)}
          className="p-1 rounded hover:bg-red-500/10 text-text-muted hover:text-red-400 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </td>
    </motion.tr>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   NewDepositPage
═══════════════════════════════════════════════════════════════════════════ */
export default function NewDepositPage() {
  const navigate = useNavigate();
  const locationState = useLocation();
  const { user, token } = useAuthStore();
  const isDemoSession = String(token ?? '').startsWith('demo-jwt-');

  /* ── Edit mode ─────────────────────────────────────────────────────────── */
  const editDeposit = locationState.state?.deposit ?? null;
  const isEditMode = Boolean(editDeposit);

  /* ── Mutations / queries ────────────────────────────────────────────────── */
  const { mutate: createDeposit, isPending: isSubmitting } = useCreateDeposit();
  const { data: locData, isLoading: locsLoading } = useLocations();
  const locations = useMemo(() => locData?.locations ?? [], [locData]);

  /* ── Form state ─────────────────────────────────────────────────────────── */
  const [form, setForm] = useState(() => {
    if (editDeposit) {
      return {
        locationId: editDeposit.locationId ?? '',
        officeId: editDeposit.officeId ?? '',
        referenceId: editDeposit.referenceId ?? editDeposit.depositId ?? generateDepositId(),
        depositDate: editDeposit.depositDate
          ? editDeposit.depositDate.slice(0, 10)
          : new Date().toISOString().slice(0, 10),
        depositTotal: editDeposit.depositTotal != null ? String(editDeposit.depositTotal) : '',
        creditCards: editDeposit.creditCards != null ? String(editDeposit.creditCards) : '',
        efts: editDeposit.efts != null ? String(editDeposit.efts) : '',
        checks: editDeposit.checks != null ? String(editDeposit.checks) : '',
        patientName: editDeposit.patientName ?? '',
        dateOfService: editDeposit.dateOfService
          ? editDeposit.dateOfService.slice(0, 10)
          : '',
        billedAmount: editDeposit.billedAmount != null ? String(editDeposit.billedAmount) : '',
        insurancePaid:
          editDeposit.insurancePaid != null ? String(editDeposit.insurancePaid) : '',
        patientPortion:
          editDeposit.patientPortion != null ? String(editDeposit.patientPortion) : '',
        cdtCodes: editDeposit.cdtCodes ?? '',
        provider: editDeposit.provider ?? '',
        insuranceCompany: editDeposit.insuranceCompany ?? '',
        remarks: editDeposit.remarks ?? '',
      };
    }
    return buildEmptyForm();
  });

  const [errors, setErrors] = useState({});
  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);

  /* ── AI state ───────────────────────────────────────────────────────────── */
  const [aiLoading, setAiLoading] = useState(false);
  const [aiPatients, setAiPatients] = useState([]);
  const [showAiTable, setShowAiTable] = useState(false);

  const aiFileInputRef = useRef(null);
  const dropFileInputRef = useRef(null);

  /* ── Dynamic offices for selected location ──────────────────────────────── */
  const { data: offData, isLoading: offsLoading } = useOffices(form.locationId || null);
  const offices = useMemo(() => offData?.offices ?? [], [offData]);

  // Reset officeId when location changes (unless in edit mode and we just mounted)
  const prevLocationRef = useRef(form.locationId);
  useEffect(() => {
    if (prevLocationRef.current !== form.locationId && prevLocationRef.current !== '') {
      setForm((prev) => ({ ...prev, officeId: '' }));
    }
    prevLocationRef.current = form.locationId;
  }, [form.locationId]);

  /* ── Deposit type subtotal ──────────────────────────────────────────────── */
  const typeSubtotal = useMemo(
    () =>
      (Number(form.creditCards) || 0) +
      (Number(form.efts) || 0) +
      (Number(form.checks) || 0),
    [form.creditCards, form.efts, form.checks],
  );

  /* ── Determine status based on role ─────────────────────────────────────── */
  const role = user?.role ?? 'user';
  const depositStatus = ['admin', 'manager'].includes(role) ? 'Open' : 'Pending Review';

  /* ── handleChange ────────────────────────────────────────────────────────── */
  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }

  /* ── Validation ──────────────────────────────────────────────────────────── */
  function validate() {
    const e = {};
    if (!form.locationId) e.locationId = 'Location is required';
    if (!form.depositDate) e.depositDate = 'Deposit date is required';
    if (!form.depositTotal || isNaN(Number(form.depositTotal))) {
      e.depositTotal = 'A valid deposit total is required';
    }
    return e;
  }

  /* ── Submit ──────────────────────────────────────────────────────────────── */
  function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      toast.error('Please fix the highlighted fields before submitting.');
      return;
    }

    const payload = {
      locationId: form.locationId,
      officeId: form.officeId || undefined,
      referenceId: form.referenceId || undefined,
      depositDate: form.depositDate,
      depositTotal: Number(form.depositTotal),
      creditCards: form.creditCards ? Number(form.creditCards) : undefined,
      efts: form.efts ? Number(form.efts) : undefined,
      checks: form.checks ? Number(form.checks) : undefined,
      patientName: form.patientName || undefined,
      dateOfService: form.dateOfService || undefined,
      billedAmount: form.billedAmount ? Number(form.billedAmount) : undefined,
      insurancePaid: form.insurancePaid ? Number(form.insurancePaid) : undefined,
      patientPortion: form.patientPortion ? Number(form.patientPortion) : undefined,
      cdtCodes: form.cdtCodes || undefined,
      provider: form.provider || undefined,
      insuranceCompany: form.insuranceCompany || undefined,
      remarks: form.remarks || undefined,
      status: depositStatus,
      ...(isEditMode && editDeposit?.id ? { id: editDeposit.id } : {}),
    };

    if (isDemoSession) {
      toast.success(
        isEditMode
          ? 'Demo mode: deposit changes saved locally for preview.'
          : 'Demo mode: deposit submitted as a preview flow.'
      );
      navigate('/postings');
      return;
    }

    createDeposit(payload, {
      onSuccess: () => {
        toast.success(isEditMode ? 'Deposit updated successfully.' : 'Deposit submitted successfully.');
        navigate('/postings');
      },
      onError: (err) => {
        toast.error(err?.message ?? 'Failed to submit deposit. Please try again.');
      },
    });
  }

  /* ── Clear ───────────────────────────────────────────────────────────────── */
  function handleClear() {
    setForm(buildEmptyForm());
    setFiles([]);
    setErrors({});
    setAiPatients([]);
    setShowAiTable(false);
    toast('Form cleared.', { icon: '🗑️' });
  }

  /* ── File drop zone ──────────────────────────────────────────────────────── */
  function handleDrop(e) {
    e.preventDefault();
    setIsDragging(false);
    const dropped = Array.from(e.dataTransfer.files ?? []);
    setFiles((prev) => [...prev, ...dropped]);
  }

  function handleDropFileInput(e) {
    const picked = Array.from(e.target.files ?? []);
    setFiles((prev) => [...prev, ...picked]);
    e.target.value = '';
  }

  function removeFile(i) {
    setFiles((prev) => prev.filter((_, idx) => idx !== i));
  }

  /* ── AI Auto-Fill ────────────────────────────────────────────────────────── */
  function handleAiFileSelect(e) {
    const picked = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (picked.length === 0) return;
    runAiExtract(picked);
  }

  async function runAiExtract(sourceFiles) {
    setAiLoading(true);
    try {
      if (isDemoSession) {
        const tagged = buildDemoAiPatients(sourceFiles);
        setAiPatients(tagged);
        setShowAiTable(true);

        if (tagged.length === 1) {
          const p = tagged[0];
          setForm((prev) => ({
            ...prev,
            patientName: p.patientName ?? prev.patientName,
            dateOfService: p.dateOfService ? p.dateOfService.slice(0, 10) : prev.dateOfService,
            billedAmount: p.billedAmount != null ? String(p.billedAmount) : prev.billedAmount,
            insurancePaid:
              p.insurancePaid != null ? String(p.insurancePaid) : prev.insurancePaid,
            patientPortion:
              p.patientPortion != null ? String(p.patientPortion) : prev.patientPortion,
            cdtCodes: p.cdtCodes ?? prev.cdtCodes,
            provider: p.provider ?? prev.provider,
            insuranceCompany: p.insuranceCompany ?? prev.insuranceCompany,
            depositTotal:
              p.billedAmount != null ? String(p.billedAmount) : prev.depositTotal,
          }));
        }

        toast.success(
          `Demo mode: generated ${tagged.length} sample patient record${tagged.length !== 1 ? 's' : ''}.`
        );
        return;
      }

      const fd = new FormData();
      sourceFiles.forEach((f) => fd.append('files', f));

      const { data } = await api.post('/api/ai/extract', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const patients = Array.isArray(data?.patients)
        ? data.patients
        : Array.isArray(data)
        ? data
        : [];

      if (patients.length === 0) {
        toast('AI did not find any patient records in the uploaded document.', {
          icon: '⚠️',
        });
        setAiLoading(false);
        return;
      }

      // Tag each record with the source filename
      const tagged = patients.map((p, i) => ({
        ...p,
        _source: sourceFiles[0]?.name ?? `File ${i + 1}`,
      }));

      setAiPatients(tagged);
      setShowAiTable(true);

      // Auto-fill single-patient fields if only one record returned
      if (tagged.length === 1) {
        const p = tagged[0];
        setForm((prev) => ({
          ...prev,
          patientName: p.patientName ?? prev.patientName,
          dateOfService: p.dateOfService ? p.dateOfService.slice(0, 10) : prev.dateOfService,
          billedAmount: p.billedAmount != null ? String(p.billedAmount) : prev.billedAmount,
          insurancePaid:
            p.insurancePaid != null ? String(p.insurancePaid) : prev.insurancePaid,
          patientPortion:
            p.patientPortion != null ? String(p.patientPortion) : prev.patientPortion,
          cdtCodes: p.cdtCodes ?? prev.cdtCodes,
          provider: p.provider ?? prev.provider,
          insuranceCompany: p.insuranceCompany ?? prev.insuranceCompany,
          depositTotal:
            p.billedAmount != null ? String(p.billedAmount) : prev.depositTotal,
        }));
      }

      toast.success(`AI extracted ${tagged.length} patient record${tagged.length !== 1 ? 's' : ''}.`);
    } catch (err) {
      toast.error(err?.response?.data?.message ?? err?.message ?? 'AI extraction failed.');
    } finally {
      setAiLoading(false);
    }
  }

  /* ── AI table helpers ────────────────────────────────────────────────────── */
  function handleAiPatientChange(index, updated) {
    setAiPatients((prev) => prev.map((p, i) => (i === index ? updated : p)));
  }

  function handleRemoveAiPatient(index) {
    setAiPatients((prev) => prev.filter((_, i) => i !== index));
    if (aiPatients.length <= 1) setShowAiTable(false);
  }

  function handleSaveAllDeposits() {
    if (aiPatients.length === 0) return;
    const base = {
      locationId: form.locationId,
      officeId: form.officeId || undefined,
      depositDate: form.depositDate,
      status: depositStatus,
    };
    // Batch-create using sequential creates (server may support bulk endpoint)
    Promise.all(
      aiPatients.map((p) =>
        api.post('/deposits', {
          ...base,
          referenceId: generateDepositId(),
          patientName: p.patientName,
          dateOfService: p.dateOfService,
          billedAmount: p.billedAmount ? Number(p.billedAmount) : undefined,
          insurancePaid: p.insurancePaid ? Number(p.insurancePaid) : undefined,
          patientPortion: p.patientPortion ? Number(p.patientPortion) : undefined,
          depositTotal: p.billedAmount ? Number(p.billedAmount) : 0,
          cdtCodes: p.cdtCodes,
          provider: p.provider,
          insuranceCompany: p.insuranceCompany,
        }),
      ),
    )
      .then(() => {
        toast.success(`${aiPatients.length} deposit${aiPatients.length !== 1 ? 's' : ''} saved.`);
        navigate('/postings');
      })
      .catch((err) => {
        toast.error(err?.message ?? 'Batch save failed.');
      });
  }

  function handleDiscardAll() {
    setAiPatients([]);
    setShowAiTable(false);
  }

  /* ─────────────────────────────────────────────────────────────────────────
     Render
  ───────────────────────────────────────────────────────────────────────── */
  return (
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      className="min-h-screen bg-bg px-4 py-8 sm:px-8 lg:px-12"
    >
      {/* ── Page Header ───────────────────────────────────────────────────── */}
      <motion.div variants={sectionVariants} className="mb-8">
        <h1
          className="text-[36px] font-semibold text-text-primary leading-tight"
          style={{ fontFamily: '"Noto Serif", Georgia, serif' }}
        >
          {isEditMode
            ? `Editing Deposit ${editDeposit?.depositId ?? editDeposit?.referenceId ?? ''}`
            : 'New Deposit'}
        </h1>
        <p className="text-sm text-text-muted mt-1">
          {isEditMode
            ? 'Update the deposit details below and save your changes.'
            : 'Complete the form below to submit a new deposit posting.'}
        </p>
      </motion.div>

      <form onSubmit={handleSubmit} noValidate>
        <Card className="bg-surface border border-gold/10 rounded-2xl overflow-visible">
          <div className="p-6 sm:p-8 space-y-10">

            {/* ══ Section 1: Location & Deposit Info ══════════════════════ */}
            <motion.div variants={sectionVariants}>
              <SectionTitle>Location &amp; Deposit Info</SectionTitle>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Location */}
                <Field label="Location" required error={errors.locationId}>
                  {locsLoading ? (
                    <Skeleton className="h-10 rounded-xl" />
                  ) : (
                    <StyledSelect
                      value={form.locationId}
                      onChange={(e) => handleChange('locationId', e.target.value)}
                      hasError={Boolean(errors.locationId)}
                    >
                      <option value="">Select location…</option>
                      {locations.map((loc) => (
                        <option key={loc.id} value={loc.id}>
                          {loc.name}
                        </option>
                      ))}
                    </StyledSelect>
                  )}
                </Field>

                {/* Office */}
                <Field label="Office">
                  {offsLoading && form.locationId ? (
                    <Skeleton className="h-10 rounded-xl" />
                  ) : (
                    <StyledSelect
                      value={form.officeId}
                      onChange={(e) => handleChange('officeId', e.target.value)}
                      disabled={!form.locationId}
                    >
                      <option value="">
                        {form.locationId ? 'Select office…' : 'Select a location first'}
                      </option>
                      {offices.map((off) => (
                        <option key={off.id} value={off.id}>
                          {off.name}
                        </option>
                      ))}
                    </StyledSelect>
                  )}
                </Field>

                {/* Reference ID */}
                <Field label="Reference ID">
                  <StyledInput
                    type="text"
                    value={form.referenceId}
                    onChange={(e) => handleChange('referenceId', e.target.value)}
                    placeholder="DEP-XXXXXXXX"
                    className="font-mono"
                  />
                </Field>

                {/* Deposit Date */}
                <Field label="Deposit Date" required error={errors.depositDate}>
                  <StyledInput
                    type="date"
                    value={form.depositDate}
                    onChange={(e) => handleChange('depositDate', e.target.value)}
                    hasError={Boolean(errors.depositDate)}
                  />
                </Field>

                {/* Deposit Total */}
                <Field label="Deposit Total ($)" required error={errors.depositTotal}>
                  <StyledInput
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.depositTotal}
                    onChange={(e) => handleChange('depositTotal', e.target.value)}
                    placeholder="0.00"
                    hasError={Boolean(errors.depositTotal)}
                  />
                </Field>
              </div>
            </motion.div>

            {/* ══ Section 2: Deposit Types ════════════════════════════════ */}
            <motion.div variants={sectionVariants}>
              <SectionTitle>Deposit Types</SectionTitle>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <Field label="Credit Cards ($)">
                  <StyledInput
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.creditCards}
                    onChange={(e) => handleChange('creditCards', e.target.value)}
                    placeholder="0.00"
                  />
                </Field>
                <Field label="EFTs / ACH ($)">
                  <StyledInput
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.efts}
                    onChange={(e) => handleChange('efts', e.target.value)}
                    placeholder="0.00"
                  />
                </Field>
                <Field label="Checks ($)">
                  <StyledInput
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.checks}
                    onChange={(e) => handleChange('checks', e.target.value)}
                    placeholder="0.00"
                  />
                </Field>
              </div>
              <AnimatePresence>
                {typeSubtotal > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mt-3 flex items-center gap-2 text-xs text-text-muted"
                  >
                    <span>Types subtotal:</span>
                    <span className="text-gold font-semibold tabular-nums">
                      {fmt$(typeSubtotal)}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* ══ Section 3: Patient & Claim Info ════════════════════════ */}
            <motion.div variants={sectionVariants}>
              <SectionTitle>Patient &amp; Claim Info</SectionTitle>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Field label="Patient Name">
                  <StyledInput
                    type="text"
                    value={form.patientName}
                    onChange={(e) => handleChange('patientName', e.target.value)}
                    placeholder="Full legal name"
                  />
                </Field>
                <Field label="Date of Service">
                  <StyledInput
                    type="date"
                    value={form.dateOfService}
                    onChange={(e) => handleChange('dateOfService', e.target.value)}
                  />
                </Field>
                <Field label="Billed Amount ($)">
                  <StyledInput
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.billedAmount}
                    onChange={(e) => handleChange('billedAmount', e.target.value)}
                    placeholder="0.00"
                  />
                </Field>
                <Field label="Insurance Paid ($)">
                  <StyledInput
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.insurancePaid}
                    onChange={(e) => handleChange('insurancePaid', e.target.value)}
                    placeholder="0.00"
                  />
                </Field>
                <Field label="Patient Portion ($)">
                  <StyledInput
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.patientPortion}
                    onChange={(e) => handleChange('patientPortion', e.target.value)}
                    placeholder="0.00"
                  />
                </Field>
                <Field label="CDT Codes">
                  <StyledInput
                    type="text"
                    value={form.cdtCodes}
                    onChange={(e) => handleChange('cdtCodes', e.target.value)}
                    placeholder="e.g. D2140, D0274"
                    className="font-mono"
                  />
                </Field>
                <Field label="Provider">
                  <StyledInput
                    type="text"
                    value={form.provider}
                    onChange={(e) => handleChange('provider', e.target.value)}
                    placeholder="Dr. Smith"
                  />
                </Field>
                <Field label="Insurance Company">
                  <StyledInput
                    type="text"
                    value={form.insuranceCompany}
                    onChange={(e) => handleChange('insuranceCompany', e.target.value)}
                    placeholder="Delta Dental, MetLife, Cigna…"
                  />
                </Field>
              </div>
            </motion.div>

            {/* ══ Section 4: Remarks ═══════════════════════════════════════ */}
            <motion.div variants={sectionVariants}>
              <SectionTitle>Remarks</SectionTitle>
              <StyledTextarea
                rows={4}
                value={form.remarks}
                onChange={(e) => handleChange('remarks', e.target.value)}
                placeholder="Any additional notes, adjustments, or context for this deposit…"
              />
            </motion.div>

            {/* ══ Section 5: Upload Documents ══════════════════════════════ */}
            <motion.div variants={sectionVariants}>
              <SectionTitle>Upload Documents</SectionTitle>

              {/* AI Auto-Fill Button */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 mb-6 rounded-2xl border border-gold/20 bg-gradient-to-br from-gold/[0.07] to-gold/[0.02]">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-gold/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Sparkles className="w-4.5 h-4.5 text-gold" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-text-primary">
                      AI Auto-Fill from Document
                    </p>
                    <p className="text-xs text-text-muted mt-0.5 leading-relaxed">
                      Upload a PDF or image and AI fills all fields instantly — extracts
                      patients, amounts, CDT codes, and insurance details automatically.
                    </p>
                  </div>
                </div>

                {/* Hidden AI file input */}
                <input
                  ref={aiFileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.png,.jpg,.jpeg,.tiff,.bmp,.webp"
                  className="hidden"
                  onChange={handleAiFileSelect}
                />

                <button
                  type="button"
                  disabled={aiLoading}
                  onClick={() => aiFileInputRef.current?.click()}
                  className={[
                    'flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 flex-shrink-0 whitespace-nowrap',
                    'bg-gradient-to-r from-gold to-amber-400 text-navy shadow-lg shadow-gold/25',
                    'hover:from-amber-400 hover:to-gold hover:shadow-gold/40 active:scale-95',
                    aiLoading ? 'opacity-70 cursor-wait' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {aiLoading ? (
                    <>
                      <svg
                        className="w-4 h-4 animate-spin"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v8H4z"
                        />
                      </svg>
                      AI is reading your document…
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      AI Auto-Fill
                    </>
                  )}
                </button>
              </div>

              {/* ── AI Extracted Patients Table ─────────────────────────── */}
              <AnimatePresence>
                {showAiTable && aiPatients.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-6 overflow-hidden"
                  >
                    <div className="rounded-2xl border border-gold/15 overflow-x-auto">
                      <div className="flex items-center justify-between px-4 py-3 border-b border-gold/10 bg-gold/[0.04]">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-3.5 h-3.5 text-gold" />
                          <span className="text-xs font-semibold text-gold uppercase tracking-wider">
                            AI Extracted — {aiPatients.length} Patient
                            {aiPatients.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleSaveAllDeposits}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gold/15 text-gold hover:bg-gold/25 transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                            Save All Deposits
                          </button>
                          <button
                            type="button"
                            onClick={handleDiscardAll}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                          >
                            <X className="w-3 h-3" />
                            Discard All
                          </button>
                        </div>
                      </div>
                      <table className="min-w-full text-xs">
                        <thead>
                          <tr className="border-b border-gold/10 bg-navy/30">
                            <th className="py-2.5 px-3 text-left font-semibold text-text-muted uppercase tracking-wider whitespace-nowrap">
                              #
                            </th>
                            <th className="py-2.5 px-3 text-left font-semibold text-text-muted uppercase tracking-wider whitespace-nowrap">
                              Source
                            </th>
                            <th className="py-2.5 px-3 text-left font-semibold text-text-muted uppercase tracking-wider whitespace-nowrap">
                              Patient Name
                            </th>
                            <th className="py-2.5 px-3 text-left font-semibold text-text-muted uppercase tracking-wider whitespace-nowrap">
                              DOS
                            </th>
                            <th className="py-2.5 px-3 text-left font-semibold text-text-muted uppercase tracking-wider whitespace-nowrap">
                              Billed
                            </th>
                            <th className="py-2.5 px-3 text-left font-semibold text-text-muted uppercase tracking-wider whitespace-nowrap">
                              Ins. Paid
                            </th>
                            <th className="py-2.5 px-3 text-left font-semibold text-text-muted uppercase tracking-wider whitespace-nowrap">
                              Pt. Portion
                            </th>
                            <th className="py-2.5 px-3 text-left font-semibold text-text-muted uppercase tracking-wider whitespace-nowrap">
                              Insurance
                            </th>
                            <th className="py-2.5 px-3 text-left font-semibold text-text-muted uppercase tracking-wider whitespace-nowrap">
                              Provider
                            </th>
                            <th className="py-2.5 px-3 text-left font-semibold text-text-muted uppercase tracking-wider whitespace-nowrap">
                              CDT Codes
                            </th>
                            <th className="py-2.5 px-3" />
                          </tr>
                        </thead>
                        <tbody>
                          <AnimatePresence>
                            {aiPatients.map((patient, i) => (
                              <AiPatientRow
                                key={`ai-patient-${i}`}
                                patient={patient}
                                index={i}
                                onChange={handleAiPatientChange}
                                onRemove={handleRemoveAiPatient}
                              />
                            ))}
                          </AnimatePresence>
                        </tbody>
                      </table>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ── Drop Zone ────────────────────────────────────────────── */}
              <div
                onDrop={handleDrop}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDragEnd={() => setIsDragging(false)}
                onClick={() => dropFileInputRef.current?.click()}
                className={[
                  'border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-200 select-none',
                  isDragging
                    ? 'border-gold bg-gold/[0.06] scale-[1.01]'
                    : 'border-gold/20 hover:border-gold/40 hover:bg-gold/[0.02]',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                <input
                  ref={dropFileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png,.xlsx,.docx,.tiff,.bmp,.webp,.csv"
                  className="hidden"
                  onChange={handleDropFileInput}
                />
                <Upload
                  className={`w-9 h-9 mx-auto mb-3 transition-colors ${
                    isDragging ? 'text-gold' : 'text-text-muted/50'
                  }`}
                />
                <p className="text-sm font-semibold text-text-primary mb-1">
                  {isDragging ? 'Release to attach files' : 'Drag & drop files here, or click to browse'}
                </p>
                <p className="text-xs text-text-muted">
                  Accepts PDF, JPG, PNG, XLSX, DOCX — up to 25 MB each
                </p>
              </div>

              {/* ── Attached Files List ───────────────────────────────────── */}
              <AnimatePresence>
                {files.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mt-4 space-y-2"
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">
                      {files.length} file{files.length !== 1 ? 's' : ''} attached
                    </p>
                    <AnimatePresence>
                      {files.map((f, i) => (
                        <FileChip key={`${f.name}-${i}`} file={f} onRemove={() => removeFile(i)} />
                      ))}
                    </AnimatePresence>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

          </div>

          {/* ── Footer Actions ──────────────────────────────────────────── */}
          <motion.div
            variants={sectionVariants}
            className="px-6 sm:px-8 py-5 border-t border-gold/10 flex flex-col sm:flex-row items-center justify-between gap-4 bg-navy/20 rounded-b-2xl"
          >
            {/* Status indicator */}
            <div className="flex items-center gap-2 text-xs text-text-muted">
              <span className="w-2 h-2 rounded-full bg-gold/50" />
              Deposit will be set to:&nbsp;
              <span className="font-semibold text-gold">{depositStatus}</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleClear}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold border border-gold/20 text-text-muted hover:text-text-primary hover:border-gold/40 transition-all duration-200 active:scale-95"
              >
                Clear
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={[
                  'flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 active:scale-95',
                  'bg-gradient-to-r from-gold to-amber-400 text-navy shadow-lg shadow-gold/25',
                  'hover:from-amber-400 hover:to-gold hover:shadow-gold/40',
                  isSubmitting ? 'opacity-70 cursor-wait' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                {isSubmitting ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8H4z"
                      />
                    </svg>
                    Submitting…
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    {isEditMode ? 'Save Changes' : 'Submit Deposit'}
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </Card>
      </form>
    </motion.div>
  );
}
