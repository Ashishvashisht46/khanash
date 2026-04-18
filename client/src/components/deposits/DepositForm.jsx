import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  MapPin,
  Hash,
  Calendar,
  DollarSign,
  CreditCard,
  Building2,
  User,
  Stethoscope,
  FileText,
  Shield,
  MessageSquare,
  AlertCircle,
} from 'lucide-react';
import { Input, Button, Select, Textarea, Dropzone } from '../ui';
import AIExtractButton from '../ai/AIExtractButton';

/* ─────────────────────────────────────────────────────────────────────────────
   DepositForm
   Reusable controlled form for creating or editing a deposit.
   Integrates AIExtractButton to auto-fill fields from uploaded documents.

   Props:
     initialData       — partial deposit object for edit mode (optional)
     onSubmit(data)    — called with validated form data
     onCancel          — called when user cancels
     submitLabel       — override submit button text (default "Save Deposit")
     locations         — [{ value, label }] for location select
     providers         — [{ value, label }] for provider select
     insurances        — [{ value, label }] for insurance select
     loading           — disables form during parent submission
───────────────────────────────────────────────────────────────────────────── */

const EMPTY_FORM = {
  location: '',
  office: '',
  refId: '',
  date: '',
  totalDeposit: '',
  creditCards: '',
  efts: '',
  checks: '',
  patientName: '',
  dateOfService: '',
  billed: '',
  insPaid: '',
  patientPortion: '',
  cdtCodes: '',
  provider: '',
  insurance: '',
  remarks: '',
};

function sectionTitle(title) {
  return (
    <div className="flex items-center gap-3 col-span-full">
      <span className="text-[10px] font-bold text-gold/70 uppercase tracking-widest whitespace-nowrap">
        {title}
      </span>
      <div className="flex-1 h-px bg-gold/10" />
    </div>
  );
}

