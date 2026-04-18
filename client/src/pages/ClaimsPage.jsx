import React, { useCallback, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowRight,
  Clock3,
  Download,
  FileWarning,
  Filter,
  RefreshCw,
  Search,
  ShieldAlert,
  TrendingUp,
} from 'lucide-react';
import { useDeposits } from '../hooks/useDeposits';
import api from '../lib/api';
import { fmt$, fmtDate, getDaysOpen } from '../lib/utils';
import { Button, EmptyState, Skeleton, StatusBadge } from '../components/ui';
import toast from 'react-hot-toast';

const OPEN_STATUSES = ['open', 'in progress', 'pending review', 'inprogress', 'submitted', 'in_process'];
const AGE_TABS = [
  { key: 'all', label: 'All outstanding' },
  { key: '30', label: '30-59 days' },
  { key: '60', label: '60-89 days' },
  { key: '90+', label: '90+ days' },
];
const CLAIM_ACTIONS = [
  { key: 'denied', label: 'Mark denied' },
  { key: 'under appeal', label: 'Move to appeal' },
  { key: 'written off', label: 'Write off' },
  { key: 'in progress', label: 'Resubmit' },
];

function ageBucket(days) {
  if (days < 30) return 'under30';
  if (days < 60) return '30';
  if (days < 90) return '60';
  return '90+';
}

function buildClaims(deposits) {
  return (deposits ?? [])
    .filter((d) => OPEN_STATUSES.includes((d.status ?? '').toLowerCase().trim()))
    .map((d) => ({ ...d, daysOpen: getDaysOpen(d.depositDate ?? d.createdAt) }))
    .sort((a, b) => b.daysOpen - a.daysOpen);
}

