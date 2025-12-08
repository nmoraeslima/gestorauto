import { supabase } from '@/lib/supabase';
import { WorkOrder, WorkOrderService as DBWorkOrderService, WorkOrderProduct } from '@/types/database';

export interface WorkOrderWithDetails extends WorkOrder {
    customer?: { name: string };
    vehicle?: { brand: string; model: string; license_plate: string };
}

export interface CreateWorkOrderDTO {
    company_id: string;
    appointment_id: string;
    customer_id: string;
    vehicle_id: string;
    status: string;
    entry_date: string;
    expected_completion_date?: string | null;
    fuel_level?: number;
    odometer?: number;
    damage_notes?: string;
    customer_belongings?: string;
    internal_notes?: string;
    customer_notes?: string;
    discount?: number;
    discount_type?: 'percentage' | 'fixed';
    payment_method?: string;
    payment_status?: string;
    total: number; // Ensure total is passed
    subtotal: number;
    items?: {
        services: Array<{
            service_id: string;
            service_name: string;
            quantity: number;
            unit_price: number;
            notes?: string;
        }>;
        products: Array<{
            product_id: string;
            product_name: string;
            quantity: number;
        }>;
    };
}

export class WorkOrderService {
    async list(companyId: string): Promise<WorkOrderWithDetails[]> {
        const { data, error } = await supabase
            .from('work_orders')
            .select(`
                *,
                customer:customers(name),
                vehicle:vehicles(brand, model, license_plate)
            `)
            .eq('company_id', companyId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as WorkOrderWithDetails[];
    }

    async getById(id: string): Promise<WorkOrderWithDetails | null> {
        const { data, error } = await supabase
            .from('work_orders')
            .select(`
                *,
                customer:customers(*),
                vehicle:vehicles(*),
                services:work_order_services(*),
                products:work_order_products(*, product:products(unit))
            `)
            .eq('id', id)
            .single();

        if (error) throw error;
        return data as WorkOrderWithDetails;
    }

    async delete(id: string): Promise<void> {
        const { error } = await supabase
            .from('work_orders')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }

    // Helper to manage financial transaction
    private async handleFinancialTransaction(
        companyId: string,
        workOrderId: string,
        workOrderNumber: string,
        customerId: string,
        total: number,
        dueDate: string,
        paymentStatus: string,
        isDraft: boolean
    ) {
        if (isDraft) return;

        let status = 'pending';
        if (paymentStatus === 'paid') status = 'paid';
        else if (paymentStatus === 'partial') status = 'pending';

        const transactionData = {
            company_id: companyId,
            type: 'income',
            category: 'Serviço',
            description: `O.S. #${workOrderNumber}`, // Can be enriched by caller if needed
            amount: total || 0,
            status: status,
            due_date: dueDate,
            paid_at: paymentStatus === 'paid' ? new Date().toISOString() : null,
            work_order_id: workOrderId,
            customer_id: customerId,
        };

        // Check if exists
        const { data: existing } = await supabase
            .from('financial_transactions')
            .select('id')
            .eq('work_order_id', workOrderId)
            .single();

        if (existing) {
            await supabase.from('financial_transactions').update(transactionData).eq('id', existing.id);
        } else {
            await supabase.from('financial_transactions').insert(transactionData);
        }
    }

    async saveItems(workOrderId: string, companyId: string, items: CreateWorkOrderDTO['items']) {
        if (items?.services && items.services.length > 0) {
            const servicesData = items.services.map(s => ({
                company_id: companyId,
                work_order_id: workOrderId,
                service_id: s.service_id,
                service_name: s.service_name,
                quantity: s.quantity,
                unit_price: s.unit_price,
                total_price: s.unit_price * s.quantity,
                notes: s.notes || null,
            }));
            const { error } = await supabase.from('work_order_services').insert(servicesData);
            if (error) throw error;
        }

        if (items?.products && items.products.length > 0) {
            const productsData = items.products.map(p => ({
                company_id: companyId,
                work_order_id: workOrderId,
                product_id: p.product_id,
                product_name: p.product_name,
                quantity: p.quantity,
                unit_price: 0,
                total_price: 0,
            }));
            const { error } = await supabase.from('work_order_products').insert(productsData);
            if (error) throw error;
        }
    }

    async create(data: CreateWorkOrderDTO) {
        // 1. Create Work Order
        const { items, ...workOrderData } = data;

        const orderNumber = new Date().getTime().toString().slice(-6);

        // Initial Insert
        const { data: workOrder, error } = await supabase
            .from('work_orders')
            .insert({
                ...workOrderData,
                order_number: orderNumber
            } as any)
            .select()
            .single();

        if (error) throw error;

        // 2. Insert Items
        if (items) {
            await this.saveItems(workOrder.id, workOrder.company_id, items);
        }

        // 3. Handle Financial
        await this.handleFinancialTransaction(
            workOrder.company_id,
            workOrder.id,
            workOrder.order_number,
            workOrder.customer_id,
            workOrder.total,
            workOrder.expected_completion_date || workOrder.entry_date,
            workOrder.payment_status || 'pending',
            workOrder.status === 'draft'
        );

        // 4. Update status to trigger completion effects if needed
        if (workOrderData.status === 'completed') {
            await supabase
                .from('work_orders')
                .update({ status: 'completed', completed_at: new Date().toISOString() })
                .eq('id', workOrder.id);
        }

        return workOrder;
    }

    async update(id: string, data: Partial<CreateWorkOrderDTO>) {
        const { items, ...workOrderData } = data;

        const { data: existing } = await supabase.from('work_orders').select('*').eq('id', id).single();
        if (!existing) throw new Error('WorkOrder not found');

        const { data: workOrder, error } = await supabase
            .from('work_orders')
            .update(workOrderData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        if (items) {
            await supabase.from('work_order_services').delete().eq('work_order_id', id);
            await supabase.from('work_order_products').delete().eq('work_order_id', id);
            await this.saveItems(id, workOrder.company_id, items);
        }

        // Handle Financial
        // Note: Use combined data (existing + update) to get total/status if not in update payload
        // Limitation: If total relies on items and items were updated, 'total' in data should be correct from caller.
        const effectiveTotal = data.total ?? existing.total;
        const effectiveStatus = data.status ?? existing.status;
        const effectivePaymentStatus = data.payment_status ?? existing.payment_status;

        await this.handleFinancialTransaction(
            workOrder.company_id,
            workOrder.id,
            workOrder.order_number,
            workOrder.customer_id, // assuming customer doesn't change OR caller provides strict full structure
            effectiveTotal,
            workOrder.expected_completion_date || workOrder.entry_date,
            effectivePaymentStatus,
            effectiveStatus === 'draft'
        );

        // Completion Trigger Logic (if moving to completed)
        if (data.status === 'completed' && existing.status !== 'completed') {
            await supabase
                .from('work_orders')
                .update({ status: 'completed', completed_at: new Date().toISOString() })
                .eq('id', workOrder.id);
        }

        return workOrder;
    }
}

export const workOrderService = new WorkOrderService();
