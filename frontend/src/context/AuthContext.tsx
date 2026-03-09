import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api } from '../lib/api';
import { AuthContextType, User } from '../types';



const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchUser = async () => {
        try {
            const userData = await api.getCurrentUser();
            setUser(userData);
        } catch (error) {
            setUser(null);
            console.error('Failed to fetch current user:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUser();
    }, []);

    const login = async (username: string, password: string) => {
        const response = await api.login(username, password);
        setUser(response.user);
    };

    const logout = async () => {
        await api.logout();
        // ✅ SECURITY: Clear local cache to prevent data leakage
        localStorage.clear();
        console.log('🗑️ Local storage cleared on logout');
        setUser(null);
    };

    const refreshUser = async () => {
        await fetchUser();
    };

    const value = {
        user,
        loading,
        login,
        logout,
        refreshUser,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
}
