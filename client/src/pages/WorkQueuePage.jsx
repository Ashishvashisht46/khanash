import React, { useCallback, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Eye,
  FileWarning,
  Inbox,
  MessageSquarePlus,
  RefreshCw,
  ShieldAlert,
  XCircle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDeposits } from '../hooks/useDeposits';
import { Button, EmptyState, Skeleton, Textarea } from '../components/ui';
import { fmt$, fmtDate, getDaysOpen } from '../lib/utils';
import api from '../lib/api';
import toast from 'react-hot-toast';

const FILTER_TABS = [
  { key: 'all', label: 'All items' },
  { key: 'discrepancy', label: 'Discrepancies' },
  { key: 'pending_review', label: 'Pending review' },
  { key: 'denied', label: 'Denied' },
  { key: 'appeal', label: 'Under appeal' },
];

function classifyDeposit(deposit) {
  const status = (deposit.status ?? '').toLowerCase().trim();
  const posted = Number(deposit.postedAmount ?? 0);
  const actual = Number(deposit.actualDeposit ?? deposit.amount ?? 0);
  const unapplied = Number(deposit.unappliedAmount ?? 0);

  if (status === 'denied') return 'denied';
  if (status === 'under appeal') return 'appeal';
  if (status === 'pending review') return 'pending_review';
  if (posted > actual || unapplied > 0) return 'discrepancy';
  return null;
}

function buildQueueItems(deposits) {
  return (deposits ?? [])
    .reduce((items, deposit) => {
      const type = classifyDeposit(deposit);
      if (!type) return items;
      const posted = Number(deposit.postedAmount ?? 0);
      const actual = Number(deposit.actualDeposit ?? deposit.amount ?? 0);
      const unapplied = Number(deposit.unappliedAmount ?? 0);

      let reason = '';
      if (type === 'discrepancy') {
        reason = posted > actual ? `Posted ${fmt$(posted)} exceeds actual ${fmt$(actual)}` : `Unapplied amount ${fmt$(unapplied)} still needs resolution`;
      } else if (type === 'pending_review') {
        reason = `Deposit submitted ${getDaysOpen(deposit.depositDate ?? deposit.createdAt)} days ago and still needs review`;
      } else if (type === 'denied') {
        reason = `Claim denied and needs a documented next step`;
      } else if (type === 'appeal') {
        reason = `Appeal is active and may need follow-up documentation`;
      }

      items.push({ ...deposit, _type: type, _reason: reason, _daysOpen: getDaysOpen(deposit.depositDate ?? deposit.createdAt) });
      return items;
    }, [])
    .sort((a, b) => b._daysOpen - a._daysOpen);
}

function laneAccent(type) {
  switch (type) {
    case 'discrepancy': return '#f6c55f';
    case 'pending_review': return '#55c3ff';
    case 'denied': return '#ff7b8b';
    case 'appeal': return '#a78bfa';
    default: return '#97abc9';
  }
}

