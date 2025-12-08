import { supabase } from '@/lib/supabase';
import { Service } from '@/types/database';

export interface CreateServiceDTO {
    company_id: string;
    name: string;
    description?: string;
    price: number;
    duration_minutes: number;
    recurrence_interval?: number;
    category?: string;
    is_active?: boolean;
}

export interface UpdateServiceDTO extends Partial<CreateServiceDTO> {
    id: string;
}

export interface ServiceListOptions {
    activeOnly?: boolean;
    searchTerm?: string;
    category?: string;
}

export class CatalogService {
    async list(companyId: string, options: ServiceListOptions = {}): Promise<Service[]> {
        let query = supabase
            .from('services')
            .select('*')
            .eq('company_id', companyId)
            .order('name');

        if (options.activeOnly) {
            query = query.eq('is_active', true);
        }

        if (options.category && options.category !== 'all') {
            query = query.eq('category', options.category);
        }

        // Search in memory for now as specialized search is complex via RLS pure filters without text search enabled on DB
        // But for standard 'ilike' we can try if RLS permits
        if (options.searchTerm) {
            query = query.ilike('name', `%${options.searchTerm}%`);
        }

        const { data, error } = await query;

        if (error) throw error;
        return data as Service[];
    }

    async create(data: CreateServiceDTO): Promise<Service> {
        const { data: service, error } = await supabase
            .from('services')
            .insert(data)
            .select()
            .single();

        if (error) throw error;
        return service;
    }

    async update(id: string, data: Partial<CreateServiceDTO>): Promise<Service> {
        const { data: service, error } = await supabase
            .from('services')
            .update(data)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return service;
    }

    async delete(id: string): Promise<void> {
        const { error } = await supabase
            .from('services')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
}

export const catalogService = new CatalogService();
