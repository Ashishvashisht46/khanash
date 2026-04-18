import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, RefreshCw, Pencil, Save, X, Shield, AlertTriangle,
} from 'lucide-react';
import { useUsers, useUpdateUser } from '../hooks/useUsers';
import { useLocations } from '../hooks/useLocations';
import {
  Button, Card, Table, Input, Select, RoleBadge,
  EmptyState, Skeleton,
} from '../components/ui';
import { getInitials } from '../lib/utils';
import { ROLE_OPTIONS } from '../lib/constants';
import toast from 'react-hot-toast';

/* ─── motion ─────────────────────────────────────────────────────────────── */
const containerVariants = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.04 } },
};
const rowVariants = {
  hidden:  { opacity: 0, x: -6 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.2 } },
};
const panelVariants = {
  hidden:  { opacity: 0, height: 0, y: -8 },
  visible: {
    opacity: 1, height: 'auto', y: 0,
    transition: { type: 'spring', stiffness: 280, damping: 26 },
  },
  exit:    { opacity: 0, height: 0, y: -4, transition: { duration: 0.18 } },
};

const STAFF_ROLES = ROLE_OPTIONS.filter((r) => r.value !== 'pending');

/* ─── EditPanel ───────────────────────────────────────────────────────────── */
function EditPanel({ user, locations, onSave, onCancel, isSaving }) {
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.name || '—';

  const [form, setForm] = useState({
    firstName:   user.firstName  ?? '',
    lastName:    user.lastName   ?? '',
    email:       user.email      ?? '',
    role:        user.role       ?? '',
    status:      user.status     ?? 'active',
    locationId:  user.locationId ?? '',
    locationIds: user.locationIds ?? [],
    officeIds:   user.officeIds  ?? [],
  });

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const toggleLocation = (id) => setForm((p) => ({
    ...p,
    locationIds: p.locationIds.includes(id)
      ? p.locationIds.filter((x) => x !== id)
      : [...p.locationIds, id],
  }));

  /* collect all offices from all locations */
  const allOffices = useMemo(
    () => (locations ?? []).flatMap((l) => l.offices ?? []),
    [locations]
  );

  const toggleOffice = (id) => setForm((p) => ({
    ...p,
    officeIds: p.officeIds.includes(id)
      ? p.officeIds.filter((x) => x !== id)
      : [...p.officeIds, id],
  }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.role) { toast.error('Role is required'); return; }
    onSave({ id: user._id ?? user.id, ...form });
  };

  return (
    <motion.div
      key="edit-panel"
      variants={panelVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="overflow-hidden"
    >
      <Card className="mx-0 mt-2 rounded-xl border-gold/30 bg-gold/[0.025]">
        {/* Panel header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gold/10">
          <div className="flex items-center gap-2">
            <Pencil className="w-4 h-4 text-gold" />
            <h3 className="text-sm font-semibold text-text-primary">
              Edit Staff Member — <span className="text-gold">{fullName}</span>
            </h3>
          </div>
          <button
            onClick={onCancel}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form body */}
        <form onSubmit={handleSubmit} className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
            {/* Name */}
            <div className="grid grid-cols-2 gap-3">
              <Input label="First Name" value={form.firstName} onChange={set('firstName')} placeholder="Sarah" />
              <Input label="Last Name"  value={form.lastName}  onChange={set('lastName')}  placeholder="Martinez" />
            </div>

            {/* Email */}
            <Input label="Email" type="email" value={form.email} onChange={set('email')} placeholder="sarah@dental.com" />

            {/* Role */}
            <Select
              label="Role *"
              options={STAFF_ROLES}
              value={form.role}
              onChange={set('role')}
              placeholder="Select role…"
            />

            {/* Status */}
            <div>
              <label className="text-[10px] font-semibold text-gold/80 uppercase tracking-widest block mb-2">
                Account Status
              </label>
              <div className="flex gap-5">
                {['active', 'inactive'].map((s) => (
                  <label key={s} className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="radio"
                      name={`status-${user._id ?? user.id}`}
                      value={s}
                      checked={form.status === s}
                      onChange={() => setForm((p) => ({ ...p, status: s }))}
                      className="accent-gold"
                    />
                    <span
                      className={`text-sm ${
                        form.status === s
                          ? s === 'active' ? 'text-emerald-400 font-medium' : 'text-red-400 font-medium'
                          : 'text-text-muted'
                      }`}
                    >
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Location + Office checklists */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
            <div>
              <label className="text-[10px] font-semibold text-gold/80 uppercase tracking-widest block mb-1.5">
                Assigned Locations
              </label>
              <div className="border border-gold/15 rounded-xl p-3 max-h-36 overflow-y-auto space-y-2 bg-surface">
                {(locations ?? []).length === 0 ? (
                  <p className="text-xs text-text-muted text-center py-2">No locations available</p>
                ) : (
                  (locations ?? []).map((loc) => {
                    const locId = loc._id ?? loc.id;
                    return (
                      <label key={locId} className="flex items-center gap-2.5 text-sm text-text-primary cursor-pointer hover:text-gold transition-colors">
                        <input
                          type="checkbox"
                          checked={form.locationIds.includes(locId)}
                          onChange={() => toggleLocation(locId)}
                          className="w-3.5 h-3.5 rounded accent-gold"
                        />
                        {loc.name}
                      </label>
                    );
                  })
                )}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-semibold text-gold/80 uppercase tracking-widest block mb-1.5">
                Assigned Offices
              </label>
              <div className="border border-gold/15 rounded-xl p-3 max-h-36 overflow-y-auto space-y-2 bg-surface">
                {allOffices.length === 0 ? (
                  <p className="text-xs text-text-muted text-center py-2">No offices available</p>
                ) : (
                  allOffices.map((off) => {
                    const offId = off._id ?? off.id;
                    return (
                      <label key={offId} className="flex items-center gap-2.5 text-sm text-text-primary cursor-pointer hover:text-gold transition-colors">
                        <input
                          type="checkbox"
                          checked={form.officeIds.includes(offId)}
                          onChange={() => toggleOffice(offId)}
                          className="w-3.5 h-3.5 rounded accent-gold"
                        />
                        {off.name}
                      </label>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center gap-2 pt-4 border-t border-gold/10">
            <Button type="submit" variant="gold" size="md" icon={Save} loading={isSaving}>
              Save Changes
            </Button>
            <Button type="button" variant="ghost" size="md" icon={X} onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </motion.div>
  );
}

/* ─── main ────────────────────────────────────────────────────────────────── */
export default function RoleAssignPage() {
  const [search, setSearch]             = useState('');
  const [roleFilter, setRoleFilter]     = useState('');
  const [editingId, setEditingId]       = useState(null);

  const { data: userData,  isLoading, isError, refetch, isFetching } = useUsers({ pageSize: 300 });
  const { data: locData }                                             = useLocations();
  const { mutate: updateUser, isPending: isSaving }                  = useUpdateUser();

  const users     = userData?.users     ?? [];
  const locations = locData?.locations  ?? [];

  const filtered = useMemo(() => {
    let list = users;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((u) => {
        const name = [u.firstName, u.lastName, u.name].filter(Boolean).join(' ').toLowerCase();
        return name.includes(q) || (u.email ?? '').toLowerCase().includes(q);
      });
    }
    if (roleFilter) list = list.filter((u) => u.role === roleFilter);
    return list;
  }, [users, search, roleFilter]);

  const roleOptions = [{ value: '', label: 'All Roles' }, ...ROLE_OPTIONS];

  const handleSave = (data) => {
    updateUser(data, { onSuccess: () => setEditingId(null) });
  };

  const editingUser = useMemo(
    () => filtered.find((u) => (u._id ?? u.id) === editingId) ?? null,
    [filtered, editingId]
  );

  return (
    <div className="min-h-screen bg-bg px-6 py-8 space-y-8">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1
            className="text-[36px] font-bold text-text-primary leading-tight"
            style={{ fontFamily: "'Noto Serif', Georgia, serif" }}
          >
            Role Assignment
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Manage staff roles, location access, and permissions
          </p>
        </div>
        <Button
          variant="gold"
          size="md"
          icon={RefreshCw}
          loading={isFetching}
          onClick={() => refetch()}
        >
          Refresh
        </Button>
      </div>

      {/* Search + filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="w-full rounded-lg bg-surface border border-gold/20 pl-9 pr-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold/50 transition-all"
          />
        </div>
        <div className="w-full sm:w-52">
          <Select
            options={roleOptions}
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-0"
      >
        {isLoading ? (
          <Card className="p-6">
            <Skeleton variant="table" count={7} />
          </Card>
        ) : isError ? (
          <EmptyState
            icon={AlertTriangle}
            title="Failed to load staff"
            description="Unable to retrieve user data."
            action={
              <Button variant="outline" size="sm" icon={RefreshCw} onClick={() => refetch()}>
                Retry
              </Button>
            }
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Shield}
            title="No staff found"
            description={search || roleFilter ? 'Try adjusting your search or filter.' : 'No staff members have been added yet.'}
          />
        ) : (
          <Card className="overflow-hidden">
            <Table>
              <Table.Header>
                <Table.Row hover={false}>
                  <Table.Head>Staff Member</Table.Head>
                  <Table.Head>Current Role</Table.Head>
                  <Table.Head className="hidden md:table-cell">Location</Table.Head>
                  <Table.Head className="hidden lg:table-cell">Assigned Offices</Table.Head>
                  <Table.Head>Status</Table.Head>
                  <Table.Head className="text-right">Actions</Table.Head>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {filtered.map((user, idx) => {
                  const uid       = user._id ?? user.id;
                  const isEditing = editingId === uid;
                  const fullName  = [user.firstName, user.lastName, user.name].filter(Boolean).join(' ') || '—';
                  const initials  = getInitials(fullName);
                  const isActive  = (user.status ?? 'active') === 'active';

                  return (
                    <React.Fragment key={uid ?? idx}>
                      <Table.Row even={idx % 2 === 1} className={isEditing ? 'bg-gold/[0.03]' : ''}>

                        {/* Name */}
                        <Table.Cell>
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold/30 to-gold/10 border border-gold/25 flex items-center justify-center text-xs font-bold text-gold flex-shrink-0">
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-text-primary truncate max-w-[150px]">
                                {fullName}
                              </p>
                              <p className="text-[11px] text-text-muted truncate max-w-[150px]">{user.email}</p>
                            </div>
                          </div>
                        </Table.Cell>

                        {/* Role */}
                        <Table.Cell>
                          <RoleBadge role={user.role} size="sm" />
                        </Table.Cell>

                        {/* Location */}
                        <Table.Cell className="hidden md:table-cell text-text-muted">
                          {user.locationName ?? '—'}
                        </Table.Cell>

                        {/* Offices */}
                        <Table.Cell className="hidden lg:table-cell text-text-muted max-w-[160px]">
                          <span className="truncate block">
                            {user.assignedOffices ?? user.officeName ?? '—'}
                          </span>
                        </Table.Cell>

                        {/* Status */}
                        <Table.Cell>
                          <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${isActive ? 'text-emerald-400' : 'text-slate-400'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                            {isActive ? 'Active' : 'Inactive'}
                          </span>
                        </Table.Cell>

                        {/* Edit */}
                        <Table.Cell className="text-right">
                          <Button
                            variant={isEditing ? 'primary' : 'ghost'}
                            size="sm"
                            icon={Pencil}
                            onClick={() => setEditingId(isEditing ? null : uid)}
                          >
                            {isEditing ? 'Editing…' : 'Edit'}
                          </Button>
                        </Table.Cell>
                      </Table.Row>

                      {/* Inline edit panel — rendered as full-width row outside the Table */}
                      <AnimatePresence>
                        {isEditing && editingUser && (
                          <tr key={`edit-${uid}`} className="bg-transparent">
                            <td colSpan={6} className="p-0 border-0">
                              <EditPanel
                                user={editingUser}
                                locations={locations}
                                onSave={handleSave}
                                onCancel={() => setEditingId(null)}
                                isSaving={isSaving}
                              />
                            </td>
                          </tr>
                        )}
                      </AnimatePresence>
                    </React.Fragment>
                  );
                })}
              </Table.Body>
            </Table>

            {/* Footer count */}
            <div className="px-5 py-3 border-t border-gold/10 text-xs text-text-muted">
              Showing {filtered.length} of {users.length} staff members
              {(search || roleFilter) && (
                <button
                  onClick={() => { setSearch(''); setRoleFilter(''); }}
                  className="ml-3 text-gold hover:underline"
                >
                  Clear filters
                </button>
              )}
            </div>
          </Card>
        )}
      </motion.div>
    </div>
  );
}
