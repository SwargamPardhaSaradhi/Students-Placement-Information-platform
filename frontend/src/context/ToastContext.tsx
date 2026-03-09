import { createContext, useContext, useState, ReactNode } from 'react';
import ToastNotification from '../components/ToastNotification';
import { Toast, ToastInput } from '../types/toast';

interface ToastContextType {
    showToast: (toast: ToastInput) => string;
    updateToast: (id: string, updates: Partial<Toast>) => void;
    removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = (input: ToastInput): string => {
        const id = input.id || `toast-${Date.now()}-${Math.random()}`;
        const toast: Toast = {
            ...input,
            id,
        };

        setToasts((prev) => {
            // Limit to maximum 5 toasts
            const newToasts = [...prev, toast];
            return newToasts.slice(-5);
        });

        return id;
    };

    const updateToast = (id: string, updates: Partial<Toast>) => {
        setToasts((prev) =>
            prev.map((toast) =>
                toast.id === id ? { ...toast, ...updates } : toast
            )
        );
    };

    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    };

    return (
        <ToastContext.Provider value={{ showToast, updateToast, removeToast }}>
            {children}

            {/* Toast Container - Fixed Top Right */}
            <div className="fixed top-4 right-4 z-50 space-y-3 pointer-events-none">
                {toasts.map((toast) => (
                    <div key={toast.id} className="pointer-events-auto">
                        <ToastNotification toast={toast} onRemove={removeToast} />
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within ToastProvider');
    }
    return context;
}
