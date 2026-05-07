import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, Clock3, Search, Command, ChevronDown } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useUiStore } from '../../stores/uiStore';
import { PAGE_TITLES } from '../../lib/constants';
import { THEMES } from '../../lib/brand.js';
import { getInitials } from '../../lib/utils';
import { RoleBadge } from '../ui';

function formatNow() {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(new Date());
}

export default function Topbar({ workQueueCount = 0 }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  const { currentPage, theme, setTheme } = useUiStore();
  const [searchValue, setSearchValue] = useState('');

  const role = user?.role ?? 'viewer';
  const displayName = user ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() : 'User';
  const firstName = user?.firstName ?? 'Team';
  const initials = getInitials(displayName);
  const pageTitle = PAGE_TITLES[location.pathname] ?? PAGE_TITLES[currentPage] ?? 'Dashboard';

  const subtitle = useMemo(() => {
    const map = {
      '/dashboard': 'Daily financial pulse across deposits, claims, and approvals.',
      '/postings': 'Review deposit activity, exceptions, and posting readiness.',
      '/new-deposit': 'Capture new payment batches with clean supporting detail.',
      '/claims': 'Monitor aging claims and next actions by payer or practice.',
      '/workqueue': 'Clear blockers and keep the revenue cycle moving.',
      '/report': 'Generate AI-assisted summaries and executive-ready snapshots.',
      '/locations': 'Compare site performance and operational health.',
      '/users': 'Manage staffing visibility, approvals, and ownership.',
      '/role-assign': 'Control access with clear operational boundaries.',
    };
    return map[location.pathname] ?? 'Operational clarity for your revenue cycle.';
  }, [location.pathname]);

  return (
    <header className="relative z-10 px-4 pt-4 md:px-6 md:pt-6">
      <div className="surface-card flex flex-col gap-4 px-5 py-4 lg:flex-row lg:items-center lg:justify-between lg:px-6">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3 text-sm text-text-muted">
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">{formatNow()}</span>
            <span className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/10 px-3 py-1 text-brand-soft">
              <Clock3 className="h-3.5 w-3.5" />
              Live workspace
            </span>
          </div>
          <h1 className="mt-3 text-3xl font-bold text-text-primary md:text-4xl">{pageTitle}</h1>
          <p className="mt-2 max-w-2xl text-sm text-text-muted md:text-base">{subtitle}</p>
        </div>

        <div className="flex flex-col gap-3 lg:min-w-[520px] lg:max-w-[560px] lg:items-end">
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center lg:justify-end">
            <div className="relative flex-1 sm:max-w-xs lg:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-soft" />
              <input
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="Search deposits, claims, users..."
                className="w-full rounded-2xl border border-white/10 bg-white/[0.04] py-3 pl-10 pr-12 text-sm text-text-primary placeholder:text-text-soft focus:border-brand/40 focus:outline-none"
              />
              <span className="absolute right-3 top-1/2 inline-flex -translate-y-1/2 items-center gap-1 rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1 text-[11px] text-text-soft">
                <Command className="h-3 w-3" />K
              </span>
            </div>

            <button
              onClick={() => workQueueCount > 0 && navigate('/workqueue')}
              className="relative inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-text-muted transition hover:border-white/20 hover:bg-white/[0.08] hover:text-text-primary"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
              {workQueueCount > 0 && <span className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full bg-danger" />}
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3 lg:justify-end">
            {THEMES.length > 1 && (
              <div className="flex items-center rounded-2xl border border-white/10 bg-white/[0.04] p-1">
                {THEMES.map((option) => {
                  const active = theme === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setTheme(option.id)}
                      className={[
                        'rounded-xl px-3 py-2 text-xs font-semibold transition',
                        active
                          ? 'bg-brand text-slate-950 shadow-sm shadow-brand/30'
                          : 'text-text-muted hover:text-text-primary',
                      ].join(' ')}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            )}
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-text-muted">
              Good to see you, <span className="font-semibold text-text-primary">{firstName}</span>
            </div>
            <RoleBadge role={role} size="sm" />
            <button className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 transition hover:border-white/20 hover:bg-white/[0.08]">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-brand to-accent text-sm font-bold text-slate-950">
                {initials}
              </div>
              <div className="hidden text-left sm:block">
                <p className="text-sm font-semibold text-text-primary">{displayName}</p>
                <p className="text-xs text-text-muted">Operations workspace</p>
              </div>
              <ChevronDown className="hidden h-4 w-4 text-text-soft sm:block" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
