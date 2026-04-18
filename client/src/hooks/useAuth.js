import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../lib/api.js';
import { useAuthStore } from '../stores/authStore.js';
import { QK } from '../lib/constants.js';

/* ─────────────────────────────────────────────────────────────────────────────
   Auth hooks — login, Google OAuth, current user, access requests.
───────────────────────────────────────────────────────────────────────────── */

/* ── Mutation: Google One-Tap / OAuth login ────────────────────────────── */
/**
 * Exchange a Google ID token for an internal JWT.
 * @example
 *   const { mutate: googleLogin } = useGoogleLogin();
 *   googleLogin({ credential: googleIdToken });
 */
export function useGoogleLogin() {
  const { login, setLoading } = useAuthStore();

  return useMutation({
    mutationFn: async ({ credential }) => {
      const { data } = await api.post('/auth/google', { credential });
      return data; // { token, user }
    },
    onMutate: () => {
      setLoading(true);
    },
    onSuccess: ({ token, user }) => {
      login(token, user);
      toast.success(`Welcome back, ${user.firstName ?? user.email}!`);
    },
    onError: (error) => {
      setLoading(false);
      toast.error(error.message ?? 'Google sign-in failed');
    },
  });
}

/* ── Mutation: email + password login ─────────────────────────────────── */
/**
 * @example
 *   const { mutate: emailLogin, isPending } = useEmailLogin();
 *   emailLogin({ email, password });
 */
export function useEmailLogin() {
  const { login, setLoading } = useAuthStore();

  return useMutation({
    mutationFn: async ({ email, password }) => {
      const { data } = await api.post('/auth/login', { email, password });
      return data; // { token, user }
    },
    onMutate: () => {
      setLoading(true);
    },
    onSuccess: ({ token, user }) => {
      login(token, user);
      toast.success(`Welcome back, ${user.firstName ?? user.email}!`);
    },
    onError: (error) => {
      setLoading(false);
      const message = error.message ?? 'Login failed';
      toast.error(message);
    },
  });
}

/* ── Query: fetch the currently authenticated user's profile ───────────── */
/**
 * Automatically disabled when there is no token in the store.
 * Syncs the store's user object when a fresher version is returned.
 */
export function useCurrentUser() {
  const { token, setUser, logout } = useAuthStore();
  const qc = useQueryClient();

  return useQuery({
    queryKey: [QK.CURRENT_USER],
    queryFn: async () => {
      const { data } = await api.get('/auth/me');
      return data.user;
    },
    enabled: Boolean(token) && !String(token).startsWith('demo-jwt-'),
    staleTime: 1000 * 60 * 5,
    onSuccess: (user) => {
      // Keep the Zustand store in sync with the latest profile from the server
      setUser(user);
    },
    onError: (error) => {
      if (error?.response?.status === 401) {
        logout();
        qc.clear();
      }
    },
  });
}

/* ── Mutation: request portal access ─────────────────────────────────────── */
/**
 * Used on the /request-access page — no auth token required.
 * @example
 *   const { mutate: requestAccess, isPending } = useRequestAccess();
 *   requestAccess({ firstName, lastName, email, practice, role, message });
 */
export function useRequestAccess() {
  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post('/auth/request-access', payload);
      return data;
    },
    onSuccess: () => {
      toast.success(
        "Access request submitted! You'll receive an email once approved."
      );
    },
    onError: (error) => {
      toast.error(error.message ?? 'Failed to submit access request');
    },
  });
}

/* ── Mutation: logout (server-side session invalidation) ──────────────── */
export function useLogout() {
  const { logout } = useAuthStore();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // Best-effort server-side logout (invalidate refresh token if used)
      try {
        await api.post('/auth/logout');
      } catch {
        // Don't block logout if the server call fails
      }
    },
    onSettled: () => {
      logout();
      qc.clear();
    },
  });
}

/* ── Mutation: update own profile ─────────────────────────────────────── */
export function useUpdateProfile() {
  const { setUser } = useAuthStore();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (updates) => {
      const { data } = await api.patch('/auth/me', updates);
      return data.user;
    },
    onSuccess: (user) => {
      setUser(user);
      qc.setQueryData([QK.CURRENT_USER], user);
      toast.success('Profile updated');
    },
    onError: (error) => {
      toast.error(error.message ?? 'Failed to update profile');
    },
  });
}

/* ── Mutation: change password ────────────────────────────────────────── */
export function useChangePassword() {
  return useMutation({
    mutationFn: async ({ currentPassword, newPassword }) => {
      const { data } = await api.post('/auth/change-password', {
        currentPassword,
        newPassword,
      });
      return data;
    },
    onSuccess: () => {
      toast.success('Password changed successfully');
    },
    onError: (error) => {
      toast.error(error.message ?? 'Failed to change password');
    },
  });
}

/* ── Mutation: forgot password ────────────────────────────────────────── */
export function useForgotPassword() {
  return useMutation({
    mutationFn: async ({ email }) => {
      const { data } = await api.post('/auth/forgot-password', { email });
      return data;
    },
    onSuccess: () => {
      toast.success('Password reset email sent');
    },
    onError: (error) => {
      toast.error(error.message ?? 'Failed to send reset email');
    },
  });
}
