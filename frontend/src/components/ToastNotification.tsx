import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, X, Loader2 } from 'lucide-react';
import { Toast } from '../types/toast';

interface ToastNotificationProps {
    toast: Toast;
    onRemove: (id: string) => void;
}

export default function ToastNotification({ toast, onRemove }: ToastNotificationProps) {
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        // Auto-dismiss only for success and error, NOT for loading
        if (toast.type === 'success' || toast.type === 'error') {
            const duration = toast.duration || (toast.type === 'success' ? 3000 : 5000);
            const timer = setTimeout(() => {
                handleRemove();
            }, duration);

            return () => clearTimeout(timer);
        }
        // Loading toasts persist until manually updated
    }, [toast.type, toast.duration]);

    const handleRemove = () => {
        setIsExiting(true);
        setTimeout(() => {
            onRemove(toast.id);
        }, 300); // Match animation duration
    };

    const getIcon = () => {
        switch (toast.type) {
            case 'loading':
                return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
            case 'success':
                return <CheckCircle className="h-5 w-5 text-green-500" />;
            case 'error':
                return <XCircle className="h-5 w-5 text-red-500" />;
        }
    };

    const getBorderColor = () => {
        switch (toast.type) {
            case 'loading':
                return 'border-l-blue-500';
            case 'success':
                return 'border-l-green-500';
            case 'error':
                return 'border-l-red-500';
        }
    };

    return (
        <div
            className={`
        bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-4 min-w-[320px] max-w-[400px]
        border border-gray-200 dark:border-gray-700 border-l-4 ${getBorderColor()}
        transition-all duration-300 ease-in-out
        ${isExiting ? 'animate-slide-out-right' : 'animate-slide-in-right'}
      `}
        >
            <div className="flex items-start gap-3">
                {/* Icon */}
                <div className="flex-shrink-0 mt-0.5">
                    {getIcon()}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">
                        {toast.title}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                        {toast.message}
                    </p>
                </div>

                {/* Close button (only for non-loading toasts) */}
                {toast.type !== 'loading' && (
                    <button
                        onClick={handleRemove}
                        className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </button>
                )}
            </div>
        </div>
    );
}
