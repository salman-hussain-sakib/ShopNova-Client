'use client';

import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { CheckCircle, XCircle, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: () => void }) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Start exit animation after 2.7s (300ms before removal)
    const exitTimer = setTimeout(() => {
      setIsExiting(true);
    }, 2700);

    const removeTimer = setTimeout(() => {
      onRemove();
    }, 3000);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(removeTimer);
    };
  }, [onRemove]);

  return (
    <div
      className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl backdrop-blur-xl border transition-all duration-300 ${
        isExiting ? 'animate-slide-right opacity-0 scale-95' : 'animate-slide-left'
      }`}
      style={{
        background: 'rgba(255, 255, 255, 0.85)',
        borderColor: toast.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : toast.type === 'error' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(59, 130, 246, 0.2)',
      }}
    >
      <div className={`dark:hidden absolute inset-0 rounded-2xl opacity-50 ${toast.type === 'success' ? 'bg-emerald-500/10' : toast.type === 'error' ? 'bg-red-500/10' : 'bg-blue-500/10'}`}></div>
      <div className={`hidden dark:block absolute inset-0 rounded-2xl opacity-90 ${toast.type === 'success' ? 'bg-emerald-950/80 border-emerald-500/30' : toast.type === 'error' ? 'bg-red-950/80 border-red-500/30' : 'bg-blue-950/80 border-blue-500/30'}`}></div>
      
      <div className="relative z-10">
        {toast.type === 'success' && <CheckCircle className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />}
        {toast.type === 'error' && <XCircle className="w-5 h-5 text-red-500 dark:text-red-400" />}
        {toast.type === 'info' && <Info className="w-5 h-5 text-blue-500 dark:text-blue-400" />}
      </div>
      <span className="relative z-10 font-medium text-sm text-slate-800 dark:text-slate-100 pr-2">{toast.message}</span>
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      <div className="fixed top-24 right-4 z-[100] flex flex-col gap-3 pointer-events-none">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onRemove={() => removeToast(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context.toast;
}
