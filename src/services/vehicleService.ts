import { supabase } from '@/lib/supabase';
import { Vehicle } from '@/types/database';

export interface CreateVehicleDTO {
    company_id: string;
    customer_id: string;
    license_plate: string;
    brand: string;
    model: string;
    year?: number;
    color?: string;
    notes?: string;
}

export interface UpdateVehicleDTO extends Partial<CreateVehicleDTO> {
    id: string;
}

export interface VehicleListOptions {
    searchTerm?: string;
}

export class VehicleService {
    async list(companyId: string, options: VehicleListOptions = {}): Promise<Vehicle[]> {
        // Fetch vehicles with customer data
        const query = supabase
            .from('vehicles')
            .select(`
                *,
                customer:customer_id(name)
            `)
            .eq('company_id', companyId)
            .is('deleted_at', null)
            .order('created_at', { ascending: false });

        const { data, error } = await query;

        if (error) throw error;

        // Perform memory filtering if search term provided (Supabase simple filtering limitation on relations)
        // If the dataset grows correctly, consider adding a VIEW or specific RPC later.
        if (options.searchTerm) {
            const term = options.searchTerm.toLowerCase();
            return (data as any[]).filter(v =>
                v.brand.toLowerCase().includes(term) ||
                v.model.toLowerCase().includes(term) ||
                v.license_plate.toLowerCase().includes(term) ||
                v.customer?.name.toLowerCase().includes(term)
            );
        }

        return data as Vehicle[];
    }

    async create(data: CreateVehicleDTO): Promise<Vehicle> {
        const { data: vehicle, error } = await supabase
            .from('vehicles')
            .insert(data)
            .select()
            .single();

        if (error) throw error;
        return vehicle;
    }

    async update(id: string, data: Partial<CreateVehicleDTO>): Promise<Vehicle> {
        const { data: vehicle, error } = await supabase
            .from('vehicles')
            .update(data)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return vehicle;
    }

    async delete(id: string): Promise<void> {
        // Soft delete to avoid FK constraints and preserve history
        const { error } = await supabase
            .from('vehicles')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', id);

        if (error) {
            console.error('Vehicle delete error:', error);
            throw error;
        }
    }
}

export const vehicleService = new VehicleService();
