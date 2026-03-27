"use client";

import { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { CheckCircle, AlertCircle, XCircle } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface ToastData {
  id: number;
  message: string;
  type: ToastType;
}

let toastId = 0;
let addToastFn: ((message: string, type?: ToastType) => void) | null = null;

export function showToast(message: string, type: ToastType = "success") {
  addToastFn?.(message, type);
}

const ICONS = {
  success: <CheckCircle size={18} className="text-positive shrink-0" />,
  error: <XCircle size={18} className="text-negative shrink-0" />,
  info: <AlertCircle size={18} className="text-accent shrink-0" />,
};

export default function ToastProvider() {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  useEffect(() => {
    addToastFn = (message: string, type: ToastType = "success") => {
      const id = ++toastId;
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 2500);
    };
    return () => {
      addToastFn = null;
    };
  }, []);

  if (toasts.length === 0) return null;

  const container = (
    <div className="fixed top-4 left-0 right-0 z-[10001] flex flex-col items-center gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto bg-bg-card border border-border rounded-[12px] px-4 py-3 shadow-lg flex items-center gap-2.5 max-w-[min(360px,calc(100%-32px))] animate-fade-in-up"
        >
          {ICONS[t.type]}
          <p className="text-[13px] text-text-primary font-medium">{t.message}</p>
        </div>
      ))}
    </div>
  );

  if (typeof document !== "undefined") {
    return ReactDOM.createPortal(container, document.body);
  }
  return container;
}