function SummaryCard({ title, count, amount, icon: Icon, accent }) {
  return (
    <div className="surface-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="section-kicker">{title}</p>
          <p className="mt-3 text-3xl font-bold text-text-primary">{count}</p>
          <p className="mt-2 text-sm font-medium" style={{ color: accent }}>{fmt$(amount)}</p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]" style={{ color: accent }}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function ClaimRow({ claim, onAction }) {
  return (
    <div className="surface-card-soft grid gap-4 p-4 lg:grid-cols-[1.25fr_1fr_0.8fr_0.8fr_0.9fr_1.1fr] lg:items-center">
      <div>
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-brand/20 bg-brand/10 px-2 py-1 font-mono text-[11px] font-semibold text-brand-soft">
            {claim.depositId ?? 'Claim'}
          </span>
          <StatusBadge status={claim.status} size="sm" />
        </div>
        <p className="mt-3 text-sm font-semibold text-text-primary">{claim.patientName ?? 'Unknown patient'}</p>
        <p className="mt-1 text-xs text-text-muted">{claim.insuranceName ?? claim.payer ?? 'Unknown payer'}</p>
      </div>
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-text-soft">Office</p>
        <p className="mt-2 text-sm text-text-primary">{claim.officeName ?? claim.office ?? 'Unassigned'}</p>
        <p className="mt-1 text-xs text-text-muted">Deposit {fmtDate(claim.depositDate ?? claim.createdAt, 'short')}</p>
      </div>
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-text-soft">Days open</p>
        <p className="mt-2 text-lg font-semibold text-text-primary">{claim.daysOpen}d</p>
      </div>
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-text-soft">Billed</p>
        <p className="mt-2 text-sm font-semibold text-text-primary">{fmt$(claim.billedAmount ?? claim.amount)}</p>
      </div>
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-text-soft">Insurance paid</p>
        <p className="mt-2 text-sm font-semibold text-emerald-300">{fmt$(claim.insurancePaid ?? claim.postedAmount ?? 0)}</p>
      </div>
      <div className="flex flex-wrap gap-2 lg:justify-end">
        {CLAIM_ACTIONS.map((action) => (
          <button
            key={action.key}
            onClick={() => onAction(claim, action.key)}
            className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-medium text-text-muted transition hover:border-brand/30 hover:bg-brand/10 hover:text-text-primary"
          >
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function ClaimsPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const { data, isLoading, isError, refetch, isFetching } = useDeposits({ pageSize: 300 });

  const allClaims = useMemo(() => buildClaims(data?.deposits), [data]);
  const filteredClaims = useMemo(() => {
    let list = allClaims;
    const q = search.trim().toLowerCase();

    if (q) {
      list = list.filter((claim) =>
        (claim.depositId ?? '').toLowerCase().includes(q) ||
        (claim.patientName ?? '').toLowerCase().includes(q) ||
        (claim.insuranceName ?? claim.payer ?? '').toLowerCase().includes(q) ||
        (claim.officeName ?? claim.office ?? '').toLowerCase().includes(q)
      );
    }

    if (activeTab !== 'all') {
      list = list.filter((claim) => ageBucket(claim.daysOpen) === activeTab);
    }

    return list;
  }, [allClaims, activeTab, search]);

  const stats = useMemo(() => {
    const calc = (predicate) => {
      const items = allClaims.filter(predicate);
      return {
        count: items.length,
        amount: items.reduce((sum, item) => sum + Number(item.billedAmount ?? item.amount ?? 0), 0),
      };
    };

    return {
      all: calc(() => true),
      '30': calc((claim) => claim.daysOpen >= 30 && claim.daysOpen < 60),
      '60': calc((claim) => claim.daysOpen >= 60 && claim.daysOpen < 90),
      '90+': calc((claim) => claim.daysOpen >= 90),
    };
  }, [allClaims]);

  const handleAction = useCallback(async (claim, nextStatus) => {
    const id = claim._id ?? claim.id;
    setIsUpdating(true);
    try {
      await api.patch(`/deposits/${id}`, { status: nextStatus });
      toast.success(`${claim.depositId ?? 'Claim'} updated to ${nextStatus}`);
      refetch();
    } catch (error) {
      toast.error(error?.response?.data?.message ?? 'Failed to update claim');
    } finally {
      setIsUpdating(false);
    }
  }, [refetch]);

  const handleExport = useCallback(() => {
    if (!filteredClaims.length) {
      toast.error('No claims available to export');
      return;
    }

    const headers = ['Claim ID', 'Patient', 'Insurance', 'Office', 'Deposit Date', 'Days Open', 'Billed', 'Insurance Paid', 'Status'];
    const rows = filteredClaims.map((claim) => [
      claim.depositId ?? '',
      claim.patientName ?? '',
      claim.insuranceName ?? claim.payer ?? '',
      claim.officeName ?? claim.office ?? '',
      fmtDate(claim.depositDate ?? claim.createdAt),
      claim.daysOpen,
      claim.billedAmount ?? claim.amount ?? 0,
      claim.insurancePaid ?? claim.postedAmount ?? 0,
      claim.status ?? '',
    ]);
    const csv = [headers, ...rows].map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `claims-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success('Claims exported');
  }, [filteredClaims]);

  return (
    <div className="space-y-5 pb-8">
      <section className="surface-highlight p-6 md:p-8">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <p className="section-kicker">Claims operations</p>
            <h2 className="mt-3 text-3xl font-bold text-text-primary md:text-5xl">Outstanding claims with clearer urgency and less noise.</h2>
            <p className="mt-4 text-base text-text-muted md:text-lg">Aging buckets, payer context, and next-action controls are now front and center so the team can work the queue faster.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" icon={RefreshCw} loading={isFetching || isUpdating} onClick={() => refetch()}>Refresh</Button>
            <Button icon={Download} onClick={handleExport}>Export CSV</Button>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        {isLoading ? Array.from({ length: 3 }).map((_, index) => <div key={index} className="surface-card h-[132px] animate-pulse" />) : (
          <>
            <SummaryCard title="30-59 day claims" count={stats['30'].count} amount={stats['30'].amount} icon={Clock3} accent="#f6c55f" />
            <SummaryCard title="60-89 day claims" count={stats['60'].count} amount={stats['60'].amount} icon={AlertTriangle} accent="#fb923c" />
            <SummaryCard title="90+ day claims" count={stats['90+'].count} amount={stats['90+'].amount} icon={ShieldAlert} accent="#ff7b8b" />
          </>
        )}
      </div>

      <section className="surface-card p-5 md:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="h-4 w-4 text-text-soft" />
            {AGE_TABS.map((tab) => {
              const count = tab.key === 'all' ? stats.all?.count ?? 0 : stats[tab.key]?.count ?? 0;
              const active = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={[
                    'rounded-2xl border px-3 py-2 text-sm transition',
                    active ? 'border-brand/35 bg-brand/12 text-text-primary' : 'border-white/10 bg-white/[0.03] text-text-muted hover:border-white/20 hover:text-text-primary',
                  ].join(' ')}
                >
                  {tab.label}
                  <span className={['ml-2 rounded-full px-2 py-0.5 text-[11px] font-semibold', active ? 'bg-brand/20 text-brand-soft' : 'bg-white/[0.06] text-text-soft'].join(' ')}>{count}</span>
                </button>
              );
            })}
          </div>
          <div className="relative w-full lg:w-[320px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-soft" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search patient, payer, office, claim ID..."
              className="w-full rounded-2xl border border-white/10 bg-white/[0.04] py-3 pl-10 pr-4 text-sm text-text-primary placeholder:text-text-soft focus:border-brand/40 focus:outline-none"
            />
          </div>
        </div>
      </section>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className="h-28 w-full rounded-3xl" />)}
        </div>
      ) : isError ? (
        <EmptyState icon={AlertTriangle} title="Could not load claims" description="The claims feed is unavailable right now. Try refreshing." action={<Button variant="secondary" icon={RefreshCw} onClick={() => refetch()}>Retry</Button>} />
      ) : filteredClaims.length === 0 ? (
        <EmptyState icon={FileWarning} title="No claims match this view" description="Try a different search term or switch aging buckets." />
      ) : (
        <div className="space-y-3">
          {filteredClaims.map((claim) => <ClaimRow key={claim._id ?? claim.id} claim={claim} onAction={handleAction} />)}
        </div>
      )}

      <section className="surface-card p-5 md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-lg font-semibold text-text-primary">Why this page now feels more operational</p>
            <p className="mt-1 text-sm text-text-muted">The old version buried triage decisions inside a denser table. This version prioritizes urgency, aging, and actions first.</p>
          </div>
          <button className="inline-flex items-center gap-2 text-sm font-medium text-brand-soft" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            Back to top <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </section>
    </div>
  );
}
