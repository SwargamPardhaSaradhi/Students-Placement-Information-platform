import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requireAdmin?: boolean;
}

export default function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
    const { loading, isAuthenticated, isAdmin } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <LoadingSpinner />
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (requireAdmin && !isAdmin) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-red-500 mb-4">403 - Access Denied</h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        You don't have permission to access this page.
                    </p>
                    <p className="text-gray-500 dark:text-gray-500 mt-2">
                        Admin access required.
                    </p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
