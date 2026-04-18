import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ClipboardList, Copy, Mail, RefreshCw, Search, Shield, ShieldCheck, UserPlus, Users } from 'lucide-react';
import {
  useAccessRequests,
  useApproveAccessRequest,
  useCreateUser,
  useRejectAccessRequest,
  useUpdateUser,
  useUsers,
} from '../hooks/useUsers';
import { useLocations } from '../hooks/useLocations';
import { useAuthStore } from '../stores/authStore';
import { Button, EmptyState, Input, Modal, RoleBadge, Select, Skeleton } from '../components/ui';
import { fmtDate, getInitials } from '../lib/utils';
import { ROLE_OPTIONS } from '../lib/constants';
import toast from 'react-hot-toast';

const STAFF_ROLES = ROLE_OPTIONS.filter((role) => role.value !== 'pending');

function StaffCard({ user, onEdit, onToggle, onRemove, canRemove }) {
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.name || 'Unknown user';
  const initials = getInitials(fullName);
  const isActive = (user.status ?? 'active') === 'active';

  return (
    <div className="surface-card p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand to-accent text-sm font-bold text-slate-950">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-text-primary">{fullName}</p>
          <p className="truncate text-xs text-text-muted">{user.email}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <RoleBadge role={user.role} size="sm" />
            <span className={['rounded-full px-2 py-0.5 text-[11px] font-semibold', isActive ? 'bg-emerald-400/15 text-emerald-300' : 'bg-white/[0.06] text-text-muted'].join(' ')}>
              {isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      </div>

      {(user.locationName || user.officeName) && (
        <p className="mt-4 text-sm text-text-muted">{user.locationName ?? 'No location'}{user.officeName ? ` · ${user.officeName}` : ''}</p>
      )}

      <div className="mt-5 flex flex-wrap gap-2 border-t border-white/10 pt-4">
        <button onClick={() => onEdit(user)} className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-text-muted transition hover:border-brand/30 hover:text-text-primary">Edit</button>
        <button onClick={() => onToggle(user)} className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-text-muted transition hover:border-brand/30 hover:text-text-primary">{isActive ? 'Deactivate' : 'Activate'}</button>
        {canRemove && <button onClick={() => onRemove(user)} className="rounded-2xl border border-red-400/25 bg-red-400/10 px-3 py-2 text-xs font-semibold text-red-300 transition hover:bg-red-400/20">Remove</button>}
      </div>
    </div>
  );
}

function RequestCard({ request, onApprove, onReject }) {
  const fullName = [request.firstName, request.lastName].filter(Boolean).join(' ') || request.name || 'Unknown requester';
  const initials = getInitials(fullName);

  return (
    <div className="surface-card-soft flex items-start gap-4 p-4">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-400/15 text-sm font-bold text-amber-300">{initials}</div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-text-primary">{fullName}</p>
            <p className="text-xs text-text-muted">{request.email}</p>
          </div>
          <p className="text-xs text-text-soft">{fmtDate(request.createdAt, 'short')}</p>
        </div>
        {request.roleHint && <p className="mt-2 text-xs text-text-muted">Requested role: <span className="text-text-primary">{request.roleHint}</span></p>}
        {request.reason && <p className="mt-2 text-sm text-text-muted">{request.reason}</p>}
        <div className="mt-3 flex flex-wrap gap-2">
          <button onClick={() => onApprove(request)} className="rounded-2xl border border-emerald-400/25 bg-emerald-400/10 px-3 py-2 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-400/20">Approve</button>
          <button onClick={() => onReject(request)} className="rounded-2xl border border-red-400/25 bg-red-400/10 px-3 py-2 text-xs font-semibold text-red-300 transition hover:bg-red-400/20">Reject</button>
        </div>
      </div>
    </div>
  );
}

function InviteModal({ isOpen, onClose, locations }) {
  const { mutate: createUser, isPending } = useCreateUser();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', role: '', locationIds: [] });
  const [inviteRole, setInviteRole] = useState('');
  const [inviteLink, setInviteLink] = useState('');

  const locationOptions = locations.map((location) => ({ value: location._id ?? location.id, label: location.name }));

  const reset = () => {
    setForm({ firstName: '', lastName: '', email: '', role: '', locationIds: [] });
    setInviteRole('');
    setInviteLink('');
  };

  function handleClose() {
    reset();
    onClose();
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.email || !form.role) {
      toast.error('Email and role are required');
      return;
    }
    createUser(form, { onSuccess: handleClose });
  }

  function generateInvite() {
    if (!inviteRole) {
      toast.error('Select a role for the invite link');
      return;
    }
    const token = Math.random().toString(36).slice(2, 14).toUpperCase();
    setInviteLink(`${window.location.origin}/invite?token=${token}&role=${inviteRole}`);
  }

  function copyInvite() {
    navigator.clipboard.writeText(inviteLink);
    toast.success('Invite link copied');
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add or invite staff" size="xl">
      <div className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <p className="text-lg font-semibold text-text-primary">Create a staff account</p>
            <p className="mt-1 text-sm text-text-muted">Add a user directly for internal operations.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="First name" value={form.firstName} onChange={(e) => setForm((prev) => ({ ...prev, firstName: e.target.value }))} />
            <Input label="Last name" value={form.lastName} onChange={(e) => setForm((prev) => ({ ...prev, lastName: e.target.value }))} />
          </div>
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))} />
          <Select label="Role" options={STAFF_ROLES} value={form.role} onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value }))} placeholder="Select role" />
          <div>
            <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.22em] text-text-soft">Locations</label>
            <div className="space-y-2 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
              {locationOptions.map((location) => (
                <label key={location.value} className="flex items-center gap-2 text-sm text-text-primary">
                  <input
                    type="checkbox"
                    checked={form.locationIds.includes(location.value)}
                    onChange={(e) => setForm((prev) => ({
                      ...prev,
                      locationIds: e.target.checked ? [...prev.locationIds, location.value] : prev.locationIds.filter((id) => id !== location.value),
                    }))}
                    className="accent-cyan-400"
                  />
                  {location.label}
                </label>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={handleClose}>Cancel</Button>
            <Button size="sm" type="submit" loading={isPending} icon={UserPlus}>Add staff</Button>
          </div>
        </form>

        <div className="space-y-4 rounded-3xl border border-white/10 bg-white/[0.03] p-5">
          <div>
            <p className="text-lg font-semibold text-text-primary">Generate an invite link</p>
            <p className="mt-1 text-sm text-text-muted">Useful for onboarding remote or newly approved staff.</p>
          </div>
          <Select label="Role for invite" options={STAFF_ROLES} value={inviteRole} onChange={(e) => setInviteRole(e.target.value)} placeholder="Select role" />
          <Button variant="secondary" icon={ShieldCheck} onClick={generateInvite}>Generate secure link</Button>
          {inviteLink && (
            <div className="space-y-3 rounded-2xl border border-brand/20 bg-brand/10 p-4">
              <p className="text-sm text-text-primary">This link is ready to send.</p>
              <div className="rounded-2xl border border-white/10 bg-white/[0.05] px-3 py-3 text-xs text-text-primary">{inviteLink}</div>
              <Button size="sm" variant="secondary" icon={Copy} onClick={copyInvite}>Copy link</Button>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

function EditUserModal({ isOpen, onClose, user, locations }) {
  const { mutate: updateUser, isPending } = useUpdateUser();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', role: '', locationId: '', status: 'active' });

  useEffect(() => {
    if (!user) return;
    setForm({
      firstName: user.firstName ?? '',
      lastName: user.lastName ?? '',
      email: user.email ?? '',
      role: user.role ?? '',
      locationId: user.locationId ?? '',
      status: user.status ?? 'active',
    });
  }, [user]);

  if (!user) return null;

  const locationOptions = locations.map((location) => ({ value: location._id ?? location.id, label: location.name }));

  function handleSave() {
    updateUser({ id: user._id ?? user.id, ...form }, { onSuccess: onClose });
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit staff member" size="md" footer={<><Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button><Button size="sm" loading={isPending} onClick={handleSave}>Save changes</Button></>}>
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="First name" value={form.firstName} onChange={(e) => setForm((prev) => ({ ...prev, firstName: e.target.value }))} />
          <Input label="Last name" value={form.lastName} onChange={(e) => setForm((prev) => ({ ...prev, lastName: e.target.value }))} />
        </div>
        <Input label="Email" type="email" value={form.email} onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))} />
        <Select label="Role" options={STAFF_ROLES} value={form.role} onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value }))} placeholder="Select role" />
        <Select label="Location" options={locationOptions} value={form.locationId} onChange={(e) => setForm((prev) => ({ ...prev, locationId: e.target.value }))} placeholder="Select location" />
        <Select label="Status" options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]} value={form.status} onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))} />
      </div>
    </Modal>
  );
}

