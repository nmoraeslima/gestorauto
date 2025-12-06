import { supabase } from '@/lib/supabase';

interface MessageQueueItem {
    phone: string;
    message: string;
    priority: 'high' | 'normal' | 'low';
    appointmentId?: string;
    type?: string;
}

interface EvolutionConfig {
    baseUrl: string;
    apiKey: string;
    instanceName: string;
}

export class AntiBanWhatsAppClient {
    private config: EvolutionConfig;
    private messageQueue: MessageQueueItem[] = [];
    private lastMessageTime: number = 0;
    private dailyMessageCount: number = 0;
    private dailyResetTime: number = Date.now();
    private isProcessing: boolean = false;

    // Limites Anti-Ban (conservadores)
    private readonly MAX_MESSAGES_PER_DAY = 50;
    private readonly MIN_DELAY_BETWEEN_MESSAGES = 30000; // 30 segundos
    private readonly MAX_DELAY_BETWEEN_MESSAGES = 120000; // 2 minutos
    private readonly MAX_MESSAGES_PER_HOUR = 10;
    private readonly BUSINESS_HOURS_START = 8; // 8h
    private readonly BUSINESS_HOURS_END = 20; // 20h

    constructor(config: EvolutionConfig) {
        this.config = config;

        // Iniciar processador de fila
        this.startQueueProcessor();

        console.log('🚀 Anti-Ban WhatsApp Client initialized');
    }

    /**
     * Adicionar mensagem à fila (não envia imediatamente)
     */
    async queueMessage(
        phone: string,
        message: string,
        options: {
            priority?: 'high' | 'normal' | 'low';
            appointmentId?: string;
            type?: string;
        } = {}
    ): Promise<void> {
        const { priority = 'normal', appointmentId, type } = options;

        // Verificar limite diário
        if (this.dailyMessageCount >= this.MAX_MESSAGES_PER_DAY) {
            const error = `Daily message limit reached (${this.MAX_MESSAGES_PER_DAY}). Try again tomorrow.`;
            console.error('❌', error);
            throw new Error(error);
        }

        // Adicionar à fila
        this.messageQueue.push({
            phone,
            message,
            priority,
            appointmentId,
            type,
        });

        // Ordenar por prioridade
        this.messageQueue.sort((a, b) => {
            const priorityOrder = { high: 0, normal: 1, low: 2 };
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        });

        console.log(`📬 Message queued for ${phone}. Queue size: ${this.messageQueue.length}`);
    }

    /**
     * Processar fila com delays anti-ban
     */
    private async startQueueProcessor(): Promise<void> {
        setInterval(async () => {
            // Reset contador diário (meia-noite)
            const now = new Date();
            const resetTime = new Date(this.dailyResetTime);
            if (now.getDate() !== resetTime.getDate()) {
                this.dailyMessageCount = 0;
                this.dailyResetTime = Date.now();
                console.log('🔄 Daily message counter reset');
            }

            // Verificar se há mensagens na fila
            if (this.messageQueue.length === 0) return;

            // Verificar se já está processando
            if (this.isProcessing) return;

            // Verificar limite diário
            if (this.dailyMessageCount >= this.MAX_MESSAGES_PER_DAY) {
                console.log('⚠️ Daily limit reached. Pausing queue until tomorrow.');
                return;
            }

            // Verificar horário comercial
            if (!this.isBusinessHours()) {
                console.log('⏰ Outside business hours. Pausing queue.');
                return;
            }

            // Calcular delay desde última mensagem
            const timeSinceLastMessage = Date.now() - this.lastMessageTime;
            const randomDelay = this.getRandomDelay();

            // Aguardar delay mínimo
            if (timeSinceLastMessage < randomDelay) {
                const waitTime = Math.round((randomDelay - timeSinceLastMessage) / 1000);
                console.log(`⏳ Waiting ${waitTime}s before next message`);
                return;
            }

            // Processar próxima mensagem
            this.isProcessing = true;
            const item = this.messageQueue.shift();

            if (item) {
                try {
                    await this.sendMessageNow(item);
                } catch (error) {
                    console.error('Error processing message:', error);
                }
            }

            this.isProcessing = false;
        }, 5000); // Verificar a cada 5 segundos
    }

