import { useEffect, useState } from 'react';
import { YearAnalytics, Company, Student } from '../types';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { TrendingUp, Award, Building2, Users, Download, Filter } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import { exportToCSV } from '../lib/exportUtils';
import { useTheme } from '../context/ThemeContext';
import { useDataCache } from '../context/DataCacheContext';
import RefreshButton from '../components/RefreshButton';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

export default function Analytics() {
  const { fetchYears, fetchCompanies, fetchStudents } = useDataCache();
  const [years, setYears] = useState<YearAnalytics[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | 'all'>('all');
  const { theme } = useTheme();

  // Theme-aware tooltip styles
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
        setError(null);
        // Use cached data for years and companies
        const [yearsData, companiesData, studentsData] = await Promise.all([
          fetchYears(), // Cache-first!
          fetchCompanies(), // Cache-first!
          fetchStudents() // Cache-first! No more duplicate 133KB calls
        ]);

        setYears(yearsData);
        setCompanies(companiesData);
        setStudents(studentsData);
      } catch (error) {
        console.error('Error fetching analytics data:', error);
        setError('Failed to load analytics data. Please try refreshing the page.');
        // Set empty arrays to prevent undefined errors
        setYears([]);
        setCompanies([]);
        setStudents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [fetchCompanies, fetchStudents, fetchYears]);

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading analytics..." />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="glass-strong rounded-2xl p-8 max-w-md text-center">
          <div className="mb-4">
            <TrendingUp className="h-16 w-16 text-red-400 mx-auto" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Failed to Load Analytics</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-all btn-hover"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Filter data by selected year
  const filteredCompanies = selectedYear === 'all'
    ? companies
    : companies.filter(c => c.year === selectedYear);

  // Calculate total applications (participated) per year from companies
  // This counts each student-company combination, so if 133 students applied to 3 companies, it's 133*3
  const participationByYear = companies.reduce((acc, company) => {
    const year = company.year;
    acc[year] = (acc[year] || 0) + (company.totalApplied || 0);
    return acc;
  }, {} as Record<number, number>);

  const yearlyTrend = years.map(y => {
    const participated = participationByYear[y.year] || 0;
    return {
      year: y.year,
      companies: y.totalCompanies || 0,
      placed: y.totalPlaced || 0,
      participated: participated,
      placementRate: participated > 0
        ? ((y.totalPlaced / participated) * 100).toFixed(1)
        : 0
    };
  });

  const statusDistribution = [
    { name: 'Placed', value: students.filter(s => s.currentStatus === 'placed').length },
    { name: 'Not Placed', value: students.filter(s => s.currentStatus === 'not_placed').length },
  ];

  const companyStatusData = [
    { name: 'Completed', value: filteredCompanies.filter(c => c.status === 'completed').length },
    { name: 'Running', value: filteredCompanies.filter(c => c.status === 'running').length },
  ];

  const topCompanies = filteredCompanies
    .sort((a, b) => b.totalPlaced - a.totalPlaced)
    .slice(0, 10)
    .map(c => ({
      name: c.companyName.length > 15 ? c.companyName.substring(0, 15) + '...' : c.companyName,
      placed: c.totalPlaced,
      applied: c.totalApplied,
      successRate: c.totalApplied > 0 ? ((c.totalPlaced / c.totalApplied) * 100).toFixed(1) : 0
    }));

  const offersDistribution = students.reduce((acc, student) => {
    const offers = student.totalOffers;
    const existing = acc.find(item => item.offers === offers);
    if (existing) {
      existing.count++;
    } else {
      acc.push({ offers, count: 1 });
    }
    return acc;
  }, [] as { offers: number; count: number }[]).sort((a, b) => a.offers - b.offers);

  // Calculate summary stats
  const totalPlacements = filteredCompanies.reduce((sum, c) => sum + (c.totalPlaced || 0), 0);
  const totalApplications = filteredCompanies.reduce((sum, c) => sum + (c.totalApplied || 0), 0);
  const avgSuccessRate = totalApplications > 0 ? ((totalPlacements / totalApplications) * 100).toFixed(1) : '0';

  const handleExportAll = () => {
    const exportData = [
      ...yearlyTrend.map(yt => ({
        Type: 'Yearly Trend',
        Year: yt.year,
        Companies: yt.companies,
        Placed: yt.placed,
        Participated: yt.participated,
        'Success Rate': yt.placementRate + '%'
      })),
      ...statusDistribution.map(sd => ({
        Type: 'Student Status',
        Status: sd.name,
        Count: sd.value,
        Year: selectedYear === 'all' ? 'All' : selectedYear
      })),
      ...companyStatusData.map(csd => ({
        Type: 'Company Status',
        Status: csd.name,
        Count: csd.value,
        Year: selectedYear === 'all' ? 'All' : selectedYear
      })),
      ...offersDistribution.map(od => ({
        Type: 'Offers Distribution',
        Offers: od.offers,
        Students: od.count,
        Year: selectedYear === 'all' ? 'All' : selectedYear
      })),
      ...topCompanies.map(tc => ({
        Type: 'Top Companies',
        'Company Name': tc.name,
        Placed: tc.placed,
        Applied: tc.applied,
        'Success Rate': tc.successRate + '%',
        Year: selectedYear === 'all' ? 'All' : selectedYear
      }))
    ];
    exportToCSV(exportData, `analytics_full_report_${new Date().toISOString().split('T')[0]}`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="glass-strong rounded-2xl p-8 border border-blue-500/20">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <h1 className="text-4xl font-bold text-gradient-blue mb-2">Analytics</h1>
            <p className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Data-driven placement insights and trends
            </p>
          </div>
          <div className="flex items-center gap-4">
            <RefreshButton />
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-cyan-400" />
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                className="dropdown hover:border-cyan-500"
              >
                <option value="all">All Years</option>
                {years.map(year => (
                  <option key={year.year} value={year.year}>{year.year}</option>
                ))}
              </select>
            </div>
            <button
              onClick={handleExportAll}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-medium hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-lg shadow-green-500/30 btn-hover"
            >
              <Download className="h-4 w-4" />
              Export All
            </button>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass rounded-xl p-6 card-hover animate-scale-in stagger-1">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-glow-blue">
              <Building2 className="h-6 w-6 text-white stroke-white" strokeWidth={2} />
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Total Companies</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{filteredCompanies.length}</p>
            </div>
          </div>
        </div>

        <div className="glass rounded-xl p-6 card-hover animate-scale-in stagger-2">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-glow-green">
              <Award className="h-6 w-6 text-white stroke-white" strokeWidth={2} />
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Total Placements</p>
              <p className="text-3xl font-bold text-gradient-green">{totalPlacements}</p>
            </div>
          </div>
        </div>

        <div className="glass rounded-xl p-6 card-hover animate-scale-in stagger-3">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-glow-purple">
              <Users className="h-6 w-6 text-white stroke-white" strokeWidth={2} />
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Applications</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{totalApplications}</p>
            </div>
          </div>
        </div>

        <div className="glass rounded-xl p-6 card-hover animate-scale-in stagger-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-lg">
              <TrendingUp className="h-6 w-6 text-white stroke-white" strokeWidth={2} />
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Success Rate</p>
              <p className="text-3xl font-bold text-gradient-blue">{avgSuccessRate}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* NEW: Company Participation Pie Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Company Distribution Pie Chart */}
        <div className="glass-strong rounded-2xl p-6 shadow-2xl animate-scale-in">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-glow-green">
              <Award className="h-5 w-5 text-white stroke-white" strokeWidth={2} />
            </div>
            Company Placement Distribution {selectedYear !== 'all' && `(${selectedYear})`}
          </h2>
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={filteredCompanies.map(c => ({
                  name: c.companyName.length > 20 ? c.companyName.substring(0, 20) + '...' : c.companyName,
                  value: c.totalPlaced || 0,
                  fullName: c.companyName,
                  participated: c.totalApplied || 0
                })).filter(c => c.value > 0)}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={(entry) => `${((entry.value / filteredCompanies.reduce((sum, c) => sum + (c.totalPlaced || 0), 0)) * 100).toFixed(0)}%`}
                labelLine={{ stroke: theme === 'dark' ? '#9ca3af' : '#6b7280' }}
              >
                {filteredCompanies.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={tooltipStyle}
                labelStyle={tooltipLabelStyle}
                itemStyle={tooltipItemStyle}
                content={(props: any) => {
                  if (props.active && props.payload && props.payload.length) {
                    const data = props.payload[0].payload;
                    return (
                      <div style={tooltipStyle} className="p-3">
                        <p style={tooltipLabelStyle} className="mb-2">{data.fullName}</p>
                        <p style={tooltipItemStyle}>Students Placed: <span className="font-bold text-green-500">{data.value}</span></p>
                        <p style={tooltipItemStyle}>Students Participated: <span className="font-bold">{data.participated}</span></p>
                        <p style={tooltipItemStyle}>Success Rate: <span className="font-bold">{data.participated > 0 ? ((data.value / data.participated) * 100).toFixed(1) : 0}%</span></p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: '12px' }}
                formatter={(value, entry: any) => (
                  <span style={{ color: theme === 'dark' ? '#e5e7eb' : '#374151' }}>
                    {value} ({entry.payload.value})
                  </span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
            Total Placements: <span className="font-bold text-green-500">{filteredCompanies.reduce((sum, c) => sum + (c.totalPlaced || 0), 0)}</span>
          </p>
        </div>

        {/* Student Participation Breakdown Pie Chart */}
        <div className="glass-strong rounded-2xl p-6 shadow-2xl animate-scale-in">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-green-500 to-green-600 rounded-lg">
              <Users className="h-5 w-5 text-white stroke-white" strokeWidth={2} />
            </div>
            Top 8 Companies by Participation {selectedYear !== 'all' && `(${selectedYear})`}
          </h2>
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={filteredCompanies
                  .sort((a, b) => (b.totalApplied || 0) - (a.totalApplied || 0))
                  .slice(0, 8)
                  .map(c => ({
                    name: c.companyName.length > 15 ? c.companyName.substring(0, 15) + '...' : c.companyName,
                    value: c.totalApplied || 0,
                    fullName: c.companyName,
                    placed: c.totalPlaced || 0,
                    status: c.status
                  }))}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                label={(entry) => `${entry.value}`}
                labelLine={{ stroke: theme === 'dark' ? '#9ca3af' : '#6b7280' }}
              >
                {filteredCompanies.slice(0, 8).map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={tooltipStyle}
                labelStyle={tooltipLabelStyle}
                itemStyle={tooltipItemStyle}
                content={(props: any) => {
                  if (props.active && props.payload && props.payload.length) {
                    const data = props.payload[0].payload;
                    const percentage = ((data.value / filteredCompanies.reduce((sum, c) => sum + (c.totalApplied || 0), 0)) * 100).toFixed(1);
                    return (
                      <div style={tooltipStyle} className="p-3">
                        <p style={tooltipLabelStyle} className="mb-2">{data.fullName}</p>
                        <p style={tooltipItemStyle}>Participated: <span className="font-bold">{data.value}</span></p>
                        <p style={tooltipItemStyle}>Placed: <span className="font-bold text-green-500">{data.placed}</span></p>
                        <p style={tooltipItemStyle}>Share: <span className="font-bold">{percentage}%</span></p>
                        <p style={tooltipItemStyle}>
                          Status: <span className={`font-bold ${data.status === 'completed' ? 'text-green-500' : 'text-yellow-500'}`}>
                            {data.status.charAt(0).toUpperCase() + data.status.slice(1)}
                          </span>
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: '12px' }}
                formatter={(value, entry: any) => (
                  <span style={{ color: theme === 'dark' ? '#e5e7eb' : '#374151' }}>
                    {value}
                  </span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
            Showing top 8 companies by student participation
          </p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Year-wise Trend */}
        <div className="glass-strong rounded-2xl p-6 shadow-2xl animate-slide-in-left">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
              <TrendingUp className="h-5 w-5 text-white stroke-white" strokeWidth={2} />
            </div>
            Year-wise Placement Trend
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={yearlyTrend}>
              <defs>
                <linearGradient id="colorPlaced" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorParticipated" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis dataKey="year" stroke={axisStroke} />
              <YAxis stroke={axisStroke} />
              <Tooltip
                contentStyle={tooltipStyle}
                labelStyle={tooltipLabelStyle}
              />
              <Legend />
              <Area type="monotone" dataKey="placed" stroke="#10b981" fillOpacity={1} fill="url(#colorPlaced)" name="Students Placed" />
              <Area type="monotone" dataKey="participated" stroke="#3b82f6" fillOpacity={1} fill="url(#colorParticipated)" name="Participated" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Student Status Distribution */}
        <div className="glass-strong rounded-2xl p-6 shadow-2xl animate-slide-in-right">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-glow-green">
              <Users className="h-5 w-5 text-white stroke-white" strokeWidth={2} />
            </div>
            Student Placement Status
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {statusDistribution.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={tooltipStyle}
                itemStyle={tooltipItemStyle}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Company Status */}
        <div className="glass-strong rounded-2xl p-6 shadow-2xl animate-slide-in-left stagger-1">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-glow-purple">
              <Building2 className="h-5 w-5 text-white stroke-white" strokeWidth={2} />
            </div>
            Company Status Distribution
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={companyStatusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {companyStatusData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index + 2]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={tooltipStyle}
                itemStyle={tooltipItemStyle}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Offers Distribution */}
        <div className="glass-strong rounded-2xl p-6 shadow-2xl animate-slide-in-right stagger-1">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg">
              <Award className="h-5 w-5 text-white stroke-white" strokeWidth={2} />
            </div>
            Offers Distribution
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={offersDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis dataKey="offers" stroke={axisStroke} label={{ value: 'Number of Offers', position: 'insideBottom', offset: -5 }} />
              <YAxis stroke={axisStroke} label={{ value: 'Students', angle: -90, position: 'insideLeft' }} />
              <Tooltip
                contentStyle={tooltipStyle}
                labelStyle={tooltipLabelStyle}
              />
              <Bar dataKey="count" fill="#f59e0b" name="Students" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Companies */}
      <div className="glass-strong rounded-2xl p-6 shadow-2xl animate-fade-in">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
            <Building2 className="h-5 w-5 text-white stroke-white" strokeWidth={2} />
          </div>
          Top 10 Companies by Placements
        </h2>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={topCompanies} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
            <XAxis type="number" stroke={axisStroke} />
            <YAxis dataKey="name" type="category" stroke={axisStroke} width={150} />
            <Tooltip
              contentStyle={tooltipStyle}
              labelStyle={tooltipLabelStyle}
              itemStyle={tooltipItemStyle}
            />
            <Legend />
            <Bar dataKey="placed" fill="#10b981" name="Placed" radius={[0, 8, 8, 0]} />
            <Bar dataKey="applied" fill="#3b82f6" name="Applied" radius={[0, 8, 8, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Year-wise Statistics Table */}
      <div className="glass-strong rounded-2xl p-6 shadow-2xl animate-slide-in-right">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">Detailed Year-wise Statistics</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-4 px-4 text-gray-400 font-medium">Year</th>
                <th className="text-right py-4 px-4 text-gray-400 font-medium">Companies</th>
                <th className="text-right py-4 px-4 text-gray-400 font-medium">Completed</th>
                <th className="text-right py-4 px-4 text-gray-400 font-medium">Running</th>
                <th className="text-right py-4 px-4 text-gray-400 font-medium">Placed</th>
                <th className="text-right py-4 px-4 text-gray-400 font-medium">Participated</th>
                <th className="text-right py-4 px-4 text-gray-400 font-medium">Success Rate</th>
              </tr>
            </thead>
            <tbody>
              {years.map((year, index) => {
                const participated = participationByYear[year.year] || 0;
                const successRate = participated > 0
                  ? (((year.totalPlaced || 0) / participated) * 100).toFixed(1)
                  : '0';
                return (
                  <tr
                    key={year.year}
                    className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-all duration-200 animate-fade-in"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <td className="py-4 px-4 text-gray-900 dark:text-white font-semibold">{year.year}</td>
                    <td className="py-4 px-4 text-right text-gray-900 dark:text-white">{year.totalCompanies || 0}</td>
                    <td className="py-4 px-4 text-right text-green-400">{year.completedCompanies || 0}</td>
                    <td className="py-4 px-4 text-right text-yellow-400">{year.runningCompanies || 0}</td>
                    <td className="py-4 px-4 text-right text-blue-400 font-semibold text-lg">{year.totalPlaced || 0}</td>
                    <td className="py-4 px-4 text-right text-gray-900 dark:text-white">{participated}</td>
                    <td className="py-4 px-4 text-right">
                      <span className="text-gradient font-bold text-lg">{successRate}%</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div >
  );
}
