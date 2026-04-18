import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Building2,
  AlertCircle,
  Clock3,
  DollarSign,
  FileWarning,
  Inbox,
  RefreshCw,
  TrendingUp,
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { useDepositStats } from '../hooks/useDeposits.js';
import { useAuthStore } from '../stores/authStore.js';
import { fmt$, fmtRelative } from '../lib/utils.js';
import { Button, StatusBadge } from '../components/ui';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Tooltip, Legend, Filler);

const FALLBACK = {
  totalDeposits: 217,
  totalAmount: 412850,
  pendingCount: 14,
  pendingAmount: 52400,
  approvedCount: 41,
  approvedAmount: 104200,
  postedCount: 152,
  postedAmount: 232650,
  rejectedCount: 10,
  outstandingAmount: 92500,
  outstanding60d: 37800,
  outstanding90d: 21200,
  collectionRate: 87,
  workQueueCount: 8,
  chartData: {
    byStatus: {
      labels: ['Pending', 'In Review', 'Approved', 'Posted', 'On Hold', 'Rejected'],
      data: [14, 22, 41, 152, 7, 10],
      colors: ['#f6c55f', '#5ab6ff', '#36d399', '#55c3ff', '#a78bfa', '#ff7b8b'],
    },
    revenueTrend: {
      labels: ['9w', '8w', '7w', '6w', '5w', '4w', '3w', 'This wk'],
      billed: [305000, 322000, 291000, 348000, 330000, 316000, 341000, 412850],
      posted: [276000, 295000, 268000, 315000, 304000, 289000, 318000, 379200],
    },
    byLocation: {
      labels: ['Downtown', 'Westside', 'Northpark', 'Eastgate', 'Lakeview'],
      data: [118000, 96500, 87200, 74450, 36700],
      colors: ['#55c3ff', '#7ef0c7', '#a78bfa', '#f6c55f', '#ff7b8b'],
    },
  },
  locationPerformance: [
    { name: 'Downtown Dental', amount: 118000 },
    { name: 'Westside Family', amount: 96500 },
    { name: 'Northpark Smiles', amount: 87200 },
    { name: 'Eastgate Dental', amount: 74450 },
    { name: 'Lakeview Oral Care', amount: 36700 },
  ],
  recentActivity: [
    { id: 1, type: 'approved', action: 'DEP-A3X8K2 approved by Sarah M.', meta: { time: new Date(Date.now() - 4 * 60_000) } },
    { id: 2, type: 'deposit', action: 'DEP-BQ71WP posted to ledger', meta: { time: new Date(Date.now() - 18 * 60_000) } },
    { id: 3, type: 'action', action: 'Claim CLM-882 submitted for appeal', meta: { time: new Date(Date.now() - 55 * 60_000) } },
    { id: 4, type: 'denied', action: 'CLM-794 denied by Delta Dental', meta: { time: new Date(Date.now() - 120 * 60_000) } },
  ],
};

function StatCard({ title, value, copy, icon: Icon, accent, onClick }) {
  return (
    <motion.button
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className="surface-card relative overflow-hidden p-5 text-left"
    >
      <div className="absolute right-0 top-0 h-24 w-24 rounded-full blur-3xl" style={{ background: `${accent}33` }} />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="section-kicker">{title}</p>
          <p className="mt-3 text-3xl font-bold text-text-primary">{value}</p>
          <p className="mt-2 text-sm text-text-muted">{copy}</p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]" style={{ color: accent }}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </motion.button>
  );
}

