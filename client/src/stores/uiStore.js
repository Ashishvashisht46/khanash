import { create } from 'zustand';
import { LS_UI_KEY } from '../lib/constants.js';

/* ─────────────────────────────────────────────────────────────────────────────
   UI Store — manages sidebar state, active page, chat panel, and modal visibility.
   Non-sensitive UI preferences are persisted to localStorage.
───────────────────────────────────────────────────────────────────────────── */

// Rehydrate persisted UI preferences (sidebar collapse state only)
function loadPersistedUi() {
  try {
    const raw = localStorage.getItem(LS_UI_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function persistUi(partial) {
  try {
    const current = loadPersistedUi();
    localStorage.setItem(LS_UI_KEY, JSON.stringify({ ...current, ...partial }));
  } catch {
    // no-op
  }
}

const saved = loadPersistedUi();

export const useUiStore = create((set, get) => ({
  /* ── State ─────────────────────────────────────────────────────────────── */

  /** Whether the left sidebar is in collapsed (icon-only) mode */
  sidebarCollapsed: saved.sidebarCollapsed ?? false,

  /** Active visual theme */
  theme: saved.theme ?? 'clinical',

  /** The current page path — kept in sync by AppLayout via setCurrentPage */
  currentPage: '/',

  /** Whether the AI chat side-panel is open */
  chatOpen: false,

  /**
   * Map of modal names → boolean open state.
   * Components open/close modals by name rather than with local useState,
   * so any component in the tree can trigger a modal.
   * @type {Record<string, boolean>}
   */
  modalOpen: {},

  /**
   * Map of drawer names → boolean open state (e.g. filter drawer, comment drawer).
   * @type {Record<string, boolean>}
   */
  drawerOpen: {},

  /** Whether the global command palette is open */
  commandPaletteOpen: false,

  /* ── Sidebar actions ───────────────────────────────────────────────────── */

  toggleSidebar() {
    const next = !get().sidebarCollapsed;
    persistUi({ sidebarCollapsed: next });
    set({ sidebarCollapsed: next });
  },

  setSidebarCollapsed(collapsed) {
    persistUi({ sidebarCollapsed: collapsed });
    set({ sidebarCollapsed: collapsed });
  },

  setTheme(theme) {
    persistUi({ theme });
    set({ theme });
  },

  /* ── Page actions ──────────────────────────────────────────────────────── */

  setCurrentPage(page) {
    set({ currentPage: page });
  },

  /* ── Chat panel ────────────────────────────────────────────────────────── */

  toggleChat() {
    set((s) => ({ chatOpen: !s.chatOpen }));
  },

  openChat() {
    set({ chatOpen: true });
  },

  closeChat() {
    set({ chatOpen: false });
  },

  /* ── Modal management ──────────────────────────────────────────────────── */

  /**
   * Open a named modal.
   * @param {string} name - Modal identifier (e.g. 'confirmDelete', 'editDeposit')
   */
  openModal(name) {
    set((s) => ({
      modalOpen: { ...s.modalOpen, [name]: true },
    }));
  },

  /**
   * Close a named modal.
   * @param {string} name
   */
  closeModal(name) {
    set((s) => ({
      modalOpen: { ...s.modalOpen, [name]: false },
    }));
  },

  /**
   * Toggle a named modal.
   * @param {string} name
   */
  toggleModal(name) {
    set((s) => ({
      modalOpen: { ...s.modalOpen, [name]: !s.modalOpen[name] },
    }));
  },

  /**
   * Check if a named modal is open.
   * @param {string} name
   * @returns {boolean}
   */
  isModalOpen(name) {
    return Boolean(get().modalOpen[name]);
  },

  /** Close all open modals at once */
  closeAllModals() {
    set({ modalOpen: {} });
  },

  /* ── Drawer management ─────────────────────────────────────────────────── */

  openDrawer(name) {
    set((s) => ({
      drawerOpen: { ...s.drawerOpen, [name]: true },
    }));
  },

  closeDrawer(name) {
    set((s) => ({
      drawerOpen: { ...s.drawerOpen, [name]: false },
    }));
  },

  toggleDrawer(name) {
    set((s) => ({
      drawerOpen: { ...s.drawerOpen, [name]: !s.drawerOpen[name] },
    }));
  },

  isDrawerOpen(name) {
    return Boolean(get().drawerOpen[name]);
  },

  closeAllDrawers() {
    set({ drawerOpen: {} });
  },

  /* ── Command palette ───────────────────────────────────────────────────── */

  openCommandPalette() {
    set({ commandPaletteOpen: true });
  },

  closeCommandPalette() {
    set({ commandPaletteOpen: false });
  },

  toggleCommandPalette() {
    set((s) => ({ commandPaletteOpen: !s.commandPaletteOpen }));
  },
}));