export default function DepositForm({
  initialData = null,
  onSubmit,
  onCancel,
  submitLabel = 'Save Deposit',
  locations = [],
  providers = [],
  insurances = [],
  loading = false,
}) {
  const [form, setForm] = useState({ ...EMPTY_FORM, ...initialData });
  const [errors, setErrors] = useState({});
  const [files, setFiles] = useState([]);
  const [extractError, setExtractError] = useState('');

  // Sync initialData into form if it changes (e.g. modal re-opens with different deposit)
  useEffect(() => {
    if (initialData) {
      setForm({ ...EMPTY_FORM, ...initialData });
    }
  }, [initialData]);

  const set = (key) => (val) => {
    setForm((prev) => ({ ...prev, [key]: val }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const setRaw = (key) => (e) => set(key)(e.target.value);

  // AI auto-fill handler
  const handleExtracted = (data) => {
    if (!data) return;
    setExtractError('');
    setForm((prev) => ({
      ...prev,
      ...(data.patientName && { patientName: data.patientName }),
      ...(data.dateOfService && { dateOfService: data.dateOfService }),
      ...(data.billed && { billed: data.billed }),
      ...(data.insPaid && { insPaid: data.insPaid }),
      ...(data.patientPortion && { patientPortion: data.patientPortion }),
      ...(data.cdtCodes && { cdtCodes: data.cdtCodes }),
      ...(data.provider && { provider: data.provider }),
      ...(data.insurance && { insurance: data.insurance }),
      ...(data.totalDeposit && { totalDeposit: data.totalDeposit }),
      ...(data.refId && { refId: data.refId }),
      ...(data.date && { date: data.date }),
      ...(data.location && { location: data.location }),
      ...(data.remarks && { remarks: data.remarks }),
    }));
  };

  // Validation
  const validate = () => {
    const errs = {};
    if (!form.location.trim()) errs.location = 'Location is required';
    if (!form.refId.trim()) errs.refId = 'Reference ID is required';
    if (!form.date) errs.date = 'Date is required';
    if (!form.totalDeposit) errs.totalDeposit = 'Total deposit is required';
    if (!form.patientName.trim()) errs.patientName = 'Patient name is required';
    return errs;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    onSubmit?.({ ...form, files });
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
      {/* AI Auto-Fill */}
      <AIExtractButton
        onExtracted={handleExtracted}
        onError={setExtractError}
      />
      {extractError && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-1.5 text-xs text-red-400"
        >
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          {extractError}
        </motion.p>
      )}

      {/* ── Form fields grid ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4">

        {sectionTitle('Deposit Details')}

        {/* Location */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-semibold text-gold/80 uppercase tracking-widest">
            Location *
          </label>
          {locations.length > 0 ? (
            <Select
              value={form.location}
              onChange={set('location')}
              options={[{ value: '', label: 'Select location…' }, ...locations]}
              error={errors.location}
            />
          ) : (
            <Input
              icon={MapPin}
              value={form.location}
              onChange={setRaw('location')}
              placeholder="e.g. Main Street Office"
              error={errors.location}
            />
          )}
        </div>

        {/* Office */}
        <Input
          label="Office"
          icon={Building2}
          value={form.office}
          onChange={setRaw('office')}
          placeholder="e.g. Suite 101"
        />

        {/* Ref ID */}
        <Input
          label="Reference ID *"
          icon={Hash}
          value={form.refId}
          onChange={setRaw('refId')}
          placeholder="e.g. DEP-2024-001"
          error={errors.refId}
        />

        {/* Date */}
        <Input
          label="Deposit Date *"
          icon={Calendar}
          type="date"
          value={form.date}
          onChange={setRaw('date')}
          error={errors.date}
        />

        {/* Total Deposit */}
        <Input
          label="Total Deposit *"
          icon={DollarSign}
          type="number"
          step="0.01"
          min="0"
          value={form.totalDeposit}
          onChange={setRaw('totalDeposit')}
          placeholder="0.00"
          error={errors.totalDeposit}
        />

        {sectionTitle('Payment Breakdown')}

        {/* Credit Cards */}
        <Input
          label="Credit Cards"
          icon={CreditCard}
          type="number"
          step="0.01"
          min="0"
          value={form.creditCards}
          onChange={setRaw('creditCards')}
          placeholder="0.00"
        />

        {/* EFTs */}
        <Input
          label="EFTs"
          icon={Building2}
          type="number"
          step="0.01"
          min="0"
          value={form.efts}
          onChange={setRaw('efts')}
          placeholder="0.00"
        />

        {/* Checks */}
        <Input
          label="Checks"
          icon={FileText}
          type="number"
          step="0.01"
          min="0"
          value={form.checks}
          onChange={setRaw('checks')}
          placeholder="0.00"
        />

        {sectionTitle('Patient Information')}

        {/* Patient Name */}
        <Input
          label="Patient Name *"
          icon={User}
          value={form.patientName}
          onChange={setRaw('patientName')}
          placeholder="Full name"
          error={errors.patientName}
        />

        {/* Date of Service */}
        <Input
          label="Date of Service"
          icon={Calendar}
          type="date"
          value={form.dateOfService}
          onChange={setRaw('dateOfService')}
        />

        {/* Billed */}
        <Input
          label="Billed Amount"
          icon={DollarSign}
          type="number"
          step="0.01"
          min="0"
          value={form.billed}
          onChange={setRaw('billed')}
          placeholder="0.00"
        />

        {/* Insurance Paid */}
        <Input
          label="Insurance Paid"
          icon={Shield}
          type="number"
          step="0.01"
          min="0"
          value={form.insPaid}
          onChange={setRaw('insPaid')}
          placeholder="0.00"
        />

        {/* Patient Portion */}
        <Input
          label="Patient Portion"
          icon={User}
          type="number"
          step="0.01"
          min="0"
          value={form.patientPortion}
          onChange={setRaw('patientPortion')}
          placeholder="0.00"
        />

        {/* CDT Codes */}
        <Input
          label="CDT Codes"
          icon={Stethoscope}
          value={form.cdtCodes}
          onChange={setRaw('cdtCodes')}
          placeholder="e.g. D0150, D1110"
        />

        {/* Provider */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-semibold text-gold/80 uppercase tracking-widest">
            Provider
          </label>
          {providers.length > 0 ? (
            <Select
              value={form.provider}
              onChange={set('provider')}
              options={[{ value: '', label: 'Select provider…' }, ...providers]}
            />
          ) : (
            <Input
              icon={Stethoscope}
              value={form.provider}
              onChange={setRaw('provider')}
              placeholder="Provider name"
            />
          )}
        </div>

        {/* Insurance */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-semibold text-gold/80 uppercase tracking-widest">
            Insurance
          </label>
          {insurances.length > 0 ? (
            <Select
              value={form.insurance}
              onChange={set('insurance')}
              options={[{ value: '', label: 'Select insurance…' }, ...insurances]}
            />
          ) : (
            <Input
              icon={Shield}
              value={form.insurance}
              onChange={setRaw('insurance')}
              placeholder="Insurance name / plan"
            />
          )}
        </div>

        {/* Remarks */}
        <div className="col-span-full">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-semibold text-gold/80 uppercase tracking-widest flex items-center gap-1.5">
              <MessageSquare className="w-3 h-3" />
              Remarks
            </label>
            <Textarea
              value={form.remarks}
              onChange={setRaw('remarks')}
              placeholder="Any notes or comments about this deposit…"
              rows={3}
            />
          </div>
        </div>

        {sectionTitle('Supporting Documents')}

        {/* Dropzone */}
        <div className="col-span-full">
          <Dropzone
            onFiles={setFiles}
            accept=".pdf,.png,.jpg,.jpeg,.webp"
            maxSizeMB={20}
            multiple
          />
        </div>
      </div>

      {/* ── Footer buttons ───────────────────────────────────────────────── */}
      <div className="flex items-center justify-end gap-3 pt-2 border-t border-gold/10">
        {onCancel && (
          <Button
            type="button"
            variant="ghost"
            size="md"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          variant="gold"
          size="md"
          loading={loading}
          disabled={loading}
        >
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