function SectionCard({ title, copy, action, children }) {
  return (
    <section className="surface-card p-5 md:p-6">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <p className="text-lg font-semibold text-text-primary">{title}</p>
          {copy && <p className="mt-1 text-sm text-text-muted">{copy}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { data, isLoading, isError, refetch, isFetching } = useDepositStats();

  const stats = data ?? FALLBACK;
  const firstName = user?.firstName ?? 'Team';

  const barData = useMemo(() => ({
    labels: stats.chartData?.byStatus?.labels ?? [],
    datasets: [{
      data: stats.chartData?.byStatus?.data ?? [],
      backgroundColor: stats.chartData?.byStatus?.colors ?? [],
      borderRadius: 14,
      borderSkipped: false,
    }],
  }), [stats]);

  const lineData = useMemo(() => ({
    labels: stats.chartData?.revenueTrend?.labels ?? [],
    datasets: [
      {
        label: 'Billed',
        data: stats.chartData?.revenueTrend?.billed ?? [],
        borderColor: '#55c3ff',
        backgroundColor: 'rgba(85,195,255,0.14)',
        fill: true,
        tension: 0.38,
      },
      {
        label: 'Posted',
        data: stats.chartData?.revenueTrend?.posted ?? [],
        borderColor: '#7ef0c7',
        backgroundColor: 'rgba(126,240,199,0.08)',
        fill: true,
        tension: 0.38,
      },
    ],
  }), [stats]);

  const doughnutData = useMemo(() => ({
    labels: stats.chartData?.byLocation?.labels ?? [],
    datasets: [{
      data: stats.chartData?.byLocation?.data ?? [],
      backgroundColor: stats.chartData?.byLocation?.colors ?? [],
      borderColor: '#13233f',
      borderWidth: 3,
    }],
  }), [stats]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: '#97abc9' } },
      tooltip: {
        backgroundColor: '#0f1b31',
        borderColor: 'rgba(85,195,255,0.18)',
        borderWidth: 1,
        titleColor: '#f3f7fe',
        bodyColor: '#c4d2e8',
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#97abc9' } },
      y: { grid: { color: 'rgba(151,171,201,0.12)' }, ticks: { color: '#97abc9' } },
    },
  };

  return (
    <div className="space-y-5 pb-8">
      <section className="surface-highlight overflow-hidden p-6 md:p-8">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <p className="section-kicker">Executive snapshot</p>
            <h2 className="mt-3 text-3xl font-bold text-text-primary md:text-5xl">Morning, {firstName}. Your revenue cycle is moving.</h2>
            <p className="mt-4 max-w-2xl text-base text-text-muted md:text-lg">
              Posted revenue is trending well, but there are still pending deposits and aging claims worth pulling forward before they become avoidable drag.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" icon={RefreshCw} loading={isFetching} onClick={() => refetch()}>Refresh data</Button>
            <Button icon={ArrowRight} onClick={() => navigate('/new-deposit')}>Create deposit</Button>
          </div>
        </div>
      </section>

      {isError && (
        <div className="surface-card flex items-center gap-3 p-4 text-sm text-text-muted">
          <AlertCircle className="h-5 w-5 text-warning" />
          Live stats are unavailable right now, so the dashboard is showing polished demo data.
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Collected" value={fmt$(stats.totalAmount)} copy={`${stats.totalDeposits} deposits tracked`} icon={DollarSign} accent="#55c3ff" onClick={() => navigate('/postings')} />
        <StatCard title="Posted" value={fmt$(stats.postedAmount)} copy={`${stats.postedCount} items finalized`} icon={TrendingUp} accent="#7ef0c7" onClick={() => navigate('/postings')} />
        <StatCard title="Pending" value={fmt$(stats.pendingAmount)} copy={`${stats.pendingCount} items awaiting action`} icon={Clock3} accent="#f6c55f" onClick={() => navigate('/workqueue')} />
        <StatCard title="Outstanding" value={fmt$(stats.outstandingAmount)} copy={`${stats.rejectedCount} claims need follow-up`} icon={FileWarning} accent="#ff7b8b" onClick={() => navigate('/claims')} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.35fr_0.95fr]">
        <SectionCard title="Revenue trend" copy="Billed versus posted amounts over the last eight weeks.">
          <div className="h-[320px]">{isLoading ? <div className="h-full animate-pulse rounded-2xl bg-white/[0.04]" /> : <Line data={lineData} options={chartOptions} />}</div>
        </SectionCard>
        <SectionCard title="Revenue by location" copy="Practice contribution to current posted volume.">
          <div className="h-[320px]">{isLoading ? <div className="h-full animate-pulse rounded-2xl bg-white/[0.04]" /> : <Doughnut data={doughnutData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#97abc9' } } } }} />}</div>
        </SectionCard>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.05fr_1.2fr_0.95fr]">
        <SectionCard title="Status mix" copy="Current processing mix across deposit statuses.">
          <div className="h-[280px]">{isLoading ? <div className="h-full animate-pulse rounded-2xl bg-white/[0.04]" /> : <Bar data={barData} options={chartOptions} />}</div>
        </SectionCard>

        <SectionCard title="Recent activity" copy="A quick read on what changed most recently." action={<button onClick={() => navigate('/postings')} className="text-sm font-medium text-brand-soft">View postings</button>}>
          <div className="space-y-3">
            {(stats.recentActivity ?? []).map((item) => (
              <div key={item.id} className="surface-card-soft flex items-start gap-3 p-4">
                <div className="mt-1 h-2.5 w-2.5 rounded-full bg-brand" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-text-primary">{item.action}</p>
                  <p className="mt-1 text-xs text-text-muted">{fmtRelative(item.meta?.time)}</p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Priority lanes" copy="Fast paths the team should keep warm today.">
          <div className="space-y-3">
            <div className="surface-card-soft p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-text-primary">Work queue</p>
                <StatusBadge status="pending" size="sm" />
              </div>
              <p className="mt-2 text-sm text-text-muted">{stats.workQueueCount} items need review before close of day.</p>
              <button onClick={() => navigate('/workqueue')} className="mt-3 text-sm font-medium text-brand-soft">Open queue</button>
            </div>
            <div className="surface-card-soft p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-text-primary">Aging claims</p>
                <StatusBadge status="on_hold" size="sm" />
              </div>
              <p className="mt-2 text-sm text-text-muted">60+ days: {fmt$(stats.outstanding60d)}. 90+ days: {fmt$(stats.outstanding90d)}.</p>
              <button onClick={() => navigate('/claims')} className="mt-3 text-sm font-medium text-brand-soft">Review claims</button>
            </div>
            <div className="surface-card-soft p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-text-primary">Locations</p>
                <Building2 className="h-4 w-4 text-accent" />
              </div>
              <p className="mt-2 text-sm text-text-muted">Top performer: {stats.locationPerformance?.[0]?.name ?? 'Downtown Dental'}.</p>
              <button onClick={() => navigate('/locations')} className="mt-3 text-sm font-medium text-brand-soft">Compare sites</button>
            </div>
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Location performance" copy="Posted amount by practice for a quick comparative view.">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {(stats.locationPerformance ?? []).map((location) => (
            <div key={location.name} className="surface-card-soft p-4">
              <p className="text-sm font-semibold text-text-primary">{location.name}</p>
              <p className="mt-3 text-2xl font-bold text-gradient-brand">{fmt$(location.amount)}</p>
              <div className="mt-4 h-2 rounded-full bg-white/[0.06]">
                <div className="h-2 rounded-full bg-gradient-to-r from-brand to-accent" style={{ width: `${Math.max(18, Math.round((location.amount / (stats.locationPerformance?.[0]?.amount || location.amount)) * 100))}%` }} />
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