function WorkItem({ item, processing, onApprove, onDeny, onNote, onView }) {
  const [noteOpen, setNoteOpen] = useState(false);
  const [note, setNote] = useState('');
  const accent = laneAccent(item._type);

  return (
    <motion.div whileHover={{ y: -2 }} className="surface-card overflow-hidden">
      <div className="h-1" style={{ background: accent }} />
      <div className="p-5 md:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 font-mono text-[11px] font-semibold text-text-primary">{item.depositId ?? 'Deposit'}</span>
              <span className="rounded-full border px-2.5 py-1 text-[11px] font-semibold" style={{ borderColor: `${accent}55`, color: accent, background: `${accent}18` }}>
                {FILTER_TABS.find((tab) => tab.key === item._type)?.label ?? item._type}
              </span>
            </div>
            <p className="mt-4 text-base font-semibold text-text-primary">{item._reason}</p>
            <div className="mt-4 grid gap-3 text-sm text-text-muted md:grid-cols-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] text-text-soft">Location</p>
                <p className="mt-1 text-text-primary">{item.locationName ?? item.location ?? 'Unknown'}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] text-text-soft">Deposit date</p>
                <p className="mt-1 text-text-primary">{fmtDate(item.depositDate ?? item.createdAt, 'short')}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] text-text-soft">Billed</p>
                <p className="mt-1 text-text-primary">{fmt$(item.billedAmount ?? item.amount)}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] text-text-soft">Age</p>
                <p className="mt-1 text-text-primary">{item._daysOpen} days</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 xl:max-w-[290px] xl:justify-end">
            <button disabled={processing} onClick={() => onApprove(item)} className="rounded-2xl border border-emerald-400/25 bg-emerald-400/10 px-3 py-2 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-400/20 disabled:opacity-50">
              <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5" />Approve</span>
            </button>
            <button disabled={processing} onClick={() => onDeny(item)} className="rounded-2xl border border-red-400/25 bg-red-400/10 px-3 py-2 text-xs font-semibold text-red-300 transition hover:bg-red-400/20 disabled:opacity-50">
              <span className="inline-flex items-center gap-1.5"><XCircle className="h-3.5 w-3.5" />Deny</span>
            </button>
            <button onClick={() => setNoteOpen((value) => !value)} className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-text-muted transition hover:border-brand/30 hover:text-text-primary">
              <span className="inline-flex items-center gap-1.5"><MessageSquarePlus className="h-3.5 w-3.5" />Add note</span>
            </button>
            <button onClick={() => onView(item)} className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-text-muted transition hover:border-brand/30 hover:text-text-primary">
              <span className="inline-flex items-center gap-1.5"><Eye className="h-3.5 w-3.5" />Open posting</span>
            </button>
          </div>
        </div>

        {noteOpen && (
          <div className="mt-4 space-y-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <Textarea rows={3} placeholder="Add an internal follow-up note..." value={note} onChange={(e) => setNote(e.target.value)} />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setNoteOpen(false)}>Cancel</Button>
              <Button size="sm" onClick={() => {
                if (!note.trim()) {
                  toast.error('Note cannot be empty');
                  return;
                }
                onNote(item, note);
                setNote('');
                setNoteOpen(false);
              }}>Save note</Button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function WorkQueuePage() {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState('all');
  const [processingId, setProcessingId] = useState(null);
  const { data, isLoading, isError, refetch, isFetching } = useDeposits({ pageSize: 300 });

  const allItems = useMemo(() => buildQueueItems(data?.deposits), [data]);
  const filteredItems = useMemo(() => activeFilter === 'all' ? allItems : allItems.filter((item) => item._type === activeFilter), [allItems, activeFilter]);
  const counts = useMemo(() => ({
    all: allItems.length,
    discrepancy: allItems.filter((item) => item._type === 'discrepancy').length,
    pending_review: allItems.filter((item) => item._type === 'pending_review').length,
    denied: allItems.filter((item) => item._type === 'denied').length,
    appeal: allItems.filter((item) => item._type === 'appeal').length,
  }), [allItems]);

  const handleApprove = useCallback(async (item) => {
    const id = item._id ?? item.id;
    setProcessingId(id);
    try {
      await api.patch(`/deposits/${id}`, { status: 'approved' });
      toast.success(`${item.depositId ?? 'Deposit'} approved`);
      refetch();
    } catch (error) {
      toast.error(error?.response?.data?.message ?? 'Failed to approve item');
    } finally {
      setProcessingId(null);
    }
  }, [refetch]);

  const handleDeny = useCallback(async (item) => {
    const id = item._id ?? item.id;
    setProcessingId(id);
    try {
      await api.patch(`/deposits/${id}`, { status: 'denied' });
      toast.success(`${item.depositId ?? 'Deposit'} denied`);
      refetch();
    } catch (error) {
      toast.error(error?.response?.data?.message ?? 'Failed to deny item');
    } finally {
      setProcessingId(null);
    }
  }, [refetch]);

  const handleNote = useCallback(async (item, text) => {
    const id = item._id ?? item.id;
    try {
      await api.post(`/deposits/${id}/comments`, { text, isInternal: true });
      toast.success('Note added');
    } catch (error) {
      toast.error(error?.response?.data?.message ?? 'Failed to add note');
    }
  }, []);

  const handleView = useCallback((item) => {
    navigate(`/postings?highlight=${item._id ?? item.id}`);
  }, [navigate]);

  return (
    <div className="space-y-5 pb-8">
      <section className="surface-highlight p-6 md:p-8">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <p className="section-kicker">Action queue</p>
            <h2 className="mt-3 text-3xl font-bold text-text-primary md:text-5xl">One queue for the items that actually need attention.</h2>
            <p className="mt-4 text-base text-text-muted md:text-lg">Instead of scanning noisy tables, the team now gets reason-first cards with fast approve, deny, note, and drill-in actions.</p>
          </div>
          <Button variant="secondary" icon={RefreshCw} loading={isFetching || Boolean(processingId)} onClick={() => refetch()}>Refresh queue</Button>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="surface-card p-5"><p className="section-kicker">Total queue</p><p className="mt-3 text-3xl font-bold text-text-primary">{counts.all}</p><p className="mt-2 text-sm text-text-muted">All items currently needing human review.</p></div>
        <div className="surface-card p-5"><p className="section-kicker">Discrepancies</p><p className="mt-3 text-3xl font-bold text-text-primary">{counts.discrepancy}</p><p className="mt-2 text-sm text-text-muted">Posted or unapplied amounts that need reconciliation.</p></div>
        <div className="surface-card p-5"><p className="section-kicker">Pending review</p><p className="mt-3 text-3xl font-bold text-text-primary">{counts.pending_review}</p><p className="mt-2 text-sm text-text-muted">Deposits waiting for approval or posting review.</p></div>
        <div className="surface-card p-5"><p className="section-kicker">Denied and appeal</p><p className="mt-3 text-3xl font-bold text-text-primary">{counts.denied + counts.appeal}</p><p className="mt-2 text-sm text-text-muted">Claim exceptions that need follow-up and documentation.</p></div>
      </div>

      <section className="surface-card p-5 md:p-6">
        <div className="flex flex-wrap gap-2">
          {FILTER_TABS.map((tab) => {
            const active = activeFilter === tab.key;
            return (
              <button key={tab.key} onClick={() => setActiveFilter(tab.key)} className={[
                'rounded-2xl border px-3 py-2 text-sm transition',
                active ? 'border-brand/35 bg-brand/12 text-text-primary' : 'border-white/10 bg-white/[0.03] text-text-muted hover:border-white/20 hover:text-text-primary',
              ].join(' ')}>
                {tab.label}
                <span className={['ml-2 rounded-full px-2 py-0.5 text-[11px] font-semibold', active ? 'bg-brand/20 text-brand-soft' : 'bg-white/[0.06] text-text-soft'].join(' ')}>{counts[tab.key] ?? 0}</span>
              </button>
            );
          })}
        </div>
      </section>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-40 w-full rounded-3xl" />)}</div>
      ) : isError ? (
        <EmptyState icon={AlertTriangle} title="Could not load work queue" description="The queue feed is unavailable right now. Try refreshing." action={<Button variant="secondary" icon={RefreshCw} onClick={() => refetch()}>Retry</Button>} />
      ) : filteredItems.length === 0 ? (
        <EmptyState icon={Inbox} title="Queue is clear" description="Nothing in this lane needs work right now." />
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item) => (
            <WorkItem
              key={item._id ?? item.id}
              item={item}
              processing={processingId === (item._id ?? item.id)}
              onApprove={handleApprove}
              onDeny={handleDeny}
              onNote={handleNote}
              onView={handleView}
            />
          ))}
        </div>
      )}

      <section className="surface-card p-5 md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-lg font-semibold text-text-primary">New work queue philosophy</p>
            <p className="mt-1 text-sm text-text-muted">Reason-first cards cut down hunting. The action buttons now sit where the decision is made.</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-brand-soft">
            <AlertCircle className="h-4 w-4" /> Queue logic is still powered by your existing deposit data.
          </div>
        </div>
      </section>
    </div>
  );
}
