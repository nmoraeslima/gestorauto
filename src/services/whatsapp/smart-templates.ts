import { Appointment, Customer, Vehicle, Company } from '@/types/database';

interface TemplateData {
    customer: Customer;
    appointment: Appointment;
    vehicle?: Vehicle;
    company: Company;
}

export class SmartWhatsAppTemplates {
    /**
     * Gerar confirmação com variações (anti-spam)
     */
    static appointmentConfirmation(data: TemplateData): string {
        const templates = [
            this.confirmationTemplate1(data),
            this.confirmationTemplate2(data),
            this.confirmationTemplate3(data),
        ];

        // Escolher aleatoriamente
        return templates[Math.floor(Math.random() * templates.length)];
    }

    /**
     * Template 1: Formal e completo
     */
    private static confirmationTemplate1(data: TemplateData): string {
        const { customer, appointment, vehicle, company } = data;
        const firstName = customer.name.split(' ')[0];
        const date = new Date(appointment.scheduled_date).toLocaleDateString('pt-BR');
        const time = new Date(appointment.scheduled_date).toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
        });

        return `🚗 *${company.name}*
Confirmação de Agendamento

Olá, ${firstName}! 👋

Seu agendamento foi confirmado com sucesso:

📅 *Data:* ${date}
🕐 *Horário:* ${time}
${vehicle ? `🚘 *Veículo:* ${vehicle.brand} ${vehicle.model} - ${vehicle.license_plate}` : ''}

📍 *Endereço:*
${company.address || 'Consulte nosso endereço'}

${appointment.notes ? `📝 *Observações:*\n${appointment.notes}\n\n` : ''}Para reagendar ou cancelar, responda esta mensagem.

Até breve! ✨`;
    }

    /**
     * Template 2: Casual e direto
     */
    private static confirmationTemplate2(data: TemplateData): string {
        const { customer, appointment, vehicle, company } = data;
        const firstName = customer.name.split(' ')[0];
        const date = new Date(appointment.scheduled_date).toLocaleDateString('pt-BR');
        const time = new Date(appointment.scheduled_date).toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
        });

        return `Olá, ${firstName}!

Confirmamos seu agendamento:

Data: ${date}
Horário: ${time}
${vehicle ? `Veículo: ${vehicle.brand} ${vehicle.model}` : ''}

${company.name}
${company.address || ''}

Nos vemos em breve! 🚗`;
    }

    /**
     * Template 3: Minimalista
     */
    private static confirmationTemplate3(data: TemplateData): string {
        const { customer, appointment, vehicle } = data;
        const firstName = customer.name.split(' ')[0];
        const date = new Date(appointment.scheduled_date).toLocaleDateString('pt-BR');
        const time = new Date(appointment.scheduled_date).toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
        });

        return `✅ Agendamento confirmado!

${firstName}, esperamos você:

📅 ${date} - ${time}
${vehicle ? `🚘 ${vehicle.brand} ${vehicle.model}` : ''}

Qualquer dúvida, é só responder.`;
    }

    /**
     * Lembrete 24h antes
     */
    static reminder24h(data: TemplateData): string {
        const { customer, appointment, vehicle } = data;
        const firstName = customer.name.split(' ')[0];
        const date = new Date(appointment.scheduled_date).toLocaleDateString('pt-BR');
        const time = new Date(appointment.scheduled_date).toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
        });

        const templates = [
            `⏰ *Lembrete de Agendamento*

Olá, ${firstName}!

Lembramos que você tem um agendamento amanhã:

📅 ${date} às ${time}
${vehicle ? `🚘 ${vehicle.brand} ${vehicle.model}` : ''}

Nos vemos em breve! 👋`,

            `Oi, ${firstName}!

Só lembrando: seu agendamento é amanhã, ${date} às ${time}.

${vehicle ? `Veículo: ${vehicle.brand} ${vehicle.model}` : ''}

Até lá! 🚗`,

            `📅 Lembrete

${firstName}, amanhã ${date} às ${time} temos seu agendamento.

Confirma presença? 👍`,
        ];

        return templates[Math.floor(Math.random() * templates.length)];
    }

    /**
     * Lembrete 2h antes
     */
    static reminder2h(data: TemplateData): string {
        const { customer, appointment } = data;
        const firstName = customer.name.split(' ')[0];
        const time = new Date(appointment.scheduled_date).toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
        });

        const templates = [
            `⏰ *Lembrete*

Olá, ${firstName}!

Seu agendamento é daqui a 2 horas (${time}).

Estamos te esperando! 🚗`,

            `Oi, ${firstName}!

Lembrete: seu horário é às ${time} (daqui 2h).

Até já! 👋`,

            `${firstName}, seu agendamento é às ${time}.

Nos vemos daqui a pouco! ✨`,
        ];

        return templates[Math.floor(Math.random() * templates.length)];
    }

    /**
     * Serviço concluído
     */
    static serviceCompleted(data: {
        customer: Customer;
        workOrder: any;
        vehicle?: Vehicle;
    }): string {
        const { customer, workOrder, vehicle } = data;
        const firstName = customer.name.split(' ')[0];

        const templates = [
            `✅ *Serviço Concluído*

Olá, ${firstName}!

O serviço no seu veículo foi concluído:

${vehicle ? `🚘 ${vehicle.brand} ${vehicle.model} - ${vehicle.license_plate}` : ''}
📋 *O.S.:* #${workOrder.order_number}

Obrigado pela confiança! 🙏

Caso tenha alguma dúvida, estamos à disposição.`,

            `Oi, ${firstName}!

Serviço finalizado! ✅

${vehicle ? `Veículo: ${vehicle.brand} ${vehicle.model}` : ''}
O.S.: #${workOrder.order_number}

Obrigado! 🚗`,

            `${firstName}, concluímos o serviço no seu ${vehicle?.brand || 'veículo'}!

O.S. #${workOrder.order_number}

Qualquer coisa, é só chamar. 👍`,
        ];

        return templates[Math.floor(Math.random() * templates.length)];
    }

    /**
     * Mensagem de boas-vindas (primeiro contato)
     */
    static welcome(data: { customer: Customer; company: Company }): string {
        const { customer, company } = data;
        const firstName = customer.name.split(' ')[0];

        return `Olá, ${firstName}! 👋

Seja bem-vindo(a) à ${company.name}!

Estamos felizes em tê-lo(a) como cliente.

Para agendar serviços ou tirar dúvidas, é só responder esta mensagem.

Atenciosamente,
Equipe ${company.name}`;
    }
}
