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

    let message = `Olá, ${firstName}! 👋\n\n`;
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

    let message = `Olá, ${firstName}!\n\n`;
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

    let message = `⏰ *Lembrete de Agendamento*\n\n`;
    message += `Olá, ${firstName}!\n\n`;
    message += `Lembramos que você tem um agendamento amanhã:\n\n`;
    message += `📅 ${date} às ${time}\n`;

    if (vehicle) {
        message += `🚘 ${vehicle.brand} ${vehicle.model}\n`;
    }

    message += `\nNos vemos em breve! 👋`;

    return message;
}
