import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
  Activity,
  Sparkles,
  Users,
  BadgeCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useEmailLogin } from '../hooks/useAuth.js';
import { useAuthStore } from '../stores/authStore.js';
import AppBrand from '../components/layout/AppBrand.jsx';

const DEMO_LOGINS = [
  { title: 'Admin', email: 'admin@luxdental.com', password: 'Admin@123456' },
  { title: 'Manager', email: 'manager@luxdental.com', password: 'Manager@123456' },
  { title: 'Biller', email: 'coord.ohm@luxdental.com', password: 'Coord@123456' },
  { title: 'Agent', email: 'coord.smile@luxdental.com', password: 'Coord@123456' },
];

const DEMO_USERS = {
  'admin@luxdental.com': {
    id: 'demo-admin',
    firstName: 'Ava',
    lastName: 'Reynolds',
    email: 'admin@luxdental.com',
    role: 'admin',
    status: 'active',
  },
  'manager@luxdental.com': {
    id: 'demo-manager',
    firstName: 'Marcus',
    lastName: 'Lane',
    email: 'manager@luxdental.com',
    role: 'rcm_manager',
    status: 'active',
  },
  'coord.ohm@luxdental.com': {
    id: 'demo-biller',
    firstName: 'Olivia',
    lastName: 'Hart',
    email: 'coord.ohm@luxdental.com',
    role: 'biller',
    status: 'active',
  },
  'coord.smile@luxdental.com': {
    id: 'demo-agent',
    firstName: 'Sam',
    lastName: 'Miller',
    email: 'coord.smile@luxdental.com',
    role: 'rcm_agent',
    status: 'active',
  },
};

