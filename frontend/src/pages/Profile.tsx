import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { User as UserIcon, Lock, Mail, Shield, AlertCircle, CheckCircle, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (newPassword !== confirmPassword) {
            setError('New passwords do not match');
            return;
        }

        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);

        try {
            await api.changePassword(currentPassword, newPassword);
            setSuccess('Password changed successfully!');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err: unknown) {
            setError((err as Error).message || 'Failed to change password');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    if (!user) return null;

    const getRoleBadge = (role: string) => {
        const badges = {
            admin: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
            faculty: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
            student: 'bg-green-500/20 text-green-400 border-green-500/30',
        };
        return badges[role as keyof typeof badges] || badges.student;
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="glass-strong rounded-2xl p-8 border border-blue-500/20">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-3xl shadow-glow-blue">
                            {user.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h1 className="text-4xl font-bold text-gradient-blue mb-2">Profile</h1>
                            <p className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
                                <UserIcon className="h-4 w-4" />
                                Manage your account settings
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-all btn-hover flex items-center gap-2 shadow-lg"
                    >
                        <LogOut className="h-5 w-5" />
                        Logout
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* User Information */}
                <div className="glass-strong rounded-2xl p-6 shadow-2xl border border-gray-200 dark:border-gray-700/50">
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
                            <UserIcon className="h-5 w-5 text-white stroke-white" strokeWidth={2} />
                        </div>
                        User Information
                    </h2>

                    <div className="space-y-4">
                        <div className="glass rounded-xl p-4">
                            <p className="text-gray-400 text-sm mb-1 flex items-center gap-2">
                                <UserIcon className="h-4 w-4" />
                                Username
                            </p>
                            <p className="text-gray-900 dark:text-white font-medium text-lg">{user.username}</p>
                        </div>

                        <div className="glass rounded-xl p-4">
                            <p className="text-gray-400 text-sm mb-1 flex items-center gap-2">
                                <Shield className="h-4 w-4" />
                                Role
                            </p>
                            <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium border ${getRoleBadge(user.role)}`}>
                                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                            </span>
                        </div>

                        <div className="glass rounded-xl p-4">
                            <p className="text-gray-400 text-sm mb-1 flex items-center gap-2">
                                <Mail className="h-4 w-4" />
                                User ID
                            </p>
                            <p className="text-gray-900 dark:text-white font-mono text-sm">{user.id}</p>
                        </div>
                    </div>
                </div>

                {/* Change Password */}
                <div className="glass-strong rounded-2xl p-6 shadow-2xl border border-gray-200 dark:border-gray-700/50">
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg">
                            <Lock className="h-5 w-5 text-white stroke-white" strokeWidth={2} />
                        </div>
                        Change Password
                    </h2>

                    {error && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3 animate-fade-in">
                            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                            <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
                        </div>
                    )}

                    {success && (
                        <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-xl flex items-start gap-3 animate-fade-in">
                            <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                            <p className="text-green-600 dark:text-green-400 text-sm">{success}</p>
                        </div>
                    )}

                    <form onSubmit={handlePasswordChange} className="space-y-4">
                        <div>
                            <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Current Password
                            </label>
                            <input
                                id="currentPassword"
                                type="password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                placeholder="Enter current password"
                                required
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                            />
                        </div>

                        <div>
                            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                New Password
                            </label>
                            <input
                                id="newPassword"
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Enter new password"
                                required
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                            />
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Confirm New Password
                            </label>
                            <input
                                id="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirm new password"
                                required
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                                    Changing Password...
                                </>
                            ) : (
                                <>
                                    <Lock className="h-5 w-5" />
                                    Change Password
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
