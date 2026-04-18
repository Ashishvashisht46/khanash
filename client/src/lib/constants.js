/* ─────────────────────────────────────────────────────────────────────────────
   Constants — Lux Dental Marketing RCM Portal
   Keep this file as the single source of truth for enumerations, labels, and
   colour mappings used throughout the UI.
───────────────────────────────────────────────────────────────────────────── */

/* ─── Deposit / posting status ──────────────────────────────────────────── */
export const STATUS_OPTIONS = [
  { value: 'pending',     label: 'Pending',     description: 'Awaiting initial review' },
  { value: 'in_review',   label: 'In Review',   description: 'Being reviewed by a team member' },
  { value: 'approved',    label: 'Approved',    description: 'Approved and ready for posting' },
  { value: 'posted',      label: 'Posted',      description: 'Successfully posted to ledger' },
  { value: 'rejected',    label: 'Rejected',    description: 'Rejected — requires correction' },
  { value: 'on_hold',     label: 'On Hold',     description: 'Temporarily paused' },
  { value: 'closed',      label: 'Closed',      description: 'Completed and closed' },
];

export const STATUS_VALUES = STATUS_OPTIONS.map((s) => s.value);

/* ─── Claim status ──────────────────────────────────────────────────────── */
export const CLAIM_STATUS_OPTIONS = [
  { value: 'not_submitted',  label: 'Not Submitted'  },
  { value: 'submitted',      label: 'Submitted'      },
  { value: 'in_process',     label: 'In Process'     },
  { value: 'partial_pay',    label: 'Partial Pay'    },
  { value: 'paid',           label: 'Paid'           },
  { value: 'denied',         label: 'Denied'         },
  { value: 'appealing',      label: 'Appealing'      },
  { value: 'written_off',    label: 'Written Off'    },
];

/* ─── User roles ────────────────────────────────────────────────────────── */
export const ROLE_OPTIONS = [
  { value: 'super_admin',  label: 'Super Admin',  description: 'Full system access' },
  { value: 'admin',        label: 'Admin',        description: 'Location-level admin' },
  { value: 'rcm_manager',  label: 'RCM Manager',  description: 'Oversees RCM team' },
  { value: 'rcm_agent',    label: 'RCM Agent',    description: 'Posts and processes deposits' },
  { value: 'biller',       label: 'Biller',       description: 'Insurance billing specialist' },
  { value: 'viewer',       label: 'Viewer',       description: 'Read-only access' },
  { value: 'pending',      label: 'Pending',      description: 'Awaiting access approval' },
];

export const ROLE_VALUES = ROLE_OPTIONS.map((r) => r.value);

/* ─── Page titles (route → display name) ───────────────────────────────── */
export const PAGE_TITLES = {
  '/dashboard':   'Dashboard',
  '/postings':    'Deposit Postings',
  '/new-deposit': 'New Deposit',
  '/claims':      'Claims',
  '/workqueue':   'Work Queue',
  '/report':      'Reports',
  '/locations':   'Locations',
  '/users':       'Users',
  '/role-assign': 'Role Assignment',
};

/* ─── Status → Tailwind colour mapping ─────────────────────────────────── */
export const STATUS_COLORS = {
  // Deposit statuses
  pending:      { bg: 'bg-warning/10',  text: 'text-warning',  border: 'border-warning/20',  dot: 'bg-warning'  },
  in_review:    { bg: 'bg-info/10',     text: 'text-info',     border: 'border-info/20',     dot: 'bg-info'     },
  approved:     { bg: 'bg-success/10',  text: 'text-success',  border: 'border-success/20',  dot: 'bg-success'  },
  posted:       { bg: 'bg-purple/10',   text: 'text-purple',   border: 'border-purple/20',   dot: 'bg-purple'   },
  rejected:     { bg: 'bg-danger/10',   text: 'text-danger',   border: 'border-danger/20',   dot: 'bg-danger'   },
  on_hold:      { bg: 'bg-gold/10',     text: 'text-gold',     border: 'border-gold/20',     dot: 'bg-gold'     },
  closed:       { bg: 'bg-navy-light',  text: 'text-text-muted', border: 'border-gold/10',   dot: 'bg-text-muted' },
  // Claim statuses
  not_submitted:{ bg: 'bg-navy-light',  text: 'text-text-muted', border: 'border-gold/10',   dot: 'bg-text-muted' },
  submitted:    { bg: 'bg-info/10',     text: 'text-info',     border: 'border-info/20',     dot: 'bg-info'     },
  in_process:   { bg: 'bg-warning/10',  text: 'text-warning',  border: 'border-warning/20',  dot: 'bg-warning'  },
  partial_pay:  { bg: 'bg-gold/10',     text: 'text-gold',     border: 'border-gold/20',     dot: 'bg-gold'     },
  paid:         { bg: 'bg-success/10',  text: 'text-success',  border: 'border-success/20',  dot: 'bg-success'  },
  denied:       { bg: 'bg-danger/10',   text: 'text-danger',   border: 'border-danger/20',   dot: 'bg-danger'   },
  appealing:    { bg: 'bg-purple/10',   text: 'text-purple',   border: 'border-purple/20',   dot: 'bg-purple'   },
  written_off:  { bg: 'bg-navy-light',  text: 'text-text-muted', border: 'border-gold/10',   dot: 'bg-text-muted' },
};

