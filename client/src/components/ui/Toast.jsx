import React from 'react';
import { Toaster } from 'react-hot-toast';

/**
 * Drop this <AppToaster /> once in your app root (e.g. App.jsx).
 * Everywhere else just import `toast` from 'react-hot-toast' and call it normally.
 *
 * Examples:
 *   import toast from 'react-hot-toast';
 *   toast.success('Deposit saved!');
 *   toast.error('Something went wrong.');
 *   toast('Neutral message');
 */
export function AppToaster() {
  return (
    <Toaster
      position="top-right"
      reverseOrder={false}
      gutter={8}
      toastOptions={{
        duration: 4000,
        style: {
          background: 'var(--toast-bg)',
          color: 'var(--toast-text)',
          border: '1px solid var(--toast-border)',
          borderRadius: '12px',
          padding: '12px 16px',
          fontSize: '13px',
          fontWeight: '500',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          maxWidth: '380px',
        },
        success: {
          iconTheme: {
            primary: 'rgb(var(--success-rgb))',
            secondary: 'rgb(var(--navy-rgb))',
          },
          style: {
            background: 'var(--toast-bg)',
            border: '1px solid rgb(var(--success-rgb) / 0.3)',
          },
        },
        error: {
          iconTheme: {
            primary: 'rgb(var(--danger-rgb))',
            secondary: 'rgb(var(--navy-rgb))',
          },
          style: {
            background: 'var(--toast-bg)',
            border: '1px solid rgb(var(--danger-rgb) / 0.3)',
          },
          duration: 6000,
        },
        loading: {
          iconTheme: {
            primary: 'rgb(var(--brand-rgb))',
            secondary: 'rgb(var(--navy-rgb))',
          },
        },
      }}
    />
  );
}

// Re-export toast for convenience
export { default as toast } from 'react-hot-toast';
export default AppToaster;
