import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { api } from '../lib/api';
import { YearAnalytics, Company, Student, StudentStats, DashboardSummary, Round } from '../types';

interface CacheEntry<T> {
    data: T;
    timestamp: number;
}

interface DataCacheContextType {
    // Cached data
    years: YearAnalytics[] | null;
    companies: Company[] | null;
    students: Student[] | null;
    studentsStats: StudentStats | null;
    dashboardSummary: DashboardSummary | null;
    rounds: Record<string, Round[]>;  // Keyed by companyYearId

    // Fetch functions (cache-first)
    fetchYears: (force?: boolean) => Promise<YearAnalytics[]>;
    fetchCompanies: (force?: boolean) => Promise<Company[]>;
    fetchStudents: (force?: boolean) => Promise<Student[]>;
    fetchStudentsStats: (force?: boolean) => Promise<StudentStats>;
    fetchDashboardSummary: (force?: boolean) => Promise<DashboardSummary>;
    fetchRoundsForCompany: (companyYearId: string, force?: boolean) => Promise<Round[]>;

    // Loading states
    yearsLoading: boolean;
    companiesLoading: boolean;
    studentsLoading: boolean;
    statsLoading: boolean;
    dashboardLoading: boolean;
    roundsLoading: Record<string, boolean>;  // Keyed by companyYearId

    // Cache management
    refreshAll: () => Promise<void>;
    clearCache: () => void;
}

const DataCacheContext = createContext<DataCacheContextType | undefined>(undefined);

// ✅ NO MORE TTL - Cache is permanent until manually cleared!
// Data fetched ONCE and stored in localStorage
// Reused across all pages without refetching

