"use client";

import { useEffect, useRef, useCallback } from "react";
import ReactDOM from "react-dom";
import { X } from "lucide-react";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: string;
}

export default function BottomSheet({
  open,
  onClose,
  title,
  children,
}: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const currentY = useRef(0);
  const isDragging = useRef(false);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
    currentY.current = 0;
    isDragging.current = true;
    if (sheetRef.current) {
      sheetRef.current.style.transition = "none";
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging.current) return;
    const diff = e.touches[0].clientY - startY.current;
    currentY.current = Math.max(0, diff); // 위로는 못 끌게
    if (sheetRef.current) {
      sheetRef.current.style.transform = `translateY(${currentY.current}px)`;
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    isDragging.current = false;
    if (sheetRef.current) {
      sheetRef.current.style.transition = "transform 300ms cubic-bezier(0.32, 0.72, 0, 1)";
      if (currentY.current > 100) {
        sheetRef.current.style.transform = "translateY(100%)";
        setTimeout(onClose, 200);
      } else {
        sheetRef.current.style.transform = "translateY(0)";
      }
    }
    currentY.current = 0;
  }, [onClose]);

  if (!open) return null;

  const sheet = (
    <div className="fixed inset-0 z-[9999]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 animate-fade-in"
        onClick={onClose}
      />
      {/* Sheet - 모바일 중앙 정렬 */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-center">
        <div
          ref={sheetRef}
          className="w-full max-w-lg bg-bg-card rounded-t-[20px] animate-slide-up safe-bottom"
          style={{ maxHeight: "90vh" }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Drag handle */}
          <div className="pt-3 pb-0 cursor-grab">
            <div className="drag-handle" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 pb-4">
            <h2 className="text-[18px] font-bold text-text-primary">{title}</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-bg-primary hover:bg-border transition-colors"
            >
              <X size={16} className="text-text-secondary" />
            </button>
          </div>

          {/* Content */}
          <div className="px-5 pb-8 overflow-y-auto no-scrollbar" style={{ maxHeight: "calc(90vh - 80px)" }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );

  if (typeof document !== "undefined") {
    return ReactDOM.createPortal(sheet, document.body);
  }

  return sheet;
}
