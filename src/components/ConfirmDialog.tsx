"use client";

import ReactDOM from "react-dom";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "default";
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmText = "확인",
  cancelText = "취소",
  variant = "default",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  const dialog = (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 animate-fade-in" onClick={onCancel} />
      <div className="relative bg-bg-card rounded-[16px] w-[min(320px,calc(100%-40px))] p-6 animate-fade-in-up shadow-xl">
        <h3 className="text-[17px] font-bold text-text-primary">{title}</h3>
        <p className="text-[14px] text-text-secondary mt-2 leading-relaxed">{message}</p>
        <div className="flex gap-2.5 mt-6">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-[12px] bg-bg-primary text-text-secondary text-[14px] font-semibold pressable"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-3 rounded-[12px] text-[14px] font-semibold pressable ${
              variant === "danger"
                ? "bg-negative text-white"
                : "bg-accent text-white"
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );

  if (typeof document !== "undefined") {
    return ReactDOM.createPortal(dialog, document.body);
  }
  return dialog;
}
