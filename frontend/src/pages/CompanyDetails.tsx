import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { Company, Round, Placement } from '../types';
import { ArrowLeft, Building2, Users, Trophy, Calendar, CheckCircle2, XCircle, Clock, TrendingUp, Download, Search, Filter as FilterIcon, ChevronRight, FileText, Loader2, Trash2 } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { exportToCSV } from '../lib/exportUtils';
import { useDataCache } from '../context/DataCacheContext';
import { useToast } from '../context/ToastContext';

export default function CompanyDetails() {
  const { id } = useParams<{ id: string }>();
  const { fetchRoundsForCompany, clearCache, refreshAll } = useDataCache();  // ✅ Use cached rounds
  const { showToast, updateToast } = useToast();
  const [company, setCompany] = useState<Company | null>(null);
  const [rounds, setRounds] = useState<Record<string, Round>>({});
  const [placements, setPlacements] = useState<Record<string, Placement>>({});
  const [loading, setLoading] = useState(true);
  const [selectedRound, setSelectedRound] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'qualified' | 'not_qualified' | 'pending'>('all');
  const [deletingRound, setDeletingRound] = useState<string | null>(null);

  const fetchCompanyDetails = useCallback(async () => {
    if (!id) {
      console.error('No company ID provided');
      setLoading(false);
      return;
    }

    try {
      console.log('Fetching company details for ID:', id);

      // ✅ Fetch company details and use cached rounds
      const [companyData, roundsData] = await Promise.all([
        api.request<Company>(`/companies/${id}`),
        fetchRoundsForCompany(id)  // ✅ Use cached rounds!
      ]);

      console.log('Company data received:', companyData);
      console.log('Rounds data received (cached):', roundsData);

      setCompany(companyData);

      // Convert rounds array to object with roundId as key
      const roundsMap: Record<string, Round> = {};
      roundsData.forEach(round => {
        if (round.roundId) {
          roundsMap[round.roundId] = round;
        }
      });
      setRounds(roundsMap);

      // Extract placements from company data if available
      if (companyData.placements) {
        setPlacements(companyData.placements);
      } else {
        console.log('No placements data found for company');
        setPlacements({});
      }
    } catch (error) {
      console.error('Error fetching company details:', error);
      // Set company to null so we show the error state
      setCompany(null);
    } finally {
      setLoading(false);
    }
  }, [id]);  // ✅ Only depend on id, fetchRoundsForCompany is stable

  useEffect(() => {
    fetchCompanyDetails();
  }, [id, fetchCompanyDetails]);

  const handleDeleteRound = async (roundId: string, roundNumber: number, e: React.MouseEvent) => {
    e.stopPropagation();

    const confirmMessage = `⚠️ Delete Round ${roundNumber}?\n\nThis will permanently delete:\n• All student data for this round\n• Student placement records if final round\n\nThis CANNOT be undone. Continue?`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    // Show loading toast
    const toastId = showToast({
      type: 'loading',
      title: 'Deleting Round',
      message: `Removing Round ${roundNumber} and data...`
    });

    try {
      setDeletingRound(roundId);
      const result = await api.deleteRound(company!.companyYearId, roundId, roundNumber);

      // Update toast to success
      updateToast(toastId, {
        type: 'success',
        title: 'Round Deleted',
        message: `Round ${roundNumber} removed. Updated ${result.deleted.students_updated} students.`
      });

      // ✅ AUTOMATIC REFRESH
      console.log('🗑️ Clearing cache after round deletion...');
      clearCache();
      await refreshAll();

      // Refresh data (refreshAll fetches fresh data, but we might want to ensure local state updation)
      // fetchCompanyDetails(); // refreshAll + component re-render should handle it, or we call this to be safe
      await fetchCompanyDetails();
    } catch (error: unknown) {
      // Update toast to error
      updateToast(toastId, {
        type: 'error',
        title: 'Deletion Failed',
        message: (error as Error).message || 'Failed to delete round'
      });
    } finally {
      setDeletingRound(null);
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading company details..." />;
  }

  if (!company) {
    return (
      <EmptyState
        icon={Building2}
        title="Company not found"
        description="The company you're looking for doesn't exist or has been removed"
      />
    );
  }

  const sortedRounds = Object.entries(rounds).sort(([, a], [, b]) => a.roundNumber - b.roundNumber);
  const selectedRoundData = selectedRound ? rounds[selectedRound] : null;
  const successRate = company.totalApplied > 0
    ? ((company.totalPlaced / company.totalApplied) * 100).toFixed(1)
    : '0';

  const completionRate = company.totalRounds > 0
    ? ((company.currentRound / company.totalRounds) * 100).toFixed(0)
    : '0';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back Button */}
      <Link
        to="/companies"
        className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-all group"
      >
        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
        <span>Back to Companies</span>
      </Link>

      {/* Company Header */}
      <div className="glass-strong rounded-2xl p-8 shadow-2xl border border-blue-500/20">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-always-white font-bold text-3xl shadow-glow-blue">
              {company.companyName.charAt(0)}
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gradient-blue mb-2">{company.companyName}</h1>
              <div className="flex items-center gap-4 text-gray-400">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Academic Year {company.year}</span>
                </div>
                <span
                  className={`inline-flex items-center px-4 py-1.5 rounded-lg text-sm font-medium border ${company.status === 'completed'
                    ? 'bg-green-500/20 text-green-400 border-green-500/30 shadow-glow-green'
                    : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                    }`}
                >
                  {company.status === 'completed' ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Completed
                    </>
                  ) : (
                    <>
                      <Clock className="h-4 w-4 mr-2" />
                      Running
                    </>
                  )}
                </span>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-400" />
                <span className="text-gray-400 text-sm">
                  Round {company.currentRound} of {company.totalRounds}
                </span>
                <div className="flex-1 max-w-xs">
                  <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-full rounded-full transition-all animate-shimmer"
                      style={{ width: `${completionRate}%` }}
                    ></div>
                  </div>
                </div>
                <span className="text-blue-400 text-sm font-medium">{completionRate}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-8">
          <div className="glass rounded-xl p-4 card-hover animate-scale-in stagger-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-glow-green">
                <Trophy className="h-5 w-5 text-white stroke-white" strokeWidth={2} />
              </div>
              <span className="text-gray-400 text-sm">Placed</span>
            </div>
            <p className="text-3xl font-bold text-gradient-green">{company.totalPlaced}</p>
          </div>

          <div className="glass rounded-xl p-4 card-hover animate-scale-in stagger-2">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
                <Users className="h-5 w-5 text-white stroke-white" strokeWidth={2} />
              </div>
              <span className="text-gray-400 text-sm">Applied</span>
            </div>
            <p className="text-3xl font-bold text-white">{company.totalApplied}</p>
          </div>

          <div className="glass rounded-xl p-4 card-hover animate-scale-in stagger-3">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-glow-purple">
                <Building2 className="h-5 w-5 text-white stroke-white" strokeWidth={2} />
              </div>
              <span className="text-gray-400 text-sm">Total Rounds</span>
            </div>
            <p className="text-3xl font-bold text-white">{company.totalRounds}</p>
          </div>

          <div className="glass rounded-xl p-4 card-hover animate-scale-in stagger-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-lg">
                <TrendingUp className="h-5 w-5 text-white stroke-white" strokeWidth={2} />
              </div>
              <span className="text-gray-400 text-sm">Success Rate</span>
            </div>
            <p className="text-3xl font-bold text-gradient-blue">{successRate}%</p>
          </div>
        </div>
      </div>

      {/* Rounds Overview - Show this FIRST */}
      {!selectedRound ? (
        <div className="glass-strong rounded-2xl p-6 shadow-2xl animate-slide-in-right">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-white flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg">
                <FileText className="h-5 w-5 text-white stroke-white" strokeWidth={2} />
              </div>
              Placement Rounds Overview
            </h2>
            <div className="px-4 py-2 bg-purple-500/10 rounded-lg border border-purple-500/30">
              <span className="text-purple-400 font-medium text-sm">
                {sortedRounds.length} Rounds
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedRounds.map(([roundId, round], index) => {
              // Get next round for progression tracking
              const nextRound = sortedRounds[index + 1];
              const isFinalRound = !nextRound || round.isFinalRound;

              let qualifiedCount = 0;
              let disqualifiedCount = 0;
              let pendingCount = 0;

              if (isFinalRound) {
                // For final round, show pending students
                pendingCount = Object.values(round.data).filter(d => d.status === 'pending').length;
              } else {
                // For non-final rounds, calculate based on next round
                const nextRoundStudentIds = new Set(
                  Object.values(nextRound[1].data)
                    .map(d => d.studentId)
                    .filter((id): id is string => id !== null)
                );

                // Count how many students from this round made it to next round
                qualifiedCount = Object.values(round.data)
                  .filter(d => d.studentId && nextRoundStudentIds.has(d.studentId))
                  .length;

                // Disqualified = total students - qualified
                disqualifiedCount = round.studentCount - qualifiedCount;
              }

              return (
                <div
                  key={roundId}
                  onClick={() => setSelectedRound(roundId)}
                  className="glass-strong rounded-xl p-6 card-hover cursor-pointer border border-gray-700/50 hover:border-blue-500 transition-all group animate-scale-in"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-always-white font-bold text-xl shadow-lg group-hover:scale-110 transition-transform">
                        {round.roundNumber}
                      </div>
                      <div>
                        <h3 className="text-white font-semibold text-lg group-hover:text-blue-400 transition-colors">
                          Round {round.roundNumber}
                        </h3>
                        {round.roundName && (
                          <p className="text-gray-400 text-sm">{round.roundName}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => handleDeleteRound(roundId, round.roundNumber, e)}
                        disabled={deletingRound === roundId}
                        className="p-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        title="Delete Round"
                      >
                        {deletingRound === roundId ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Trash2 size={16} />
                        )}
                      </button>
                      <ChevronRight className="h-5 w-5 text-gray-500 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Total Students</span>
                      <span className="text-white font-semibold">{round.studentCount}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Data Columns</span>
                      <span className="text-white font-semibold">{round.rawColumns.length}</span>
                    </div>
                    {isFinalRound ? (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Pending</span>
                        <span className="text-yellow-400 font-semibold">{pendingCount}</span>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-400">Qualified</span>
                          <span className="text-green-400 font-semibold flex items-center gap-1">
                            {qualifiedCount}
                            <span className="text-xs text-green-500/60">→ R{round.roundNumber + 1}</span>
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-400">Disqualified</span>
                          <span className="text-red-400 font-semibold">{disqualifiedCount}</span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Raw Columns Display */}
                  <div className="mb-4">
                    <p className="text-gray-400 text-xs mb-2 font-medium">Columns in this round:</p>
                    <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto custom-scrollbar">
                      {round.rawColumns.slice(0, 6).map((column, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-blue-500/10 border border-blue-500/30 rounded text-xs text-blue-400"
                        >
                          {column}
                        </span>
                      ))}
                      {round.rawColumns.length > 6 && (
                        <span className="px-2 py-1 bg-gray-700 rounded text-xs text-gray-400">
                          +{round.rawColumns.length - 6} more
                        </span>
                      )}
                    </div>
                  </div>

                  {round.isFinalRound && (
                    <div className="px-3 py-1 bg-yellow-500/20 border border-yellow-500/30 rounded-lg text-center">
                      <span className="text-yellow-400 text-xs font-medium">Final Round</span>
                    </div>
                  )}

                  <div className="mt-4 flex items-center gap-2 text-blue-400 text-sm font-medium group-hover:gap-3 transition-all">
                    <span>View Student Data</span>
                    <ChevronRight className="h-4 w-4" />
                  </div>
                </div>
              );
            })}

            {/* Final Placements Card */}
            <div
              onClick={() => setSelectedRound('placements')}
              className="glass-strong rounded-xl p-6 card-hover cursor-pointer border border-gray-700/50 hover:border-green-500 transition-all group animate-scale-in"
              style={{ animationDelay: `${sortedRounds.length * 0.05}s` }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-glow-green group-hover:scale-110 transition-transform">
                    <Trophy className="h-7 w-7 text-white stroke-white" strokeWidth={2} />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-lg group-hover:text-green-400 transition-colors">
                      Final Placements
                    </h3>
                    <p className="text-gray-400 text-sm">Selected Students</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-500 group-hover:text-green-400 group-hover:translate-x-1 transition-all" />
              </div>

              <div className="flex items-center justify-center py-6">
                <div className="text-center">
                  <p className="text-5xl font-bold text-gradient-green mb-2">{Object.keys(placements).length}</p>
                  <p className="text-gray-400 text-sm">Students Placed</p>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2 text-green-400 text-sm font-medium group-hover:gap-3 transition-all">
                <span>View Placements</span>
                <ChevronRight className="h-4 w-4" />
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Show Student Data when round is selected
        <div className="glass-strong rounded-2xl p-6 shadow-2xl animate-slide-in-right">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSelectedRound(null)}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-gray-400 hover:text-white"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h2 className="text-2xl font-semibold text-white flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
                  <Users className="h-5 w-5 text-white stroke-white" strokeWidth={2} />
                </div>
                {selectedRound === 'placements' ? 'Final Placements' : `Round ${selectedRoundData?.roundNumber} - Student Data`}
              </h2>
            </div>
          </div>

          {/* Search and Filters */}
          {selectedRound !== 'placements' && selectedRoundData && (
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search in round data..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>
              <div className="flex items-center gap-2">
                <FilterIcon className="h-5 w-5 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                  className="dropdown"
                >
                  <option value="all">All Status</option>
                  <option value="qualified">Qualified</option>
                  <option value="not_qualified">Disqualified</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
              <button
                onClick={() => {
                  if (selectedRoundData) {
                    const exportData = Object.values(selectedRoundData.data).map((data) => {
                      const row: Record<string, unknown> = { Status: data.status };
                      selectedRoundData.rawColumns.forEach(col => {
                        row[col] = data.rowData[col] || '';
                      });
                      return row;
                    });
                    exportToCSV(exportData, `${company?.companyName}_round_${selectedRoundData.roundNumber}_${new Date().toISOString().split('T')[0]}`);
                  }
                }}
                className="px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-all btn-hover flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export
              </button>
            </div>
          )}

          {/* Content */}
          {selectedRound === 'placements' ? (
            <PlacementsTable placements={placements} />
          ) : selectedRoundData ? (
            <RoundDataTable
              round={selectedRoundData}
              searchTerm={searchTerm}
              statusFilter={statusFilter}
              allRounds={rounds}
              currentRoundNumber={selectedRoundData.roundNumber}
            />
          ) : (
            <EmptyState
              icon={Clock}
              title="No round selected"
              description="Select a round to view details"
            />
          )}
        </div>
      )}
    </div>
  );
}