    /**
     * Enviar mensagem imediatamente (uso interno)
     */
    private async sendMessageNow(item: MessageQueueItem): Promise<void> {
        const { phone, message, appointmentId, type } = item;

        try {
            console.log(`📤 Sending message to ${phone}...`);

            const response = await fetch(`${this.config.baseUrl}/message/sendText/${this.config.instanceName}`, {
                method: 'POST',
                headers: {
                    'apikey': this.config.apiKey,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    number: this.formatPhone(phone),
                    text: this.addHumanVariation(message),
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || response.statusText);
            }

            const data = await response.json();

            // Atualizar contadores
            this.lastMessageTime = Date.now();
            this.dailyMessageCount++;

            // Registrar sucesso
            await this.logMessage({
                phone,
                message,
                status: 'sent',
                appointmentId,
                type,
                response: data,
            });

            console.log(`✅ Message sent successfully. Daily count: ${this.dailyMessageCount}/${this.MAX_MESSAGES_PER_DAY}`);
        } catch (error: any) {
            console.error(`❌ Error sending message to ${phone}:`, error.message);

            // Registrar erro
            await this.logMessage({
                phone,
                message,
                status: 'failed',
                appointmentId,
                type,
                error: error.message,
            });

            // Se erro de ban, pausar tudo
            if (this.isBanError(error)) {
                console.error('🚨 POSSIBLE BAN DETECTED! Pausing all messages.');
                this.messageQueue = []; // Limpar fila
                await this.notifyBanDetected(error);
            }

            throw error;
        }
    }

    /**
     * Adicionar variação humana à mensagem
     */
    private addHumanVariation(message: string): string {
        // Adicionar variações sutis para evitar detecção de spam
        const variations = [
            '',      // Sem variação (50%)
            ' ',     // Espaço extra (25%)
            '\n',    // Quebra de linha extra (25%)
        ];

        const random = Math.random();
        let variation = '';

        if (random < 0.5) {
            variation = variations[0];
        } else if (random < 0.75) {
            variation = variations[1];
        } else {
            variation = variations[2];
        }

        return message + variation;
    }

    /**
     * Gerar delay aleatório (simular comportamento humano)
     */
    private getRandomDelay(): number {
        // Delay entre 30s e 2min
        return Math.floor(
            Math.random() * (this.MAX_DELAY_BETWEEN_MESSAGES - this.MIN_DELAY_BETWEEN_MESSAGES) +
            this.MIN_DELAY_BETWEEN_MESSAGES
        );
    }

    /**
     * Verificar se está em horário comercial
     */
    private isBusinessHours(): boolean {
        const now = new Date();
        const hour = now.getHours();
        return hour >= this.BUSINESS_HOURS_START && hour < this.BUSINESS_HOURS_END;
    }

    /**
     * Formatar telefone para WhatsApp
     */
    private formatPhone(phone: string): string {
        // Remover caracteres não numéricos
        const cleaned = phone.replace(/\D/g, '');

        // Adicionar código do país se não tiver
        const withCountry = cleaned.startsWith('55') ? cleaned : `55${cleaned}`;

        return `${withCountry}@s.whatsapp.net`;
    }

    /**
     * Detectar erro de ban
     */
    private isBanError(error: any): boolean {
        const banKeywords = [
            'banned',
            'blocked',
            'suspended',
            'violation',
            'terms of service',
            '403',
            'unauthorized',
            'account',
        ];

        const errorMessage = (error.message?.toLowerCase() || '') +
            (error.response?.data?.message?.toLowerCase() || '');

        return banKeywords.some(keyword => errorMessage.includes(keyword));
    }

    /**
     * Registrar mensagem no banco
     */
    private async logMessage(data: {
        phone: string;
        message: string;
        status: 'sent' | 'failed';
        appointmentId?: string;
        type?: string;
        response?: any;
        error?: string;
    }): Promise<void> {
        try {
            await supabase.from('whatsapp_messages').insert({
                phone: data.phone,
                message: data.message,
                status: data.status,
                appointment_id: data.appointmentId,
                type: data.type,
                evolution_response: data.response,
                error: data.error,
                sent_at: data.status === 'sent' ? new Date().toISOString() : null,
            });
        } catch (error) {
            console.error('Error logging message:', error);
        }
    }

    /**
     * Notificar detecção de ban
     */
    private async notifyBanDetected(error: any): Promise<void> {
        try {
            await supabase.from('system_alerts').insert({
                type: 'whatsapp_ban_detected',
                severity: 'critical',
                message: `Possible WhatsApp ban detected. Error: ${error.message}`,
                metadata: {
                    error: error.message,
                    timestamp: new Date().toISOString(),
                    dailyCount: this.dailyMessageCount,
                },
                created_at: new Date().toISOString(),
            });

            console.error('🚨 Ban detection alert created in database');
        } catch (err) {
            console.error('Error creating ban alert:', err);
        }
    }

    /**
     * Verificar status da instância
     */
    async checkInstanceStatus(): Promise<any> {
        try {
            const response = await fetch(`${this.config.baseUrl}/instance/connectionState/${this.config.instanceName}`, {
                method: 'GET',
                headers: {
                    'apikey': this.config.apiKey,
                }
            });

            if (!response.ok) {
                throw new Error(response.statusText);
            }

            return await response.json();
        } catch (error) {
            console.error('Error checking instance status:', error);
            throw error;
        }
    }

    /**
     * Obter estatísticas
     */
    getStats() {
        return {
            queueSize: this.messageQueue.length,
            dailyCount: this.dailyMessageCount,
            dailyLimit: this.MAX_MESSAGES_PER_DAY,
            remaining: this.MAX_MESSAGES_PER_DAY - this.dailyMessageCount,
            lastMessageTime: this.lastMessageTime ? new Date(this.lastMessageTime).toISOString() : null,
            isBusinessHours: this.isBusinessHours(),
            isProcessing: this.isProcessing,
        };
    }

    /**
     * Limpar fila (emergência)
     */
    clearQueue(): void {
        const size = this.messageQueue.length;
        this.messageQueue = [];
        console.log(`🗑️ Queue cleared. ${size} messages removed.`);
    }
}
