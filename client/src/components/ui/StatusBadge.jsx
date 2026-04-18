import React from 'react';
import Badge from './Badge';

const STATUS_MAP = {
  open: { variant: 'open', label: 'Open' },
  pending: { variant: 'pending', label: 'Pending' },
  pending_review: { variant: 'pending', label: 'Pending Review' },
  in_review: { variant: 'info', label: 'In Review' },
  inprogress: { variant: 'inprogress', label: 'In Progress' },
  in_progress: { variant: 'inprogress', label: 'In Progress' },
  approved: { variant: 'completed', label: 'Approved' },
  posted: { variant: 'open', label: 'Posted' },
  completed: { variant: 'completed', label: 'Completed' },
  rejected: { variant: 'denied', label: 'Rejected' },
  denied: { variant: 'denied', label: 'Denied' },
  on_hold: { variant: 'warning', label: 'On Hold' },
  appeal: { variant: 'appeal', label: 'Under Appeal' },
  under_appeal: { variant: 'appeal', label: 'Under Appeal' },
  written_off: { variant: 'writtenOff', label: 'Written Off' },
  writtenoff: { variant: 'writtenOff', label: 'Written Off' },
  mismatch: { variant: 'mismatch', label: 'Totals Mismatch' },
  totals_mismatch: { variant: 'mismatch', label: 'Totals Mismatch' },
};

export default function StatusBadge({ status, size = 'md', dot = true, className = '' }) {
  const key = (status ?? '').toLowerCase().trim().replace(/\s+/g, '_');
  const config = STATUS_MAP[key] ?? { variant: 'neutral', label: status ?? 'Unknown' };

  return (
    <Badge variant={config.variant} size={size} dot={dot} className={className}>
      {config.label}
    </Badge>
  );
}
