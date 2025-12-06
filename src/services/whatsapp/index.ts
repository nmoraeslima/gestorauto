import { AntiBanWhatsAppClient } from './anti-ban-client';
import { SmartWhatsAppTemplates } from './smart-templates';
import { supabase } from '@/lib/supabase';

// Singleton instance
let whatsappClient: AntiBanWhatsAppClient | null = null;

export function getWhatsAppClient(): AntiBanWhatsAppClient {
    if (!whatsappClient) {
        const config = {
            baseUrl: process.env.NEXT_PUBLIC_EVOLUTION_API_URL || process.env.EVOLUTION_API_URL || '',
            apiKey: process.env.EVOLUTION_API_KEY || '',
            instanceName: process.env.EVOLUTION_INSTANCE_NAME || 'gestorauto-main',
        };

        if (!config.baseUrl || !config.apiKey) {
            throw new Error('WhatsApp Evolution API not configured. Set EVOLUTION_API_URL and EVOLUTION_API_KEY environment variables.');
        }

        whatsappClient = new AntiBanWhatsAppClient(config);
        console.log('✅ WhatsApp client initialized');
    }

    return whatsappClient;
}

/**
 * Enviar confirmação de agendamento
 */
export async function sendAppointmentConfirmation(appointmentId: string) {
    try {
        // Buscar dados do agendamento
        const { data: appointment, error: appointmentError } = await supabase
            .from('appointments')
            .select(`
        *,
        customer:customers(*),
        vehicle:vehicles(*),
        company:companies(*)
      `)
            .eq('id', appointmentId)
            .single();

        if (appointmentError || !appointment) {
            throw new Error('Appointment not found');
        }

        // Gerar mensagem
        const message = SmartWhatsAppTemplates.appointmentConfirmation({
            customer: appointment.customer,
            appointment,
            vehicle: appointment.vehicle,
            company: appointment.company,
        });

        // Adicionar à fila
        const client = getWhatsAppClient();
        await client.queueMessage(
            appointment.customer.phone,
            message,
            {
                priority: 'high',
                appointmentId,
                type: 'confirmation',
            }
        );

        console.log(`✅ Appointment confirmation queued for ${appointment.customer.name}`);
        return { success: true };
    } catch (error: any) {
        console.error('Error sending appointment confirmation:', error);
        throw error;
    }
}

/**
 * Enviar lembrete 24h antes
 */
export async function sendReminder24h(appointmentId: string) {
    try {
        const { data: appointment } = await supabase
            .from('appointments')
            .select(`
        *,
        customer:customers(*),
        vehicle:vehicles(*)
      `)
            .eq('id', appointmentId)
            .single();

        if (!appointment) throw new Error('Appointment not found');

        const message = SmartWhatsAppTemplates.reminder24h({
            customer: appointment.customer,
            appointment,
            vehicle: appointment.vehicle,
            company: {} as any, // Not needed for reminder
        });

        const client = getWhatsAppClient();
        await client.queueMessage(
            appointment.customer.phone,
            message,
            {
                priority: 'normal',
                appointmentId,
                type: 'reminder_24h',
            }
        );

        console.log(`✅ 24h reminder queued for ${appointment.customer.name}`);
        return { success: true };
    } catch (error: any) {
        console.error('Error sending 24h reminder:', error);
        throw error;
    }
}

/**
 * Enviar lembrete 2h antes
 */
export async function sendReminder2h(appointmentId: string) {
    try {
        const { data: appointment } = await supabase
            .from('appointments')
            .select(`
        *,
        customer:customers(*),
        vehicle:vehicles(*)
      `)
            .eq('id', appointmentId)
            .single();

        if (!appointment) throw new Error('Appointment not found');

        const message = SmartWhatsAppTemplates.reminder2h({
            customer: appointment.customer,
            appointment,
            vehicle: appointment.vehicle,
            company: {} as any,
        });

        const client = getWhatsAppClient();
        await client.queueMessage(
            appointment.customer.phone,
            message,
            {
                priority: 'high',
                appointmentId,
                type: 'reminder_2h',
            }
        );

        console.log(`✅ 2h reminder queued for ${appointment.customer.name}`);
        return { success: true };
    } catch (error: any) {
        console.error('Error sending 2h reminder:', error);
        throw error;
    }
}

/**
 * Enviar notificação de serviço concluído
 */
export async function sendServiceCompleted(workOrderId: string) {
    try {
        const { data: workOrder } = await supabase
            .from('work_orders')
            .select(`
        *,
        customer:customers(*),
        vehicle:vehicles(*)
      `)
            .eq('id', workOrderId)
            .single();

        if (!workOrder) throw new Error('Work order not found');

        const message = SmartWhatsAppTemplates.serviceCompleted({
            customer: workOrder.customer,
            workOrder,
            vehicle: workOrder.vehicle,
        });

        const client = getWhatsAppClient();
        await client.queueMessage(
            workOrder.customer.phone,
            message,
            {
                priority: 'normal',
                type: 'completed',
            }
        );

        console.log(`✅ Service completed notification queued for ${workOrder.customer.name}`);
        return { success: true };
    } catch (error: any) {
        console.error('Error sending service completed notification:', error);
        throw error;
    }
}
