import { useEffect, useState } from 'react';
import { Company, YearAnalytics } from '../types';
import { Trophy, Medal, Crown, Star, TrendingUp, Flame, Sparkles, Building2 } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import { useDataCache } from '../context/DataCacheContext';

export default function Leaderboard() {
    const { fetchCompanies, fetchYears } = useDataCache();
    const [companies, setCompanies] = useState<Company[]>([]);
    const [years, setYears] = useState<YearAnalytics[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedYear, setSelectedYear] = useState<number | 'all'>('all');
    // const { theme } = useTheme();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [companiesData, yearsData] = await Promise.all([
                    fetchCompanies(), // Cache-first!
                    fetchYears() // Cache-first!
                ]);

                setCompanies(companiesData);
                setYears(yearsData);
            } catch (error: unknown) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [fetchCompanies, fetchYears]);

    if (loading) {
        return <LoadingSpinner size="lg" text="Loading leaderboard..." />;
    }

    const filteredCompanies = selectedYear === 'all'
        ? companies
        : companies.filter(c => c.year === selectedYear);

    // Sort by placements
    const rankedCompanies = [...filteredCompanies]
        .sort((a, b) => (b.totalPlaced || 0) - (a.totalPlaced || 0));

    // Get top 3 for podium (if available)
    const top3 = rankedCompanies.slice(0, Math.min(3, rankedCompanies.length));
    // Show all companies in the full rankings list
    const allRanked = rankedCompanies;

    // Calculate achievements
    const achievements = {
        mostPlacements: rankedCompanies[0],
        highestSuccessRate: [...filteredCompanies]
            .filter(c => c.totalApplied > 0)
            .sort((a, b) => (b.totalPlaced / b.totalApplied) - (a.totalPlaced / a.totalApplied))[0],
        mostRounds: [...filteredCompanies]
            .sort((a, b) => b.totalRounds - a.totalRounds)[0],
    };

    const getRankIcon = (rank: number) => {
        switch (rank) {
            case 1:
                return <Crown className="h-8 w-8 text-yellow-400" />;
            case 2:
                return <Medal className="h-7 w-7 text-gray-400" />;
            case 3:
                return <Medal className="h-6 w-6 text-amber-600" />;
            default:
                return <span className="text-2xl font-bold text-gray-500">#{rank}</span>;
        }
    };

    const getRankBg = (rank: number) => {
        switch (rank) {
            case 1:
                return 'bg-gradient-to-br from-yellow-400 via-yellow-500 to-amber-600';
            case 2:
                return 'bg-gradient-to-br from-gray-300 via-gray-400 to-gray-500';
            case 3:
                return 'bg-gradient-to-br from-amber-500 via-amber-600 to-orange-700';
            default:
                return 'bg-gradient-to-br from-gray-700 to-gray-800';
        }
    };

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div className="glass-strong rounded-2xl p-8 border border-yellow-500/20">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    <div>
                        <h1 className="text-4xl font-bold flex items-center gap-3">
                            <span className="text-gradient">Leaderboard</span>
                            <Trophy className="h-10 w-10 text-yellow-500 animate-pulse-slow" />
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 flex items-center gap-2 mt-2">
                            <Flame className="h-4 w-4 text-orange-500" />
                            Top performing companies by placements
                        </p>
                    </div>
                    <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                        className="dropdown px-4 py-2 rounded-xl text-sm"
                    >
                        <option value="all">All Time</option>
                        {years.map(y => (
                            <option key={y.year} value={y.year}>{y.year}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Top 3 Podium */}
            {top3.length >= 3 && (
                <div className="grid grid-cols-3 gap-4 items-end">
                    {/* Second Place */}
                    <div className="glass-strong rounded-2xl p-6 card-hover text-center animate-slide-in-left" style={{ animationDelay: '0.1s' }}>
                        <div className="relative inline-block mb-4">
                            <div className={`w-20 h-20 ${getRankBg(2)} rounded-full flex items-center justify-center mx-auto shadow-xl`}>
                                <span className="text-3xl font-bold text-always-white">{top3[1]?.companyName?.charAt(0)}</span>
                            </div>
                            <div className="absolute -top-2 -right-2 bg-white dark:bg-gray-800 rounded-full p-1 shadow-lg">
                                {getRankIcon(2)}
                            </div>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 truncate">{top3[1]?.companyName}</h3>
                        <p className="text-3xl font-bold text-gradient-green mb-1">{top3[1]?.totalPlaced || 0}</p>
                        <p className="text-gray-500 text-sm">placements</p>
                        <div className="mt-3 h-24 bg-gradient-to-t from-gray-300 to-gray-200 dark:from-gray-600 dark:to-gray-500 rounded-t-xl" />
                    </div>

                    {/* First Place */}
                    <div className="glass-strong rounded-2xl p-6 card-hover text-center animate-slide-in-left relative overflow-hidden" style={{ animationDelay: '0s' }}>
                        <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/10 to-amber-500/10" />
                        <div className="relative">
                            <div className="relative inline-block mb-4">
                                <div className={`w-24 h-24 ${getRankBg(1)} rounded-full flex items-center justify-center mx-auto shadow-2xl ring-4 ring-yellow-400/50`}>
                                    <span className="text-4xl font-bold text-always-white">{top3[0]?.companyName?.charAt(0)}</span>
                                </div>
                                <div className="absolute -top-3 -right-3 bg-white dark:bg-gray-800 rounded-full p-2 shadow-lg animate-bounce">
                                    {getRankIcon(1)}
                                </div>
                                <Sparkles className="absolute -left-2 top-0 h-5 w-5 text-yellow-400 animate-pulse" />
                                <Sparkles className="absolute -right-2 bottom-0 h-4 w-4 text-yellow-400 animate-pulse" style={{ animationDelay: '0.5s' }} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1 truncate">{top3[0]?.companyName}</h3>
                            <p className="text-4xl font-bold text-gradient-green mb-1">{top3[0]?.totalPlaced || 0}</p>
                            <p className="text-gray-500 text-sm">placements</p>
                            <div className="mt-3 h-32 bg-gradient-to-t from-yellow-400 to-yellow-300 dark:from-yellow-500 dark:to-yellow-400 rounded-t-xl" />
                        </div>
                    </div>

                    {/* Third Place */}
                    <div className="glass-strong rounded-2xl p-6 card-hover text-center animate-slide-in-right" style={{ animationDelay: '0.2s' }}>
                        <div className="relative inline-block mb-4">
                            <div className={`w-18 h-18 ${getRankBg(3)} rounded-full flex items-center justify-center mx-auto shadow-xl w-16`}>
                                <span className="text-2xl font-bold text-always-white">{top3[2]?.companyName?.charAt(0)}</span>
                            </div>
                            <div className="absolute -top-2 -right-2 bg-white dark:bg-gray-800 rounded-full p-1 shadow-lg">
                                {getRankIcon(3)}
                            </div>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 truncate">{top3[2]?.companyName}</h3>
                        <p className="text-2xl font-bold text-gradient-green mb-1">{top3[2]?.totalPlaced || 0}</p>
                        <p className="text-gray-500 text-sm">placements</p>
                        <div className="mt-3 h-16 bg-gradient-to-t from-amber-600 to-amber-500 dark:from-amber-700 dark:to-amber-600 rounded-t-xl" />
                    </div>
                </div>
            )}

            {/* Achievement Badges */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-strong rounded-2xl p-6 card-hover border border-yellow-500/20">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-xl">
                            <Trophy className="h-6 w-6 text-white stroke-white" strokeWidth={2} />
                        </div>
                        <div>
                            <p className="text-gray-600 dark:text-gray-400 text-sm">Most Placements</p>
                            <p className="text-lg font-bold text-gray-900 dark:text-white">{achievements.mostPlacements?.companyName}</p>
                        </div>
                    </div>
                    <p className="text-3xl font-bold text-gradient-green">{achievements.mostPlacements?.totalPlaced || 0} placed</p>
                </div>

                <div className="glass-strong rounded-2xl p-6 card-hover border border-green-500/20">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl">
                            <TrendingUp className="h-6 w-6 text-white stroke-white" strokeWidth={2} />
                        </div>
                        <div>
                            <p className="text-gray-600 dark:text-gray-400 text-sm">Highest Success Rate</p>
                            <p className="text-lg font-bold text-gray-900 dark:text-white">{achievements.highestSuccessRate?.companyName}</p>
                        </div>
                    </div>
                    <p className="text-3xl font-bold text-gradient-blue">
                        {achievements.highestSuccessRate
                            ? ((achievements.highestSuccessRate.totalPlaced / achievements.highestSuccessRate.totalApplied) * 100).toFixed(1)
                            : 0}%
                    </p>
                </div>

                <div className="glass-strong rounded-2xl p-6 card-hover border border-purple-500/20">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl">
                            <Star className="h-6 w-6 text-white stroke-white" strokeWidth={2} />
                        </div>
                        <div>
                            <p className="text-gray-600 dark:text-gray-400 text-sm">Most Rigorous</p>
                            <p className="text-lg font-bold text-gray-900 dark:text-white">{achievements.mostRounds?.companyName}</p>
                        </div>
                    </div>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{achievements.mostRounds?.totalRounds || 0} rounds</p>
                </div>
            </div>

            {/* Full Leaderboard */}
            <div className="glass-strong rounded-2xl p-6 shadow-2xl">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
                        <Building2 className="h-5 w-5 text-white stroke-white" strokeWidth={2} />
                    </div>
                    Full Rankings
                </h2>

                <div className="space-y-3">
                    {allRanked.map((company, index) => {
                        const rank = index + 1;
                        const successRate = company.totalApplied > 0
                            ? ((company.totalPlaced / company.totalApplied) * 100).toFixed(1)
                            : 0;

                        return (
                            <div
                                key={company.companyYearId}
                                className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-all duration-200 animate-slide-in-left group"
                                style={{ animationDelay: `${index * 0.05}s` }}
                            >
                                <div className="w-12 h-12 flex items-center justify-center">
                                    <span className="text-xl font-bold text-gray-500 dark:text-gray-400 group-hover:scale-110 transition-transform">
                                        #{rank}
                                    </span>
                                </div>

                                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
                                    <span className="text-lg font-bold text-always-white">{company.companyName?.charAt(0)}</span>
                                </div>

                                <div className="flex-1">
                                    <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors">
                                        {company.companyName}
                                    </h3>
                                    <p className="text-gray-500 text-sm">Year {company.year}</p>
                                </div>

                                <div className="text-right">
                                    <p className="text-xl font-bold text-gradient-green">{company.totalPlaced || 0}</p>
                                    <p className="text-gray-500 text-xs">placements</p>
                                </div>

                                <div className="text-right min-w-[80px]">
                                    <p className="text-lg font-bold text-gradient-blue">{successRate}%</p>
                                    <p className="text-gray-500 text-xs">success</p>
                                </div>

                                <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                                    <div
                                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-full rounded-full transition-all duration-1000"
                                        style={{ width: `${successRate}%` }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
