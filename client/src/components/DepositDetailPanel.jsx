import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, FileText, MessageSquare, Clock, Download, Pencil, Trash2,
  ChevronDown, Send, Info, AlertTriangle,
} from 'lucide-react';
import { useDeposit, useUpdateDeposit, useDeleteDeposit, useAddComment, useApproveDeposit, useRejectDeposit } from '../hooks/useDeposits.js';
import { useAuthStore } from '../stores/authStore.js';
import { Button, StatusBadge, Skeleton } from './ui/index.js';
import { fmt$, fmtDate, fmtRelative, getInitials } from '../lib/utils.js';
import { STATUS_OPTIONS } from '../lib/constants.js';

const panelVariants = {
  hidden: { x: '100%', opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { type: 'spring', stiffness: 300, damping: 32 },
  },
  exit: {
    x: '100%',
    opacity: 0,
    transition: { duration: 0.2 },
  },
};

/* ── Info row ────────────────────────────────────────────────────────────────── */
function InfoRow({ label, value, mono }) {
  return (
    <div>
      <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-0.5">{label}</p>
      <p className={['text-sm text-text-primary', mono && 'font-mono'].join(' ')}>{value ?? '—'}</p>
    </div>
  );
}

/* ── Comment bubble ─────────────────────────────────────────────────────────── */
function CommentBubble({ comment }) {
  const initials = getInitials(comment.userName ?? 'Unknown');
  return (
    <div className="flex items-start gap-2.5">
      <div className="w-7 h-7 rounded-full bg-navy-light border border-gold/15 flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-gold">
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold text-text-primary">{comment.userName ?? 'Staff'}</span>
          <span className="text-[10px] text-text-muted">{fmtRelative(comment.createdAt)}</span>
          {comment.isInternal && (
            <span className="px-1 py-0.5 rounded text-[9px] bg-purple-400/10 text-purple-400 border border-purple-400/15">Internal</span>
          )}
        </div>
        <div className="bg-navy-light rounded-lg p-2.5 border border-gold/[0.07]">
          <p className="text-sm text-text-primary">{comment.text}</p>
        </div>
      </div>
    </div>
  );
}

/* ── Audit entry ─────────────────────────────────────────────────────────────── */
function AuditEntry({ entry }) {
  return (
    <div className="flex items-start gap-3 py-2 border-b border-gold/[0.06] last:border-0">
      <div className="w-1.5 h-1.5 rounded-full bg-gold/40 flex-shrink-0 mt-2" />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-text-primary">{entry.action ?? entry.description}</p>
        <p className="text-[10px] text-text-muted mt-0.5">
          {entry.userName ?? 'System'} &bull; {fmtRelative(entry.createdAt ?? entry.timestamp)}
        </p>
      </div>
    </div>
  );
}