function ApproveRequestModal({ isOpen, onClose, request, locations }) {
  const { mutate: approve, isPending } = useApproveAccessRequest();
  const [role, setRole] = useState('');
  const [locationId, setLocationId] = useState('');

  useEffect(() => {
    setRole(request?.roleHint ?? '');
    setLocationId('');
  }, [request]);

  if (!request) return null;

  const locationOptions = locations.map((location) => ({ value: location._id ?? location.id, label: location.name }));

  function handleApprove() {
    if (!role) {
      toast.error('Select a role');
      return;
    }
    approve({ requestId: request._id ?? request.id, role, locationId: locationId || undefined }, { onSuccess: onClose });
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Approve access request" size="md" footer={<><Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button><Button size="sm" loading={isPending} onClick={handleApprove}>Approve</Button></>}>
      <div className="space-y-4">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-sm font-semibold text-text-primary">{[request.firstName, request.lastName].filter(Boolean).join(' ') || request.name}</p>
          <p className="mt-1 text-sm text-text-muted">{request.email}</p>
          {request.reason && <p className="mt-3 text-sm text-text-muted">{request.reason}</p>}
        </div>
        <Select label="Role" options={STAFF_ROLES} value={role} onChange={(e) => setRole(e.target.value)} placeholder="Select role" />
        <Select label="Location" options={locationOptions} value={locationId} onChange={(e) => setLocationId(e.target.value)} placeholder="Optional location" />
      </div>
    </Modal>
  );
}

