import { create } from 'zustand';
import { DEFAULT_PAGE_SIZE } from '../lib/constants.js';

/* ─────────────────────────────────────────────────────────────────────────────
   Deposit Store — client-side state for the deposit list, active filters,
   pagination, and multi-row selection.

   Note: actual data fetching lives in useDeposits.js (React Query).
   This store holds derived/UI state that doesn't belong in the server cache.
───────────────────────────────────────────────────────────────────────────── */

const DEFAULT_FILTERS = {
  search:     '',
  status:     '',
  location:   '',
  dateFrom:   '',
  dateTo:     '',
  paymentMethod: '',
  assignedTo: '',
};

const DEFAULT_PAGINATION = {
  page:     1,
  pageSize: DEFAULT_PAGE_SIZE,
  total:    0,
  totalPages: 1,
};

export const useDepositStore = create((set, get) => ({
  /* ── State ─────────────────────────────────────────────────────────────── */

  /** Full list of deposits returned by the last query (mirrored from RQ cache) */
  deposits: [],

  /** The deposit currently open in the detail panel / edit form */
  currentDeposit: null,

  /** Active filter values for the deposits list */
  filters: { ...DEFAULT_FILTERS },

  /** Pagination state */
  pagination: { ...DEFAULT_PAGINATION },

  /** Set of selected deposit IDs (multi-select for bulk actions) */
  selectedIds: new Set(),

  /** Whether "select all on this page" is active */
  allSelected: false,

  /* ── Deposit list actions ──────────────────────────────────────────────── */

  /**
   * Replace the deposits array (called by useDeposits after a successful fetch).
   * @param {object[]} deposits
   */
  setDeposits(deposits) {
    set({ deposits });
  },

  /**
   * Set the deposit to display in the detail/edit view.
   * @param {object|null} deposit
   */
  setCurrentDeposit(deposit) {
    set({ currentDeposit: deposit });
  },

  /** Clear the current deposit (close detail view) */
  clearCurrentDeposit() {
    set({ currentDeposit: null });
  },

  /* ── Filter actions ────────────────────────────────────────────────────── */

  /**
   * Merge partial filter updates and reset to page 1.
   * @param {Partial<typeof DEFAULT_FILTERS>} updates
   */
  setFilters(updates) {
    set((s) => ({
      filters: { ...s.filters, ...updates },
      pagination: { ...s.pagination, page: 1 },
      selectedIds: new Set(),
      allSelected: false,
    }));
  },

  /** Clear all filters back to defaults */
  resetFilters() {
    set({
      filters: { ...DEFAULT_FILTERS },
      pagination: { ...DEFAULT_PAGINATION },
      selectedIds: new Set(),
      allSelected: false,
    });
  },

  /* ── Pagination actions ────────────────────────────────────────────────── */

  /**
   * Navigate to a specific page.
   * @param {number} page
   */
  setPage(page) {
    set((s) => ({
      pagination: { ...s.pagination, page },
      selectedIds: new Set(),
      allSelected: false,
    }));
  },

  /**
   * Update pagination metadata (total count, total pages) from API response.
   * @param {{ total: number, totalPages: number, page: number, pageSize: number }} meta
   */
  setPaginationMeta(meta) {
    set((s) => ({
      pagination: { ...s.pagination, ...meta },
    }));
  },

  /* ── Selection actions ─────────────────────────────────────────────────── */

  /**
   * Toggle the selected state of a single deposit.
   * @param {string} id
   */
  toggleSelect(id) {
    set((s) => {
      const next = new Set(s.selectedIds);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return {
        selectedIds: next,
        allSelected: next.size === s.deposits.length && s.deposits.length > 0,
      };
    });
  },

  /**
   * Select all deposits on the current page.
   */
  selectAll() {
    set((s) => ({
      selectedIds: new Set(s.deposits.map((d) => d._id ?? d.id)),
      allSelected: true,
    }));
  },

  /**
   * Clear the selection.
   */
  clearSelection() {
    set({ selectedIds: new Set(), allSelected: false });
  },

  /**
   * Check if a deposit ID is selected.
   * @param {string} id
   * @returns {boolean}
   */
  isSelected(id) {
    return get().selectedIds.has(id);
  },

  /**
   * Return an array of selected IDs (for passing to bulk-action API calls).
   * @returns {string[]}
   */
  getSelectedIds() {
    return Array.from(get().selectedIds);
  },

  /**
   * Return the count of currently selected items.
   * @returns {number}
   */
  selectionCount() {
    return get().selectedIds.size;
  },
}));