export function DataCacheProvider({ children }: { children: ReactNode }) {
    // Helper to load from localStorage
    const loadFromStorage = <T,>(key: string): CacheEntry<T> | null => {
        try {
            const stored = localStorage.getItem(key);
            if (stored) {
                return JSON.parse(stored) as CacheEntry<T>;
            }
        } catch (error) {
            console.warn(`Failed to load ${key} from localStorage:`, error);
        }
        return null;
    };

    // Helper to save to localStorage
    const saveToStorage = <T,>(key: string, data: CacheEntry<T>) => {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (error) {
            console.warn(`Failed to save ${key} to localStorage:`, error);
        }
    };

    // Cache entries with timestamps - Initialize from localStorage
    const [yearsCache, setYearsCache] = useState<CacheEntry<YearAnalytics[]> | null>(() =>
        loadFromStorage<YearAnalytics[]>('cache_years')
    );
    const [companiesCache, setCompaniesCache] = useState<CacheEntry<Company[]> | null>(() =>
        loadFromStorage<Company[]>('cache_companies')
    );
    const [studentsCache, setStudentsCache] = useState<CacheEntry<Student[]> | null>(() =>
        loadFromStorage<Student[]>('cache_all_students')  // ✅ Same key as Students page!
    );
    const [statsCache, setStatsCache] = useState<CacheEntry<StudentStats> | null>(() =>
        loadFromStorage<StudentStats>('cache_stats')
    );
    const [dashboardCache, setDashboardCache] = useState<CacheEntry<DashboardSummary> | null>(() =>
        loadFromStorage<DashboardSummary>('cache_dashboard')
    );
    const [roundsCache, setRoundsCache] = useState<Record<string, CacheEntry<Round[]>>>(() => {
        // Load all company rounds from localStorage
        const cached = loadFromStorage<Record<string, CacheEntry<Round[]>>>('cache_rounds');
        return cached?.data || {};
    });

    // Loading states
    const [yearsLoading, setYearsLoading] = useState(false);
    const [companiesLoading, setCompaniesLoading] = useState(false);
    const [studentsLoading, setStudentsLoading] = useState(false);
    const [statsLoading, setStatsLoading] = useState(false);
    const [dashboardLoading, setDashboardLoading] = useState(false);
    const [roundsLoading, setRoundsLoading] = useState<Record<string, boolean>>({});

    // Fetch Years (cache-first, permanent)
    const fetchYears = useCallback(async (force = false): Promise<YearAnalytics[]> => {
        // ✅ Return cached data if exists (unless forced refresh)
        if (!force && yearsCache?.data) {
            console.log('✅ Using cached years from localStorage/memory');
            return yearsCache.data;
        }

        // Fetch from API
        console.log('🔄 Fetching years from API...');
        setYearsLoading(true);
        try {
            const data = await api.request<YearAnalytics[]>('/years');
            data.sort((a, b) => a.year - b.year);

            const cacheEntry = {
                data,
                timestamp: Date.now(),
            };
            setYearsCache(cacheEntry);
            saveToStorage('cache_years', cacheEntry);

            console.log(`✅ Cached ${data.length} years to memory + localStorage`);
            return data;
        } catch (error) {
            console.error('❌ Error fetching years:', error);
            // Return cached data if available, even if expired
            if (yearsCache) {
                console.log('⚠️ Using expired cache due to error');
                return yearsCache.data;
            }
            throw error;
        } finally {
            setYearsLoading(false);
        }
    }, [yearsCache]);

    // Fetch Companies (cache-first, permanent)
    const fetchCompanies = useCallback(async (force = false): Promise<Company[]> => {
        // ✅ Return cached data if exists (unless forced refresh)
        if (!force && companiesCache?.data) {
            console.log('✅ Using cached companies from localStorage/memory');
            return companiesCache.data;
        }

        // Fetch from API
        console.log('🔄 Fetching companies from API...');
        setCompaniesLoading(true);
        try {
            const data = await api.request<Company[]>('/companies');
            data.sort((a, b) => (b.year - a.year) || a.companyName.localeCompare(b.companyName));

            const cacheEntry = {
                data,
                timestamp: Date.now(),
            };
            setCompaniesCache(cacheEntry);
            saveToStorage('cache_companies', cacheEntry);

            console.log(`✅ Cached ${data.length} companies to memory + localStorage`);
            return data;
        } catch (error) {
            console.error('❌ Error fetching companies:', error);
            // Return cached data if available, even if expired
            if (companiesCache) {
                console.log('⚠️ Using expired cache due to error');
                return companiesCache.data;
            }
            throw error;
        } finally {
            setCompaniesLoading(false);
        }
    }, [companiesCache]);

    // Fetch Students (cache-first, permanent) - SHARED with Students page!
    const fetchStudents = useCallback(async (force = false): Promise<Student[]> => {
        // ✅ Return cached data if exists (unless forced refresh)
        if (!force && studentsCache?.data) {
            console.log(`✅ [CACHE HIT] Using cached ${studentsCache.data.length} students from localStorage - NO API CALL!`);
            return studentsCache.data;
        }

        // Fetch ALL students from API
        console.log('📡 [API CALL] Fetching ALL students from /api/students...');
        setStudentsLoading(true);
        try {
            // Fetch all students (no limit - backend returns everything)
            const response = await api.request<{ students: Student[] }>('/students');
            const students = response.students || [];

            const cacheEntry = {
                data: students,
                timestamp: Date.now(),
            };
            setStudentsCache(cacheEntry);
            saveToStorage('cache_all_students', cacheEntry);  // ✅ Shared cache key!

            console.log(`✅ [CACHED] ${students.length} students saved to localStorage`);
            console.log(`💡 Next time = instant load, NO API call!`);
            return students;
        } catch (error) {
            console.error('❌ Error fetching students:', error);
            if (studentsCache) {
                console.log('⚠️ Using expired cache due to error');
                return studentsCache.data;
            }
            throw error;
        } finally {
            setStudentsLoading(false);
        }
    }, [studentsCache]);

    // Fetch Students Stats (cache-first, permanent)
    const fetchStudentsStats = useCallback(async (force = false): Promise<StudentStats> => {
        // ✅ Return cached data if exists (unless forced refresh)
        if (!force && statsCache?.data) {
            console.log('✅ Using cached stats from localStorage/memory');
            return statsCache.data;
        }

        // Fetch from API
        console.log('🔄 Fetching students stats from API...');
        setStatsLoading(true);
        try {
            const data = await api.request<StudentStats>('/students/stats');

            const cacheEntry = {
                data,
                timestamp: Date.now(),
            };
            setStatsCache(cacheEntry);
            saveToStorage('cache_stats', cacheEntry);

            console.log(`✅ Cached student stats to memory + localStorage`);
            return data;
        } catch (error) {
            console.error('❌ Error fetching students stats:', error);
            // Return cached data if available, even if expired
            if (statsCache) {
                console.log('⚠️ Using expired cache due to error');
                return statsCache.data;
            }
            throw error;
        } finally {
            setStatsLoading(false);
        }
    }, [statsCache]);

    // Fetch Dashboard Summary (cache-first, permanent)
    const fetchDashboardSummary = useCallback(async (force = false): Promise<DashboardSummary> => {
        // ✅ Return cached data if exists (unless forced refresh)
        if (!force && dashboardCache?.data) {
            console.log('✅ Using cached dashboard from localStorage/memory (includes companyWise)');
            return dashboardCache.data;
        }

        // Fetch from API
        console.log('🔄 Fetching dashboard summary from API...');
        setDashboardLoading(true);
        try {
            const data = await api.request<DashboardSummary>('/summary/dashboard');

            const cacheEntry = {
                data,
                timestamp: Date.now(),
            };
            setDashboardCache(cacheEntry);
            saveToStorage('cache_dashboard', cacheEntry);

            console.log(`✅ Cached dashboard summary (including latest year companyWise) to memory + localStorage`);
            return data;
        } catch (error) {
            console.error('❌ Error fetching dashboard summary:', error);
            // Return cached data if available, even if expired
            if (dashboardCache) {
                console.log('⚠️ Using expired cache due to error');
                return dashboardCache.data;
            }
            throw error;
        } finally {
            setDashboardLoading(false);
        }
    }, [dashboardCache]);

    // Fetch Rounds for Company (cache-first, permanent, per-company)
    const fetchRoundsForCompany = useCallback(async (companyYearId: string, force = false): Promise<Round[]> => {
        // ✅ Return cached data if exists (unless forced refresh)
        if (!force && roundsCache[companyYearId]?.data) {
            console.log(`✅ Using cached rounds for company ${companyYearId} from localStorage/memory`);
            return roundsCache[companyYearId].data;
        }

        // Fetch from API
        console.log(`🔄 Fetching rounds for company ${companyYearId} from API...`);
        setRoundsLoading(prev => ({ ...prev, [companyYearId]: true }));

        try {
            const rounds = await api.request<Round[]>(`/companies/${companyYearId}/rounds`);
            console.log(`✅ Fetched ${rounds.length} rounds for company ${companyYearId}`);

            // Save to cache (both memory and localStorage)
            const newEntry: CacheEntry<Round[]> = {
                data: rounds,
                timestamp: Date.now()
            };

            // Update rounds cache with this company's data
            const updatedRoundsCache = {
                ...roundsCache,
                [companyYearId]: newEntry
            };
            setRoundsCache(updatedRoundsCache);

            // Save all rounds to localStorage
            saveToStorage('cache_rounds', {
                data: updatedRoundsCache,
                timestamp: Date.now()
            });

            return rounds;
        } catch (error) {
            console.error(`Error fetching rounds for company ${companyYearId}:`, error);
            throw error;
        } finally {
            setRoundsLoading(prev => ({ ...prev, [companyYearId]: false }));
        }
    }, [roundsCache]);

    // Refresh all cached data
    const refreshAll = useCallback(async () => {
        console.log('🔄 Refreshing all cached data...');
        await Promise.all([
            fetchYears(true),
            fetchCompanies(true),
            fetchStudents(true),
            fetchStudentsStats(true),
            fetchDashboardSummary(true),
        ]);
        console.log('✅ All data refreshed');
    }, [fetchYears, fetchCompanies, fetchStudents, fetchStudentsStats, fetchDashboardSummary]);

    // Clear all caches
    const clearCache = useCallback(() => {
        setYearsCache(null);
        setCompaniesCache(null);
        setStudentsCache(null);
        setStatsCache(null);
        setDashboardCache(null);
        setRoundsCache({});  // Clear all rounds

        localStorage.removeItem('cache_years');
        localStorage.removeItem('cache_companies');
        localStorage.removeItem('cache_all_students');
        localStorage.removeItem('cache_students');  // Legacy key
        localStorage.removeItem('cache_stats');
        localStorage.removeItem('cache_dashboard');
        localStorage.removeItem('cache_rounds');  // Remove all rounds

        console.log('🗑️ All caches cleared from memory and localStorage (including rounds)');
    }, []);

    const value: DataCacheContextType = {
        // Cached data - expose only the data, not the cache entries
        years: yearsCache?.data ?? null,
        companies: companiesCache?.data ?? null,
        students: studentsCache?.data ?? null,
        studentsStats: statsCache?.data ?? null,
        dashboardSummary: dashboardCache?.data ?? null,
        rounds: Object.fromEntries(
            Object.entries(roundsCache).map(([key, entry]) => [key, entry.data])
        ),  // Convert {companyId: CacheEntry} to {companyId: Round[]}

        // Fetch functions
        fetchYears,
        fetchCompanies,
        fetchStudents,
        fetchStudentsStats,
        fetchDashboardSummary,
        fetchRoundsForCompany,

        // Loading states
        yearsLoading,
        companiesLoading,
        studentsLoading,
        statsLoading,
        dashboardLoading,
        roundsLoading,

        // Cache management
        refreshAll,
        clearCache,
    };

    return (
        <DataCacheContext.Provider value={value}>
            {children}
        </DataCacheContext.Provider>
    );
}

// Custom hook to use the cache
// eslint-disable-next-line react-refresh/only-export-components
export function useDataCache() {
    const context = useContext(DataCacheContext);
    if (context === undefined) {
        throw new Error('useDataCache must be used within a DataCacheProvider');
    }
    return context;
}
