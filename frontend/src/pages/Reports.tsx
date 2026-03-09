import { useEffect, useState } from 'react';
import { YearAnalytics, Company } from '../types';
import { FileText, Download, Calendar, TrendingUp, Building2, Users, Award, FileSpreadsheet, BarChart3 } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import { exportToCSV } from '../lib/exportUtils';
import { useDataCache } from '../context/DataCacheContext';
import RefreshButton from '../components/RefreshButton';

export default function Reports() {
    const { fetchYears, fetchCompanies, fetchStudents } = useDataCache();
    const [years, setYears] = useState<YearAnalytics[]>([]);
    const [companies, setCompanies] = useState<Company[]>([]);
    // const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedYear, setSelectedYear] = useState<number | 'all'>('all');
    const [modalYear, setModalYear] = useState<number | null>(null);
    // const { theme } = useTheme();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [yearsData, companiesData] = await Promise.all([
                    fetchYears(), // Cache-first!
                    fetchCompanies(), // Cache-first!
                    fetchStudents() // Cache-first!
                ]);

                setYears(yearsData);
                setCompanies(companiesData);
                // setStudents(studentsData);
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [fetchCompanies, fetchStudents, fetchYears]);

    if (loading) {
        return <LoadingSpinner size="lg" text="Loading reports..." />;
    }

    const filteredCompanies = selectedYear === 'all'
        ? companies
        : companies.filter(c => c.year === selectedYear);

    const totalPlacements = filteredCompanies.reduce((sum, c) => sum + (c.totalPlaced || 0), 0);
    const totalApplications = filteredCompanies.reduce((sum, c) => sum + (c.totalApplied || 0), 0);
    const completedDrives = filteredCompanies.filter(c => c.status === 'completed').length;
    const runningDrives = filteredCompanies.filter(c => c.status === 'running').length;

    const handleExportYearReport = (year: YearAnalytics) => {
        const yearCompanies = companies.filter(c => c.year === year.year);
        const reportData = yearCompanies.map(c => ({
            Company: c.companyName,
            Applied: c.totalApplied,
            Placed: c.totalPlaced,
            'Success Rate': c.totalApplied > 0 ? `${((c.totalPlaced / c.totalApplied) * 100).toFixed(1)}%` : '0%',
            Status: c.status,
            Rounds: c.totalRounds
        }));
        exportToCSV(reportData, `placement_report_${year.year}`);
    };

    const handleExportFullReport = () => {
        const reportData = companies.map(c => ({
            Year: c.year,
            Company: c.companyName,
            Applied: c.totalApplied,
            Placed: c.totalPlaced,
            'Success Rate': c.totalApplied > 0 ? `${((c.totalPlaced / c.totalApplied) * 100).toFixed(1)}%` : '0%',
            Status: c.status,
            Rounds: c.totalRounds
        }));
        exportToCSV(reportData, 'full_placement_report');
    };

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div className="glass-strong rounded-2xl p-8 border border-blue-500/20">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    <div>
                        <h1 className="text-4xl font-bold text-gradient-blue mb-2">Reports</h1>
                        <p className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Generate and export placement reports
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <RefreshButton />
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                            className="dropdown px-4 py-2 rounded-xl text-sm"
                        >
                            <option value="all">All Years</option>
                            {years.map(y => (
                                <option key={y.year} value={y.year}>{y.year}</option>
                            ))}
                        </select>
                        <button
                            onClick={handleExportFullReport}
                            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-lg shadow-blue-500/30 btn-hover"
                        >
                            <Download className="h-4 w-4" />
                            Export All
                        </button>
                    </div>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="glass-strong rounded-2xl p-6 card-hover">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
                            <Building2 className="h-6 w-6 text-white stroke-white" strokeWidth={2} />
                        </div>
                        <div>
                            <p className="text-gray-600 dark:text-gray-400 text-sm">Companies</p>
                            <p className="text-3xl font-bold text-gray-900 dark:text-white">{filteredCompanies.length}</p>
                        </div>
                    </div>
                </div>

                <div className="glass-strong rounded-2xl p-6 card-hover">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-glow-green">
                            <Award className="h-6 w-6 text-white stroke-white" strokeWidth={2} />
                        </div>
                        <div>
                            <p className="text-gray-600 dark:text-gray-400 text-sm">Placements</p>
                            <p className="text-3xl font-bold text-gradient-green">{totalPlacements}</p>
                        </div>
                    </div>
                </div>

                <div className="glass-strong rounded-2xl p-6 card-hover">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-glow-purple">
                            <Users className="h-6 w-6 text-white stroke-white" strokeWidth={2} />
                        </div>
                        <div>
                            <p className="text-gray-600 dark:text-gray-400 text-sm">Applications</p>
                            <p className="text-3xl font-bold text-gray-900 dark:text-white">{totalApplications}</p>
                        </div>
                    </div>
                </div>

                <div className="glass-strong rounded-2xl p-6 card-hover">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl">
                            <TrendingUp className="h-6 w-6 text-white stroke-white" strokeWidth={2} />
                        </div>
                        <div>
                            <p className="text-gray-600 dark:text-gray-400 text-sm">Success Rate</p>
                            <p className="text-3xl font-bold text-gradient-blue">
                                {totalApplications > 0 ? ((totalPlacements / totalApplications) * 100).toFixed(1) : 0}%
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Year-wise Report Cards */}
            <div className="glass-strong rounded-2xl p-6 shadow-2xl">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg">
                        <Calendar className="h-5 w-5 text-white stroke-white" strokeWidth={2} />
                    </div>
                    Year-wise Reports
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {years.map((year, index) => {
                        const yearCompanies = companies.filter(c => c.year === year.year);
                        const yearPlacements = yearCompanies.reduce((sum, c) => sum + (c.totalPlaced || 0), 0);
                        const yearApplications = yearCompanies.reduce((sum, c) => sum + (c.totalApplied || 0), 0);
                        const successRate = yearApplications > 0 ? ((yearPlacements / yearApplications) * 100).toFixed(1) : 0;

                        return (
                            <div
                                key={year.year}
                                className="glass rounded-2xl p-6 card-hover border border-gray-200 dark:border-gray-700/50 hover:border-blue-500/50 transition-all duration-300 animate-slide-in-left"
                                style={{ animationDelay: `${index * 0.1}s` }}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-2xl font-bold text-gradient-blue">{year.year}</h3>
                                    <span className="px-3 py-1 bg-blue-500/20 text-blue-500 dark:text-blue-400 rounded-full text-sm font-medium">
                                        {yearCompanies.length} companies
                                    </span>
                                </div>

                                <div className="space-y-3 mb-4">
                                    <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                                        <span className="text-gray-600 dark:text-gray-400 text-sm">Placements</span>
                                        <span className="font-bold text-green-500">{yearPlacements}</span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                                        <span className="text-gray-600 dark:text-gray-400 text-sm">Applications</span>
                                        <span className="font-bold text-gray-900 dark:text-white">{yearApplications}</span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                                        <span className="text-gray-600 dark:text-gray-400 text-sm">Success Rate</span>
                                        <span className="font-bold text-gradient-blue">{successRate}%</span>
                                    </div>
                                </div>

                                {/* Progress bar */}
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-4">
                                    <div
                                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-full rounded-full transition-all duration-1000"
                                        style={{ width: `${successRate}%` }}
                                    />
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleExportYearReport(year)}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-xl text-sm font-medium transition-all duration-200"
                                    >
                                        <FileSpreadsheet className="h-4 w-4" />
                                        CSV
                                    </button>
                                    <button
                                        onClick={() => setModalYear(year.year)}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-xl text-sm font-medium transition-all duration-200 shadow-lg shadow-blue-500/20"
                                    >
                                        <BarChart3 className="h-4 w-4" />
                                        View
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Drive Status Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="glass-strong rounded-2xl p-6 shadow-2xl">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                        Completed Drives
                    </h3>
                    <p className="text-5xl font-bold text-gradient-green mb-2">{completedDrives}</p>
                    <p className="text-gray-600 dark:text-gray-400">Successfully finished placement drives</p>
                </div>

                <div className="glass-strong rounded-2xl p-6 shadow-2xl">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse" />
                        Running Drives
                    </h3>
                    <p className="text-5xl font-bold text-yellow-500 mb-2">{runningDrives}</p>
                    <p className="text-gray-600 dark:text-gray-400">Currently active placement drives</p>
                </div>
            </div>

            {/* Year Detail Modal */}
            {modalYear && (() => {
                const yearData = years.find(y => y.year === modalYear);
                const yearCompanies = companies.filter(c => c.year === modalYear);
                const yearPlacements = yearCompanies.reduce((sum, c) => sum + (c.totalPlaced || 0), 0);
                const yearApplications = yearCompanies.reduce((sum, c) => sum + (c.totalApplied || 0), 0);
                const completedCompanies = yearCompanies.filter(c => c.status === 'completed').length;
                const runningCompanies = yearCompanies.filter(c => c.status === 'running').length;
                const successRate = yearApplications > 0 ? ((yearPlacements / yearApplications) * 100).toFixed(1) : '0';

                return (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setModalYear(null)}>
                        <div className="glass-strong rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-blue-500/30 animate-scale-in" onClick={(e) => e.stopPropagation()}>
                            {/* Modal Header */}
                            <div className="sticky top-0 z-10 glass-strong border-b border-gray-700/50 p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-3xl font-bold text-gradient-blue mb-1">Academic Year {modalYear} - Detailed Report</h2>
                                        <p className="text-gray-400">Comprehensive placement statistics and company breakdown</p>
                                    </div>
                                    <button
                                        onClick={() => setModalYear(null)}
                                        className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-gray-400 hover:text-white"
                                    >
                                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            {/* Modal Content */}
                            <div className="p-6 space-y-6">
                                {/* Key Metrics */}
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div className="glass rounded-xl p-4 card-hover border border-green-500/30">
                                        <div className="flex items-center gap-3 mb-2">
                                            <Award className="h-5 w-5 text-green-400" />
                                            <span className="text-gray-400 text-sm">Total Placements</span>
                                        </div>
                                        <p className="text-3xl font-bold text-gradient-green">{yearPlacements}</p>
                                    </div>
                                    <div className="glass rounded-xl p-4 card-hover border border-blue-500/30">
                                        <div className="flex items-center gap-3 mb-2">
                                            <Users className="h-5 w-5 text-blue-400" />
                                            <span className="text-gray-400 text-sm">Applications</span>
                                        </div>
                                        <p className="text-3xl font-bold text-white">{yearApplications}</p>
                                    </div>
                                    <div className="glass rounded-xl p-4 card-hover border border-purple-500/30">
                                        <div className="flex items-center gap-3 mb-2">
                                            <TrendingUp className="h-5 w-5 text-purple-400" />
                                            <span className="text-gray-400 text-sm">Success Rate</span>
                                        </div>
                                        <p className="text-3xl font-bold text-gradient">{successRate}%</p>
                                    </div>
                                    <div className="glass rounded-xl p-4 card-hover border border-cyan-500/30">
                                        <div className="flex items-center gap-3 mb-2">
                                            <Building2 className="h-5 w-5 text-cyan-400" />
                                            <span className="text-gray-400 text-sm">Companies</span>
                                        </div>
                                        <p className="text-3xl font-bold text-white">{yearCompanies.length}</p>
                                    </div>
                                </div>

                                {/* Drive Status */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="glass rounded-xl p-5 border border-green-500/20">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                                            <h3 className="text-lg font-semibold text-white">Completed Drives</h3>
                                        </div>
                                        <p className="text-4xl font-bold text-gradient-green mb-2">{completedCompanies}</p>
                                        <p className="text-gray-400 text-sm">Successfully finished placement drives</p>
                                    </div>
                                    <div className="glass rounded-xl p-5 border border-yellow-500/20">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
                                            <h3 className="text-lg font-semibold text-white">Running Drives</h3>
                                        </div>
                                        <p className="text-4xl font-bold text-yellow-500 mb-2">{runningCompanies}</p>
                                        <p className="text-gray-400 text-sm">Currently active placement drives</p>
                                    </div>
                                </div>

                                {/* Companies Breakdown */}
                                <div className="glass rounded-xl p-5 border border-blue-500/20">
                                    <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                                        <Building2 className="h-5 w-5 text-blue-400" />
                                        Company-wise Breakdown
                                    </h3>
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b border-gray-700">
                                                    <th className="text-left py-3 px-4 text-gray-400 font-medium">#</th>
                                                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Company</th>
                                                    <th className="text-right py-3 px-4 text-gray-400 font-medium">Applied</th>
                                                    <th className="text-right py-3 px-4 text-gray-400 font-medium">Placed</th>
                                                    <th className="text-right py-3 px-4 text-gray-400 font-medium">Success %</th>
                                                    <th className="text-center py-3 px-4 text-gray-400 font-medium">Rounds</th>
                                                    <th className="text-center py-3 px-4 text-gray-400 font-medium">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {yearCompanies
                                                    .sort((a, b) => (b.totalPlaced || 0) - (a.totalPlaced || 0))
                                                    .map((company, index) => {
                                                        const companySuccessRate = company.totalApplied > 0
                                                            ? ((company.totalPlaced / company.totalApplied) * 100).toFixed(1)
                                                            : '0';
                                                        return (
                                                            <tr key={company.companyYearId} className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-all">
                                                                <td className="py-3 px-4 text-gray-500 font-medium">{index + 1}</td>
                                                                <td className="py-3 px-4 text-white font-semibold">{company.companyName}</td>
                                                                <td className="py-3 px-4 text-right text-blue-400">{company.totalApplied}</td>
                                                                <td className="py-3 px-4 text-right text-green-400 font-bold">{company.totalPlaced}</td>
                                                                <td className="py-3 px-4 text-right">
                                                                    <span className="text-gradient font-semibold">{companySuccessRate}%</span>
                                                                </td>
                                                                <td className="py-3 px-4 text-center text-purple-400">{company.totalRounds}</td>
                                                                <td className="py-3 px-4 text-center">
                                                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium ${company.status === 'completed'
                                                                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                                                        : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                                                                        }`}>
                                                                        {company.status === 'completed' ? '✓ Completed' : '⟳ Running'}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Export Action */}
                                <div className="flex justify-end gap-3 pt-4 border-t border-gray-700/50">
                                    <button
                                        onClick={() => yearData && handleExportYearReport(yearData)}
                                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-lg shadow-blue-500/30"
                                    >
                                        <Download className="h-4 w-4" />
                                        Export Full Report
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
}
