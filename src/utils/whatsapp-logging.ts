import { supabase } from '@/lib/supabase';

interface LogMessageParams {
    appointmentId: string;
    customerName: string;
    phone: string;
    messageType: 'confirmation' | 'cancellation' | 'reminder';
    messagePreview: string;
    companyId: string;
    userId: string;
}

/**
 * Log WhatsApp message (for analytics)
 * Non-blocking, fire-and-forget
 */
export async function logWhatsAppMessage(params: LogMessageParams): Promise<void> {
    try {
        await supabase.from('whatsapp_message_log').insert({
            appointment_id: params.appointmentId,
            customer_name: params.customerName,
            phone: params.phone,
            message_type: params.messageType,
            message_preview: params.messagePreview.substring(0, 200), // First 200 chars
            company_id: params.companyId,
            created_by: params.userId,
        });
    } catch (error) {
        // Silent fail - logging should not block user flow
        console.error('Failed to log WhatsApp message:', error);
    }
}

/**
 * Get message statistics
 */
export async function getWhatsAppStats(companyId: string, days: number = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
        .from('whatsapp_message_stats')
        .select('*')
        .eq('company_id', companyId)
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: false });

    if (error) throw error;
    return data;
}
