import { useCallback, useEffect, useRef, useState } from "react";
import "./Toast.css";

export interface ToastItem {
  id: number;
  message: string;
  variant: "ok" | "err";
  action?: { label: string; href: string };
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (
      message: string,
      variant: "ok" | "err" = "err",
      action?: { label: string; href: string },
    ) => {
      const id = ++idRef.current;
      setToasts((prev) => [...prev, { id, message, variant, action }]);
      return id;
    },
    [],
  );

  return { toasts, showToast, dismissToast };
}

function Toast({
  toast,
  onDismiss,
}: {
  toast: ToastItem;
  onDismiss: (id: number) => void;
}) {
  // Auto-dismiss after 5s, unless it carries an action (user must act/read).
  useEffect(() => {
    if (toast.action) return;
    const timer = setTimeout(() => onDismiss(toast.id), 5000);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  return (
    <div className={`toast toast--${toast.variant}`} role="status">
      <span className="toast__msg">{toast.message}</span>
      {toast.action && (
        <a className="toast__action" href={toast.action.href}>
          {toast.action.label}
        </a>
      )}
      <button
        type="button"
        className="toast__close"
        aria-label="Dismiss"
        onClick={() => onDismiss(toast.id)}
      >
        ✕
      </button>
    </div>
  );
}

export function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[];
  onDismiss: (id: number) => void;
}) {
  if (toasts.length === 0) return null;
  return (
    <div className="toast-container" aria-live="polite">
      {toasts.map((t) => (
        <Toast key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}
