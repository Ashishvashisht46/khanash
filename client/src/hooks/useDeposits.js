import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../lib/api.js';
import { QK, DEFAULT_PAGE_SIZE } from '../lib/constants.js';
import { buildQuery } from '../lib/utils.js';

/* ─────────────────────────────────────────────────────────────────────────────
   Deposit hooks — all server interactions for deposits/postings.
───────────────────────────────────────────────────────────────────────────── */

/* ── Query: paginated deposit list ─────────────────────────────────────── */
/**
 * @param {object} [filters]
 * @param {string} [filters.search]
 * @param {string} [filters.status]
 * @param {string} [filters.location]
 * @param {string} [filters.dateFrom]
 * @param {string} [filters.dateTo]
 * @param {string} [filters.paymentMethod]
 * @param {string} [filters.assignedTo]
 * @param {number} [filters.page]
 * @param {number} [filters.pageSize]
 */
export function useDeposits(filters = {}) {
  const {
    page = 1,
    pageSize = DEFAULT_PAGE_SIZE,
    search = '',
    status = '',
    location = '',
    dateFrom = '',
    dateTo = '',
    paymentMethod = '',
    assignedTo = '',
  } = filters;

  const queryString = buildQuery({
    page,
    pageSize,
    search,
    status,
    location,
    dateFrom,
    dateTo,
    paymentMethod,
    assignedTo,
  });

  return useQuery({
    queryKey: [QK.DEPOSITS, filters],
    queryFn: async () => {
      const { data } = await api.get(`/deposits${queryString}`);
      return data; // { deposits: [], total, page, pageSize, totalPages }
    },
    placeholderData: (prev) => prev, // keep previous data while refetching
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

/* ── Query: single deposit with files, comments, audit trail ──────────── */
/**
 * @param {string|null} id
 */
export function useDeposit(id) {
  return useQuery({
    queryKey: [QK.DEPOSIT, id],
    queryFn: async () => {
      const { data } = await api.get(`/deposits/${id}`);
      return data; // { deposit, files, comments, auditLog }
    },
    enabled: Boolean(id),
    staleTime: 1000 * 60 * 1, // 1 minute
  });
}

/* ── Query: dashboard / overview statistics ────────────────────────────── */
/**
 * @param {object} [params]
 * @param {string} [params.location]
 * @param {string} [params.dateFrom]
 * @param {string} [params.dateTo]
 */
export function useDepositStats(params = {}) {
  const queryString = buildQuery(params);

  return useQuery({
    queryKey: [QK.DEPOSIT_STATS, params],
    queryFn: async () => {
      const { data } = await api.get(`/deposits/stats${queryString}`);
      return data;
      // {
      //   totalDeposits, totalAmount, pendingCount, pendingAmount,
      //   approvedCount, approvedAmount, postedCount, postedAmount,
      //   rejectedCount, avgProcessingDays, recentActivity, chartData
      // }
    },
    staleTime: 1000 * 60 * 5,
  });
}

/* ── Mutation: create deposit ──────────────────────────────────────────── */
export function useCreateDeposit() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post('/deposits', payload);
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: [QK.DEPOSITS] });
      qc.invalidateQueries({ queryKey: [QK.DEPOSIT_STATS] });
      toast.success(`Deposit ${data.deposit?.depositId ?? ''} created`);
    },
    onError: (error) => {
      toast.error(error.message ?? 'Failed to create deposit');
    },
  });
}

/* ── Mutation: update deposit ──────────────────────────────────────────── */
/**
 * @returns {import('@tanstack/react-query').UseMutationResult}
 */
export function useUpdateDeposit() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }) => {
      const { data } = await api.patch(`/deposits/${id}`, updates);
      return data;
    },
    onSuccess: (data, variables) => {
      qc.invalidateQueries({ queryKey: [QK.DEPOSITS] });
      qc.invalidateQueries({ queryKey: [QK.DEPOSIT, variables.id] });
      qc.invalidateQueries({ queryKey: [QK.DEPOSIT_STATS] });
      toast.success('Deposit updated');
    },
    onError: (error) => {
      toast.error(error.message ?? 'Failed to update deposit');
    },
  });
}

