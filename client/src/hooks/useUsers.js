import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../lib/api.js';
import { QK } from '../lib/constants.js';
import { buildQuery } from '../lib/utils.js';

/* ─────────────────────────────────────────────────────────────────────────────
   User management hooks — CRUD for users and access request workflows.
───────────────────────────────────────────────────────────────────────────── */

/* ── Query: paginated user list ────────────────────────────────────────── */
/**
 * @param {object} [params]
 * @param {string} [params.search]
 * @param {string} [params.role]
 * @param {string} [params.location]
 * @param {string} [params.status]   - 'active' | 'inactive' | 'pending'
 * @param {number} [params.page]
 * @param {number} [params.pageSize]
 */
export function useUsers(params = {}) {
  const queryString = buildQuery(params);

  return useQuery({
    queryKey: [QK.USERS, params],
    queryFn: async () => {
      const { data } = await api.get(`/users${queryString}`);
      return data; // { users: [], total, page, pageSize, totalPages }
    },
    staleTime: 1000 * 60 * 3,
  });
}

/* ── Query: single user by ID ──────────────────────────────────────────── */
/**
 * @param {string|null} id
 */
export function useUser(id) {
  return useQuery({
    queryKey: [QK.USER, id],
    queryFn: async () => {
      const { data } = await api.get(`/users/${id}`);
      return data; // { user }
    },
    enabled: Boolean(id),
    staleTime: 1000 * 60 * 5,
  });
}

/* ── Query: pending access requests ────────────────────────────────────── */
/**
 * @param {object} [params]
 */
export function useAccessRequests(params = {}, options = {}) {
  const queryString = buildQuery(params);
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('rcm_token') : null;
  const isDemo = token?.startsWith('demo-jwt-');

  return useQuery({
    queryKey: [QK.ACCESS_REQS, params],
    queryFn: async () => {
      const { data } = await api.get(`/users/access-requests${queryString}`);
      return data; // { requests: [], total }
    },
    staleTime: 1000 * 60 * 2,
    enabled: (options.enabled ?? true) && !isDemo,
  });
}

/* ── Mutation: create user (admin invite) ──────────────────────────────── */
export function useCreateUser() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post('/users', payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QK.USERS] });
      toast.success('User invited successfully');
    },
    onError: (error) => {
      toast.error(error.message ?? 'Failed to create user');
    },
  });
}

/* ── Mutation: update user profile / role ──────────────────────────────── */
export function useUpdateUser() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }) => {
      const { data } = await api.patch(`/users/${id}`, updates);
      return data;
    },
    onSuccess: (data, variables) => {
      qc.invalidateQueries({ queryKey: [QK.USERS] });
      qc.invalidateQueries({ queryKey: [QK.USER, variables.id] });
      toast.success('User updated');
    },
    onError: (error) => {
      toast.error(error.message ?? 'Failed to update user');
    },
  });
}

/* ── Mutation: deactivate (soft-delete) user ────────────────────────────── */
export function useDeactivateUser() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const { data } = await api.patch(`/users/${id}`, { status: 'inactive' });
      return data;
    },
    onSuccess: (data, id) => {
      qc.invalidateQueries({ queryKey: [QK.USERS] });
      qc.invalidateQueries({ queryKey: [QK.USER, id] });
      toast.success('User deactivated');
    },
    onError: (error) => {
      toast.error(error.message ?? 'Failed to deactivate user');
    },
  });
}

/* ── Mutation: reactivate user ─────────────────────────────────────────── */
export function useReactivateUser() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const { data } = await api.patch(`/users/${id}`, { status: 'active' });
      return data;
    },
    onSuccess: (data, id) => {
      qc.invalidateQueries({ queryKey: [QK.USERS] });
      qc.invalidateQueries({ queryKey: [QK.USER, id] });
      toast.success('User reactivated');
    },
    onError: (error) => {
      toast.error(error.message ?? 'Failed to reactivate user');
    },
  });
}

/* ── Mutation: assign role to user ─────────────────────────────────────── */
/**
 * @example
 *   const { mutate: assignRole } = useAssignRole();
 *   assignRole({ userId: '...', role: 'rcm_agent', locationId: '...' });
 */
export function useAssignRole() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, role, locationId }) => {
      const { data } = await api.post(`/users/${userId}/role`, {
        role,
        locationId,
      });
      return data;
    },
    onSuccess: (data, variables) => {
      qc.invalidateQueries({ queryKey: [QK.USERS] });
      qc.invalidateQueries({ queryKey: [QK.USER, variables.userId] });
      toast.success('Role assigned successfully');
    },
    onError: (error) => {
      toast.error(error.message ?? 'Failed to assign role');
    },
  });
}

/* ── Mutation: approve an access request ───────────────────────────────── */
/**
 * @example
 *   const { mutate: approveAccess } = useApproveAccessRequest();
 *   approveAccess({ requestId: '...', role: 'rcm_agent', locationId: '...' });
 */
export function useApproveAccessRequest() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ requestId, role, locationId }) => {
      const { data } = await api.post(
        `/users/access-requests/${requestId}/approve`,
        { role, locationId }
      );
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QK.ACCESS_REQS] });
      qc.invalidateQueries({ queryKey: [QK.USERS] });
      toast.success('Access request approved — user can now log in');
    },
    onError: (error) => {
      toast.error(error.message ?? 'Failed to approve request');
    },
  });
}

/* ── Mutation: reject an access request ────────────────────────────────── */
/**
 * @example
 *   const { mutate: rejectAccess } = useRejectAccessRequest();
 *   rejectAccess({ requestId: '...', reason: 'Duplicate account' });
 */
export function useRejectAccessRequest() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ requestId, reason = '' }) => {
      const { data } = await api.post(
        `/users/access-requests/${requestId}/reject`,
        { reason }
      );
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QK.ACCESS_REQS] });
      toast.success('Access request rejected');
    },
    onError: (error) => {
      toast.error(error.message ?? 'Failed to reject request');
    },
  });
}

/* ── Mutation: resend invite email ─────────────────────────────────────── */
export function useResendInvite() {
  return useMutation({
    mutationFn: async (userId) => {
      const { data } = await api.post(`/users/${userId}/resend-invite`);
      return data;
    },
    onSuccess: () => {
      toast.success('Invite email resent');
    },
    onError: (error) => {
      toast.error(error.message ?? 'Failed to resend invite');
    },
  });
}