export default function DepositDetailPanel({ depositId, onClose }) {
  const { user } = useAuthStore();
  const role = user?.role ?? 'viewer';
  const isAdmin = ['admin', 'super_admin'].includes(role);
  const isCoordinator = ['rcm_agent', 'rcm_manager', 'admin', 'super_admin'].includes(role);

  const { data, isLoading } = useDeposit(depositId);
  const { mutate: updateDeposit, isPending: isUpdating } = useUpdateDeposit();
  const { mutate: deleteDeposit, isPending: isDeleting } = useDeleteDeposit();
  const { mutate: addComment, isPending: isCommenting } = useAddComment();
  const { mutate: approveDeposit, isPending: isApproving } = useApproveDeposit();
  const { mutate: rejectDeposit, isPending: isRejecting } = useRejectDeposit();

  const [comment, setComment] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [postForm, setPostForm] = useState({ actualDeposit: '', postedAmount: '', status: '' });
  const [activeTab, setActiveTab] = useState('info'); // info | files | comments | audit

  const deposit = data?.deposit ?? null;
  const files = data?.files ?? [];
  const comments = data?.comments ?? [];
  const auditLog = data?.auditLog ?? [];

  // Computed unapplied
  const unapplied = (Number(postForm.actualDeposit || deposit?.actualDeposit) || 0)
    - (Number(postForm.postedAmount || deposit?.postedAmount) || 0);

  function handleSavePost(e) {
    e.preventDefault();
    if (!depositId) return;
    updateDeposit({
      id: depositId,
      actualDeposit: Number(postForm.actualDeposit) || undefined,
      postedAmount: Number(postForm.postedAmount) || undefined,
      status: postForm.status || undefined,
    });
  }

  function handleComment(e) {
    e.preventDefault();
    if (!comment.trim()) return;
    addComment({ depositId, text: comment.trim(), isInternal });
    setComment('');
  }

  function handleDelete() {
    if (!window.confirm('Permanently delete this deposit?')) return;
    deleteDeposit(depositId);
    onClose();
  }

  const TABS = [
    { id: 'info', label: 'Info', icon: Info },
    { id: 'files', label: `Files (${files.length})`, icon: FileText },
    { id: 'comments', label: `Comments (${comments.length})`, icon: MessageSquare },
    { id: 'audit', label: 'Audit Log', icon: Clock },
  ];

  return (
    <AnimatePresence>
      {depositId && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-30 bg-navy/50 backdrop-blur-[2px]"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed right-0 top-0 bottom-0 z-40 w-full max-w-[640px] flex flex-col bg-navy border-l border-gold/15 shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gold/10 bg-navy/90 backdrop-blur-sm flex-shrink-0">
              <div className="flex items-center gap-3">
                {isLoading ? (
                  <Skeleton className="h-5 w-32" />
                ) : (
                  <>
                    <span className="font-mono text-sm font-bold text-gold">
                      {deposit?.depositId ?? 'DEP-XXXXXX'}
                    </span>
                    {deposit?.status && <StatusBadge status={deposit.status} />}
                  </>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-navy-light transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gold/10 flex-shrink-0">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={[
                    'flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium transition-colors border-b-2',
                    activeTab === tab.id
                      ? 'text-gold border-gold'
                      : 'text-text-muted border-transparent hover:text-text-primary',
                  ].join(' ')}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto">
              <div className="flex gap-0">
                {/* Left: main content */}
                <div className="flex-1 p-5 space-y-5 min-w-0">
                  {/* Info tab */}
                  {activeTab === 'info' && (
                    <div className="space-y-5">
                      {isLoading ? (
                        <div className="grid grid-cols-2 gap-4">
                          {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="space-y-1">
                              <Skeleton className="h-3 w-16" />
                              <Skeleton className="h-4 w-28" />
                            </div>
                          ))}
                        </div>
                      ) : deposit ? (
                        <>
                          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                            <InfoRow label="Deposit ID" value={deposit.depositId} mono />
                            <InfoRow label="Reference ID" value={deposit.referenceId} mono />
                            <InfoRow label="Location" value={deposit.locationName ?? deposit.location} />
                            <InfoRow label="Office" value={deposit.officeName ?? deposit.office} />
                            <InfoRow label="Deposit Date" value={fmtDate(deposit.depositDate)} />
                            <InfoRow label="Submitted" value={fmtDate(deposit.createdAt)} />
                            <InfoRow label="Deposit Total" value={fmt$(deposit.depositTotal)} />
                            <InfoRow label="Actual Deposit" value={fmt$(deposit.actualDeposit)} />
                            <InfoRow label="Posted Amount" value={fmt$(deposit.postedAmount)} />
                            <InfoRow label="Unapplied" value={fmt$((deposit.actualDeposit ?? 0) - (deposit.postedAmount ?? 0))} />
                            <InfoRow label="Patient Name" value={deposit.patientName} />
                            <InfoRow label="Date of Service" value={fmtDate(deposit.dateOfService, 'short')} />
                            <InfoRow label="Insurance" value={deposit.insuranceCompany} />
                            <InfoRow label="CDT Codes" value={deposit.cdtCodes} />
                            <InfoRow label="Provider" value={deposit.provider} />
                            <InfoRow label="Billed Amount" value={fmt$(deposit.billedAmount)} />
                            <InfoRow label="Insurance Paid" value={fmt$(deposit.insurancePaid)} />
                            <InfoRow label="Patient Portion" value={fmt$(deposit.patientPortion)} />
                          </div>
                          {deposit.remarks && (
                            <div>
                              <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1">Remarks</p>
                              <p className="text-sm text-text-primary bg-navy-light p-3 rounded-lg border border-gold/[0.07]">
                                {deposit.remarks}
                              </p>
                            </div>
                          )}
                        </>
                      ) : (
                        <p className="text-sm text-text-muted">No deposit data available.</p>
                      )}
                    </div>
                  )}

                  {/* Files tab */}
                  {activeTab === 'files' && (
                    <div className="space-y-2">
                      {files.length === 0 ? (
                        <div className="py-8 text-center text-sm text-text-muted">No files attached</div>
                      ) : files.map((f) => (
                        <div key={f.id} className="flex items-center gap-3 p-3 rounded-lg border border-gold/[0.08] bg-navy-light hover:border-gold/20 transition-colors">
                          <FileText className="w-5 h-5 text-gold/70 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-text-primary truncate">{f.filename ?? f.name}</p>
                            <p className="text-xs text-text-muted">{fmtDate(f.uploadedAt, 'short')}</p>
                          </div>
                          <a
                            href={f.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded text-text-muted hover:text-gold transition-colors"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Comments tab */}
                  {activeTab === 'comments' && (
                    <div className="space-y-4">
                      <div className="space-y-3">
                        {comments.length === 0 ? (
                          <div className="py-6 text-center text-sm text-text-muted">No comments yet</div>
                        ) : comments.map((c) => <CommentBubble key={c.id} comment={c} />)}
                      </div>
                      <form onSubmit={handleComment} className="space-y-2">
                        <textarea
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          placeholder="Add a comment…"
                          rows={3}
                          className="input resize-none text-sm"
                        />
                        <div className="flex items-center justify-between">
                          <label className="flex items-center gap-2 text-xs text-text-muted cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={isInternal}
                              onChange={(e) => setIsInternal(e.target.checked)}
                              className="w-3 h-3 accent-gold"
                            />
                            Internal only
                          </label>
                          <Button type="submit" variant="primary" size="sm" icon={Send} loading={isCommenting}>
                            Comment
                          </Button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Audit tab */}
                  {activeTab === 'audit' && (
                    <div className="space-y-0">
                      {auditLog.length === 0 ? (
                        <div className="py-8 text-center text-sm text-text-muted">No audit trail available</div>
                      ) : auditLog.map((e) => <AuditEntry key={e.id} entry={e} />)}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer: Post Payment + Actions */}
            <div className="flex-shrink-0 border-t border-gold/10 bg-navy/90">
              {/* Post Payment form */}
              {isCoordinator && deposit && (
                <form onSubmit={handleSavePost} className="p-4 border-b border-gold/10">
                  <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
                    Post Payment
                  </p>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="input-label">Actual Deposit</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder={deposit.actualDeposit ?? '0.00'}
                        value={postForm.actualDeposit}
                        onChange={(e) => setPostForm((p) => ({ ...p, actualDeposit: e.target.value }))}
                        className="input text-sm"
                      />
                    </div>
                    <div>
                      <label className="input-label">Posted Amount</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder={deposit.postedAmount ?? '0.00'}
                        value={postForm.postedAmount}
                        onChange={(e) => setPostForm((p) => ({ ...p, postedAmount: e.target.value }))}
                        className="input text-sm"
                      />
                    </div>
                  </div>
                  {/* Unapplied bar */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-text-muted">Unapplied Balance</span>
                      <span className={unapplied > 0 ? 'text-amber-400 font-semibold' : 'text-emerald-400 font-semibold'}>
                        {fmt$(unapplied)}
                      </span>
                    </div>
                    <div className="h-1.5 bg-navy-light rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${unapplied > 0 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                        style={{ width: `${Math.min(100, unapplied > 0 ? 100 : 0)}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={postForm.status}
                      onChange={(e) => setPostForm((p) => ({ ...p, status: e.target.value }))}
                      className="input text-sm flex-1"
                    >
                      <option value="">Keep current status</option>
                      {STATUS_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                    <Button type="submit" variant="gold" size="sm" loading={isUpdating}>
                      Save & Post
                    </Button>
                  </div>
                </form>
              )}

              {/* Admin actions */}
              <div className="flex items-center gap-2 px-4 py-3">
                {isCoordinator && deposit?.status === 'pending' && (
                  <Button
                    variant="primary"
                    size="sm"
                    loading={isApproving}
                    onClick={() => approveDeposit({ id: depositId })}
                  >
                    Approve
                  </Button>
                )}
                {isCoordinator && deposit?.status !== 'rejected' && (
                  <Button
                    variant="outline"
                    size="sm"
                    loading={isRejecting}
                    onClick={() => rejectDeposit({ id: depositId, reason: 'Manual rejection' })}
                  >
                    Reject
                  </Button>
                )}
                {isAdmin && (
                  <>
                    <button className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text-primary transition-colors">
                      <Pencil className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button
                      onClick={handleDelete}
                      className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition-colors ml-auto"
                      disabled={isDeleting}
                    >
                      <Trash2 className="w-3.5 h-3.5" /> {isDeleting ? 'Deleting…' : 'Delete'}
                    </button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