export default function UsersPage() {
  const authUser = useAuthStore((state) => state.user);
  const canRemove = ['admin', 'super_admin'].includes(authUser?.role ?? '');
  const [search, setSearch] = useState('');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [approvingRequest, setApprovingRequest] = useState(null);

  const { data: userData, isLoading, isError, refetch, isFetching } = useUsers({ search, pageSize: 200 });
  const { data: requestData } = useAccessRequests();
  const { data: locationData } = useLocations();
  const { mutate: updateUser } = useUpdateUser();
  const { mutate: rejectRequest } = useRejectAccessRequest();

  const users = userData?.users ?? [];
  const requests = requestData?.requests ?? [];
  const locations = locationData?.locations ?? [];

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter((user) => {
      const name = [user.firstName, user.lastName, user.name].filter(Boolean).join(' ').toLowerCase();
      return name.includes(q) || (user.email ?? '').toLowerCase().includes(q) || (user.role ?? '').toLowerCase().includes(q);
    });
  }, [users, search]);

  const stats = useMemo(() => ({
    total: users.length,
    active: users.filter((user) => (user.status ?? 'active') === 'active').length,
    inactive: users.filter((user) => (user.status ?? 'active') !== 'active').length,
    pending: requests.length,
  }), [users, requests]);

  function toggleUser(user) {
    const nextStatus = (user.status ?? 'active') === 'active' ? 'inactive' : 'active';
    updateUser({ id: user._id ?? user.id, status: nextStatus });
  }

  function removeUser(user) {
    if (!window.confirm(`Remove ${user.firstName ?? user.name}? This cannot be undone.`)) return;
    updateUser({ id: user._id ?? user.id, deleted: true });
  }

  function rejectPending(request) {
    if (!window.confirm('Reject this access request?')) return;
    rejectRequest({ requestId: request._id ?? request.id });
  }

  return (
    <div className="space-y-5 pb-8">
      <section className="surface-highlight p-6 md:p-8">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <p className="section-kicker">People and access</p>
            <h2 className="mt-3 text-3xl font-bold text-text-primary md:text-5xl">A staffing workspace that feels deliberate instead of admin-heavy.</h2>
            <p className="mt-4 text-base text-text-muted md:text-lg">The team page now balances staff visibility, invite actions, and pending approvals without dumping everything into one generic grid.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" icon={ClipboardList} onClick={() => toast('Audit log can be wired next.')}>Audit log</Button>
            <Button icon={UserPlus} onClick={() => setInviteOpen(true)}>Add or invite staff</Button>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="surface-card p-5"><p className="section-kicker">Total staff</p><p className="mt-3 text-3xl font-bold text-text-primary">{stats.total}</p><p className="mt-2 text-sm text-text-muted">Everyone currently visible in the workspace.</p></div>
        <div className="surface-card p-5"><p className="section-kicker">Active</p><p className="mt-3 text-3xl font-bold text-text-primary">{stats.active}</p><p className="mt-2 text-sm text-text-muted">Staff with current access.</p></div>
        <div className="surface-card p-5"><p className="section-kicker">Inactive</p><p className="mt-3 text-3xl font-bold text-text-primary">{stats.inactive}</p><p className="mt-2 text-sm text-text-muted">Users retained but not currently active.</p></div>
        <div className="surface-card p-5"><p className="section-kicker">Pending requests</p><p className="mt-3 text-3xl font-bold text-text-primary">{stats.pending}</p><p className="mt-2 text-sm text-text-muted">Access requests waiting for approval.</p></div>
      </div>

      {requests.length > 0 && (
        <section className="surface-card p-5 md:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-lg font-semibold text-text-primary">Pending access requests</p>
              <p className="mt-1 text-sm text-text-muted">Approve, reject, and assign roles from the same surface.</p>
            </div>
            <span className="rounded-full bg-amber-400/15 px-3 py-1 text-xs font-semibold text-amber-300">{requests.length} waiting</span>
          </div>
          <div className="space-y-3">
            {requests.map((request) => <RequestCard key={request._id ?? request.id} request={request} onApprove={setApprovingRequest} onReject={rejectPending} />)}
          </div>
        </section>
      )}

      <section className="surface-card p-5 md:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-lg font-semibold text-text-primary">Staff directory</p>
            <p className="mt-1 text-sm text-text-muted">Search by name, email, or role.</p>
          </div>
          <div className="flex w-full gap-3 lg:w-auto lg:min-w-[420px]">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-soft" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search staff..." className="w-full rounded-2xl border border-white/10 bg-white/[0.04] py-3 pl-10 pr-4 text-sm text-text-primary placeholder:text-text-soft focus:border-brand/40 focus:outline-none" />
            </div>
            <Button variant="secondary" icon={RefreshCw} loading={isFetching} onClick={() => refetch()}>Refresh</Button>
          </div>
        </div>
      </section>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 8 }).map((_, index) => <Skeleton key={index} className="h-52 w-full rounded-3xl" />)}</div>
      ) : isError ? (
        <EmptyState icon={AlertTriangle} title="Could not load staff" description="The user directory is unavailable right now. Try refreshing." action={<Button variant="secondary" icon={RefreshCw} onClick={() => refetch()}>Retry</Button>} />
      ) : filteredUsers.length === 0 ? (
        <EmptyState icon={Users} title="No staff match this search" description="Try a different search term or invite someone new." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {filteredUsers.map((user) => <StaffCard key={user._id ?? user.id} user={user} onEdit={setEditingUser} onToggle={toggleUser} onRemove={removeUser} canRemove={canRemove} />)}
        </div>
      )}

      <InviteModal isOpen={inviteOpen} onClose={() => setInviteOpen(false)} locations={locations} />
      <EditUserModal isOpen={Boolean(editingUser)} onClose={() => setEditingUser(null)} user={editingUser} locations={locations} />
      <ApproveRequestModal isOpen={Boolean(approvingRequest)} onClose={() => setApprovingRequest(null)} request={approvingRequest} locations={locations} />
    </div>
  );
}
