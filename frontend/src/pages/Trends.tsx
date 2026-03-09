import { useEffect, useState } from 'react';
import { YearAnalytics, Company } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { TrendingUp, Activity, Zap, Target, ArrowUpRight, ArrowDownRight, Sparkles } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import { useTheme } from '../context/ThemeContext';
import { useDataCache } from '../context/DataCacheContext';

export default function Trends() {
    const { fetchYears, fetchCompanies } = useDataCache();
    const [years, setYears] = useState<YearAnalytics[]>([]);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(true);
    const { theme } = useTheme();

    // Theme-aware chart styling
    const tooltipStyle = {
        backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
        border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
        borderRadius: '12px',
        boxShadow: theme === 'dark' ? '0 4px 6px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.1)'
    };

    const tooltipLabelStyle = {
        color: theme === 'dark' ? '#f9fafb' : '#111827',
        fontWeight: '600'
    };

    const tooltipItemStyle = {
        color: theme === 'dark' ? '#e5e7eb' : '#374151'
    };

    const gridStroke = theme === 'dark' ? '#374151' : '#e5e7eb';
    const axisStroke = theme === 'dark' ? '#9ca3af' : '#6b7280';

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [yearsData, companiesData] = await Promise.all([
                    fetchYears(), // Cache-first!
                    fetchCompanies() // Cache-first!
                ]);

                setYears(yearsData);
                setCompanies(companiesData);
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [fetchYears, fetchCompanies]);

    if (loading) {
        return <LoadingSpinner size="lg" text="Loading trends..." />;
    }

    // Calculate trend data
    const trendData = years.map(year => {
        const yearCompanies = companies.filter(c => c.year === year.year);
        const placements = yearCompanies.reduce((sum, c) => sum + (c.totalPlaced || 0), 0);
        const applications = yearCompanies.reduce((sum, c) => sum + (c.totalApplied || 0), 0);
        return {
            year: year.year.toString(),
            placements,
            applications,
            companies: yearCompanies.length,
            successRate: applications > 0 ? Math.round((placements / applications) * 100) : 0
        };
    });

    // Calculate YoY changes - handle all edge cases
    const latestYear = trendData.length > 0 ? trendData[trendData.length - 1] : null;
    const previousYear = trendData.length > 1 ? trendData[trendData.length - 2] : null;

    // Calculate placement change percentage
    let placementChange = '0';
    if (latestYear && previousYear) {
        if (previousYear.placements > 0) {
            placementChange = ((latestYear.placements - previousYear.placements) / previousYear.placements * 100).toFixed(1);
        } else if (latestYear.placements > 0) {
            placementChange = '+100'; // New placements from 0
        }
    }

    // Calculate company change percentage
    let companyChange = '0';
    if (latestYear && previousYear) {
        if (previousYear.companies > 0) {
            companyChange = ((latestYear.companies - previousYear.companies) / previousYear.companies * 100).toFixed(1);
        } else if (latestYear.companies > 0) {
            companyChange = '+100'; // New companies from 0
        }
    }

    // Radar chart data
    const radarData = [
        { metric: 'Placements', value: latestYear?.placements || 0, max: Math.max(...trendData.map(t => t.placements)) || 100 },
        { metric: 'Companies', value: latestYear?.companies || 0, max: Math.max(...trendData.map(t => t.companies)) || 100 },
        { metric: 'Success Rate', value: latestYear?.successRate || 0, max: 100 },
        { metric: 'Applications', value: latestYear?.applications || 0, max: Math.max(...trendData.map(t => t.applications)) || 100 },
    ].map(d => ({
        ...d,
        normalized: (d.value / d.max) * 100
    }));

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div className="glass-strong rounded-2xl p-8 border border-purple-500/20">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    <div>
                        <h1 className="text-4xl font-bold text-gradient mb-2">Trends & Insights</h1>
                        <p className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
                            <Activity className="h-4 w-4" />
                            Track placement trends and growth patterns
                        </p>
                    </div>
                    <div className="flex gap-4">
                        <div className="glass rounded-xl px-4 py-2 flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-yellow-500" />
                            <span className="text-sm font-medium text-gray-900 dark:text-white">Live Data</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* YoY Change Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="glass-strong rounded-2xl p-6 card-hover group">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-gray-600 dark:text-gray-400 text-sm">Placement Growth</span>
                        {Number(placementChange) >= 0 ? (
                            <ArrowUpRight className="h-5 w-5 text-green-500 group-hover:scale-125 transition-transform" />
                        ) : (
                            <ArrowDownRight className="h-5 w-5 text-red-500 group-hover:scale-125 transition-transform" />
                        )}
                    </div>
                    <p className={`text-3xl font-bold ${Number(placementChange) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {Number(placementChange) >= 0 ? '+' : ''}{placementChange}%
                    </p>
                    <p className="text-gray-500 dark:text-gray-500 text-xs mt-1">vs last year</p>
                </div>

                <div className="glass-strong rounded-2xl p-6 card-hover group">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-gray-600 dark:text-gray-400 text-sm">Company Growth</span>
                        {Number(companyChange) >= 0 ? (
                            <ArrowUpRight className="h-5 w-5 text-green-500 group-hover:scale-125 transition-transform" />
                        ) : (
                            <ArrowDownRight className="h-5 w-5 text-red-500 group-hover:scale-125 transition-transform" />
                        )}
                    </div>
                    <p className={`text-3xl font-bold ${Number(companyChange) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {Number(companyChange) >= 0 ? '+' : ''}{companyChange}%
                    </p>
                    <p className="text-gray-500 dark:text-gray-500 text-xs mt-1">vs last year</p>
                </div>

                <div className="glass-strong rounded-2xl p-6 card-hover">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-gray-600 dark:text-gray-400 text-sm">Current Success Rate</span>
                        <Target className="h-5 w-5 text-blue-500" />
                    </div>
                    <p className="text-3xl font-bold text-gradient-blue">{latestYear?.successRate || 0}%</p>
                    <p className="text-gray-500 dark:text-gray-500 text-xs mt-1">this year</p>
                </div>

                <div className="glass-strong rounded-2xl p-6 card-hover">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-gray-600 dark:text-gray-400 text-sm">Total Placements</span>
                        <Zap className="h-5 w-5 text-yellow-500" />
                    </div>
                    <p className="text-3xl font-bold text-gradient-green">{latestYear?.placements || 0}</p>
                    <p className="text-gray-500 dark:text-gray-500 text-xs mt-1">this year</p>
                </div>
            </div>

            {/* Main Trend Chart */}
            <div className="glass-strong rounded-2xl p-6 shadow-2xl">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                        <TrendingUp className="h-5 w-5 text-white stroke-white" strokeWidth={2} />
                    </div>
                    Placement Trends Over Time
                </h2>
                <ResponsiveContainer width="100%" height={400}>
                    <AreaChart data={trendData}>
                        <defs>
                            <linearGradient id="colorPlacements" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorApplications" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                        <XAxis dataKey="year" stroke={axisStroke} />
                        <YAxis stroke={axisStroke} />
                        <Tooltip contentStyle={tooltipStyle} labelStyle={tooltipLabelStyle} itemStyle={tooltipItemStyle} />
                        <Legend />
                        <Area
                            type="monotone"
                            dataKey="placements"
                            stroke="#10b981"
                            fillOpacity={1}
                            fill="url(#colorPlacements)"
                            name="Placements"
                            strokeWidth={3}
                        />
                        <Area
                            type="monotone"
                            dataKey="applications"
                            stroke="#3b82f6"
                            fillOpacity={1}
                            fill="url(#colorApplications)"
                            name="Applications"
                            strokeWidth={3}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Side by Side Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Success Rate Trend */}
                <div className="glass-strong rounded-2xl p-6 shadow-2xl">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-green-500 to-green-600 rounded-lg">
                            <Target className="h-5 w-5 text-white stroke-white" strokeWidth={2} />
                        </div>
                        Success Rate Trend
                    </h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={trendData}>
                            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                            <XAxis dataKey="year" stroke={axisStroke} />
                            <YAxis stroke={axisStroke} domain={[0, 100]} />
                            <Tooltip contentStyle={tooltipStyle} labelStyle={tooltipLabelStyle} itemStyle={tooltipItemStyle} />
                            <Line
                                type="monotone"
                                dataKey="successRate"
                                stroke="#10b981"
                                strokeWidth={3}
                                dot={{ fill: '#10b981', strokeWidth: 2, r: 6 }}
                                activeDot={{ r: 8, fill: '#10b981' }}
                                name="Success Rate (%)"
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Company Growth */}
                <div className="glass-strong rounded-2xl p-6 shadow-2xl">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg">
                            <Activity className="h-5 w-5 text-white stroke-white" strokeWidth={2} />
                        </div>
                        Company Participation
                    </h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={trendData}>
                            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                            <XAxis dataKey="year" stroke={axisStroke} />
                            <YAxis stroke={axisStroke} />
                            <Tooltip contentStyle={tooltipStyle} labelStyle={tooltipLabelStyle} itemStyle={tooltipItemStyle} />
                            <Line
                                type="monotone"
                                dataKey="companies"
                                stroke="#8b5cf6"
                                strokeWidth={3}
                                dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 6 }}
                                activeDot={{ r: 8, fill: '#8b5cf6' }}
                                name="Companies"
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Performance Radar */}
            <div className="glass-strong rounded-2xl p-6 shadow-2xl">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-lg">
                        <Zap className="h-5 w-5 text-white stroke-white" strokeWidth={2} />
                    </div>
                    Current Year Performance Overview
                </h2>
                <div className="flex justify-center">
                    <ResponsiveContainer width="100%" height={400}>
                        <RadarChart data={radarData}>
                            <PolarGrid stroke={gridStroke} />
                            <PolarAngleAxis dataKey="metric" stroke={axisStroke} />
                            <PolarRadiusAxis angle={30} domain={[0, 100]} stroke={axisStroke} />
                            <Radar
                                name="Performance"
                                dataKey="normalized"
                                stroke="#3b82f6"
                                fill="#3b82f6"
                                fillOpacity={0.5}
                                strokeWidth={2}
                            />
                            <Tooltip contentStyle={tooltipStyle} itemStyle={tooltipItemStyle} />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
