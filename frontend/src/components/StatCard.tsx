import { LucideIcon } from 'lucide-react';

interface StatCardProps {
    title: string;
    value: number | string;
    icon: LucideIcon;
    color: 'blue' | 'green' | 'yellow' | 'purple' | 'red' | 'pink';
    subtitle?: string;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    className?: string;
}

export default function StatCard({
    title,
    value,
    icon: Icon,
    color,
    subtitle,
    trend,
    className = ''
}: StatCardProps) {
    const colorClasses = {
        blue: {
            gradient: 'from-blue-500 to-blue-600',
            bg: 'bg-blue-500/10',
            text: 'text-blue-400',
            glow: 'shadow-glow-blue'
        },
        green: {
            gradient: 'from-green-500 to-green-600',
            bg: 'bg-green-500/10',
            text: 'text-green-400',
            glow: 'shadow-glow-green'
        },
        yellow: {
            gradient: 'from-yellow-500 to-yellow-600',
            bg: 'bg-yellow-500/10',
            text: 'text-yellow-400',
            glow: 'shadow-glow-yellow'
        },
        purple: {
            gradient: 'from-purple-500 to-purple-600',
            bg: 'bg-purple-500/10',
            text: 'text-purple-400',
            glow: 'shadow-glow-purple'
        },
        red: {
            gradient: 'from-red-500 to-red-600',
            bg: 'bg-red-500/10',
            text: 'text-red-400',
            glow: 'shadow-glow-red'
        },
        pink: {
            gradient: 'from-pink-500 to-pink-600',
            bg: 'bg-pink-500/10',
            text: 'text-pink-400',
            glow: 'shadow-glow-pink'
        },
    };

    const styles = colorClasses[color];

    return (
        <div className={`glass-strong rounded-2xl p-6 card-hover animate-scale-in ${className}`}>
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                    <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">{title}</p>
                    <p className="text-4xl font-bold text-gray-900 dark:text-white mb-2">{value}</p>
                    {subtitle && (
                        <p className="text-gray-600 dark:text-gray-500 text-sm">{subtitle}</p>
                    )}
                    {trend && (
                        <div className={`flex items-center gap-1 mt-2 text-sm ${trend.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            <span>{trend.isPositive ? '↑' : '↓'}</span>
                            <span>{Math.abs(trend.value)}%</span>
                            <span className="text-gray-500 dark:text-gray-500 text-xs">vs last period</span>
                        </div>
                    )}
                </div>
                <div className={`p-4 rounded-xl bg-gradient-to-br ${styles.gradient} ${styles.glow}`}>
                    <Icon className="h-7 w-7 text-white stroke-white [&>*]:stroke-white" strokeWidth={2} />
                </div>
            </div>
            <div className={`h-1 rounded-full ${styles.bg} overflow-hidden`}>
                <div className={`h-full bg-gradient-to-r ${styles.gradient} animate-shimmer`} style={{ width: '70%' }}></div>
            </div>
        </div>
    );
}
