import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Download, Plus, X, Filter, ChevronLeft, ChevronRight,
  AlertTriangle, MessageSquare, FileText, Clock, CheckCircle,
  Trash2, Edit3, Send, CreditCard, Eye,
} from 'lucide-react';
import { Button, Card, Badge, Input, Select, StatusBadge, Skeleton, EmptyState } from '../components/ui';
import {
  useDeposits, useDeposit, useUpdateDeposit, useDeleteDeposit,
  useAddComment, useApproveDeposit,
} from '../hooks/useDeposits';
import { useLocations } from '../hooks/useLocations';
import { useAuthStore } from '../stores/authStore';
import { fmt$, fmtDate, fmtRelative, cn, getInitials, getDaysOpen } from '../lib/utils';
import { STATUS_OPTIONS, STATUS_COLORS } from '../lib/constants';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

/* ─── Role guards ─────────────────────────────────────────────────────────── */
const COORDINATOR_ROLES = ['rcm_agent', 'rcm_manager', 'admin', 'super_admin'];
const MANAGER_ROLES     = ['rcm_manager', 'admin', 'super_admin'];
const ADMIN_ROLES       = ['admin', 'super_admin'];

/* ─── Animation variants ──────────────────────────────────────────────────── */
const tableVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.035 } },
};
const rowVariants = {
  hidden:   { opacity: 0, x: -10 },
  visible:  { opacity: 1, x: 0, transition: { duration: 0.18 } },
};
const panelVariants = {
  hidden:   { x: '100%', opacity: 0 },
  visible:  { x: 0,      opacity: 1, transition: { type: 'spring', damping: 28, stiffness: 220 } },
  exit:     { x: '100%', opacity: 0, transition: { duration: 0.22, ease: 'easeIn' } },
};
const backdropVariants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1,  transition: { duration: 0.18 } },
  exit:    { opacity: 0,  transition: { duration: 0.18 } },
};

const PAGE_SIZE = 25;

/* ─── Demo data (fallback when API is unavailable) ────────────────────────── */
const DEMO_DEPOSITS = Array.from({ length: 10 }, (_, i) => ({
  id:            `demo-${i + 1}`,
  depositId:     `DEP-${String(100 + i).padStart(6, '0')}`,
  refId:         `REF-${String(5200 + i)}`,
  createdAt:     new Date(Date.now() - i * 86_400_000 * 2).toISOString(),
  depositDate:   new Date(Date.now() - i * 86_400_000).toISOString(),
  locationName:  ['Downtown Dental', 'Westside Family Dental', 'Northpark Smiles'][i % 3],
  officeName:    ['Main Office', 'Suite 200', 'Building A'][i % 3],
  locationId:    `loc-${(i % 3) + 1}`,
  depositTotal:  1_200 + i * 340,
  actualDeposit: 1_190 + i * 340,
  postedAmount:  1_100 + i * 290,
  patientName:   ['John Smith', 'Maria Garcia', 'Robert Chen', 'Emily Davis', 'James Wilson'][i % 5],
  submittedBy:   ['Alice R.', 'Bob K.', 'Carol M.'][i % 3],
  dateOfService: new Date(Date.now() - i * 86_400_000 * 3).toISOString(),
  billedAmount:  1_400 + i * 300,
  insurancePaid: 900 + i * 200,
  patientPortion: 300 + i * 100,
  cdtCodes:      'D0150, D1110',
  provider:      'Dr. Sarah Thompson',
  insurance:     'BlueCross BlueShield',
  creditCards:   100 + i * 20,
  efts:          500 + i * 80,
  checks:        590 + i * 240,
  remarks:       i % 3 === 0 ? 'Pending ERA from insurance' : '',
  status:        ['pending', 'in_review', 'approved', 'posted', 'rejected', 'on_hold'][i % 6],
  files:         i % 2 === 0
    ? [{ id: `f${i}`, name: `deposit-slip-${i}.pdf`, size: 1024 * (12 + i), url: '#' }]
    : [],
  comments: i % 3 === 0
    ? [{ id: `c${i}`, text: 'Reviewed and looks correct.', author: 'Alice R.', createdAt: new Date(Date.now() - 3_600_000).toISOString() }]
    : [],
  auditLog: [
    { id: `al${i}a`, action: 'Deposit created', actor: 'System', createdAt: new Date(Date.now() - i * 86_400_000 * 2).toISOString() },
    ...(i % 2 === 0 ? [{ id: `al${i}b`, action: 'Status changed to In Review', actor: 'Alice R.', createdAt: new Date(Date.now() - i * 86_400_000).toISOString() }] : []),
  ],
}));

/* ─── Sub-components ──────────────────────────────────────────────────────── */

