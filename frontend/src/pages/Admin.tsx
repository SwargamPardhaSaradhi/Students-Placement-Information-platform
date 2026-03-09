import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { User } from '../types';
import { Users, UserPlus, Edit2, Trash2, Shield, AlertCircle, CheckCircle, X, Key, Search, Filter } from 'lucide-react';

export default function Admin() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'faculty' | 'student'>('all');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const data = await api.getUsers();
            setUsers(data);
        } catch (err: unknown) {
            setError((err as Error).message || 'Failed to fetch users');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUser = async (userId: string, username: string) => {
        if (!confirm(`Are you sure you want to delete user "${username}"?`)) {
            return;
        }

        try {
            await api.deleteUser(userId);
            setSuccess(`User "${username}" deleted successfully`);
            fetchUsers();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err: unknown) {
            setError((err as Error).message || 'Failed to delete user');
            setTimeout(() => setError(''), 3000);
        }
    };

    const handleResetPassword = async (userId: string, username: string) => {
        if (!confirm(`Are you sure you want to reset the password for "${username}" to "iare"?`)) {
            return;
        }

        try {
            await api.resetPassword(userId);
            setSuccess(`Password for "${username}" reset to "iare"`);
            setTimeout(() => setSuccess(''), 3000);
        } catch (err: unknown) {
            setError((err as Error).message || 'Failed to reset password');
            setTimeout(() => setError(''), 3000);
        }
    };

    const getRoleBadge = (role: string) => {
        const badges = {
            admin: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
            faculty: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
            student: 'bg-green-500/20 text-green-400 border-green-500/30',
        };
        return badges[role as keyof typeof badges] || badges.student;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="glass-strong rounded-2xl p-8 border border-purple-500/20">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold text-gradient mb-2">Admin Panel</h1>
                        <p className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
                            <Shield className="h-4 w-4" />
                            Manage users and roles
                        </p>
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl font-medium transition-all btn-hover flex items-center gap-2 shadow-lg"
                    >
                        <UserPlus className="h-5 w-5" />
                        Create User
                    </button>
                </div>
            </div>

            {/* Alerts */}
            {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3 animate-fade-in">
                    <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
                </div>
            )}

            {success && (
                <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl flex items-start gap-3 animate-fade-in">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <p className="text-green-600 dark:text-green-400 text-sm">{success}</p>
                </div>
            )}

            {/* Users Table */}
            <div className="glass-strong rounded-2xl p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
                            <Users className="h-5 w-5 text-white stroke-white" strokeWidth={2} />
                        </div>
                        Users ({users.length})
                    </h2>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search users..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-64 text-gray-900 dark:text-white placeholder-gray-500"
                            />
                        </div>
                        <div className="relative">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <select
                                value={roleFilter}
                                onChange={(e) => setRoleFilter(e.target.value as 'all' | 'admin' | 'faculty' | 'student')}
                                className="pl-10 pr-8 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none text-gray-900 dark:text-white"
                            >
                                <option value="all">All Roles</option>
                                <option value="student">Student</option>
                                <option value="faculty">Faculty</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-700">
                                <th className="text-left py-4 px-4 text-gray-400 font-medium">Username</th>
                                <th className="text-left py-4 px-4 text-gray-400 font-medium">Role</th>
                                <th className="text-left py-4 px-4 text-gray-400 font-medium">User ID</th>
                                <th className="text-right py-4 px-4 text-gray-400 font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users
                                .filter(user => {
                                    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase());
                                    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
                                    return matchesSearch && matchesRole;
                                })
                                .map((user, index) => (
                                    <tr
                                        key={user.id}
                                        className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-all duration-200 animate-fade-in"
                                        style={{ animationDelay: `${index * 0.05}s` }}
                                    >
                                        <td className="py-4 px-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold shadow-lg">
                                                    {user.username.charAt(0).toUpperCase()}
                                                </div>
                                                <span className="text-white font-medium">{user.username}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-4">
                                            <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium border ${getRoleBadge(user.role)}`}>
                                                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                                            </span>
                                        </td>
                                        <td className="py-4 px-4">
                                            <span className="text-gray-400 font-mono text-sm">{user.id}</span>
                                        </td>
                                        <td className="py-4 px-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => setEditingUser(user)}
                                                    className="p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-all"
                                                    title="Edit role"
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteUser(user.id, user.username)}
                                                    className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-all"
                                                    title="Delete user"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleResetPassword(user.id, user.username)}
                                                    className="p-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-600 dark:text-yellow-400 rounded-lg transition-all"
                                                    title="Reset Password to 'iare'"
                                                >
                                                    <Key className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create User Modal */}
            {
                showCreateModal && (
                    <CreateUserModal
                        onClose={() => setShowCreateModal(false)}
                        onSuccess={() => {
                            fetchUsers();
                            setShowCreateModal(false);
                            setSuccess('User created successfully');
                            setTimeout(() => setSuccess(''), 3000);
                        }}
                        onError={(err) => {
                            setError(err);
                            setTimeout(() => setError(''), 3000);
                        }}
                    />
                )
            }

            {/* Edit Role Modal */}
            {
                editingUser && (
                    <EditRoleModal
                        user={editingUser}
                        onClose={() => setEditingUser(null)}
                        onSuccess={() => {
                            fetchUsers();
                            setEditingUser(null);
                            setSuccess('User role updated successfully');
                            setTimeout(() => setSuccess(''), 3000);
                        }}
                        onError={(err) => {
                            setError(err);
                            setTimeout(() => setError(''), 3000);
                        }}
                    />
                )
            }
        </div >
    );
}

// Create User Modal Component
function CreateUserModal({
    onClose,
    onSuccess,
    onError,
}: {
    onClose: () => void;
    onSuccess: () => void;
    onError: (error: string) => void;
}) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<'admin' | 'faculty' | 'student'>('student');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await api.createUser(username, password, role);
            onSuccess();
        } catch (err: unknown) {
            onError((err as Error).message || 'Failed to create user');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in" onClick={onClose}>
            <div className="glass-strong rounded-2xl border border-purple-500/30 max-w-md w-full shadow-2xl animate-scale-in" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between p-6 border-b border-gray-700">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Create New User</h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-700 rounded-lg transition-colors">
                        <X className="h-5 w-5 text-gray-400" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Enter username"
                            required
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter password"
                            required
                            minLength={6}
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Role</label>
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value as 'admin' | 'faculty' | 'student')}
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="student">Student</option>
                            <option value="faculty">Faculty</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-xl font-medium transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl font-medium transition-all disabled:opacity-50"
                        >
                            {loading ? 'Creating...' : 'Create User'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// Edit Role Modal Component
function EditRoleModal({
    user,
    onClose,
    onSuccess,
    onError,
}: {
    user: User;
    onClose: () => void;
    onSuccess: () => void;
    onError: (error: string) => void;
}) {
    const [role, setRole] = useState<'admin' | 'faculty' | 'student'>(user.role as 'admin' | 'faculty' | 'student');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await api.updateUserRole(user.id, role);
            onSuccess();
        } catch (err: unknown) {
            onError((err as Error).message || 'Failed to update role');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in" onClick={onClose}>
            <div className="glass-strong rounded-2xl border border-purple-500/30 max-w-md w-full shadow-2xl animate-scale-in" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between p-6 border-b border-gray-700">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Edit User Role</h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-700 rounded-lg transition-colors">
                        <X className="h-5 w-5 text-gray-400" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Username</label>
                        <input
                            type="text"
                            value={user.username}
                            disabled
                            className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-500 dark:text-gray-400"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Role</label>
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value as 'admin' | 'faculty' | 'student')}
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="student">Student</option>
                            <option value="faculty">Faculty</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-xl font-medium transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl font-medium transition-all disabled:opacity-50"
                        >
                            {loading ? 'Updating...' : 'Update Role'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
