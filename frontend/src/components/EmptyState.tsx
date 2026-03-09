import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description?: string;
    action?: {
        label: string;
        onClick: () => void;
    };
}

export default function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-4 animate-fade-in">
            <div className="relative mb-6">
                <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-3xl"></div>
                <div className="relative p-6 bg-gradient-to-br from-gray-100 dark:from-gray-800 to-gray-200 dark:to-gray-900 rounded-full">
                    <Icon className="h-16 w-16 text-gray-500 dark:text-gray-400" />
                </div>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
            {description && (
                <p className="text-gray-600 dark:text-gray-400 text-center max-w-md mb-6">{description}</p>
            )}
            {action && (
                <button
                    onClick={action.onClick}
                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-blue-700 transition-all duration-300 shadow-lg shadow-blue-500/30 btn-hover"
                >
                    {action.label}
                </button>
            )}
        </div>
    );
}
