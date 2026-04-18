import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  CreditCard,
  PlusCircle,
  Sparkles,
  ClipboardList,
  Inbox,
  MapPin,
  Users,
  Shield,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useUiStore } from '../../stores/uiStore';
import { cn, getInitials } from '../../lib/utils';
import { RoleBadge } from '../ui';
import AppBrand from './AppBrand.jsx';

const NAV_MAIN = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Overview' },
  { to: '/postings', icon: CreditCard, label: 'Postings' },
  { to: '/new-deposit', icon: PlusCircle, label: 'New Deposit' },
  { to: '/report', icon: Sparkles, label: 'AI Reports' },
];

const NAV_OPS = [
  { to: '/claims', icon: ClipboardList, label: 'Claims' },
  { to: '/workqueue', icon: Inbox, label: 'Work Queue' },
];

const NAV_ADMIN = [
  { to: '/locations', icon: MapPin, label: 'Locations' },
  { to: '/users', icon: Users, label: 'Team' },
  { to: '/role-assign', icon: Shield, label: 'Access Control' },
];

function canSeeOps(role) {
  return ['coordinator', 'manager', 'admin', 'rcm_agent', 'rcm_manager', 'super_admin', 'biller'].includes(role);
}

function canSeeAdmin(role) {
  return ['admin', 'manager', 'rcm_manager', 'super_admin'].includes(role);
}

function NavItem({ item, collapsed, badge }) {
  const Icon = item.icon;

  return (
    <NavLink
      to={item.to}
      className={({ isActive }) =>
        cn(
          'group relative flex items-center rounded-2xl border px-3 py-3 transition-all duration-200',
          collapsed ? 'justify-center' : 'gap-3',
          isActive
            ? 'border-brand/30 bg-brand/12 text-text-primary shadow-glow'
            : 'border-transparent text-text-muted hover:border-white/10 hover:bg-white/[0.04] hover:text-text-primary'
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon className={cn('h-4.5 w-4.5 flex-shrink-0', isActive ? 'text-brand-soft' : 'text-text-muted group-hover:text-text-primary')} />
          {!collapsed && <span className="truncate text-sm font-medium">{item.label}</span>}
          {!collapsed && badge > 0 && (
            <span className="ml-auto rounded-full bg-danger px-2 py-0.5 text-[11px] font-semibold text-white">
              {badge > 99 ? '99+' : badge}
            </span>
          )}
          {collapsed && badge > 0 && (
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-danger" />
          )}
        </>
      )}
    </NavLink>
  );
}

function SectionTitle({ title, collapsed }) {
  if (collapsed) return <div className="mx-auto my-2 h-px w-8 bg-white/10" />;
  return <p className="px-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-text-soft">{title}</p>;
}

export default function Sidebar({ pendingCount = 0 }) {
  const { user, logout } = useAuthStore();
  const { sidebarCollapsed, toggleSidebar } = useUiStore();
  const navigate = useNavigate();
  const collapsed = sidebarCollapsed;

  const role = user?.role ?? 'viewer';
  const displayName = user ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() : 'User';
  const email = user?.email ?? '';
  const initials = getInitials(displayName);

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <motion.aside
      animate={{ width: collapsed ? 92 : 302 }}
      transition={{ type: 'spring', stiffness: 280, damping: 28 }}
      className="relative z-20 hidden h-screen flex-shrink-0 p-4 lg:block"
    >
      <div className="surface-card flex h-full flex-col overflow-hidden p-3">
        <div className={cn('mb-4 flex items-center', collapsed ? 'justify-center' : 'justify-between')}>
          <AppBrand compact={collapsed} />
          {!collapsed && (
            <button
              onClick={toggleSidebar}
              className="rounded-2xl border border-white/10 bg-white/[0.04] p-2 text-text-muted transition hover:border-white/20 hover:bg-white/[0.08] hover:text-text-primary"
              aria-label="Collapse sidebar"
            >
              <PanelLeftClose className="h-4 w-4" />
            </button>
          )}
          {collapsed && (
            <button
              onClick={toggleSidebar}
              className="absolute right-3 top-3 rounded-2xl border border-white/10 bg-white/[0.04] p-2 text-text-muted transition hover:border-white/20 hover:bg-white/[0.08] hover:text-text-primary"
              aria-label="Expand sidebar"
            >
              <PanelLeftOpen className="h-4 w-4" />
            </button>
          )}
        </div>

        {!collapsed && (
          <div className="surface-highlight mb-5 rounded-3xl p-4">
            <p className="section-kicker">Today</p>
            <p className="mt-2 text-sm text-text-muted">Track deposits, review variances, and keep claims flowing without losing team visibility.</p>
          </div>
        )}

        <nav className="flex-1 space-y-5 overflow-y-auto pr-1">
          <div className="space-y-2">
            <SectionTitle title="Core" collapsed={collapsed} />
            <div className="space-y-1.5">
              {NAV_MAIN.map((item) => <NavItem key={item.to} item={item} collapsed={collapsed} badge={0} />)}
            </div>
          </div>

          {canSeeOps(role) && (
            <div className="space-y-2">
              <SectionTitle title="Operations" collapsed={collapsed} />
              <div className="space-y-1.5">
                {NAV_OPS.map((item) => <NavItem key={item.to} item={item} collapsed={collapsed} badge={0} />)}
              </div>
            </div>
          )}

          {canSeeAdmin(role) && (
            <div className="space-y-2">
              <SectionTitle title="Administration" collapsed={collapsed} />
              <div className="space-y-1.5">
                {NAV_ADMIN.map((item) => (
                  <NavItem key={item.to} item={item} collapsed={collapsed} badge={item.to === '/users' ? pendingCount : 0} />
                ))}
              </div>
            </div>
          )}
        </nav>

        <div className="mt-4 rounded-3xl border border-white/10 bg-white/[0.03] p-3">
          <div className={cn('flex items-center', collapsed ? 'justify-center' : 'gap-3')}>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-brand to-accent text-sm font-bold text-slate-950">
              {initials}
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-text-primary">{displayName}</p>
                <p className="truncate text-xs text-text-muted">{email}</p>
                <div className="mt-2">
                  <RoleBadge role={role} size="sm" />
                </div>
              </div>
            )}
            {!collapsed && (
              <button
                onClick={handleLogout}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-2 text-text-muted transition hover:border-danger/30 hover:bg-danger/10 hover:text-danger"
                aria-label="Log out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            )}
          </div>
          {collapsed && (
            <button
              onClick={handleLogout}
              className="mt-3 flex w-full items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] p-2 text-text-muted transition hover:border-danger/30 hover:bg-danger/10 hover:text-danger"
              aria-label="Log out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </motion.aside>
  );
}