/* ─── Role → colour mapping ─────────────────────────────────────────────── */
export const ROLE_COLORS = {
  super_admin: { bg: 'bg-gold/15',     text: 'text-gold',     border: 'border-gold/25'     },
  admin:       { bg: 'bg-gold/10',     text: 'text-gold-dark', border: 'border-gold/20'    },
  rcm_manager: { bg: 'bg-purple/10',   text: 'text-purple',   border: 'border-purple/20'   },
  rcm_agent:   { bg: 'bg-info/10',     text: 'text-info',     border: 'border-info/20'     },
  biller:      { bg: 'bg-success/10',  text: 'text-success',  border: 'border-success/20'  },
  viewer:      { bg: 'bg-navy-light',  text: 'text-text-muted', border: 'border-gold/10'   },
  pending:     { bg: 'bg-warning/10',  text: 'text-warning',  border: 'border-warning/20'  },
};

/* ─── Payment method options ─────────────────────────────────────────────── */
export const PAYMENT_METHODS = [
  { value: 'check',        label: 'Check'          },
  { value: 'eft',          label: 'EFT / ACH'      },
  { value: 'credit_card',  label: 'Credit Card'    },
  { value: 'cash',         label: 'Cash'           },
  { value: 'insurance_era', label: 'Insurance ERA'  },
  { value: 'other',        label: 'Other'          },
];

/* ─── Insurance payer types ──────────────────────────────────────────────── */
export const PAYER_TYPES = [
  { value: 'primary',   label: 'Primary'   },
  { value: 'secondary', label: 'Secondary' },
  { value: 'tertiary',  label: 'Tertiary'  },
  { value: 'patient',   label: 'Patient'   },
];

/* ─── Pagination defaults ────────────────────────────────────────────────── */
export const DEFAULT_PAGE_SIZE = 25;
export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

/* ─── Date range presets ─────────────────────────────────────────────────── */
export const DATE_RANGE_PRESETS = [
  { value: 'today',        label: 'Today'          },
  { value: 'yesterday',    label: 'Yesterday'      },
  { value: 'this_week',    label: 'This Week'      },
  { value: 'last_week',    label: 'Last Week'      },
  { value: 'this_month',   label: 'This Month'     },
  { value: 'last_month',   label: 'Last Month'     },
  { value: 'last_30_days', label: 'Last 30 Days'   },
  { value: 'last_90_days', label: 'Last 90 Days'   },
  { value: 'this_year',    label: 'This Year'      },
  { value: 'custom',       label: 'Custom Range'   },
];

/* ─── Work queue task types ──────────────────────────────────────────────── */
export const TASK_TYPES = [
  { value: 'follow_up',    label: 'Follow Up'       },
  { value: 'appeal',       label: 'Appeal'          },
  { value: 'resubmit',     label: 'Resubmit Claim'  },
  { value: 'correction',   label: 'Correction'      },
  { value: 'verification', label: 'Verification'    },
  { value: 'review',       label: 'Review'          },
  { value: 'other',        label: 'Other'           },
];

/* ─── Priority levels ────────────────────────────────────────────────────── */
export const PRIORITY_OPTIONS = [
  { value: 'low',      label: 'Low',      color: 'text-text-muted' },
  { value: 'normal',   label: 'Normal',   color: 'text-info'       },
  { value: 'high',     label: 'High',     color: 'text-warning'    },
  { value: 'urgent',   label: 'Urgent',   color: 'text-danger'     },
];

/* ─── Local storage keys ─────────────────────────────────────────────────── */
export const LS_TOKEN_KEY  = 'rcm_token';
export const LS_USER_KEY   = 'rcm_user';
export const LS_UI_KEY     = 'rcm_ui';

/* ─── Query keys (React Query) ───────────────────────────────────────────── */
export const QK = {
  DEPOSITS:      'deposits',
  DEPOSIT:       'deposit',
  DEPOSIT_STATS: 'deposit_stats',
  CLAIMS:        'claims',
  CLAIM:         'claim',
  LOCATIONS:     'locations',
  LOCATION:      'location',
  OFFICES:       'offices',
  OFFICE:        'office',
  USERS:         'users',
  USER:          'user',
  ACCESS_REQS:   'access_requests',
  CURRENT_USER:  'current_user',
  WORK_QUEUE:    'work_queue',
  REPORT:        'report',
};