interface RoundDataTableProps {
  round: Round;
  searchTerm: string;
  statusFilter: 'all' | 'qualified' | 'not_qualified' | 'pending';
  allRounds?: Record<string, Round>;
  currentRoundNumber?: number;
}

function RoundDataTable({ round, searchTerm, statusFilter, allRounds, currentRoundNumber }: RoundDataTableProps) {
  const [displayedCount, setDisplayedCount] = useState(50);
  const [loading, setLoading] = useState(false);
  const observerTarget = useRef<HTMLTableRowElement>(null);

  const dataEntries = Object.entries(round.data);

  // Find next round for cross-round progression check
  const nextRound = allRounds && currentRoundNumber
    ? Object.values(allRounds).find(r => r.roundNumber === currentRoundNumber + 1)
    : null;

  // Create a set of student IDs in the next round
  const nextRoundStudentIds = nextRound
    ? new Set(
      Object.values(nextRound.data)
        .map(d => d.studentId)
        .filter((id): id is string => id !== null)
    )
    : null;

  // Enrich data entries with computed qualification status based on next round
  const enrichedDataEntries = dataEntries.map(([rowId, data]) => {
    let computedStatus = data.status;

    // If this is not the final round and we have next round data
    if (nextRoundStudentIds && data.studentId) {
      if (nextRoundStudentIds.has(data.studentId)) {
        // Student is in next round = qualified from this round
        computedStatus = 'qualified';
      } else if (data.status === 'pending') {
        // Student was in this round but NOT in next round = not qualified
        computedStatus = 'not_qualified';
      }
    }

    return [rowId, { ...data, computedStatus }] as const;
  });

  // Apply filters with computed status
  let filteredEntries = enrichedDataEntries;

  if (statusFilter !== 'all') {
    filteredEntries = filteredEntries.filter(([, data]) => data.computedStatus === statusFilter);
  }

  if (searchTerm) {
    filteredEntries = filteredEntries.filter(([, data]) => {
      const searchLower = searchTerm.toLowerCase();
      return Object.values(data.rowData).some(value =>
        String(value).toLowerCase().includes(searchLower)
      );
    });
  }

  // Sort: Qualified first, then Pending, then Not Qualified
  filteredEntries.sort(([, a], [, b]) => {
    const statusOrder = { qualified: 0, pending: 1, not_qualified: 2 };
    return statusOrder[a.computedStatus as keyof typeof statusOrder] - statusOrder[b.computedStatus as keyof typeof statusOrder];
  });

  // Reset displayed count when filters change
  useEffect(() => {
    setDisplayedCount(50);
  }, [searchTerm, statusFilter]);

  // Infinite scroll observer
  useEffect(() => {
    const hasMore = displayedCount < filteredEntries.length;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          console.log('🔄 Loading more round data rows...');
          setLoading(true);
          setTimeout(() => {
            setDisplayedCount(prev => Math.min(prev + 50, filteredEntries.length));
            setLoading(false);
          }, 100);
        }
      },
      { threshold: 0.1, rootMargin: '200px' }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [displayedCount, filteredEntries.length, loading]);

  const displayedEntries = filteredEntries.slice(0, displayedCount);
  const hasMore = displayedCount < filteredEntries.length;

  if (filteredEntries.length === 0) {
    return (
      <EmptyState
        icon={Search}
        title="No data found"
        description="Try adjusting your search or filters"
      />
    );
  }

  // Count by computed status
  const statusCounts = enrichedDataEntries.reduce((acc, [, data]) => {
    acc[data.computedStatus] = (acc[data.computedStatus] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-4">
      {/* Status Summary with computed values */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="glass rounded-lg p-3 text-center card-hover">
          <p className="text-green-400 text-2xl font-bold">{statusCounts['qualified'] || 0}</p>
          <p className="text-gray-400 text-sm">Qualified</p>
          {nextRound && <p className="text-green-500/60 text-xs mt-1">→ Promoted to Round {currentRoundNumber! + 1}</p>}
        </div>
        <div className="glass rounded-lg p-3 text-center card-hover">
          <p className="text-red-400 text-2xl font-bold">{statusCounts['not_qualified'] || 0}</p>
          <p className="text-gray-400 text-sm">Disqualified</p>
          {nextRound && <p className="text-red-500/60 text-xs mt-1">✗ Did not progress</p>}
        </div>
        <div className="glass rounded-lg p-3 text-center card-hover">
          <p className="text-yellow-400 text-2xl font-bold">{statusCounts['pending'] || 0}</p>
          <p className="text-gray-400 text-sm">Pending</p>
        </div>
      </div>

      {/* Info banner about cross-round tracking */}
      {nextRound && (
        <div className="glass-strong rounded-lg p-3 border-l-4 border-blue-500">
          <p className="text-blue-400 text-sm flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span>
              <strong>Smart Tracking:</strong> Students in Round {currentRoundNumber! + 1} are automatically marked as "Qualified" from this round.
            </span>
          </p>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-left py-4 px-4 text-gray-400 font-medium sticky left-0 bg-gray-900 z-10">
                Status
              </th>
              {round.rawColumns.map((column) => (
                <th key={column} className="text-left py-4 px-4 text-gray-400 font-medium whitespace-nowrap">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayedEntries.map(([rowId, rowData], index) => {
              // Set trigger point at 30 items from the end
              const isTriggerPoint = index === displayedEntries.length - 30;

              return (
                <tr
                  key={rowId}
                  ref={isTriggerPoint ? observerTarget : null}
                  className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-all duration-200 animate-fade-in"
                  style={{ animationDelay: `${Math.min(index, 20) * 0.02}s` }}
                >
                  <td className="py-3 px-4 sticky left-0 bg-gray-900 z-10">
                    <StatusBadge status={rowData.computedStatus} />
                  </td>
                  {round.rawColumns.map((column) => (
                    <td key={column} className="py-3 px-4 text-white whitespace-nowrap">
                      {String(rowData.rowData[column] || '-')}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Loading indicator at bottom */}
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 text-blue-400 animate-spin mr-2" />
            <span className="text-gray-400">Loading more rows...</span>
          </div>
        )}

        {/* Info about displayed vs total */}
        {hasMore && (
          <div className="text-center py-4 text-gray-500 text-sm">
            Showing {displayedCount} of {filteredEntries.length} rows
          </div>
        )}
      </div>
    </div>
  );
}

function PlacementsTable({ placements }: { placements: Record<string, Placement> }) {
  const placementEntries = Object.entries(placements);

  if (placementEntries.length === 0) {
    return (
      <EmptyState
        icon={Trophy}
        title="No placements yet"
        description="Placements will appear here once students are finalized"
      />
    );
  }

  const columns = placementEntries.length > 0
    ? Object.keys(placementEntries[0][1].rowData)
    : [];

  return (
    <div className="space-y-4">
      <div className="glass rounded-lg p-4 text-center">
        <p className="text-green-400 text-4xl font-bold mb-2">{placementEntries.length}</p>
        <p className="text-gray-400">Total Students Placed</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-left py-4 px-4 text-gray-400 font-medium sticky left-0 bg-gray-900 z-10">
                #
              </th>
              <th className="text-left py-4 px-4 text-gray-400 font-medium">Student ID</th>
              {columns.map((column) => (
                <th key={column} className="text-left py-4 px-4 text-gray-400 font-medium whitespace-nowrap">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {placementEntries.map(([studentId, placement], index) => (
              <tr
                key={studentId}
                className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-all duration-200 animate-fade-in"
                style={{ animationDelay: `${index * 0.02}s` }}
              >
                <td className="py-3 px-4 text-gray-500 font-medium sticky left-0 bg-gray-900 z-10">
                  {index + 1}
                </td>
                <td className="py-3 px-4 text-blue-400 font-medium">{studentId}</td>
                {columns.map((column) => (
                  <td key={column} className="py-3 px-4 text-white whitespace-nowrap">
                    {String(placement.rowData[column] || '-')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const statusConfig = {
    qualified: {
      icon: CheckCircle2,
      className: 'bg-green-500/20 text-green-400 border-green-500/30',
      label: 'Qualified'
    },
    not_qualified: {
      icon: XCircle,
      className: 'bg-red-500/20 text-red-400 border-red-500/30',
      label: 'Disqualified'
    },
    pending: {
      icon: Clock,
      className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      label: 'Pending'
    },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all duration-200 ${config.className}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </span>
  );
}
