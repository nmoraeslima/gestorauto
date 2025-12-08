import { supabase } from '@/lib/supabase';
import { FinancialTransaction, TransactionType } from '@/types/database';

export class FinancialService {
    async list(companyId: string, options?: { type?: TransactionType, startDate?: string, endDate?: string }): Promise<FinancialTransaction[]> {
        let query = supabase
            .from('financial_transactions')
            .select('*')
            .eq('company_id', companyId)
            .order('due_date', { ascending: false });

        if (options?.type) {
            query = query.eq('type', options.type);
        }

        if (options?.startDate) {
            query = query.gte('due_date', options.startDate);
        }

        if (options?.endDate) {
            query = query.lte('due_date', options.endDate);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data as FinancialTransaction[];
    }

    async create(data: Partial<FinancialTransaction>) {
        const { data: transaction, error } = await supabase
            .from('financial_transactions')
            .insert(data)
            .select()
            .single();

        if (error) throw error;
        return transaction;
    }

    async update(id: string, data: Partial<FinancialTransaction>) {
        const { data: transaction, error } = await supabase
            .from('financial_transactions')
            .update(data)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return transaction;
    }

    async delete(id: string) {
        const { error } = await supabase
            .from('financial_transactions')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
}

export const financialService = new FinancialService();
