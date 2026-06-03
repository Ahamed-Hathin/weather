import React from 'react';

/**
 * NotificationCenter Component
 * 
 * Renders the floating stack of toast notifications on the screen.
 * Toasts will animate out when dismissed.
 * 
 * Props:
 * - toasts: Array of toast objects: { id, message, type }
 * - removeToast: Function to remove a toast by its id
 */
export default function NotificationCenter({ toasts, removeToast }) {
  return (
    <div id="notification-center" className="notification-center">
      {toasts.map((toast) => {
        // Pick the correct icon based on toast type
        let iconSvg = null;
        if (toast.type === "success") {
          iconSvg = (
            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2.5" fill="none">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          );
        } else if (toast.type === "error") {
          iconSvg = (
            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2.5" fill="none">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          );
        } else {
          // Info type fallback
          iconSvg = (
            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12" y2="8"></line>
            </svg>
          );
        }

        return (
          <div
            key={toast.id}
            className={`toast toast-${toast.type}`}
            onClick={() => removeToast(toast.id)}
            style={{ cursor: 'pointer' }}
          >
            {iconSvg}
            <span>{toast.message}</span>
          </div>
        );
      })}
    </div>
  );
}
