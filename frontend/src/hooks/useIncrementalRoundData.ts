import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';

export interface RoundDataRow {
    studentId: string | null;
    status: string;
    computedStatus?: string;
    rowData: Record<string, unknown>;
}

export function useIncrementalRoundData(
    companyYearId: string,
    roundId: string,
    searchTerm: string = '',
    statusFilter: string = 'all'
) {
    const [roundData, setRoundData] = useState<RoundDataRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [cursor, setCursor] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(true);
    const [stats, setStats] = useState({
        qualified: 0,
        not_qualified: 0,
        pending: 0,
        total: 0
    });

    // Fetch stats whenever search or filter changes
    const fetchStats = useCallback(async () => {
        try {
            let url = `/companies/${companyYearId}/rounds/${roundId}/stats`;
            const params = new URLSearchParams();
            if (searchTerm) params.append('search', searchTerm);
            if (statusFilter !== 'all') params.append('status', statusFilter);

            const queryString = params.toString();
            if (queryString) url += `?${queryString}`;

            console.log('📊 Fetching round stats:', url);

            const response = await api.request<{
                qualified: number;
                not_qualified: number;
                pending: number;
                total: number;
            }>(url);

            setStats(response);
            console.log('✅ Stats fetched:', response);
        } catch (error) {
            console.error('❌ Error fetching round stats:', error);
        }
    }, [companyYearId, roundId, searchTerm, statusFilter]);

    const loadInitialBatch = useCallback(async () => {
        setLoading(true);
        try {
            // Build URL with filters
            let url = `/companies/${companyYearId}/rounds/${roundId}/data?limit=50`;
            if (searchTerm) url += `&search=${encodeURIComponent(searchTerm)}`;
            if (statusFilter !== 'all') url += `&status=${statusFilter}`;

            console.log('📥 Loading initial round data batch:', url);

            const response = await api.request<{
                data: RoundDataRow[];
                nextCursor: string | null;
                hasMore: boolean;
            }>(url);

            setRoundData(response.data);
            setCursor(response.nextCursor);
            setHasMore(response.hasMore);

            console.log(`✅ Loaded ${response.data.length} round data rows, hasMore: ${response.hasMore}`);
        } catch (error) {
            console.error('❌ Error loading round data:', error);
        } finally {
            setLoading(false);
        }
    }, [companyYearId, roundId, searchTerm, statusFilter]);

    // Reset and fetch when search or filter changes
    useEffect(() => {
        console.log('🔄 Search/Filter changed for round data:', { searchTerm, statusFilter });
        setRoundData([]);
        setCursor(null);
        setHasMore(true);

        // Fetch both stats and initial data
        fetchStats();
        loadInitialBatch();
    }, [searchTerm, statusFilter, fetchStats, loadInitialBatch]);

    const loadMore = useCallback(async () => {
        if (!hasMore || loadingMore || !cursor) {
            console.log('⏭️ Skipping loadMore:', { hasMore, loadingMore, cursor });
            return;
        }

        setLoadingMore(true);
        try {
            // Build URL with cursor and filters
            let url = `/companies/${companyYearId}/rounds/${roundId}/data?limit=50&cursor=${cursor}`;
            if (searchTerm) url += `&search=${encodeURIComponent(searchTerm)}`;
            if (statusFilter !== 'all') url += `&status=${statusFilter}`;

            console.log('📥 Loading more round data:', url);

            const response = await api.request<{
                data: RoundDataRow[];
                nextCursor: string | null;
                hasMore: boolean;
            }>(url);

            setRoundData(prev => [...prev, ...response.data]);
            setCursor(response.nextCursor);
            setHasMore(response.hasMore);

            console.log(`✅ Loaded ${response.data.length} more rows, total: ${roundData.length + response.data.length}`);
        } catch (error) {
            console.error('❌ Error loading more round data:', error);
        } finally {
            setLoadingMore(false);
        }
    }, [companyYearId, roundId, cursor, hasMore, loadingMore, searchTerm, statusFilter, roundData.length]);

    return {
        roundData,
        loading,
        loadingMore,
        hasMore,
        stats,
        loadMore
    };
}
