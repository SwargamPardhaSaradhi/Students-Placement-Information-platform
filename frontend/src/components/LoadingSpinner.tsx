interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    text?: string;
}

export default function LoadingSpinner({ size = 'md', text }: LoadingSpinnerProps) {
    const sizeClasses = {
        sm: 'h-6 w-6',
        md: 'h-12 w-12',
        lg: 'h-16 w-16'
    };

    return (
        <div className="flex flex-col items-center justify-center gap-4 py-12">
            <div className="relative">
                <div className={`${sizeClasses[size]} rounded-full border-4 border-gray-700 border-t-blue-500 animate-spin`}></div>
                <div className={`${sizeClasses[size]} absolute top-0 left-0 rounded-full border-4 border-transparent border-t-purple-500 animate-spin`} style={{ animationDuration: '1.5s', animationDirection: 'reverse' }}></div>
            </div>
            {text && (
                <p className="text-gray-400 animate-pulse-slow">{text}</p>
            )}
        </div>
    );
}

export function SkeletonCard() {
    return (
        <div className="glass-strong rounded-2xl p-6 animate-pulse">
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1 space-y-3">
                    <div className="h-4 bg-gray-700 rounded w-1/3 skeleton"></div>
                    <div className="h-8 bg-gray-700 rounded w-1/2 skeleton"></div>
                    <div className="h-3 bg-gray-700 rounded w-2/3 skeleton"></div>
                </div>
                <div className="h-14 w-14 bg-gray-700 rounded-xl skeleton"></div>
            </div>
            <div className="h-1 bg-gray-700 rounded skeleton"></div>
        </div>
    );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
    return (
        <div className="space-y-3">
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="flex gap-4">
                    <div className="h-12 bg-gray-700 rounded flex-1 skeleton"></div>
                    <div className="h-12 bg-gray-700 rounded w-1/4 skeleton"></div>
                    <div className="h-12 bg-gray-700 rounded w-1/6 skeleton"></div>
                </div>
            ))}
        </div>
    );
}
