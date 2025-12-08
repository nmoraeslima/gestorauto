import { supabase } from '@/lib/supabase';
import { Product } from '@/types/database';

export interface CreateProductDTO {
    company_id: string;
    name: string;
    description?: string;
    category?: string;
    unit: string;
    cost_price: number;
    sale_price?: number; // Not used in frontend form but kept for compatibility
    quantity: number;
    min_stock: number;
    sku?: string;
    is_active?: boolean;
}

export interface UpdateProductDTO extends Partial<CreateProductDTO> {
    id: string;
}

export interface ProductListOptions {
    activeOnly?: boolean;
    searchTerm?: string;
    category?: string;
}

export class InventoryService {
    async list(companyId: string, options: ProductListOptions = {}): Promise<Product[]> {
        let query = supabase
            .from('products')
            .select('*')
            .eq('company_id', companyId)
            .order('name');

        if (options.activeOnly) {
            query = query.eq('is_active', true);
        }

        if (options.category && options.category !== 'all') {
            query = query.eq('category', options.category);
        }

        if (options.searchTerm) {
            query = query.or(`name.ilike.%${options.searchTerm}%,sku.ilike.%${options.searchTerm}%`);
        }

        const { data, error } = await query;

        if (error) throw error;
        return data as Product[];
    }

    async getProductStock(companyId: string, productId: string) {
        const { data, error } = await supabase
            .from('products')
            .select('quantity, min_stock, name')
            .eq('company_id', companyId)
            .eq('id', productId)
            .single();

        if (error) throw error;
        return data;
    }

    async create(data: CreateProductDTO): Promise<Product> {
        // Force default valid values if missing to avoid DB constraints if any
        const payload = {
            ...data,
            sale_price: data.sale_price || 0, // Ensure sale_price has value if DB requires it
            is_active: data.is_active !== undefined ? data.is_active : true
        };

        const { data: product, error } = await supabase
            .from('products')
            .insert(payload)
            .select()
            .single();

        if (error) throw error;
        return product;
    }

    async update(id: string, data: Partial<CreateProductDTO>): Promise<Product> {
        const { data: product, error } = await supabase
            .from('products')
            .update(data)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return product;
    }

    async delete(id: string): Promise<void> {
        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
}

export const inventoryService = new InventoryService();