function DiscrepancyIcon({ deposit }) {
  const billed = Number(deposit.depositTotal ?? 0);
  const actual = Number(deposit.actualDeposit ?? 0);
  if (Math.abs(billed - actual) < 0.01) return null;
  return (
    <span
      title={`Discrepancy: ${fmt$(Math.abs(billed - actual))}`}
      className="inline-flex items-center ml-1 text-amber-300"
    >
      <AlertTriangle className="w-3 h-3" />
    </span>
  );
}

function InfoField({ label, value, span = false }) {
  return (
    <div className={cn(span && 'col-span-2')}>
      <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-brand-soft">{label}</p>
      <p className="text-sm leading-snug text-text-primary">{value || <span className="text-text-muted/60">—</span>}</p>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   DepositDetailPanel — full slide-in implementation
───────────────────────────────────────────────────────────────────────────── */
function DepositDetailPanel({ depositId, onClose }) {
  const navigate   = useNavigate();
  const { user }   = useAuthStore();
  const role       = user?.role ?? 'viewer';
  const isAdmin    = ADMIN_ROLES.includes(role);

  /* live data from hook, falls back to demo */
  const { data: liveData, isLoading } = useDeposit(depositId);
  const deposit = liveData?.deposit ?? DEMO_DEPOSITS.find((d) => d.id === depositId) ?? null;
  const files    = liveData?.files    ?? deposit?.files    ?? [];
  const comments = liveData?.comments ?? deposit?.comments ?? [];
  const auditLog = liveData?.auditLog ?? deposit?.auditLog ?? [];

  /* comment state */
  const [commentText, setCommentText] = useState('');
  const { mutate: addComment, isPending: postingComment } = useAddComment();

  /* post-payment form */
  const [actualInput,  setActualInput]  = useState('');
  const [postedInput,  setPostedInput]  = useState('');
  const [setStatus,    setSetStatus]    = useState('');

  const actualNum  = parseFloat(actualInput)  || 0;
  const postedNum  = parseFloat(postedInput)  || 0;
  const unapplied  = actualNum - postedNum;

  /* mutations */
  const { mutate: updateDeposit, isPending: saving }  = useUpdateDeposit();
  const { mutate: deleteDeposit, isPending: deleting } = useDeleteDeposit();
  const { mutate: approveDeposit } = useApproveDeposit();

  /* prefill amounts when deposit loads */
  useMemo(() => {
    if (deposit) {
      setActualInput(String(deposit.actualDeposit ?? ''));
      setPostedInput(String(deposit.postedAmount  ?? ''));
      setSetStatus(deposit.status ?? '');
    }
  }, [deposit?.id]);  // eslint-disable-line

  /* suggest status based on amounts */
  const suggestedStatus = useMemo(() => {
    if (!actualNum) return null;
    if (actualNum === postedNum) return 'posted';
    if (postedNum > actualNum)   return 'in_review';
    if (unapplied > 0)           return 'approved';
    return null;
  }, [actualNum, postedNum, unapplied]);

  function handleSavePost() {
    if (!deposit) return;
    updateDeposit({
      id:           deposit.id,
      actualDeposit: actualNum,
      postedAmount:  postedNum,
      status:        setStatus || suggestedStatus || deposit.status,
    }, {
      onSuccess: () => toast.success('Payment posted successfully'),
    });
  }

  function handlePostComment() {
    if (!commentText.trim() || !deposit) return;
    addComment(
      { depositId: deposit.id, text: commentText.trim() },
      {
        onSuccess: () => {
          setCommentText('');
          toast.success('Comment added');
        },
      },
    );
  }

  function handleDelete() {
    if (!deposit) return;
    if (!window.confirm(`Permanently delete deposit ${deposit.depositId}? This cannot be undone.`)) return;
    deleteDeposit(deposit.id, {
      onSuccess: () => { onClose(); },
    });
  }

  if (!deposit && !isLoading) return null;

  return (
    <AnimatePresence>
      {depositId && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            key="panel"
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed top-0 right-0 z-50 flex h-full w-full max-w-[720px] flex-col border-l border-white/10 bg-panel shadow-2xl shadow-black/40"
          >
            {/* ── Panel header ──────────────────────────────────────────── */}
            <div className="flex-shrink-0 border-b border-white/10 bg-surface/90 px-6 py-4 backdrop-blur-md">
              <div className="flex items-center gap-3">
                {isLoading ? (
                  <Skeleton className="h-6 w-40" />
                ) : (
                  <>
                    <h2 className="font-mono text-lg font-bold tracking-wide text-brand-soft">
                      {deposit?.depositId ?? '—'}
                    </h2>
                    {deposit?.status && (
                      <StatusBadge status={deposit.status} size="sm" />
                    )}
                    {deposit && (
                      <DiscrepancyIcon deposit={deposit} />
                    )}
                  </>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Close panel"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* ── Scrollable body ────────────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="p-6 space-y-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-8 w-full" />
                  ))}
                </div>
              ) : deposit ? (
                <div className="flex flex-col lg:flex-row">

                  {/* ── Left column: info, files, comments, audit ─────── */}
                  <div className="flex-1 min-w-0 space-y-8 border-r border-white/10 p-6">

                    {/* Info Grid */}
                    <section>
                      <h3 className="mb-4 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-brand-soft/80">
                        <FileText className="w-3.5 h-3.5" />
                        Deposit Information
                      </h3>
                      <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                        <InfoField label="Location"        value={deposit.locationName} />
                        <InfoField label="Office"          value={deposit.officeName} />
                        <InfoField label="Reference ID"    value={deposit.refId} />
                        <InfoField label="Deposit Date"    value={fmtDate(deposit.depositDate)} />
                        <InfoField label="Submitted Date"  value={fmtDate(deposit.createdAt)} />
                        <InfoField label="Deposit Total"   value={fmt$(deposit.depositTotal)} />
                        <InfoField label="Submitted By"    value={deposit.submittedBy} />
                        <InfoField label="Patient"         value={deposit.patientName} />
                        <InfoField label="Date of Service" value={fmtDate(deposit.dateOfService)} />
                        <InfoField label="Billed Amount"   value={fmt$(deposit.billedAmount)} />
                        <InfoField label="Insurance Paid"  value={fmt$(deposit.insurancePaid)} />
                        <InfoField label="Patient Portion" value={fmt$(deposit.patientPortion)} />
                        <InfoField label="CDT Codes"       value={deposit.cdtCodes} />
                        <InfoField label="Provider"        value={deposit.provider} />
                        <InfoField label="Insurance"       value={deposit.insurance} />
                        <InfoField label="Credit Cards"    value={fmt$(deposit.creditCards)} />
                        <InfoField label="EFTs"            value={fmt$(deposit.efts)} />
                        <InfoField label="Checks"          value={fmt$(deposit.checks)} />
                        {deposit.remarks && (
                          <InfoField label="Remarks" value={deposit.remarks} span />
                        )}
                      </div>
                    </section>

                    {/* Files */}
                    <section>
                      <h3 className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-brand-soft/80">
                        <FileText className="w-3.5 h-3.5" />
                        Attached Documents
                        {files.length > 0 && (
                          <span className="ml-auto text-white/40 text-[10px] normal-case tracking-normal">
                            {files.length} file{files.length !== 1 ? 's' : ''}
                          </span>
                        )}
                      </h3>
                      {files.length === 0 ? (
                        <p className="text-sm text-white/30 italic">No files attached</p>
                      ) : (
                        <ul className="space-y-2">
                          {files.map((file) => (
                            <li
                              key={file.id}
                              className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/5 px-3 py-2.5 transition-colors hover:border-brand/30 hover:bg-white/7"
                            >
                              <FileText className="h-4 w-4 flex-shrink-0 text-brand-soft/70" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-white/90 truncate">{file.name}</p>
                                <p className="text-[10px] text-white/40">
                                  {file.size ? `${Math.round(file.size / 1024)} KB` : '—'}
                                </p>
                              </div>
                              <div className="flex gap-1.5 flex-shrink-0">
                                <a
                                  href={file.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-2 py-1 text-[10px] rounded bg-white/8 text-white/60 hover:text-white hover:bg-white/15 transition-colors"
                                >
                                  View
                                </a>
                                <a
                                  href={file.url}
                                  download={file.name}
                                  className="rounded-lg bg-brand/10 px-2 py-1 text-[10px] text-brand-soft transition-colors hover:bg-brand/20"
                                >
                                  Download
                                </a>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </section>

                    {/* Comments */}
                    <section>
                      <h3 className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-brand-soft/80">
                        <MessageSquare className="w-3.5 h-3.5" />
                        Comments &amp; Reviews
                        {comments.length > 0 && (
                          <span className="ml-auto text-white/40 text-[10px] normal-case tracking-normal">
                            {comments.length} comment{comments.length !== 1 ? 's' : ''}
                          </span>
                        )}
                      </h3>

                      {/* Existing comments */}
                      {comments.length > 0 && (
                        <ul className="space-y-3 mb-4">
                          {comments.map((c) => (
                            <li key={c.id} className="flex gap-3">
                              <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-brand/30 bg-brand/15 text-[10px] font-bold text-brand-soft">
                                {getInitials(c.author)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-baseline gap-2 mb-0.5">
                                  <span className="text-xs font-semibold text-white/80">{c.author}</span>
                                  <span className="text-[10px] text-white/35">{fmtRelative(c.createdAt)}</span>
                                </div>
                                <p className="text-sm text-white/70 leading-relaxed">{c.text}</p>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}

                      {/* Add comment */}
                      <div className="space-y-2">
                        <textarea
                          rows={3}
                          placeholder="Add a comment or review note…"
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          className={cn(
                            'w-full px-3 py-2.5 text-sm rounded-lg resize-none',
                            'bg-white/5 border border-white/10 text-white/90 placeholder:text-white/30',
                            'focus:outline-none focus:border-brand/40 focus:bg-white/8',
                            'transition-colors',
                          )}
                        />
                        <div className="flex justify-end">
                          <button
                            onClick={handlePostComment}
                            disabled={!commentText.trim() || postingComment}
                            className={cn(
                              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium',
                              'border border-brand/25 bg-brand/15 text-brand-soft',
                              'hover:border-brand/40 hover:bg-brand/25',
                              'disabled:opacity-40 disabled:cursor-not-allowed',
                              'transition-colors',
                            )}
                          >
                            <Send className="w-3.5 h-3.5" />
                            {postingComment ? 'Posting…' : 'Post'}
                          </button>
                        </div>
                      </div>
                    </section>

                    {/* Audit Log */}
                    <section>
                      <h3 className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-brand-soft/80">
                        <Clock className="w-3.5 h-3.5" />
                        Activity Log
                      </h3>
                      {auditLog.length === 0 ? (
                        <p className="text-sm text-white/30 italic">No audit entries</p>
                      ) : (
                        <ol className="relative border-l border-white/10 ml-2 space-y-0">
                          {[...auditLog].reverse().map((entry) => (
                            <li key={entry.id} className="pl-4 pb-4 last:pb-0">
                              <div className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border-2 border-panel bg-brand/55" />
                              <p className="text-xs text-white/60 leading-snug">{entry.action}</p>
                              <p className="text-[10px] text-white/35 mt-0.5">
                                {entry.actor} &bull; {fmtRelative(entry.createdAt)}
                              </p>
                            </li>
                          ))}
                        </ol>
                      )}
                    </section>
                  </div>

                  {/* ── Right column: post payment + admin actions ─────── */}
                  <div className="lg:w-64 xl:w-72 flex-shrink-0 p-5 space-y-6">

                    {/* Post Payment */}
                    <section>
                      <h3 className="mb-4 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-brand-soft/80">
                        <CreditCard className="w-3.5 h-3.5" />
                        Post Payment
                      </h3>

                      <div className="space-y-3">
                        {/* Actual Deposit */}
                        <div>
                          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-brand-soft">
                            Actual Deposit $
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            value={actualInput}
                            onChange={(e) => setActualInput(e.target.value)}
                            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-brand/40 focus:outline-none transition-colors"
                          />
                        </div>

                        {/* Posted Amount */}
                        <div>
                          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-brand-soft">
                            Posted Amount $
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            value={postedInput}
                            onChange={(e) => setPostedInput(e.target.value)}
                            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-brand/40 focus:outline-none transition-colors"
                          />
                        </div>

                        {/* Unapplied (read-only) */}
                        <div>
                          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-brand-soft">
                            Unapplied $
                          </label>
                          <div className="w-full px-3 py-2 text-sm rounded-lg bg-white/3 border border-white/8 text-white/50 select-none">
                            {fmt$(unapplied)}
                          </div>
                        </div>

                        {/* Status indicator bar */}
                        {(actualNum > 0 || postedNum > 0) && (
                          <div className={cn(
                            'px-3 py-2 rounded-lg text-xs font-medium border',
                            postedNum > actualNum
                              ? 'bg-red-500/10 border-red-500/20 text-red-400'
                              : unapplied > 0
                                ? 'border-amber-300/25 bg-amber-300/10 text-amber-200'
                                : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
                          )}>
                            {postedNum > actualNum
                              ? `Posted exceeds actual by ${fmt$(postedNum - actualNum)}`
                              : unapplied > 0
                                ? `${fmt$(unapplied)} unapplied`
                                : 'Fully applied'}
                          </div>
                        )}

                        {/* Suggested status hint */}
                        {suggestedStatus && (
                          <p className="text-[10px] text-white/35">
                            Suggested status: <span className="text-brand-soft">{suggestedStatus.replace(/_/g, ' ')}</span>
                          </p>
                        )}

                        {/* Set Status */}
                        <div>
                          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-brand-soft">
                            Set Status
                          </label>
                          <select
                            value={setStatus}
                            onChange={(e) => setSetStatus(e.target.value)}
                            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-text-primary focus:border-brand/40 focus:outline-none transition-colors"
                          >
                            <option value="">— Keep current —</option>
                            {STATUS_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        </div>

                        {/* Save & Post button */}
                        <button
                          onClick={handleSavePost}
                          disabled={saving}
                          className={cn(
                            'w-full py-2.5 px-4 rounded-lg text-sm font-semibold',
                            'bg-gradient-to-r from-brand-soft via-brand to-accent text-bg hover:brightness-105',
                            'disabled:opacity-40 disabled:cursor-not-allowed',
                            'transition-all shadow-lg shadow-brand/20',
                          )}
                        >
                          {saving ? 'Saving…' : 'Save & Post'}
                        </button>
                      </div>
                    </section>

                    {/* Admin Actions */}
                    {isAdmin && (
                      <section>
                        <h3 className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-brand-soft/80">
                          <Edit3 className="w-3.5 h-3.5" />
                          Admin Actions
                        </h3>
                        <div className="space-y-2">
                          <button
                            onClick={() => navigate('/new-deposit', { state: { deposit } })}
                            className={cn(
                              'w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm',
                              'bg-white/5 border border-white/10 text-white/70',
                              'hover:bg-white/10 hover:text-white hover:border-white/20',
                              'transition-colors',
                            )}
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            Edit Deposit
                          </button>
                          <button
                            onClick={handleDelete}
                            disabled={deleting}
                            className={cn(
                              'w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm',
                              'bg-red-500/10 border border-red-500/20 text-red-400',
                              'hover:bg-red-500/20 hover:text-red-300',
                              'disabled:opacity-40 disabled:cursor-not-allowed',
                              'transition-colors',
                            )}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            {deleting ? 'Deleting…' : 'Delete Deposit'}
                          </button>
                        </div>
                      </section>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   PostingsPage
───────────────────────────────────────────────────────────────────────────── */
export default function PostingsPage() {
  const navigate   = useNavigate();
  const { user }   = useAuthStore();
  const role       = user?.role ?? 'viewer';
  const isCoordinator = COORDINATOR_ROLES.includes(role);
  const isManager     = MANAGER_ROLES.includes(role);
  const isAdmin       = ADMIN_ROLES.includes(role);

  /* ── Filter state ────────────────────────────────────────────────────────── */
  const [search,         setSearch]         = useState('');
  const [statusFilter,   setStatusFilter]   = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [page,           setPage]           = useState(1);

  /* ── Selection state ─────────────────────────────────────────────────────── */
  const [selectedIds, setSelectedIds] = useState(new Set());

  /* ── Detail panel state ──────────────────────────────────────────────────── */
  const [detailId, setDetailId] = useState(null);

  /* ── Server data ─────────────────────────────────────────────────────────── */
  const queryFilters = useMemo(() => ({
    search, status: statusFilter, location: locationFilter, page, pageSize: PAGE_SIZE,
  }), [search, statusFilter, locationFilter, page]);

  const { data, isLoading, refetch }  = useDeposits(queryFilters);
  const { data: locData }             = useLocations();
  const { mutate: deleteDeposit }     = useDeleteDeposit();
  const { mutate: approveDeposit }    = useApproveDeposit();

  const serverDeposits = data?.deposits  ?? [];
  const serverTotal    = data?.total     ?? 0;
  const serverPages    = data?.totalPages ?? 1;

  /* ── Client-side filtering over demo data when server is empty ───────────── */
  const filteredDemo = useMemo(() => {
    let list = DEMO_DEPOSITS;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((d) =>
        d.depositId.toLowerCase().includes(q) ||
        (d.patientName ?? '').toLowerCase().includes(q) ||
        (d.refId ?? '').toLowerCase().includes(q) ||
        (d.locationName ?? '').toLowerCase().includes(q),
      );
    }
    if (statusFilter)   list = list.filter((d) => d.status === statusFilter);
    if (locationFilter) list = list.filter((d) => d.locationId === locationFilter);
    return list;
  }, [search, statusFilter, locationFilter]);

  /* use real server data when available, else demo */
  const deposits    = serverDeposits.length > 0 ? serverDeposits : (isLoading ? [] : filteredDemo);
  const total       = serverDeposits.length > 0 ? serverTotal : filteredDemo.length;
  const totalPages  = serverDeposits.length > 0 ? serverPages : Math.max(1, Math.ceil(filteredDemo.length / PAGE_SIZE));

  /* paginate demo data client-side */
  const pagedDeposits = serverDeposits.length > 0
    ? deposits
    : deposits.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const showing = pagedDeposits.length;
  const showFrom = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const showTo   = Math.min(page * PAGE_SIZE, total);

  /* ── Location options ────────────────────────────────────────────────────── */
  const locations = locData?.locations ?? [];
  const locationOptions = [
    { value: '', label: 'All Locations' },
    ...locations.map((l) => ({ value: l.id, label: l.name })),
  ];

  const statusSelectOptions = [
    { value: '', label: 'All Statuses' },
    ...STATUS_OPTIONS,
  ];

  /* ── Selection helpers ───────────────────────────────────────────────────── */
  const toggleRow = useCallback((id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setSelectedIds((prev) =>
      prev.size === pagedDeposits.length
        ? new Set()
        : new Set(pagedDeposits.map((d) => d.id)),
    );
  }, [pagedDeposits]);

  /* ── Bulk delete ─────────────────────────────────────────────────────────── */
  function handleBulkDelete() {
    if (!window.confirm(`Permanently delete ${selectedIds.size} deposit(s)?`)) return;
    Array.from(selectedIds).forEach((id) => deleteDeposit(id));
    setSelectedIds(new Set());
  }

  /* ── Approve handler (coordinator / manager) ─────────────────────────────── */
  function handleApprove(deposit, e) {
    e.stopPropagation();
    approveDeposit({ id: deposit.id });
  }

  /* ── Export CSV ──────────────────────────────────────────────────────────── */
  function handleExportCSV() {
    const headers = [
      'Deposit ID', 'Submitted', 'Deposit Date', 'Location', 'Office',
      'Reference ID', 'Deposit Total', 'Actual', 'Posted', 'Unapplied',
      'Patient', 'Status',
    ];
    const rows = pagedDeposits.map((d) => [
      d.depositId,
      fmtDate(d.createdAt),
      fmtDate(d.depositDate),
      d.locationName ?? d.location ?? '',
      d.officeName ?? '',
      d.refId ?? '',
      d.depositTotal ?? 0,
      d.actualDeposit ?? 0,
      d.postedAmount ?? 0,
      (Number(d.actualDeposit) || 0) - (Number(d.postedAmount) || 0),
      d.patientName ?? '',
      d.status ?? '',
    ]);

    const escape = (v) => {
      const s = String(v ?? '');
      return s.includes(',') || s.includes('"') || s.includes('\n')
        ? `"${s.replace(/"/g, '""')}"` : s;
    };

    const csv = [headers, ...rows].map((r) => r.map(escape).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `postings-export-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('CSV exported');
  }

  /* ── Render ──────────────────────────────────────────────────────────────── */
  return (
    <div className="space-y-5 pb-8 text-text-primary">
      <div className="space-y-5">

        {/* ── HERO HEADER ─────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="surface-highlight relative flex flex-wrap items-start justify-between gap-4 overflow-hidden p-6 md:p-8"
          style={{
            background:
              'linear-gradient(135deg, rgba(85,195,255,0.15) 0%, rgba(255,255,255,0.04) 46%, rgba(126,240,199,0.10) 100%)',
            border: '1px solid rgba(85,195,255,0.20)',
          }}
        >
          <div
            className="pointer-events-none absolute -top-24 -right-16 rounded-full blur-3xl"
            style={{
              width: 280,
              height: 280,
               background: 'radial-gradient(circle, rgba(85,195,255,0.22) 0%, transparent 70%)',
            }}
            aria-hidden="true"
          />
          <div className="relative">
              <div className="mb-2 flex items-center gap-2">
               <FileText style={{ width: 13, height: 13, color: '#8ad7ff' }} />
               <span
                 style={{
                    fontSize: 10.5,
                    color: '#8ad7ff',
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    fontWeight: 600,
                }}
              >
                Reconciliation
              </span>
            </div>
            <h1
              className="font-semibold"
              style={{
                 fontFamily: '"Space Grotesk", "Plus Jakarta Sans", sans-serif',
                 fontSize: 36,
                 letterSpacing: '-0.03em',
                 lineHeight: 1.15,
                 background: 'linear-gradient(120deg, #f3f7fe 0%, #8ad7ff 45%, #7ef0c7 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Deposit Postings
              {!isLoading && (
                <span
                  className="ml-3 tabular-nums"
                  style={{
                    fontSize: 20,
                    fontFamily: 'Manrope, sans-serif',
                     color: 'rgba(151,171,201,0.88)',
                     WebkitTextFillColor: 'rgba(151,171,201,0.88)',
                    fontWeight: 500,
                  }}
                >
                  · {total}
                </span>
              )}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-text-muted md:text-base">
              Track, approve, and reconcile every deposit across all locations.
            </p>
          </div>

          <div className="relative flex items-center gap-2 flex-wrap">
            {isAdmin && (
              <motion.button
                whileHover={{ y: -1.5 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleExportCSV}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-colors"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.14)',
                  color: '#f3f7fe',
                }}
              >
                <Download className="w-4 h-4" />
                Export CSV
              </motion.button>
            )}
            <motion.button
              whileHover={{ y: -1.5 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 380, damping: 22 }}
              onClick={() => navigate('/new-deposit')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
              style={{
                background: 'linear-gradient(135deg, #8ad7ff 0%, #55c3ff 50%, #7ef0c7 100%)',
                color: '#09111f',
                boxShadow: '0 14px 36px rgba(85,195,255,0.25), 0 0 0 1px rgba(255,255,255,0.10) inset',
              }}
            >
              <Plus className="w-4 h-4" />
              Add New Deposit
            </motion.button>
          </div>
        </motion.div>

        {/* ── TOOLBAR ─────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.1 }}
          className="surface-card flex flex-col gap-3 p-4 sm:flex-row"
          style={{
            background:
              'linear-gradient(180deg, rgba(19,35,63,0.96) 0%, rgba(15,27,49,0.92) 100%)',
            border: '1px solid rgba(255,255,255,0.10)',
          }}
        >
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by ID, patient, reference…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className={cn(
                'w-full rounded-2xl py-3 pl-9 pr-3 text-sm',
                'bg-white/[0.04] border border-white/10 text-text-primary placeholder:text-text-soft',
                'focus:outline-none focus:border-brand/40 focus:bg-white/[0.07]',
                'transition-colors',
              )}
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className={cn(
                'min-w-[140px] rounded-2xl px-3 py-3 text-sm',
                'bg-white/[0.04] border border-white/10 text-text-primary',
                'focus:outline-none focus:border-brand/40',
                'transition-colors',
              )}
            >
              {statusSelectOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>

            {/* Location filter */}
            <select
              value={locationFilter}
              onChange={(e) => { setLocationFilter(e.target.value); setPage(1); }}
              className={cn(
                'min-w-[160px] rounded-2xl px-3 py-3 text-sm',
                'bg-white/[0.04] border border-white/10 text-text-primary',
                'focus:outline-none focus:border-brand/40',
                'transition-colors',
              )}
            >
              {locationOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </motion.div>

        {/* ── BULK ACTION BAR ─────────────────────────────────────────── */}
        <AnimatePresence>
          {selectedIds.size > 0 && (
            <motion.div
              key="bulk-bar"
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: 'auto', marginTop: 0 }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="surface-card-soft flex items-center gap-3 px-4 py-3">
                <span className="text-sm font-semibold text-brand-soft">
                  {selectedIds.size} selected
                </span>
                <div className="h-4 w-px bg-white/10" />
                {isAdmin && (
                  <button
                    onClick={handleBulkDelete}
                    className="flex items-center gap-1.5 text-sm text-red-300 transition-colors hover:text-red-200"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete Selected
                  </button>
                )}
                <button
                  onClick={() => setSelectedIds(new Set())}
                  className="ml-auto flex items-center gap-1 text-xs text-text-muted transition-colors hover:text-text-primary"
                >
                  <X className="w-3.5 h-3.5" />
                  Clear Selection
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── TABLE ───────────────────────────────────────────────────── */}
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-panel shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">

              {/* Table head */}
              <thead>
                <tr className="bg-surface/90">
                  {/* Checkbox */}
                  <th className="w-10 px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={pagedDeposits.length > 0 && selectedIds.size === pagedDeposits.length}
                      onChange={toggleAll}
                      className="h-3.5 w-3.5 cursor-pointer rounded border-brand/30 bg-panel accent-[#55c3ff]"
                    />
                  </th>
                  {[
                    'Deposit ID', 'Submitted', 'Deposit Date', 'Location',
                    'Deposit Total', 'Actual', 'Posted', 'Unapplied', 'Status', 'Actions',
                  ].map((col) => (
                    <th
                      key={col}
                      className="whitespace-nowrap px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-brand-soft/80"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>

              {/* Table body */}
              <motion.tbody
                variants={tableVariants}
                initial="hidden"
                animate="visible"
              >
                {/* Loading skeletons */}
                {isLoading && Array.from({ length: 8 }).map((_, i) => (
                  <tr key={`skel-${i}`} className="border-t border-white/5">
                    {Array.from({ length: 11 }).map((__, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-3.5 rounded bg-white/8 animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))}

                {/* Empty state */}
                {!isLoading && pagedDeposits.length === 0 && (
                  <tr>
                    <td colSpan={11} className="px-4 py-20 text-center">
                      <div className="flex flex-col items-center gap-3 text-white/30">
                        <Search className="w-8 h-8 text-white/15" />
                        <p className="text-base font-medium text-white/50">No deposits found</p>
                        <p className="text-sm">Try adjusting your search or filters</p>
                        <button
                          onClick={() => navigate('/new-deposit')}
                          className="mt-2 flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-brand-soft via-brand to-accent px-4 py-2 text-sm font-semibold text-bg transition-all hover:brightness-105"
                        >
                          <Plus className="w-4 h-4" />
                          New Deposit
                        </button>
                      </div>
                    </td>
                  </tr>
                )}

                {/* Data rows */}
                {!isLoading && pagedDeposits.map((dep, idx) => {
                  const unapplied = (Number(dep.actualDeposit) || 0) - (Number(dep.postedAmount) || 0);
                  const hasDiscrepancy = Math.abs(
                    (Number(dep.depositTotal) || 0) - (Number(dep.actualDeposit) || 0),
                  ) > 0.01;
                  const isSelected = selectedIds.has(dep.id);
                  const isEven     = idx % 2 === 0;

                  const canCoordinatorApprove =
                    isCoordinator &&
                    ['pending', 'in_review'].includes(dep.status ?? '');

                  const canManagerApprove =
                    isManager &&
                    dep.status === 'approved';

                  return (
                    <motion.tr
                      key={dep.id}
                      variants={rowVariants}
                      onClick={() => setDetailId(dep.id)}
                      className={cn(
                        'border-t border-white/5 cursor-pointer group relative',
                        'transition-all duration-100',
                        isEven ? 'bg-transparent' : 'bg-white/[0.02]',
                        isSelected && 'bg-brand/8',
                        'hover:bg-brand/6',
                        '[&:hover]:border-l-2 [&:hover]:border-l-brand',
                      )}
                    >
                      {/* Checkbox */}
                      <td
                        className="px-4 py-3 w-10"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleRow(dep.id)}
                          className="h-3.5 w-3.5 cursor-pointer rounded border-brand/30 bg-panel accent-[#55c3ff]"
                        />
                      </td>

                      {/* Deposit ID */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-bold text-brand-soft">{dep.depositId}</span>
                          {hasDiscrepancy && (
                            <AlertTriangle className="h-3 w-3 flex-shrink-0 text-amber-300" title="Amount discrepancy" />
                          )}
                        </div>
                        {dep.refId && (
                          <p className="text-[10px] text-white/35 mt-0.5 font-mono">{dep.refId}</p>
                        )}
                      </td>

                      {/* Submitted */}
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-white/50">
                        {fmtDate(dep.createdAt, 'short')}
                      </td>

                      {/* Deposit Date */}
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-white/50">
                        {fmtDate(dep.depositDate, 'short')}
                      </td>

                      {/* Location */}
                      <td className="px-4 py-3 max-w-[160px]">
                        <p className="text-sm text-white/80 truncate">{dep.locationName ?? dep.location ?? '—'}</p>
                        {dep.officeName && (
                          <p className="text-[10px] text-white/35 truncate">{dep.officeName}</p>
                        )}
                      </td>

                      {/* Deposit Total */}
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <span className="font-mono text-sm font-medium text-white/90 tabular-nums">
                          {fmt$(dep.depositTotal)}
                        </span>
                      </td>

                      {/* Actual */}
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <span className="font-mono text-sm tabular-nums text-white/60">
                          {fmt$(dep.actualDeposit)}
                        </span>
                      </td>

                      {/* Posted */}
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <span className="font-mono text-sm tabular-nums text-emerald-400">
                          {fmt$(dep.postedAmount)}
                        </span>
                      </td>

                      {/* Unapplied */}
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <span className={cn(
                          'font-mono text-sm tabular-nums',
                          unapplied > 0 ? 'text-amber-300' : unapplied < 0 ? 'text-red-400' : 'text-white/30',
                        )}>
                          {fmt$(unapplied)}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <StatusBadge status={dep.status} size="sm" />
                      </td>

                      {/* Actions */}
                      <td
                        className="px-4 py-3 whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center gap-1 justify-end">
                          {/* View */}
                          <button
                            onClick={() => setDetailId(dep.id)}
                            className="rounded-lg p-1.5 text-white/30 transition-colors hover:bg-brand/10 hover:text-brand-soft"
                            title="View details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Coordinator: Approve (Open / Pending) */}
                          {canCoordinatorApprove && (
                            <button
                              onClick={(e) => handleApprove(dep, e)}
                              className="p-1.5 rounded text-white/30 hover:text-emerald-400 hover:bg-emerald-400/10 transition-colors"
                              title="Approve"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Manager: Final Approve */}
                          {canManagerApprove && (
                            <button
                              onClick={(e) => handleApprove(dep, e)}
                              className="rounded-lg p-1.5 text-white/30 transition-colors hover:bg-brand/10 hover:text-brand-soft"
                              title="Final Approve"
                            >
                              <CheckCircle className="h-3.5 w-3.5 text-brand-soft" />
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </motion.tbody>
            </table>
          </div>

          {/* ── Pagination ──────────────────────────────────────────────── */}
          {!isLoading && total > 0 && (
            <div className="flex items-center justify-between border-t border-white/10 bg-surface/90 px-5 py-3">
              <p className="text-xs text-white/40">
                Showing{' '}
                <span className="text-white/70 font-medium">{showFrom}–{showTo}</span>
                {' '}of{' '}
                <span className="text-white/70 font-medium">{total}</span>
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 rounded text-white/40 hover:text-white hover:bg-white/10 disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-3 py-1 text-xs text-white/70">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-1.5 rounded text-white/40 hover:text-white hover:bg-white/10 disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── DETAIL PANEL ──────────────────────────────────────────────── */}
      <DepositDetailPanel
        depositId={detailId}
        onClose={() => setDetailId(null)}
      />
    </div>
  );
}
