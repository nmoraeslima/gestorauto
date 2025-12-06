import { supabase } from '@/lib/supabase';
import { formatCurrency } from './calculations';
import { formatDate } from './datetime';

interface WorkOrderNotificationData {
    workOrderId: string;
    customerName: string;
    customerPhone: string;
    vehicleBrand: string;
    vehicleModel: string;
    licensePlate: string;
    orderNumber: string;
    total: number;
    services: string[];
}

/**
 * Sends WhatsApp notification when a work order is completed
 */
export async function sendWorkOrderCompletionNotification(
    data: WorkOrderNotificationData
): Promise<{ success: boolean; error?: string }> {
    try {
        const {
            workOrderId,
            customerName,
            customerPhone,
            vehicleBrand,
            vehicleModel,
            licensePlate,
            orderNumber,
            total,
            services
        } = data;

        // Format phone number (remove non-digits)
        const phone = customerPhone.replace(/\D/g, '');

        if (!phone || phone.length < 10) {
            return { success: false, error: 'Telefone inválido' };
        }

        // Build service list
        const serviceList = services.length > 0
            ? services.map(s => `  ✨ ${s}`).join('\\n')
            : '  ✨ Serviços realizados';

        // Create message
        const message = `✅ *Serviço Concluído - GestorAuto*

Boa notícia, ${customerName}! Seu veículo está pronto:

🚙 *${vehicleBrand} ${vehicleModel}* - ${licensePlate}
📋 O.S. #${orderNumber}

*Serviços realizados:*
${serviceList}

💰 *Valor Total:* ${formatCurrency(total)}

📍 *Você pode retirar seu veículo!*

Obrigado pela confiança! 🙏`;

        // Send via WhatsApp utility
        const { sendWhatsAppMessage } = await import('./whatsapp');
        const result = await sendWhatsAppMessage(phone, message);

        if (result.success) {
            // Log the notification
            await supabase.from('whatsapp_logs').insert({
                phone_number: phone,
                message_type: 'work_order_completed',
                reference_id: workOrderId,
                status: 'sent',
                message_preview: message.substring(0, 100)
            });
        }

        return result;
    } catch (error: any) {
        console.error('Error sending work order completion notification:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Loads work order details and sends completion notification
 */
export async function notifyWorkOrderCompletion(
    workOrderId: string,
    companyId: string
): Promise<{ success: boolean; error?: string }> {
    try {
        // Load work order with customer, vehicle, and services
        const { data: workOrder, error: woError } = await supabase
            .from('work_orders')
            .select(`
                *,
                customer:customers(name, phone),
                vehicle:vehicles(brand, model, license_plate)
            `)
            .eq('id', workOrderId)
            .eq('company_id', companyId)
            .single();

        if (woError || !workOrder) {
            return { success: false, error: 'Ordem de serviço não encontrada' };
        }

        // Load services
        const { data: services } = await supabase
            .from('work_order_services')
            .select('service_name, quantity')
            .eq('work_order_id', workOrderId);

        const serviceNames = services?.map(s =>
            s.quantity > 1 ? `${s.service_name} (${s.quantity}x)` : s.service_name
        ) || [];

        // Send notification
        return await sendWorkOrderCompletionNotification({
            workOrderId,
            customerName: workOrder.customer.name,
            customerPhone: workOrder.customer.phone,
            vehicleBrand: workOrder.vehicle.brand,
            vehicleModel: workOrder.vehicle.model,
            licensePlate: workOrder.vehicle.license_plate,
            orderNumber: workOrder.order_number,
            total: workOrder.total,
            services: serviceNames
        });
    } catch (error: any) {
        console.error('Error in notifyWorkOrderCompletion:', error);
        return { success: false, error: error.message };
    }
}
