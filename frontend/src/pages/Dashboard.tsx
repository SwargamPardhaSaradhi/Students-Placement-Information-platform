import { useEffect, useState } from 'react';
import { Company, YearAnalytics } from '../types';
import { TrendingUp, Building2, Users, Award, Activity, Target, Briefcase, Clock, CheckCircle } from 'lucide-react';
import StatCard from '../components/StatCard';
import { SkeletonCard } from '../components/LoadingSpinner';
import { useDataCache } from '../context/DataCacheContext';
import RefreshButton from '../components/RefreshButton';

interface DashboardSummary {
  counts: {
    years: number;
    companies: number;
    students: number;
  };
  stats: {
    totalCompanies: number;
    completedCompanies: number;
    runningCompanies: number;
    totalPlaced: number;
  };
  latestYear: YearAnalytics | null;
  recentCompanies: Company[];
}

export default function Dashboard() {
  const { fetchStudents, fetchCompanies } = useDataCache();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // ✅ Fetch students and companies from cache (NO systemStats API call!)
        const [studentsData, companiesData] = await Promise.all([
          fetchStudents(),
          fetchCompanies()
        ]);

        // ✅ Calculate statistics directly from the data
        const totalStudents = studentsData.length;
        const totalPlaced = studentsData.filter(s => s.currentStatus === 'placed').length;
        const totalCompanies = companiesData.length;
        const completedCompanies = companiesData.filter(c => c.status === 'completed').length;
        const runningCompanies = companiesData.filter(c => c.status === 'running').length;

        // Find latest year
        const years = [...new Set(companiesData.map(c => c.year))].sort((a, b) => b - a);

        // Get recent companies (most recently updated)
        const recentCompanies = [...companiesData]
          .sort((a, b) => {
            // Sort by status (running first) then by year (newest first)
            if (a.status !== b.status) {
              return a.status === 'running' ? -1 : 1;
            }
            return b.year - a.year;
          })
          .slice(0, 5);

        // Build the summary object
        const calculatedSummary: DashboardSummary = {
          counts: {
            years: years.length,
            companies: totalCompanies,
            students: totalStudents
          },
          stats: {
            totalCompanies,
            completedCompanies,
            runningCompanies,
            totalPlaced
          },
          latestYear: null, // We don't need year analytics for dashboard
          recentCompanies
        };

        setSummary(calculatedSummary);
        setCompanies(companiesData);
        console.log(`✅ Dashboard calculated from cached data: ${totalStudents} students, ${totalCompanies} companies, ${totalPlaced} placed`);
      } catch (error) {
        console.error('Error calculating dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [fetchStudents, fetchCompanies]); // ✅ Depend on fetch functions

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-20 glass-strong rounded-2xl skeleton"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <div className="glass-strong rounded-2xl p-6 h-96 skeleton"></div>
      </div>
    );
  }

  if (!summary) {
    return <div className="text-white">Error loading dashboard</div>;
  }

  const stats = summary.stats;
  const recentCompanies = summary.recentCompanies || [];
  const totalStudents = summary.counts.students;

  const placementRate = totalStudents > 0
    ? ((stats.totalPlaced / totalStudents) * 100).toFixed(1)
    : '0';

  const activeRounds = recentCompanies.filter(c => c.status === 'running').length;
  const avgPlacementsPerCompany = stats.completedCompanies > 0
    ? (stats.totalPlaced / stats.completedCompanies).toFixed(1)
    : '0';

  // ✅ Build company-wise data from CACHED COMPANIES (year 2026)
  const currentYear = 2026;
  const allCompaniesData = companies
    .filter(c => c.year === currentYear)
    .map(company => ({
      id: company.companyYearId,
      companyName: company.companyName,
      placed: company.totalPlaced || 0,
      status: company.status,
      year: company.year
    }))
    .sort((a, b) => b.placed - a.placed);

  console.log(`📊 Using ${allCompaniesData.length} companies from cache for year ${currentYear}`);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Section */}
      <div className="glass-strong rounded-2xl p-8 border border-blue-500/20">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-gradient-blue mb-2">Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Overall placement statistics across all years
            </p>
          </div>
          <div className="flex items-center gap-4">
            <RefreshButton className="py-4 px-6" />
            <div className="px-6 py-3 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl border border-blue-500/30">
              <div className="text-center">
                <p className="text-gray-600 dark:text-gray-400 text-sm">Total Years</p>
                <p className="text-3xl font-bold text-gradient-blue">{summary.counts.years}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Primary Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Companies"
          value={stats.totalCompanies || 0}
          icon={Building2}
          color="blue"
          subtitle={`${stats.completedCompanies || 0} completed, ${stats.runningCompanies || 0} running`}
          className="stagger-1"
        />
        <StatCard
          title="Students Placed"
          value={stats.totalPlaced || 0}
          icon={Award}
          color="green"
          subtitle={`${placementRate}% placement rate`}
          trend={{ value: 12.5, isPositive: true }}
          className="stagger-2"
        />
        <StatCard
          title="Total Participation"
          value={totalStudents}
          icon={Users}
          color="purple"
          subtitle="Students participated"
          className="stagger-3"
        />
        <StatCard
          title="Active Rounds"
          value={activeRounds || 0}
          icon={TrendingUp}
          color="yellow"
          subtitle="Currently in progress"
          className="stagger-4"
        />
      </div>

      {/* Secondary Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="glass-strong rounded-2xl p-6 card-hover animate-slide-in-left">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl shadow-glow-blue">
              <Target className="h-6 w-6 text-white stroke-white" strokeWidth={2} />
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Placement Success</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{placementRate}%</p>
            </div>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-cyan-500 to-cyan-600 h-full rounded-full transition-all duration-1000 animate-shimmer"
              style={{ width: `${placementRate}%` }}
            ></div>
          </div>
        </div>

        <div className="glass-strong rounded-2xl p-6 card-hover animate-slide-in-left stagger-1">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl">
              <Briefcase className="h-6 w-6 text-white stroke-white" strokeWidth={2} />
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Avg Placements</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{avgPlacementsPerCompany}</p>
            </div>
          </div>
          <p className="text-gray-500 dark:text-gray-500 text-sm">Per company</p>
        </div>

        <div className="glass-strong rounded-2xl p-6 card-hover animate-slide-in-left stagger-2">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-glow-green">
              <CheckCircle className="h-6 w-6 text-white stroke-white" strokeWidth={2} />
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Completion Rate</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {stats.totalCompanies > 0
                  ? ((stats.completedCompanies / stats.totalCompanies) * 100).toFixed(0)
                  : 0}%
              </p>
            </div>
          </div>
          <p className="text-gray-500 dark:text-gray-500 text-sm">{stats.completedCompanies} of {stats.totalCompanies} drives</p>
        </div>
      </div>

      {/* Company-wise Placements Table */}
      <div className="glass-strong rounded-2xl p-6 shadow-2xl animate-slide-in-right">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
              <Building2 className="h-5 w-5 text-white stroke-white" strokeWidth={2} />
            </div>
            Company-wise Placements (Top Companies)
          </h2>
          <div className="px-4 py-2 bg-blue-500/10 rounded-lg border border-blue-500/30">
            <span className="text-blue-400 font-medium text-sm">
              {allCompaniesData.length} Companies
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-4 px-4 text-gray-400 font-medium">#</th>
                <th className="text-left py-4 px-4 text-gray-400 font-medium">Company</th>
                <th className="text-left py-4 px-4 text-gray-400 font-medium">Year</th>
                <th className="text-left py-4 px-4 text-gray-400 font-medium">Status</th>
                <th className="text-right py-4 px-4 text-gray-400 font-medium">Placements</th>
                <th className="text-right py-4 px-4 text-gray-400 font-medium">Contribution</th>
              </tr>
            </thead>
            <tbody>
              {allCompaniesData.slice(0, 15).map((company, index) => {
                const contribution = stats.totalPlaced > 0
                  ? ((company.placed / stats.totalPlaced) * 100).toFixed(1)
                  : '0';

                return (
                  <tr
                    key={`${company.id}-${index}`}
                    className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-all duration-200 group"
                  >
                    <td className="py-4 px-4 text-gray-500 font-medium">
                      {index + 1}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-always-white font-bold shadow-lg group-hover:scale-110 transition-transform">
                          {company.companyName.charAt(0)}
                        </div>
                        <span className="text-white font-medium group-hover:text-blue-400 transition-colors">
                          {company.companyName}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-gray-400 font-mono">{company.year}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-all ${company.status === 'completed'
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                          : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                          }`}
                      >
                        {company.status === 'completed' ? (
                          <>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Completed
                          </>
                        ) : (
                          <>
                            <Clock className="h-3 w-3 mr-1" />
                            Running
                          </>
                        )}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span className="text-2xl font-bold text-gradient-blue">
                        {company.placed}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-purple-500 h-full rounded-full"
                            style={{ width: `${contribution}%` }}
                          ></div>
                        </div>
                        <span className="text-blue-400 font-semibold text-sm w-12 text-right">
                          {contribution}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/*Recent Activity */}
      {recentCompanies.length > 0 && (
        <div className="glass-strong rounded-2xl p-6 shadow-2xl animate-fade-in">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg">
              <Activity className="h-5 w-5 text-white stroke-white" strokeWidth={2} />
            </div>
            Recent Activity
          </h2>
          <div className="space-y-3">
            {recentCompanies.slice(0, 5).map((company, index) => (
              <div
                key={company.companyYearId}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-all duration-200 border border-gray-200 dark:border-gray-700/50 hover:border-gray-300 dark:hover:border-gray-600"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-always-white font-bold shadow-lg">
                    {company.companyName.charAt(0)}
                  </div>
                  <div>
                    <p className="text-gray-900 dark:text-white font-medium">{company.companyName}</p>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      {company.status === 'running'
                        ? `Round ${company.currentRound} of ${company.totalRounds} • Year ${company.year}`
                        : `Completed • Year ${company.year}`}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gradient-green">{company.totalPlaced}</p>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">placed</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
