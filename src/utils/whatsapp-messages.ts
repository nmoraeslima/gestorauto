import { Appointment, Customer, Vehicle, Company } from '@/types/database';

interface MessageData {
    customer: Customer;
    appointment?: Appointment;
    vehicle?: Vehicle;
    company?: Company;
}

/**
 * Generate appointment confirmation message
 */
export function generateConfirmationMessage(data: MessageData): string {
    const { customer, appointment, vehicle, company } = data;

    if (!appointment) return '';

    const firstName = customer.name.split(' ')[0];
    const date = new Date(appointment.scheduled_at).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
    const time = new Date(appointment.scheduled_at).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
    });

    const companyName = company?.name || 'GestorAuto';
    let message = `✅ *Agendamento Confirmado - ${companyName} (by GestorAuto)*\n\n`;
    message += `Olá, ${firstName}! 👋\n\n`;
    message += `Seu agendamento foi confirmado:\n\n`;
    message += `📅 *Data:* ${date}\n`;
    message += `🕐 *Horário:* ${time}\n`;

    if (vehicle) {
        message += `🚘 *Veículo:* ${vehicle.brand} ${vehicle.model}`;
        if (vehicle.license_plate) {
            message += ` - ${vehicle.license_plate}`;
        }
        message += `\n`;
    }

    if (appointment.notes) {
        message += `\n📝 *Observações:* ${appointment.notes}\n`;
    }

    if (company?.address) {
        message += `\n📍 *Endereço:*\n${company.address}\n`;
    }

    message += `\nPara reagendar ou cancelar, responda esta mensagem.\n\n`;
    message += `Até breve! ✨`;

    return message;
}

/**
 * Generate appointment cancellation message
 */
export function generateCancellationMessage(
    data: MessageData,
    reason: string,
    customReason?: string
): string {
    const { customer, appointment } = data;

    if (!appointment) return '';

    const firstName = customer.name.split(' ')[0];
    const date = new Date(appointment.scheduled_at).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
    const time = new Date(appointment.scheduled_at).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
    });

    const companyName = data.company?.name || 'GestorAuto';
    let message = `❌ *Agendamento Cancelado - ${companyName} (by GestorAuto)*\n\n`;
    message += `Olá, ${firstName}!\n\n`;
    message += `Infelizmente precisamos cancelar seu agendamento:\n\n`;
    message += `📅 *Data:* ${date}\n`;
    message += `🕐 *Horário:* ${time}\n\n`;

    const finalReason = reason === 'Outro (especificar)' ? customReason : reason;
    if (finalReason) {
        message += `*Motivo:* ${finalReason}\n\n`;
    }

    message += `Pedimos desculpas pelo transtorno! 🙏\n\n`;
    message += `Podemos reagendar para outro dia?\n`;
    message += `Por favor, responda esta mensagem para encontrarmos um novo horário.\n\n`;
    message += `Obrigado pela compreensão!`;

    return message;
}

/**
 * Generate reminder message (24h before)
 */
export function generateReminderMessage(data: MessageData): string {
    const { customer, appointment, vehicle } = data;

    if (!appointment) return '';

    const firstName = customer.name.split(' ')[0];
    const date = new Date(appointment.scheduled_at).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
    });
    const time = new Date(appointment.scheduled_at).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
    });

    const companyName = data.company?.name || 'GestorAuto';
    let message = `⏰ *Lembrete de Agendamento - ${companyName} (by GestorAuto)*\n\n`;
    message += `Olá, ${firstName}!\n\n`;
    message += `Lembramos que você tem um agendamento amanhã:\n\n`;
    message += `📅 ${date} às ${time}\n`;

    if (vehicle) {
        message += `🚘 ${vehicle.brand} ${vehicle.model}\n`;
    }

    message += `\nNos vemos em breve! 👋`;

    return message;
}

/**
 * Generate work order completion message
 */
export function generateWorkOrderCompletionMessage(
    data: MessageData & {
        workOrder: {
            order_number: string;
            total: number;
            services: { name: string; quantity: number }[]
        }
    }
): string {
    const { customer, vehicle, workOrder } = data;

    const firstName = customer.name.split(' ')[0];
    const totalFormatted = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(workOrder.total);

    const companyName = data.company?.name || 'GestorAuto';
    let message = `✅ *Serviço Concluído - ${companyName} (by GestorAuto)*\n\n`;
    message += `Boa notícia, ${firstName}! Seu veículo está pronto:\n\n`;

    if (vehicle) {
        message += `🚙 *${vehicle.brand} ${vehicle.model}*`;
        if (vehicle.license_plate) {
            message += ` - ${vehicle.license_plate}`;
        }
        message += `\n`;
    }

    message += `📋 O.S. #${workOrder.order_number}\n\n`;

    if (workOrder.services && workOrder.services.length > 0) {
        message += `*Serviços realizados:*\n`;
        workOrder.services.forEach(service => {
            const qty = service.quantity > 1 ? ` (${service.quantity}x)` : '';
            message += `  ✨ ${service.name}${qty}\n`;
        });
        message += `\n`;
    }

    message += `💰 *Valor Total:* ${totalFormatted}\n\n`;
    message += `📍 *Você pode retirar seu veículo!*\n\n`;
    message += `Obrigado pela confiança! 🙏`;

    return message;
}
