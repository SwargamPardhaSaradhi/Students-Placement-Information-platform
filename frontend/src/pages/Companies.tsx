import { useEffect, useState, useCallback } from 'react';
import { api } from '../lib/api';
import { Company } from '../types';
import { Link } from 'react-router-dom';
import { Building2, Users, Trophy, Calendar, ArrowRight, Search, Filter, Grid3x3, List, TrendingUp, Target, Trash2, Loader2 } from 'lucide-react';
import EmptyState from '../components/EmptyState';
import { SkeletonCard } from '../components/LoadingSpinner';
import { useDataCache } from '../context/DataCacheContext';
import RefreshButton from '../components/RefreshButton';
import { useToast } from '../context/ToastContext';

type ViewMode = 'grid' | 'list';
type SortBy = 'name' | 'placements' | 'successRate' | 'recent';

export default function Companies() {
  const { fetchCompanies, refreshAll } = useDataCache();
  const { showToast, updateToast } = useToast();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'running' | 'completed'>('all');
  const [yearFilter, setYearFilter] = useState<number | 'all'>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortBy>('recent');
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchCompaniesData = useCallback(async (force = false) => {
    try {
      const companiesData = await fetchCompanies(force); // Pass force parameter!
      setCompanies(companiesData);
      setFilteredCompanies(companiesData);
    } catch (error) {
      console.error('Error fetching companies:', error);
    } finally {
      setLoading(false);
    }
  }, [fetchCompanies]);

  const handleDeleteCompany = async (companyYearId: string, companyName: string, year: number) => {
    const confirmMessage = `⚠️ WARNING: Delete "${companyName}"?\n\nThis will permanently delete:\n• All rounds and student data\n• All placements\n• Student placement records\n• Year analytics\n\nThis CANNOT be undone. Continue?`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    // Show loading toast
    const toastId = showToast({
      type: 'loading',
      title: 'Deleting Company',
      message: `Removing ${companyName} and all associated data...`
    });

    try {
      setDeleting(companyYearId);
      const result = await api.deleteCompany(companyYearId, companyName, year);

      // Update toast to success
      updateToast(toastId, {
        type: 'success',
        title: 'Company Deleted',
        message: `${companyName} removed. Deleted ${result.deleted.rounds} rounds, ${result.deleted.placements} placements.`
      });

      // ✅ SMART REFRESH: Refetch all data in background (no page reload!)
      console.log('🔄 Refetching all cached data...');
      await refreshAll(); // Re-fetches data from API and updates cache
      console.log('✅ Cache refreshed with latest data');

      // Local state will auto-update from the refreshed cache
    } catch (error: unknown) {
      // Update toast to error
      updateToast(toastId, {
        type: 'error',
        title: 'Deletion Failed',
        message: (error as Error).message || 'Failed to delete company'
      });
    } finally {
      setDeleting(null);
    }
  };

  useEffect(() => {
    fetchCompaniesData();
  }, [fetchCompaniesData]);

  useEffect(() => {
    let filtered = [...companies];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(company =>
        company.companyName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(company => company.status === statusFilter);
    }

    // Year filter
    if (yearFilter !== 'all') {
      filtered = filtered.filter(company => company.year === yearFilter);
    }

    // Sorting
    switch (sortBy) {
      case 'name':
        filtered.sort((a, b) => a.companyName.localeCompare(b.companyName));
        break;
      case 'placements':
        filtered.sort((a, b) => b.totalPlaced - a.totalPlaced);
        break;
      case 'successRate':
        filtered.sort((a, b) => {
          const rateA = a.totalApplied > 0 ? (a.totalPlaced / a.totalApplied) : 0;
          const rateB = b.totalApplied > 0 ? (b.totalPlaced / b.totalApplied) : 0;
          return rateB - rateA;
        });
        break;
      case 'recent':
        filtered.sort((a, b) => b.year - a.year || a.companyName.localeCompare(b.companyName));
        break;
    }

    setFilteredCompanies(filtered);
  }, [searchTerm, statusFilter, yearFilter, sortBy, companies]);

  const years = Array.from(new Set(companies.map(c => c.year))).sort((a, b) => b - a);

  // Calculate statistics
  const totalPlacements = filteredCompanies.reduce((sum, c) => sum + c.totalPlaced, 0);
  const totalApplied = filteredCompanies.reduce((sum, c) => sum + c.totalApplied, 0);
  const avgSuccessRate = totalApplied > 0 ? ((totalPlacements / totalApplied) * 100).toFixed(1) : '0';

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-32 glass-strong rounded-2xl skeleton"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="glass-strong rounded-2xl p-8 border border-purple-500/20">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <h1 className="text-4xl font-bold text-gradient mb-2">Companies</h1>
            <p className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Manage and track all placement drives
            </p>
          </div>
          <div className="flex items-center gap-4">
            <RefreshButton className="py-3 px-6" />
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-gradient-blue">{filteredCompanies.length}</p>
                <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Companies</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-gradient-green">{totalPlacements}</p>
                <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Placements</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-gradient">{avgSuccessRate}%</p>
                <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Success Rate</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="glass-strong rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative group">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-blue-400 transition-colors" />
            <input
              type="text"
              placeholder="Search companies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault(); // Prevent form submission
                }
              }}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                className="dropdown"
              >
                <option value="all">All Status</option>
                <option value="running">Running</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
              className="dropdown"
            >
              <option value="all">All Years</option>
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="dropdown"
            >
              <option value="recent">Most Recent</option>
              <option value="name">Name (A-Z)</option>
              <option value="placements">Most Placements</option>
              <option value="successRate">Success Rate</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex gap-2 bg-gray-100 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-600 rounded-xl p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'grid'
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
              >
                <Grid3x3 className="h-5 w-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'list'
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
              >
                <List className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Companies Grid/List */}
      {filteredCompanies.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No companies found"
          description="Try adjusting your filters or search criteria"
        />
      ) : (
        <div className={viewMode === 'grid'
          ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          : "space-y-4"
        }>
          {filteredCompanies.map((company, index) => (
            <CompanyCard
              key={company.companyYearId}
              company={company}
              viewMode={viewMode}
              index={index}
              onDelete={handleDeleteCompany}
              isDeleting={deleting === company.companyYearId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface CompanyCardProps {
  company: Company;
  viewMode: ViewMode;
  index: number;
  onDelete: (companyYearId: string, companyName: string, year: number) => void;
  isDeleting: boolean;
}

function CompanyCard({ company, viewMode, index, onDelete, isDeleting }: CompanyCardProps) {
  const placementRate = company.totalApplied > 0
    ? ((company.totalPlaced / company.totalApplied) * 100).toFixed(1)
    : '0';

  const animationClass = viewMode === 'grid'
    ? `animate-scale-in stagger-${Math.min(index % 6 + 1, 6)}`
    : 'animate-slide-in-left';

  if (viewMode === 'list') {
    return (
      <Link
        to={`/companies/${company.companyYearId}`}
        className={`block glass-strong rounded-xl p-6 card-hover border border-gray-700/50 hover:border-blue-500/50 ${animationClass}`}
      >
        <div className="flex items-center justify-between gap-6">
          <div className="flex items-center gap-4 flex-1">
            <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-always-white font-bold text-2xl shadow-glow-blue">
              {company.companyName.charAt(0)}
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors mb-1">
                {company.companyName}
              </h3>
              <div className="flex items-center gap-3 text-sm text-gray-400">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {company.year}
                </span>
                <span>•</span>
                <span>Round {company.currentRound} of {company.totalRounds}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-gradient-green">{company.totalPlaced}</p>
              <p className="text-gray-500 dark:text-gray-400 text-xs">Placed</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-600 dark:text-gray-400">{company.totalApplied}</p>
              <p className="text-gray-500 dark:text-gray-400 text-xs">Applied</p>
            </div>
            <div className="text-center min-w-[80px]">
              <p className="text-3xl font-bold text-gradient-blue">{placementRate}%</p>
              <p className="text-gray-500 dark:text-gray-400 text-xs">Success</p>
            </div>
            <span
              className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium ${company.status === 'completed'
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                }`}
            >
              {company.status === 'completed' ? 'Completed' : 'Running'}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onDelete(company.companyYearId, company.companyName, company.year);
              }}
              disabled={isDeleting}
              className="p-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              title="Delete Company"
            >
              {isDeleting ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Trash2 size={18} />
              )}
            </button>
            <ArrowRight className="h-6 w-6 text-gray-400 group-hover:text-blue-400 group-hover:translate-x-2 transition-all" />
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      to={`/companies/${company.companyYearId}`}
      className={`block group ${animationClass}`}
    >
      <div className="glass-strong rounded-2xl border border-gray-700/50 p-6 shadow-2xl card-hover hover:border-blue-500/50">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-always-white font-bold text-xl shadow-lg group-hover:shadow-glow-blue group-hover:scale-110 transition-all">
              {company.companyName.charAt(0)}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors">
                {company.companyName}
              </h3>
              <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
                <Calendar className="h-3 w-3" />
                <span>{company.year}</span>
              </div>
            </div>
          </div>
          <span
            className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${company.status === 'completed'
              ? 'bg-green-500/20 text-green-400 border-green-500/30'
              : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
              }`}
          >
            {company.status === 'completed' ? 'Completed' : 'Running'}
          </span>
        </div>

        <div className="space-y-3 mb-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <Trophy className="h-4 w-4 text-green-500 dark:text-green-400" />
              <span className="text-sm">Placed</span>
            </div>
            <span className="text-gray-900 dark:text-white font-bold text-lg">{company.totalPlaced}</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <Users className="h-4 w-4 text-blue-500 dark:text-blue-400" />
              <span className="text-sm">Applied</span>
            </div>
            <span className="text-gray-900 dark:text-white font-bold text-lg">{company.totalApplied}</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <Target className="h-4 w-4 text-purple-500 dark:text-purple-400" />
              <span className="text-sm">Success Rate</span>
            </div>
            <span className="text-gradient-blue font-bold text-lg">{placementRate}%</span>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-700/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-blue-400" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Round {company.currentRound} of {company.totalRounds}
            </span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onDelete(company.companyYearId, company.companyName, company.year);
            }}
            disabled={isDeleting}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm"
          >
            {isDeleting ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 size={14} />
                <span>Delete</span>
              </>
            )}
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-full rounded-full transition-all duration-1000 animate-shimmer"
              style={{ width: `${(company.currentRound / company.totalRounds) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>
    </Link>
  );
}
