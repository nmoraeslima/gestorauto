import { supabase } from '@/lib/supabase';
import { Customer, CustomerFormData } from '@/types/database';

export const customerService = {
    /**
     * List all active customers for the current company
     */
    async list(companyId: string, showInactive: boolean = false): Promise<Customer[]> {
        let query = supabase
            .from('customers')
            .select('*')
            .eq('company_id', companyId)
            .is('deleted_at', null);

        if (!showInactive) {
            query = query.eq('is_active', true);
        }

        const { data, error } = await query.order('name', { ascending: true });

        if (error) throw error;
        return data || [];
    },

    /**
     * Create a new customer
     */
    async create(data: CustomerFormData & { company_id: string }): Promise<Customer> {
        const { data: newCustomer, error } = await supabase
            .from('customers')
            .insert(data)
            .select()
            .single();

        if (error) throw error;
        return newCustomer;
    },

    /**
     * Update an existing customer
     */
    async update(id: string, data: Partial<CustomerFormData>): Promise<Customer> {
        const { data: updatedCustomer, error } = await supabase
            .from('customers')
            .update(data)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return updatedCustomer;
    },

    /**
     * Activate/Deactivate a customer
     */
    async toggleActive(id: string, isActive: boolean): Promise<void> {
        const { error } = await supabase
            .from('customers')
            .update({ is_active: isActive })
            .eq('id', id);

        if (error) throw error;
    },

    /**
     * Check if customer has dependencies (financial/operational) preventing deletion
     */
    async checkDependencies(customerId: string): Promise<{
        hasDependencies: boolean;
        counts: {
            vehicles: number;
            appointments: number;
            workOrders: number;
            transactions: number;
        }
    }> {
        const [vehicles, appointments, workOrders, transactions] = await Promise.all([
            supabase.from('vehicles').select('id', { count: 'exact', head: true }).eq('customer_id', customerId),
            supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('customer_id', customerId),
            supabase.from('work_orders').select('id', { count: 'exact', head: true }).eq('customer_id', customerId),
            supabase.from('transactions').select('id', { count: 'exact', head: true }).eq('customer_id', customerId),
        ]);

        const counts = {
            vehicles: vehicles.count || 0,
            appointments: appointments.count || 0,
            workOrders: workOrders.count || 0,
            transactions: transactions.count || 0
        };

        const hasDependencies = counts.appointments > 0 || counts.workOrders > 0 || counts.transactions > 0;

        return { hasDependencies, counts };
    },

    /**
     * Delete a customer (Soft delete)
     */
    async delete(id: string): Promise<void> {
        // Soft delete customer
        const { error } = await supabase
            .from('customers')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', id);

        if (error) throw error;
    },

    /**
     * Delete customer vehicles (helper for cleanup)
     */
    async deleteVehicles(customerId: string): Promise<void> {
        const { error } = await supabase
            .from('vehicles')
            .delete()
            .eq('customer_id', customerId);

        if (error) throw error;
    },

    async getVehicles(customerId: string): Promise<any[]> {
        const { data, error } = await supabase
            .from('vehicles')
            .select('*')
            .eq('customer_id', customerId)
            .order('model');

        if (error) throw error;
        return data || [];
    }
};
