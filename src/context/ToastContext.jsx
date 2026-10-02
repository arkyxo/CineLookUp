import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { Check, AlertCircle } from 'lucide-react';

const ToastContext = createContext({ showToast: () => {} });

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  // type: 'success' (default) | 'error'
  const showToast = useCallback((message, { duration = 2500, type = 'success' } = {}) => {
    const id = idRef.current++;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  // Memoized so consumers don't re-render (or re-run effects that depend on
  // the context value) every time a toast appears or disappears.
  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed bottom-4 left-1/2 z-[100] flex -translate-x-1/2 flex-col items-center gap-2 sm:bottom-6"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto flex items-center gap-2 rounded-full border border-ink/10 bg-card/95 px-4 py-2.5 text-sm font-medium text-ink shadow-2xl backdrop-blur animate-toast-in"
          >
            {t.type === 'error' ? (
              <AlertCircle size={14} className="flex-shrink-0 text-crimson-400" />
            ) : (
              <Check size={14} className="flex-shrink-0 text-crimson-400" />
            )}
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);