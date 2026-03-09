import { useState, useEffect } from 'react';
import { Student, StudentStats } from '../types';
import { useDataCache } from '../context/DataCacheContext';

/**
 * Simplified Students Hook
 * 
 * Fetches ALL students once on mount and caches permanently
 * No pagination, no incremental loading
 * Uses shared cache with DataCacheContext (cache_all_students)
 */
export function useIncrementalStudents(search: string, statusFilter: 'all' | 'placed' | 'not_placed') {
    const { fetchStudents } = useDataCache();
    const [allStudents, setAllStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<StudentStats>({
        total: 0,
        placed: 0,
        notPlaced: 0,
        totalOffers: 0,
        avgOffers: 0
    });

    // Fetch all students once on mount
    useEffect(() => {
        const loadStudents = async () => {
            setLoading(true);
            try {
                // Uses DataCacheContext - fetches all students and caches in localStorage
                const students = await fetchStudents();
                setAllStudents(students);

                // Calculate stats
                const placed = students.filter(s => s.currentStatus === 'placed').length;
                const notPlaced = students.filter(s => s.currentStatus === 'not_placed').length;
                const total = students.length;
                const totalOffers = students.reduce((sum, s) => sum + (s.totalOffers || 0), 0);

                setStats({
                    total,
                    placed,
                    notPlaced,
                    totalOffers,
                    avgOffers: total > 0 ? parseFloat((totalOffers / total).toFixed(1)) : 0
                });

                console.log(`✅ Loaded ${students.length} students from cache/API`);
            } catch (error) {
                console.error('❌ Error loading students:', error);
                setAllStudents([]);
            } finally {
                setLoading(false);
            }
        };

        loadStudents();
    }, []); // ✅ Empty deps - fetchStudents is stable, only fetch once on mount

    // Filter students based on search and status
    const filteredStudents = allStudents.filter(student => {
        // Status filter
        if (statusFilter !== 'all' && student.currentStatus !== statusFilter) {
            return false;
        }

        // Search filter
        if (search) {
            const searchLower = search.toLowerCase();
            return (
                (student.name?.toLowerCase() || '').includes(searchLower) ||
                (student.rollNumber?.toLowerCase() || '').includes(searchLower) ||
                (student.email?.toLowerCase() || '').includes(searchLower)
            );
        }

        return true;
    });

    return {
        students: filteredStudents,
        loading,
        loadingMore: false, // No pagination
        hasMore: false, // No pagination
        stats,
        loadMore: () => { } // No-op
    };
}
