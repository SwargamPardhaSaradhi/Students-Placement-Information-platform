import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { useDataCache } from '../context/DataCacheContext';

interface RefreshButtonProps {
    position?: 'top-right' | 'inline';
    className?: string;
}

/**
 * Refresh Button Component
 * 
 * Clears all cached data and reloads the page
 * Each page will then refetch only the data it needs
 */
export default function RefreshButton({ position = 'inline', className = '' }: RefreshButtonProps) {
    const { clearCache } = useDataCache();
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleRefresh = () => {
        const confirmed = window.confirm(
            '🔄 Refresh all data?\n\n' +
            'This will clear all cached data and reload the page.\n' +
            'Use this after uploading new data or if you see outdated information.'
        );

        if (!confirmed) return;

        setIsRefreshing(true);

        // Clear all caches
        clearCache();
        console.log('🗑️ All caches cleared');

        // Reload page - each page will refetch what it needs
        window.location.reload();
    };

    const buttonClasses = position === 'top-right'
        ? 'fixed top-20 right-6 z-40 px-4 py-2 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-xl font-medium shadow-lg shadow-blue-500/30 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap'
        : `px-4 py-2 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-xl font-medium shadow-lg shadow-blue-500/30 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap ${className}`;

    return (
        <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={buttonClasses}
            title="Clear cache and refresh data"
        >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh Data'}</span>
        </button>
    );
}
