import { useState } from 'react';
import { Student } from '../types';
import { Users, Search, Download, Loader2, CheckCircle2, XCircle, Award, GraduationCap, UserPlus, X, Mail, Building2, TrendingUp, Trophy, Trash2 } from 'lucide-react';
import StatCard from '../components/StatCard';
import EmptyState from '../components/EmptyState';
import { exportToCSV } from '../lib/exportUtils';
import { useIncrementalStudents } from '../hooks/useIncrementalStudents';
import { api } from '../lib/api';
import RefreshButton from '../components/RefreshButton';
import { useToast } from '../context/ToastContext';

interface DeleteStudentResponse {
  message: string;
  studentId: string;
  studentName: string;
  cascadingUpdates: {
    companiesAffected: number;
    roundsDeleted: number;
    placementsDeleted: number;
    yearsAffected: number;
  };
}

export default function Students() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSearch, setActiveSearch] = useState('');  // Only updates on Enter
  const [statusFilter, setStatusFilter] = useState<'all' | 'placed' | 'not_placed'>('all');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({ name: '', rollNumber: '', email: '' });
  const [formError, setFormError] = useState('');
  const { showToast, updateToast } = useToast();

  // Trigger search on Enter key
  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // Prevent form submission that causes white screen
      console.log('🔍 Search activated:', searchTerm);
      setActiveSearch(searchTerm);
    }
  };

  // Clear search
  const handleClearSearch = () => {
    setSearchTerm('');
    setActiveSearch('');
  };

  const {
    students,
    loading,
    stats
  } = useIncrementalStudents(activeSearch, statusFilter);

  // Handlers for student modal

  const handleOpenModal = () => {
    setShowAddModal(true);
    setFormData({ name: '', rollNumber: '', email: '' });
    setFormError('');
  };

  const handleCloseModal = () => {
    if (!isCreating) {
      setShowAddModal(false);
      setFormData({ name: '', rollNumber: '', email: '' });
      setFormError('');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setFormError('');
  };

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setFormError('Name is required');
      return;
    }
    if (!formData.rollNumber.trim()) {
      setFormError('Roll number is required');
      return;
    }
    if (!formData.email.trim()) {
      setFormError('Email is required');
      return;
    }
    if (!formData.email.includes('@') || !formData.email.includes('.')) {
      setFormError('Invalid email format');
      return;
    }

    try {
      setIsCreating(true);
      const result = await api.createStudent({
        name: formData.name.trim(),
        rollNumber: formData.rollNumber.trim(),
        email: formData.email.trim()
      });

      alert(`✅ ${result.message} \n\nStudent added successfully!`);

      setShowAddModal(false);
      setFormData({ name: '', rollNumber: '', email: '' });
      setFormError('');

      // Refresh page to show new student
      window.location.reload();
    } catch (error: unknown) {
      setFormError((error as Error).message || 'Failed to create student');
    } finally {
      setIsCreating(false);
    }
  };

  const [deletingStudent, setDeletingStudent] = useState<string | null>(null);

  const handleDeleteStudent = async (studentId: string, studentName: string) => {
    const confirmMessage = `⚠️  DELETE "${studentName}" ?\n\n` +
      `This will permanently delete: \n` +
      `• Student profile and personal data\n` +
      `• All round participation records\n` +
      `• All placement records\n` +
      `• Updates company & year statistics\n\n` +
      `This action CANNOT be undone!\n\n` +
      `Are you absolutely sure ? `;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    // Show loading toast
    const toastId = showToast({
      type: 'loading',
      title: 'Deleting Student',
      message: `Removing ${studentName} and details...`
    });

    try {
      setDeletingStudent(studentId);
      const result = await api.deleteStudent(studentId) as DeleteStudentResponse;

      const cascading = result.cascadingUpdates;

      // Update toast to success
      updateToast(toastId, {
        type: 'success',
        title: 'Student Deleted',
        message: `${studentName} removed. Affected: ${cascading.companiesAffected} companies, ${cascading.placementsDeleted} placements.`
      });

      // Refresh page after short delay to show toast
      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (error: unknown) {
      // Update toast to error
      updateToast(toastId, {
        type: 'error',
        title: 'Deletion Failed',
        message: (error as Error).message || 'Failed to delete student'
      });
    } finally {
      setDeletingStudent(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="glass-strong rounded-2xl p-8 border border-blue-500/20">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-4xl font-bold text-gradient-blue mb-2">Students</h1>
            <p className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              Complete student management and tracking
            </p>
          </div>
          <RefreshButton />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Students"
          value={stats.total}
          icon={Users}
          color="blue"
          subtitle={`Total matching students`}
          className="stagger-1"
        />
        <StatCard
          title="Placed Students"
          value={stats.placed}
          icon={CheckCircle2}
          color="green"
          subtitle={`${stats.total > 0 ? ((stats.placed / stats.total) * 100).toFixed(1) : 0}% placement rate`}
          trend={{ value: 15.3, isPositive: true }}
          className="stagger-2"
        />
        <StatCard
          title="Not Placed"
          value={stats.notPlaced}
          icon={XCircle}
          color="red"
          subtitle="Seeking opportunities"
          className="stagger-3"
        />
        <StatCard
          title="Total Offers"
          value={stats.totalOffers}
          icon={Award}
          color="purple"
          subtitle={`Avg ${stats.avgOffers} per student`}
          className="stagger-4"
        />
      </div>

      {/* Search and Filters */}
      <div className="glass-strong rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative group">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-blue-400 transition-colors" />
            <input
              type="text"
              placeholder="Search by name, roll number, or email... (Press Enter)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleSearchKeyPress}
              className="w-full pl-12 pr-12 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            {(searchTerm || activeSearch) && (
              <button
                onClick={handleClearSearch}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="h-5 w-5" />
              </button>
            )}
            {activeSearch && (
              <div className="absolute left-0 -bottom-6 text-xs text-blue-400 flex items-center gap-1">
                <Search className="h-3 w-3" />
                Searching for: "{activeSearch}"
              </div>
            )}
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="dropdown"
          >
            <option value="all">All Status</option>
            <option value="placed">Placed</option>
            <option value="not_placed">Not Placed</option>
          </select>
          <button
            onClick={handleOpenModal}
            className="px-6 py-3 bg-green-600 dark:bg-green-500 text-white rounded-xl font-medium transition-all btn-hover flex items-center gap-2 shadow-lg shadow-green-500/30 hover:bg-green-700 dark:hover:bg-green-600"
          >
            <UserPlus className="h-4 w-4" />
            Add Student
          </button>
          <button
            onClick={() => {
              const exportData = students.map((s: Student) => ({
                Name: s.name,
                'Roll Number': s.rollNumber,
                Email: s.email,
                Status: s.currentStatus === 'placed' ? 'Placed' : 'Not Placed',
                'Total Offers': s.totalOffers,
                'Companies Applied': Object.keys(s.companyStatus).length
              }));
              exportToCSV(exportData, `students_data_${new Date().toISOString().split('T')[0]} `);
            }}
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-all btn-hover flex items-center gap-2 shadow-lg shadow-blue-500/30"
          >
            <Download className="h-4 w-4" />
            Export Data
          </button>
        </div>
      </div>

      {/* Students Table */}
      <div className="glass-strong rounded-2xl border border-purple-500/20 overflow-hidden shadow-xl">
        <div className="flex items-center justify-between mb-6 p-6 pb-0">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg">
              <Users className="h-5 w-5 text-white stroke-white" strokeWidth={2} />
            </div>
            Student Directory
          </h2>
        </div>

        {/* Table Container with Loading Overlay */}
        <div className="relative min-h-[400px]">
          {/* Loading Overlay - Shows over table content with smooth transition */}
          <div
            className={`absolute inset - 0 bg - gray - 900 / 80 backdrop - blur - sm z - 10 flex items - center justify - center rounded - b - 2xl transition - opacity duration - 300 ${loading ? 'opacity-100' : 'opacity-0 pointer-events-none'
              } `}
          >
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-12 w-12 text-purple-400 animate-spin" />
              <p className="text-gray-300 font-medium">
                {searchTerm || statusFilter !== 'all' ? 'Searching students...' : 'Loading students...'}
              </p>
            </div>
          </div>

          {/* Empty State - Only show when not loading AND no students */}
          {!loading && students.length === 0 ? (
            <div className="py-12 animate-fade-in">
              <EmptyState
                icon={Users}
                title="No students found"
                description={
                  searchTerm || statusFilter !== 'all'
                    ? "Try adjusting your search or filter criteria"
                    : "No student data available"
                }
              />
            </div>
          ) : (
            <div
              className={`overflow - x - auto transition - opacity duration - 200 ${loading ? 'opacity-30' : 'opacity-100'} `}
              style={{ willChange: 'opacity' }}
            >
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-4 px-4 text-gray-400 font-medium">Student</th>
                    <th className="text-left py-4 px-4 text-gray-400 font-medium">Roll Number</th>
                    <th className="text-left py-4 px-4 text-gray-400 font-medium">Email</th>
                    <th className="text-left py-4 px-4 text-gray-400 font-medium">Status</th>
                    <th className="text-center py-4 px-4 text-gray-400 font-medium">Offers</th>
                    <th className="text-center py-4 px-4 text-gray-400 font-medium">Companies</th>
                    <th className="text-center py-4 px-4 text-gray-400 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student: Student) => (
                    <tr
                      key={student.studentId}
                      className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors duration-150 group"
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-always-white font-semibold shadow-lg group-hover:scale-110 transition-transform">
                            {student.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="text-white font-medium block group-hover:text-purple-400 transition-colors">
                              {student.name}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-blue-400 font-mono">{student.rollNumber}</span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2 text-gray-300">
                          <Mail className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">{student.email}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium ${student.currentStatus === 'placed'
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-red-500/20 text-red-400'
                            }`}
                        >
                          {student.currentStatus === 'placed' ? (
                            <>
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Placed
                            </>
                          ) : (
                            <>
                              <XCircle className="h-3 w-3 mr-1" />
                              Not Placed
                            </>
                          )}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-gradient-to-br from-yellow-500 to-yellow-600 text-white font-bold shadow-lg">
                          {student.totalOffers}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="text-gray-300 font-medium">
                          {Object.keys(student.companyStatus).length}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-center gap-3">
                          <button
                            onClick={() => setSelectedStudent(student)}
                            className="group relative px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-sm font-semibold rounded-lg transition-all duration-200 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-105 active:scale-95 whitespace-nowrap flex items-center gap-2"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            <span>View</span>
                          </button>
                          <button
                            onClick={() => handleDeleteStudent(student.studentId, student.name)}
                            disabled={deletingStudent === student.studentId}
                            className="group relative px-5 py-2.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-all duration-200 shadow-lg shadow-red-500/30 hover:shadow-red-500/50 hover:scale-105 active:scale-95 disabled:hover:scale-100 whitespace-nowrap flex items-center justify-center gap-2 min-w-[110px]"
                            title={deletingStudent === student.studentId ? "Deleting..." : "Delete Student"}
                          >
                            {deletingStudent === student.studentId ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span>Deleting</span>
                              </>
                            ) : (
                              <>
                                <Trash2 className="h-4 w-4" />
                                <span>Delete</span>
                              </>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Student Details Modal */}
      {selectedStudent && (
        <StudentDetailsModal
          student={selectedStudent}
          onClose={() => setSelectedStudent(null)}
        />
      )}

      {/* Add Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-scale-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <UserPlus size={24} className="text-green-600 dark:text-green-400" />
                Add New Student
              </h2>
              <button
                onClick={handleCloseModal}
                disabled={isCreating}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateStudent} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  disabled={isCreating}
                  placeholder="John Doe"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Roll Number *
                </label>
                <input
                  type="text"
                  name="rollNumber"
                  value={formData.rollNumber}
                  onChange={handleInputChange}
                  disabled={isCreating}
                  placeholder="20CS001"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={isCreating}
                  placeholder="john.doe@example.com"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                  required
                />
              </div>

              {formError && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-600 dark:text-red-400">{formError}</p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={isCreating}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="flex-1 px-4 py-2 bg-green-600 dark:bg-green-500 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isCreating ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus size={16} />
                      <span>Add Student</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function StudentDetailsModal({ student, onClose }: { student: Student; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-3xl border border-purple-500/40 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-purple-600/20 via-blue-600/20 to-purple-600/20 backdrop-blur-xl border-b border-purple-500/30 p-8 flex items-center justify-between z-10">
          <div className="flex items-center gap-5">
            <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-purple-500 via-purple-600 to-blue-600 flex items-center justify-center text-white font-bold text-3xl shadow-2xl shadow-purple-500/50 ring-4 ring-purple-500/20">
              {student.name ? student.name.split(' ').map(n => n[0] || '').join('').slice(0, 2).toUpperCase() : 'ST'}
            </div>
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">{student.name}</h2>
              <p className="text-purple-300 font-mono text-lg mt-1">{student.rollNumber}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="group p-3 bg-red-500/20 hover:bg-red-500/30 rounded-xl transition-all duration-200 border border-red-500/30 hover:border-red-500/50 hover:scale-110 active:scale-95"
            title="Close"
          >
            <X className="h-6 w-6 text-red-400 group-hover:text-red-300" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Basic Info Grid */}
          <div className="grid grid-cols-2 gap-5">
            <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-2xl p-5 hover:border-blue-500/40 transition-all duration-200">
              <p className="text-blue-300 text-sm mb-2 flex items-center gap-2 font-medium">
                <GraduationCap className="h-5 w-5" />
                Roll Number
              </p>
              <p className="text-white font-bold font-mono text-lg">{student.rollNumber}</p>
            </div>
            <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 rounded-2xl p-5 hover:border-purple-500/40 transition-all duration-200">
              <p className="text-purple-300 text-sm mb-2 flex items-center gap-2 font-medium">
                <Mail className="h-5 w-5" />
                Email
              </p>
              <p className="text-white font-semibold text-lg break-all">{student.email}</p>
            </div>
            <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20 rounded-2xl p-5 hover:border-green-500/40 transition-all duration-200">
              <p className="text-green-300 text-sm mb-2 flex items-center gap-2 font-medium">
                <CheckCircle2 className="h-5 w-5" />
                Status
              </p>
              <span
                className={`inline-flex items-center px-4 py-2 rounded-xl text-sm font-bold ${student.currentStatus === 'placed'
                  ? 'bg-green-500/30 text-green-200'
                  : 'bg-red-500/30 text-red-200'
                  }`}
              >
                {student.currentStatus === 'placed' ? '✓ Placed' : '✗ Not Placed'}
              </span>
            </div>
            <div className="bg-gradient-to-br from-yellow-500/10 to-orange-600/5 border border-yellow-500/20 rounded-2xl p-5 hover:border-yellow-500/40 transition-all duration-200">
              <p className="text-yellow-300 text-sm mb-2 flex items-center gap-2 font-medium">
                <Award className="h-5 w-5" />
                Total Offers
              </p>
              <p className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">{student.totalOffers}</p>
            </div>
          </div>

          {/* Company Status */}
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
                <Building2 className="h-5 w-5 text-white stroke-white" strokeWidth={2} />
              </div>
              Company Applications ({Object.keys(student.companyStatus).length})
            </h3>
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
              {Object.entries(student.companyStatus).map(([companyId, status]) => (
                <div
                  key={companyId}
                  className="glass-strong rounded-xl p-4 border border-gray-700/50 hover:border-blue-500/50 transition-all card-hover"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-always-white font-bold shadow-lg">
                        {companyId.charAt(0)}
                      </div>
                      <div>
                        <p className="text-gray-900 dark:text-white font-medium">{companyId}</p>
                        <p className="text-gray-600 dark:text-gray-500 text-sm">Year: {status.year}</p>
                      </div>
                    </div>
                    <span
                      className={`inline - flex items - center px - 3 py - 1.5 rounded - lg text - xs font - medium border ${status.status === 'selected'
                        ? 'bg-green-500/20 text-green-400 border-green-500/30'
                        : status.status === 'not_selected'
                          ? 'bg-red-500/20 text-red-400 border-red-500/30'
                          : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                        } `}
                    >
                      {status.status === 'selected'
                        ? 'Selected ✓'
                        : status.status === 'not_selected'
                          ? 'Not Selected'
                          : 'In Process'}
                    </span>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-2 text-gray-400">
                      <TrendingUp className="h-4 w-4" />
                      <span>Round Reached: <strong className="text-blue-400">{status.roundReached}</strong></span>
                    </div>
                    {status.finalSelection !== null && (
                      <div className="flex items-center gap-2">
                        {status.finalSelection ? (
                          <>
                            <CheckCircle2 className="h-4 w-4 text-green-400" />
                            <span className="text-green-400">Finally Selected</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="h-4 w-4 text-red-400" />
                            <span className="text-red-400">Not in Final</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Selected Companies */}
          {student.selectedCompanies.length > 0 && (
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <div className="p-2 bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-glow-green">
                  <Award className="h-5 w-5 text-white stroke-white" strokeWidth={2} />
                </div>
                Selected Companies ({student.selectedCompanies.length})
              </h3>
              <div className="flex flex-wrap gap-3">
                {student.selectedCompanies.map((company) => (
                  <span
                    key={company}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500/20 to-green-600/20 text-green-400 rounded-lg text-sm font-medium border border-green-500/30 shadow-lg"
                  >
                    <Trophy className="h-4 w-4" />
                    {company}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
