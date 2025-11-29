import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface TimeSlot {
    slot_time: string;
    is_available: boolean;
}

interface UseAvailabilityOptions {
    companyId: string;
    date: Date | null;
    serviceDuration: number;
    enabled?: boolean;
}

interface UseAvailabilityReturn {
    slots: TimeSlot[];
    loading: boolean;
    error: string | null;
    refetch: () => void;
}

// Cache to store fetched slots (5 minutes TTL)
const slotsCache = new Map<string, { data: TimeSlot[]; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const useAvailability = ({
    companyId,
    date,
    serviceDuration,
    enabled = true,
}: UseAvailabilityOptions): UseAvailabilityReturn => {
    const [slots, setSlots] = useState<TimeSlot[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchSlots = useCallback(async () => {
        if (!enabled || !date || !companyId) {
            setSlots([]);
            return;
        }

        const dateStr = date.toISOString().split('T')[0];
        const cacheKey = `${companyId}-${dateStr}-${serviceDuration}`;

        // Check cache first
        const cached = slotsCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
            setSlots(cached.data);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const { data, error: rpcError } = await supabase.rpc('get_available_slots', {
                p_company_id: companyId,
                p_date: dateStr,
                p_service_duration: serviceDuration,
            });

            if (rpcError) throw rpcError;

            const slotsData = data || [];
            setSlots(slotsData);

            // Update cache
            slotsCache.set(cacheKey, {
                data: slotsData,
                timestamp: Date.now(),
            });
        } catch (err: any) {
            console.error('Error fetching availability:', err);
            setError(err.message || 'Erro ao carregar horários disponíveis');
            setSlots([]);
        } finally {
            setLoading(false);
        }
    }, [companyId, date, serviceDuration, enabled]);

    useEffect(() => {
        // Debounce the fetch
        const timer = setTimeout(() => {
            fetchSlots();
        }, 300);

        return () => clearTimeout(timer);
    }, [fetchSlots]);

    return {
        slots,
        loading,
        error,
        refetch: fetchSlots,
    };
};
