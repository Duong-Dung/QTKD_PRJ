import React, { useEffect } from 'react';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';

export interface ToastData {
  type: 'success' | 'error';
  title: string;
  description?: string;
}

interface ToastProps {
  toast: ToastData | null;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(onClose, 4000);
    return () => window.clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  const isSuccess = toast.type === 'success';

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-6 right-6 z-50 max-w-md w-full bg-white rounded-lg shadow-lg border p-4 flex items-start gap-3 transition-all ${
        isSuccess ? 'border-emerald-200' : 'border-red-200'
      }`}
    >
      <div
        className={`mt-0.5 shrink-0 ${
          isSuccess ? 'text-[#16A34A]' : 'text-[#DC2626]'
        }`}
      >
        {isSuccess ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[#111827]">{toast.title}</p>
        {toast.description && (
          <p className="mt-1 text-xs text-[#4B5563] leading-relaxed">{toast.description}</p>
        )}
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Đóng thông báo"
        className="text-[#9CA3AF] hover:text-[#4B5563] p-0.5 rounded transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
