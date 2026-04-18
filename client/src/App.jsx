import React, { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useAuthStore } from './stores/authStore.js';
import { useUiStore } from './stores/uiStore.js';
import { AppToaster } from './components/ui/Toast.jsx';

// Lazy-loaded page components
const LoginPage         = lazy(() => import('./pages/LoginPage.jsx'));
const RequestAccessPage = lazy(() => import('./pages/RequestAccessPage.jsx'));
const AppLayout         = lazy(() => import('./layouts/AppLayout.jsx'));
const DashboardPage     = lazy(() => import('./pages/DashboardPage.jsx'));
const PostingsPage      = lazy(() => import('./pages/PostingsPage.jsx'));
const NewDepositPage    = lazy(() => import('./pages/NewDepositPage.jsx'));
const ClaimsPage        = lazy(() => import('./pages/ClaimsPage.jsx'));
const WorkQueuePage     = lazy(() => import('./pages/WorkQueuePage.jsx'));
const ReportPage        = lazy(() => import('./pages/ReportPage.jsx'));
const LocationsPage     = lazy(() => import('./pages/LocationsPage.jsx'));
const UsersPage         = lazy(() => import('./pages/UsersPage.jsx'));
const RoleAssignPage    = lazy(() => import('./pages/RoleAssignPage.jsx'));
const NotFoundPage      = lazy(() => import('./pages/NotFoundPage.jsx'));

// Full-screen loading fallback
function PageLoader() {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-full border-2 border-gold/20 border-t-gold animate-spin" />
        <p className="text-text-muted text-sm font-sans">Loading…</p>
      </div>
    </div>
  );
}

// Route guard — redirects unauthenticated users to /login
function ProtectedRoute({ children }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

// Route guard — redirects already-authenticated users away from auth pages
function PublicRoute({ children }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default function App() {
  const location = useLocation();
  const theme = useUiStore((s) => s.theme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  return (
    <>
      <AppToaster />

      <Suspense fallback={<PageLoader />}>
        <AnimatePresence mode="wait" initial={false}>
          <Routes location={location} key={location.pathname}>
            {/* Public auth routes */}
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <LoginPage />
                </PublicRoute>
              }
            />
            <Route
              path="/request-access"
              element={
                <PublicRoute>
                  <RequestAccessPage />
                </PublicRoute>
              }
            />

            {/* Protected app routes — all nested under AppLayout */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              {/* Index → dashboard */}
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard"    element={<DashboardPage />} />
              <Route path="postings"     element={<PostingsPage />} />
              <Route path="new-deposit"  element={<NewDepositPage />} />
              <Route path="claims"       element={<ClaimsPage />} />
              <Route path="workqueue"    element={<WorkQueuePage />} />
              <Route path="report"       element={<ReportPage />} />
              <Route path="locations"    element={<LocationsPage />} />
              <Route path="users"        element={<UsersPage />} />
              <Route path="role-assign"  element={<RoleAssignPage />} />
            </Route>

            {/* 404 catch-all */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </AnimatePresence>
      </Suspense>
    </>
  );
}
