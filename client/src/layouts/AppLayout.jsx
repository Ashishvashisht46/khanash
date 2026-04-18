import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Sidebar from '../components/layout/Sidebar.jsx';
import Topbar from '../components/layout/Topbar.jsx';
import AIChatBubble from '../components/ai/AIChatBubble.jsx';
import AIChatWindow from '../components/ai/AIChatWindow.jsx';
import { useUiStore } from '../stores/uiStore.js';
import { useAuthStore } from '../stores/authStore.js';
import { useAccessRequests } from '../hooks/useUsers.js';

const pageVariants = {
  initial: { opacity: 0, y: 18 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.34, ease: [0.22, 1, 0.36, 1] },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: { duration: 0.18, ease: [0.4, 0, 1, 1] },
  },
};

function isAdminRole(role) {
  return ['super_admin', 'admin', 'rcm_manager'].includes(role);
}

export default function AppLayout() {
  const location = useLocation();
  const { setCurrentPage, theme } = useUiStore();
  const { user } = useAuthStore();
  const role = user?.role ?? 'viewer';

  useEffect(() => {
    setCurrentPage(location.pathname);
  }, [location.pathname, setCurrentPage]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const { data: accessData } = useAccessRequests({}, { enabled: isAdminRole(role) });
  const pendingCount = accessData?.total ?? accessData?.requests?.length ?? 0;

  return (
    <div className="app-shell flex min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 data-grid opacity-20" />
      <Sidebar pendingCount={pendingCount} />

      <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
        <Topbar workQueueCount={0} />
        <main className="relative flex-1 overflow-y-auto px-4 pb-4 md:px-6 md:pb-6">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={location.pathname}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="mx-auto min-h-full max-w-[1600px] pt-3 md:pt-4"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <AIChatBubble />
      <AIChatWindow />
    </div>
  );
}