function Feature({ icon: Icon, title, copy }) {
  return (
    <div className="surface-card-soft p-4">
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-brand/10 text-brand-soft">
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-sm font-semibold text-text-primary">{title}</p>
      <p className="mt-1 text-sm text-text-muted">{copy}</p>
    </div>
  );
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated, login } = useAuthStore();
  const { mutateAsync: emailLoginAsync } = useEmailLogin();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const stats = useMemo(
    () => [
      { label: 'Daily deposits monitored', value: '280+' },
      { label: 'Avg. reconciliation turnaround', value: '< 4 hrs' },
      { label: 'Practices visible in one hub', value: '12' },
    ],
    []
  );

  function completeDemoLogin(account) {
    const demoUser = DEMO_USERS[account.email];
    if (!demoUser) {
      toast.error('Demo account is not configured');
      return;
    }

    login(`demo-jwt-${demoUser.role}`, demoUser);
    toast.success(`Entered local demo mode as ${account.title}`);
    navigate('/dashboard', { replace: true });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email || !password || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await emailLoginAsync({ email, password });
      navigate('/dashboard', { replace: true });
    } catch (error) {
      const fallbackAccount = DEMO_LOGINS.find(
        (account) => account.email === email && account.password === password
      );

      if (fallbackAccount) {
        completeDemoLogin(fallbackAccount);
        return;
      }

      toast.error(error?.message ?? 'Login failed');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDemoLogin(account) {
    if (isSubmitting) return;
    setEmail(account.email);
    setPassword(account.password);
    setIsSubmitting(true);
    try {
      await emailLoginAsync({ email: account.email, password: account.password });
      navigate('/dashboard', { replace: true });
    } catch (error) {
      completeDemoLogin(account);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="app-shell relative min-h-screen overflow-hidden px-4 py-6 md:px-6 md:py-8">
      <div className="pointer-events-none absolute inset-0 data-grid opacity-20" />
      <div className="relative mx-auto grid min-h-[calc(100vh-3rem)] max-w-[1440px] gap-6 lg:grid-cols-[1.08fr_0.92fr]">
        <section className="surface-card relative overflow-hidden p-6 md:p-8 lg:p-10">
          <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-brand/20 blur-3xl" />
          <AppBrand />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className="relative mt-10 max-w-2xl"
          >
            <p className="section-kicker">Dental revenue operations</p>
            <h1 className="mt-4 text-balance text-4xl font-bold leading-tight text-text-primary md:text-6xl">
              A sharper front end for teams who live inside the revenue cycle.
            </h1>
            <p className="mt-5 max-w-xl text-base text-text-muted md:text-lg">
              Monitor deposits, claims, variances, and approvals in a workspace that feels clinical, trustworthy, and ready for real operations instead of demo theatrics.
            </p>
          </motion.div>

          <div className="relative mt-10 grid gap-4 md:grid-cols-3">
            {stats.map((item) => (
              <div key={item.label} className="surface-card-soft p-4">
                <p className="text-3xl font-bold text-gradient-brand">{item.value}</p>
                <p className="mt-2 text-sm text-text-muted">{item.label}</p>
              </div>
            ))}
          </div>

          <div className="relative mt-10 grid gap-4 md:grid-cols-2">
            <Feature icon={ShieldCheck} title="Controlled access" copy="Role-aware workflows, clearer permissions, and a more professional first impression for staff." />
            <Feature icon={Activity} title="Operational visibility" copy="KPIs, queue health, and recent activity stay easy to scan without looking over-designed." />
            <Feature icon={Sparkles} title="AI-ready surfaces" copy="The product still has room for AI features, but the interface now supports them without visual clutter." />
            <Feature icon={Users} title="Team-centered UX" copy="Better hierarchy helps coordinators, billers, and managers move faster with less cognitive drag." />
          </div>
        </section>

        <section className="surface-card relative flex items-center justify-center overflow-hidden p-6 md:p-8">
          <div className="absolute inset-x-0 top-0 h-1 bg-brand-gradient" />
          <div className="w-full max-w-md">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <p className="section-kicker">Secure sign in</p>
                <h2 className="mt-2 text-3xl font-bold text-text-primary">Welcome back</h2>
                <p className="mt-2 text-sm text-text-muted">Sign in to your operations workspace.</p>
              </div>
              <div className="hidden rounded-2xl border border-brand/20 bg-brand/10 p-3 text-brand-soft sm:block">
                <BadgeCheck className="h-6 w-6" />
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.22em] text-text-soft">Email</label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-soft" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@practice.com"
                    className="w-full rounded-2xl border border-white/10 bg-white/[0.04] py-3.5 pl-11 pr-4 text-sm text-text-primary placeholder:text-text-soft focus:border-brand/50 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="block text-[11px] font-semibold uppercase tracking-[0.22em] text-text-soft">Password</label>
                  <span className="text-xs text-text-soft">Demo credentials supported</span>
                </div>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-soft" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full rounded-2xl border border-white/10 bg-white/[0.04] py-3.5 pl-11 pr-12 text-sm text-text-primary placeholder:text-text-soft focus:border-brand/50 focus:outline-none"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl p-2 text-text-soft transition hover:bg-white/[0.05] hover:text-text-primary"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand via-brand-strong to-accent px-5 py-3.5 text-sm font-semibold text-slate-950 shadow-lg shadow-brand/20 transition hover:shadow-brand/40 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? 'Signing in...' : 'Sign in'}
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            <div className="mt-8">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold text-text-primary">Quick demo access</p>
                <p className="text-xs text-text-soft">For review only</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {DEMO_LOGINS.map((account) => (
                  <button
                    key={account.title}
                    onClick={() => handleDemoLogin(account)}
                    type="button"
                    className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-left transition hover:border-brand/35 hover:bg-brand/10"
                  >
                    <p className="text-sm font-semibold text-text-primary">{account.title}</p>
                    <p className="mt-1 text-xs text-text-muted">{account.email}</p>
                  </button>
                ))}
              </div>
            </div>

            <p className="mt-8 text-sm text-text-muted">
              Access is limited to approved staff. <a href="/request-access" className="font-medium text-brand-soft">Request access</a>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
