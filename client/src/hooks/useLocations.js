import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../lib/api.js';
import { QK } from '../lib/constants.js';
import { buildQuery } from '../lib/utils.js';

/* ─────────────────────────────────────────────────────────────────────────────
   Location + Office hooks — CRUD for practice locations and their sub-offices.

   Data model:
   • Location  = top-level dental group / DSO entity (e.g. "Smile Dental Group")
   • Office    = individual practice location that belongs to a Location
───────────────────────────────────────────────────────────────────────────── */

/* ═══════════════════════════ LOCATIONS ═══════════════════════════════════ */

/* ── Query: all locations ──────────────────────────────────────────────── */
/**
 * @param {object} [params]
 * @param {string} [params.search]
 * @param {boolean} [params.activeOnly]
 */
export function useLocations(params = {}) {
  const queryString = buildQuery(params);

  return useQuery({
    queryKey: [QK.LOCATIONS, params],
    queryFn: async () => {
      const { data } = await api.get(`/locations${queryString}`);
      return data; // { locations: [] }
    },
    staleTime: 1000 * 60 * 10, // locations change infrequently
  });
}

/* ── Query: single location with its offices ───────────────────────────── */
/**
 * @param {string|null} id
 */
export function useLocation(id) {
  return useQuery({
    queryKey: [QK.LOCATION, id],
    queryFn: async () => {
      const { data } = await api.get(`/locations/${id}`);
      return data; // { location, offices }
    },
    enabled: Boolean(id),
    staleTime: 1000 * 60 * 5,
  });
}

/* ── Mutation: create location ─────────────────────────────────────────── */
export function useCreateLocation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post('/locations', payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QK.LOCATIONS] });
      toast.success('Location created');
    },
    onError: (error) => {
      toast.error(error.message ?? 'Failed to create location');
    },
  });
}

/* ── Mutation: update location ─────────────────────────────────────────── */
export function useUpdateLocation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }) => {
      const { data } = await api.patch(`/locations/${id}`, updates);
      return data;
    },
    onSuccess: (data, variables) => {
      qc.invalidateQueries({ queryKey: [QK.LOCATIONS] });
      qc.invalidateQueries({ queryKey: [QK.LOCATION, variables.id] });
      toast.success('Location updated');
    },
    onError: (error) => {
      toast.error(error.message ?? 'Failed to update location');
    },
  });
}

/* ── Mutation: delete location ─────────────────────────────────────────── */
export function useDeleteLocation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      await api.delete(`/locations/${id}`);
      return id;
    },
    onSuccess: (id) => {
      qc.invalidateQueries({ queryKey: [QK.LOCATIONS] });
      qc.removeQueries({ queryKey: [QK.LOCATION, id] });
      toast.success('Location deleted');
    },
    onError: (error) => {
      toast.error(error.message ?? 'Failed to delete location');
    },
  });
}

/* ═══════════════════════════ OFFICES ════════════════════════════════════ */

/* ── Query: offices for a specific location ────────────────────────────── */
/**
 * @param {string|null} locationId
 * @param {object} [params]
 */
export function useOffices(locationId, params = {}) {
  const queryString = buildQuery(params);

  return useQuery({
    queryKey: [QK.OFFICES, locationId, params],
    queryFn: async () => {
      const { data } = await api.get(
        `/locations/${locationId}/offices${queryString}`
      );
      return data; // { offices: [] }
    },
    enabled: Boolean(locationId),
    staleTime: 1000 * 60 * 10,
  });
}

/* ── Query: all offices (flat list — for dropdowns) ────────────────────── */
export function useAllOffices(params = {}) {
  const queryString = buildQuery(params);

  return useQuery({
    queryKey: [QK.OFFICES, 'all', params],
    queryFn: async () => {
      const { data } = await api.get(`/offices${queryString}`);
      return data; // { offices: [] }
    },
    staleTime: 1000 * 60 * 10,
  });
}

/* ── Query: single office ───────────────────────────────────────────────── */
/**
 * @param {string|null} id
 */
export function useOffice(id) {
  return useQuery({
    queryKey: [QK.OFFICE, id],
    queryFn: async () => {
      const { data } = await api.get(`/offices/${id}`);
      return data; // { office }
    },
    enabled: Boolean(id),
    staleTime: 1000 * 60 * 5,
  });
}

/* ── Mutation: create office under a location ──────────────────────────── */
export function useCreateOffice() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ locationId, ...payload }) => {
      const { data } = await api.post(
        `/locations/${locationId}/offices`,
        payload
      );
      return data;
    },
    onSuccess: (data, variables) => {
      qc.invalidateQueries({ queryKey: [QK.OFFICES] });
      qc.invalidateQueries({ queryKey: [QK.LOCATION, variables.locationId] });
      toast.success('Office created');
    },
    onError: (error) => {
      toast.error(error.message ?? 'Failed to create office');
    },
  });
}

/* ── Mutation: update office ───────────────────────────────────────────── */
export function useUpdateOffice() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }) => {
      const { data } = await api.patch(`/offices/${id}`, updates);
      return data;
    },
    onSuccess: (data, variables) => {
      qc.invalidateQueries({ queryKey: [QK.OFFICES] });
      qc.invalidateQueries({ queryKey: [QK.OFFICE, variables.id] });
      toast.success('Office updated');
    },
    onError: (error) => {
      toast.error(error.message ?? 'Failed to update office');
    },
  });
}

/* ── Mutation: delete office ───────────────────────────────────────────── */
export function useDeleteOffice() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      await api.delete(`/offices/${id}`);
      return id;
    },
    onSuccess: (id) => {
      qc.invalidateQueries({ queryKey: [QK.OFFICES] });
      qc.removeQueries({ queryKey: [QK.OFFICE, id] });
      toast.success('Office deleted');
    },
    onError: (error) => {
      toast.error(error.message ?? 'Failed to delete office');
    },
  });
}
