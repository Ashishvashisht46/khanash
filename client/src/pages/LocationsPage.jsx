import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PlusCircle, MapPin, Building2, Users, Trash2,
  UserMinus, UserCheck, ChevronDown, ChevronRight, X,
  AlertTriangle,
} from 'lucide-react';
import {
  useLocations, useCreateLocation, useDeleteLocation,
  useCreateOffice, useDeleteOffice,
} from '../hooks/useLocations';
import { useUsers, useUpdateUser } from '../hooks/useUsers';
import { useAuthStore } from '../stores/authStore';
import {
  Button, Card, Modal, Input, Select, Textarea,
  RoleBadge, EmptyState, Skeleton,
} from '../components/ui';
import { getInitials } from '../lib/utils';
import toast from 'react-hot-toast';

/* ─── motion ─────────────────────────────────────────────────────────────── */
const containerVariants = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.07 } },
};
const sectionVariants = {
  hidden:  { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 280, damping: 24 } },
};

/* ─── EmployeeRow ─────────────────────────────────────────────────────────── */
function EmployeeRow({ employee, onToggleStatus, onRemove }) {
  const fullName = [employee.firstName, employee.lastName].filter(Boolean).join(' ') || employee.name || '—';
  const initials  = getInitials(fullName);
  const isActive  = (employee.status ?? 'active') === 'active';

  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-gold/[0.06] last:border-0 group">
      {/* Avatar */}
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold/30 to-gold/10 border border-gold/25 flex items-center justify-center text-[11px] font-bold text-gold flex-shrink-0">
        {initials}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-primary truncate">{fullName}</p>
        <p className="text-[11px] text-text-muted truncate">{employee.email}</p>
      </div>

      <RoleBadge role={employee.role} size="sm" />

      {/* Status indicator */}
      <div className="flex items-center gap-1.5">
        <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-400' : 'bg-red-400/60'}`} />
        <span className={`text-[10px] font-medium ${isActive ? 'text-emerald-400' : 'text-red-400/80'}`}>
          {isActive ? 'Active' : 'Inactive'}
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onToggleStatus(employee)}
          title={isActive ? 'Deactivate' : 'Activate'}
          className={[
            'p-1.5 rounded-lg transition-colors text-text-muted',
            isActive
              ? 'hover:text-amber-400 hover:bg-amber-400/10'
              : 'hover:text-emerald-400 hover:bg-emerald-400/10',
          ].join(' ')}
        >
          {isActive ? <UserMinus className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
        </button>
        <button
          onClick={() => onRemove(employee)}
          title="Remove from office"
          className="p-1.5 rounded-lg text-text-muted hover:text-red-400 hover:bg-red-400/10 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

/* ─── OfficeCard ─────────────────────────────────────────────────────────── */
function OfficeCard({ office, employees, onRemoveOffice, onToggleEmployee, onRemoveEmployee }) {
  const [expanded, setExpanded] = useState(true);
  const officeStaff = useMemo(
    () => (employees ?? []).filter((u) => u.officeId === office._id || u.officeId === office.id || u.office === (office._id ?? office.id)),
    [employees, office]
  );

  return (
    <div className="rounded-xl border border-gold/10 bg-white/[0.025] overflow-hidden">
      {/* Office header */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gold/[0.025] transition-colors"
        onClick={() => setExpanded((p) => !p)}
      >
        <Building2 className="w-4 h-4 text-gold/60 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-text-primary truncate">{office.name}</h3>
          <p className="text-[11px] text-text-muted">{officeStaff.length} staff members</p>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onRemoveOffice(office); }}
          className="p-1.5 rounded-lg text-text-muted hover:text-red-400 hover:bg-red-400/10 transition-colors opacity-60 hover:opacity-100"
          title="Remove office"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
        {expanded ? (
          <ChevronDown className="w-4 h-4 text-text-muted flex-shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 text-text-muted flex-shrink-0" />
        )}
      </div>

      {/* Employees */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3 border-t border-gold/[0.06]">
              {officeStaff.length > 0 ? (
                officeStaff.map((emp) => (
                  <EmployeeRow
                    key={emp._id ?? emp.id}
                    employee={emp}
                    onToggleStatus={onToggleEmployee}
                    onRemove={onRemoveEmployee}
                  />
                ))
              ) : (
                <p className="text-xs text-text-muted text-center py-4 italic">
                  No employees assigned to this office
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── LocationSection ────────────────────────────────────────────────────── */
function LocationSection({ location, offices, users, onRemoveLocation, onRemoveOffice, onToggleEmployee, onRemoveEmployee, onAddOffice, isAdmin }) {
  const [expanded, setExpanded] = useState(true);

  const locationOffices = useMemo(
    () => (offices ?? []).filter((o) => o.locationId === (location._id ?? location.id)),
    [offices, location]
  );

  const staffCount = useMemo(
    () => (users ?? []).filter((u) =>
      locationOffices.some((o) => o._id === u.officeId || o.id === u.officeId)
    ).length,
    [users, locationOffices]
  );

  return (
    <motion.div variants={sectionVariants}>
      <Card className="overflow-hidden">
        {/* Location header */}
        <div
          className="flex items-center gap-3 px-5 py-4 cursor-pointer hover:bg-gold/[0.02] transition-colors border-b border-gold/10"
          onClick={() => setExpanded((p) => !p)}
        >
          <div className="p-2 rounded-xl bg-gold/10 flex-shrink-0">
            <MapPin className="w-5 h-5 text-gold" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-text-primary">{location.name}</h2>
            <p className="text-xs text-text-muted truncate">
              {location.address ?? location.notes ?? 'No address on file'}
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs text-text-muted flex-shrink-0">
            <span className="flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5" />
              {locationOffices.length} office{locationOffices.length !== 1 ? 's' : ''}
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              {staffCount} staff
            </span>
          </div>
          <div className="flex items-center gap-1.5 ml-2">
            <button
              onClick={(e) => { e.stopPropagation(); onAddOffice(location); }}
              className="p-1.5 rounded-lg text-text-muted hover:text-gold hover:bg-gold/10 transition-colors"
              title="Add office"
            >
              <PlusCircle className="w-4 h-4" />
            </button>
            {isAdmin && (
              <button
                onClick={(e) => { e.stopPropagation(); onRemoveLocation(location); }}
                className="p-1.5 rounded-lg text-text-muted hover:text-red-400 hover:bg-red-400/10 transition-colors"
                title="Remove location"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            {expanded ? (
              <ChevronDown className="w-4 h-4 text-text-muted" />
            ) : (
              <ChevronRight className="w-4 h-4 text-text-muted" />
            )}
          </div>
        </div>

        {/* Office cards */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.24 }}
              className="overflow-hidden"
            >
              <div className="p-4 space-y-3">
                {locationOffices.length > 0 ? (
                  locationOffices.map((office) => (
                    <OfficeCard
                      key={office._id ?? office.id}
                      office={office}
                      employees={users}
                      onRemoveOffice={onRemoveOffice}
                      onToggleEmployee={onToggleEmployee}
                      onRemoveEmployee={onRemoveEmployee}
                    />
                  ))
                ) : (
                  <div className="py-8 text-center">
                    <Building2 className="w-8 h-8 text-text-muted/30 mx-auto mb-2" />
                    <p className="text-sm text-text-muted mb-3">No offices in this location</p>
                    <Button variant="outline" size="sm" icon={PlusCircle} onClick={() => onAddOffice(location)}>
                      Add First Office
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}

/* ─── AddLocationModal ───────────────────────────────────────────────────── */
function AddLocationModal({ isOpen, onClose }) {
  const { mutate: createLocation, isPending } = useCreateLocation();
  const [form, setForm] = useState({ name: '', address: '', notes: '' });

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Location name is required'); return; }
    createLocation(form, {
      onSuccess: () => { onClose(); setForm({ name: '', address: '', notes: '' }); },
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Location"
      size="md"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button variant="gold" size="sm" loading={isPending} onClick={handleSubmit}>
            Save Location
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Location Name *"
          value={form.name}
          onChange={set('name')}
          placeholder="Downtown Dental Group"
          required
        />
        <Input
          label="Address"
          value={form.address}
          onChange={set('address')}
          placeholder="123 Main Street, New York, NY 10001"
        />
        <Textarea
          label="Notes"
          value={form.notes}
          onChange={set('notes')}
          placeholder="Any additional notes…"
          rows={2}
        />
      </form>
    </Modal>
  );
}

/* ─── AddOfficeModal ─────────────────────────────────────────────────────── */
function AddOfficeModal({ isOpen, onClose, locations, preselectedLocationId }) {
  const { mutate: createOffice, isPending } = useCreateOffice();
  const [form, setForm] = useState({ locationId: preselectedLocationId ?? '', name: '', notes: '' });

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.locationId) { toast.error('Please select a location'); return; }
    if (!form.name.trim()) { toast.error('Office name is required'); return; }
    createOffice(form, {
      onSuccess: () => { onClose(); setForm({ locationId: '', name: '', notes: '' }); },
    });
  };

  const locationOptions = (locations ?? []).map((l) => ({
    value: l._id ?? l.id,
    label: l.name,
  }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Office"
      size="md"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button variant="gold" size="sm" loading={isPending} onClick={handleSubmit}>
            Save Office
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Select
          label="Location *"
          options={locationOptions}
          value={form.locationId}
          onChange={set('locationId')}
          placeholder="Select a location…"
          required
        />
        <Input
          label="Office Name *"
          value={form.name}
          onChange={set('name')}
          placeholder="Suite 101 — General Practice"
          required
        />
        <Textarea
          label="Notes"
          value={form.notes}
          onChange={set('notes')}
          placeholder="Any office-specific notes…"
          rows={2}
        />
      </form>
    </Modal>
  );
}

/* ─── main ────────────────────────────────────────────────────────────────── */
export default function LocationsPage() {
  const user    = useAuthStore((s) => s.user);
  const isAdmin = ['admin', 'super_admin'].includes(user?.role ?? '');

  const { data: locData,   isLoading: locLoading,  isError: locError  } = useLocations();
  const { data: usersData, isLoading: usersLoading                     } = useUsers({ pageSize: 500 });

  const { mutate: deleteLocation } = useDeleteLocation();
  const { mutate: deleteOffice   } = useDeleteOffice();
  const { mutate: updateUser     } = useUpdateUser();

  const locations = locData?.locations ?? [];

  /* flatten all offices from all location responses */
  const offices = useMemo(() => {
    return (locations ?? []).flatMap((l) => l.offices ?? []);
  }, [locations]);

  const users = usersData?.users ?? [];

  const [showAddLoc,   setShowAddLoc]   = useState(false);
  const [addOfficeLoc, setAddOfficeLoc] = useState(null);

  const handleRemoveLocation = (loc) => {
    if (!window.confirm(`Remove location "${loc.name}"? This cannot be undone.`)) return;
    deleteLocation(loc._id ?? loc.id);
  };

  const handleRemoveOffice = (office) => {
    if (!window.confirm(`Remove office "${office.name}"?`)) return;
    deleteOffice(office._id ?? office.id);
  };

  const handleToggleEmployee = (emp) => {
    const newStatus = (emp.status ?? 'active') === 'active' ? 'inactive' : 'active';
    updateUser({ id: emp._id ?? emp.id, status: newStatus });
  };

  const handleRemoveEmployee = (emp) => {
    if (!window.confirm(`Remove ${emp.firstName ?? emp.name} from this office?`)) return;
    updateUser({ id: emp._id ?? emp.id, officeId: null });
  };

  const isLoading = locLoading || usersLoading;

  return (
    <div className="min-h-screen bg-bg px-6 py-8 space-y-8">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1
            className="text-[36px] font-bold text-text-primary leading-tight"
            style={{ fontFamily: "'Noto Serif', Georgia, serif" }}
          >
            Locations, Offices &amp; Staff
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Manage your practice hierarchy, offices, and staff assignments
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="md" icon={PlusCircle} onClick={() => setAddOfficeLoc({})}>
            Add Office
          </Button>
          <Button variant="gold" size="md" icon={PlusCircle} onClick={() => setShowAddLoc(true)}>
            Add Location
          </Button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-5">
          {[0, 1].map((i) => (
            <Card key={i} className="p-5 space-y-4">
              <Skeleton variant="avatar" count={1} />
              <Skeleton variant="card" count={2} />
            </Card>
          ))}
        </motion.div>
      ) : locError ? (
        <EmptyState
          icon={AlertTriangle}
          title="Failed to load locations"
          description="Could not retrieve location data. Please try refreshing the page."
          action={
            <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
              Refresh
            </Button>
          }
        />
      ) : locations.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="No locations yet"
          description="Add your first practice location to get started."
          action={
            <Button variant="gold" size="md" icon={PlusCircle} onClick={() => setShowAddLoc(true)}>
              Add Location
            </Button>
          }
        />
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-5"
        >
          {locations.map((loc) => (
            <LocationSection
              key={loc._id ?? loc.id}
              location={loc}
              offices={offices}
              users={users}
              isAdmin={isAdmin}
              onRemoveLocation={handleRemoveLocation}
              onRemoveOffice={handleRemoveOffice}
              onToggleEmployee={handleToggleEmployee}
              onRemoveEmployee={handleRemoveEmployee}
              onAddOffice={(l) => setAddOfficeLoc(l)}
            />
          ))}
        </motion.div>
      )}

      {/* Modals */}
      <AddLocationModal
        isOpen={showAddLoc}
        onClose={() => setShowAddLoc(false)}
      />
      <AddOfficeModal
        isOpen={Boolean(addOfficeLoc)}
        onClose={() => setAddOfficeLoc(null)}
        locations={locations}
        preselectedLocationId={addOfficeLoc?._id ?? addOfficeLoc?.id ?? ''}
      />
    </div>
  );
}
