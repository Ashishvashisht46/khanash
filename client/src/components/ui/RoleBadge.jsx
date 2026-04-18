import React from 'react';
import Badge from './Badge';
import { ShieldCheck, Users, Star, User, Briefcase } from 'lucide-react';

const ROLE_MAP = {
  super_admin: { variant: 'warning', label: 'Super Admin', Icon: ShieldCheck },
  admin: { variant: 'warning', label: 'Admin', Icon: ShieldCheck },
  rcm_manager: { variant: 'completed', label: 'RCM Manager', Icon: Star },
  rcm_agent: { variant: 'info', label: 'RCM Agent', Icon: Users },
  biller: { variant: 'open', label: 'Biller', Icon: Briefcase },
  viewer: { variant: 'neutral', label: 'Viewer', Icon: User },
  pending: { variant: 'pending', label: 'Pending', Icon: User },
};

export default function RoleBadge({ role, size = 'md', showIcon = false, className = '' }) {
  const key = (role ?? '').toLowerCase().trim();
  const config = ROLE_MAP[key] ?? { variant: 'neutral', label: role ?? 'Unknown', Icon: User };
  const { Icon } = config;

  return (
    <Badge variant={config.variant} size={size} className={className}>
      {showIcon && <Icon className={size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5'} />}
      {config.label}
    </Badge>
  );
}