/* ── Mutation: delete deposit ──────────────────────────────────────────── */
export function useDeleteDeposit() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      await api.delete(`/deposits/${id}`);
      return id;
    },
    onSuccess: (id) => {
      qc.invalidateQueries({ queryKey: [QK.DEPOSITS] });
      qc.invalidateQueries({ queryKey: [QK.DEPOSIT_STATS] });
      qc.removeQueries({ queryKey: [QK.DEPOSIT, id] });
      toast.success('Deposit deleted');
    },
    onError: (error) => {
      toast.error(error.message ?? 'Failed to delete deposit');
    },
  });
}

/* ── Mutation: add comment to deposit ──────────────────────────────────── */
export function useAddComment() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ depositId, text, isInternal = false }) => {
      const { data } = await api.post(`/deposits/${depositId}/comments`, {
        text,
        isInternal,
      });
      return data;
    },
    onSuccess: (data, variables) => {
      qc.invalidateQueries({ queryKey: [QK.DEPOSIT, variables.depositId] });
    },
    onError: (error) => {
      toast.error(error.message ?? 'Failed to add comment');
    },
  });
}

/* ── Mutation: approve deposit ─────────────────────────────────────────── */
export function useApproveDeposit() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, note = '' }) => {
      const { data } = await api.post(`/deposits/${id}/approve`, { note });
      return data;
    },
    onSuccess: (data, variables) => {
      qc.invalidateQueries({ queryKey: [QK.DEPOSITS] });
      qc.invalidateQueries({ queryKey: [QK.DEPOSIT, variables.id] });
      qc.invalidateQueries({ queryKey: [QK.DEPOSIT_STATS] });
      toast.success('Deposit approved');
    },
    onError: (error) => {
      toast.error(error.message ?? 'Failed to approve deposit');
    },
  });
}

/* ── Mutation: reject deposit ──────────────────────────────────────────── */
export function useRejectDeposit() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, reason = '' }) => {
      const { data } = await api.post(`/deposits/${id}/reject`, { reason });
      return data;
    },
    onSuccess: (data, variables) => {
      qc.invalidateQueries({ queryKey: [QK.DEPOSITS] });
      qc.invalidateQueries({ queryKey: [QK.DEPOSIT, variables.id] });
      qc.invalidateQueries({ queryKey: [QK.DEPOSIT_STATS] });
      toast.success('Deposit rejected');
    },
    onError: (error) => {
      toast.error(error.message ?? 'Failed to reject deposit');
    },
  });
}

/* ── Mutation: upload file attachment ──────────────────────────────────── */
export function useUploadDepositFile() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ depositId, file }) => {
      const formData = new FormData();
      formData.append('file', file);

      const { data } = await api.post(`/deposits/${depositId}/files`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (event) => {
          // Progress is available here if callers need it:
          // event.loaded / event.total
        },
      });
      return data;
    },
    onSuccess: (data, variables) => {
      qc.invalidateQueries({ queryKey: [QK.DEPOSIT, variables.depositId] });
      toast.success('File uploaded');
    },
    onError: (error) => {
      toast.error(error.message ?? 'File upload failed');
    },
  });
}

/* ── Mutation: bulk status update ──────────────────────────────────────── */
export function useBulkUpdateDeposits() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ ids, status, note = '' }) => {
      const { data } = await api.patch('/deposits/bulk', { ids, status, note });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QK.DEPOSITS] });
      qc.invalidateQueries({ queryKey: [QK.DEPOSIT_STATS] });
      toast.success('Deposits updated');
    },
    onError: (error) => {
      toast.error(error.message ?? 'Bulk update failed');
    },
  });
}
