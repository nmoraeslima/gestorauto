import { supabase } from '@/lib/supabase';
import { AppNotification } from '@/types/database';

export class NotificationService {
    private static instance: NotificationService;
    private checkInterval: number | null = null;
    private lastChecks: {
        appointments: number;
        stock: number;
        receivables: number;
        trial: number;
    } = {
            appointments: 0,
            stock: 0,
            receivables: 0,
            trial: 0,
        };

    private constructor() { }

    static getInstance(): NotificationService {
        if (!NotificationService.instance) {
            NotificationService.instance = new NotificationService();
        }
        return NotificationService.instance;
    }

    async requestPermission(): Promise<boolean> {
        if (!('Notification' in window)) {
            console.log('This browser does not support notifications');
            return false;
        }

        if (Notification.permission === 'granted') {
            return true;
        }

        if (Notification.permission !== 'denied') {
            const permission = await Notification.requestPermission();
            return permission === 'granted';
        }

        return false;
    }

    async registerServiceWorker(): Promise<void> {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js');
                console.log('Service Worker registered:', registration);
            } catch (error) {
                console.error('Service Worker registration failed:', error);
            }
        }
    }

    startPeriodicChecks(companyId: string): void {
        // Check every 5 minutes
        this.checkInterval = window.setInterval(() => {
            this.checkAll(companyId);
        }, 5 * 60 * 1000);

        // Run initial check
        this.checkAll(companyId);
    }

    stopPeriodicChecks(): void {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
    }

    private async checkAll(companyId: string): Promise<void> {
        console.log('[Notifications] Running periodic check for company:', companyId);

        await Promise.all([
            this.checkAppointments(companyId),
            this.checkStock(companyId),
            this.checkReceivables(companyId),
            this.checkTrialStatus(companyId),
        ]);

        console.log('[Notifications] Check completed');
    }

    private async createNotification(companyId: string, notification: Omit<AppNotification, 'id' | 'created_at' | 'read' | 'company_id'>): Promise<void> {
        try {
            // Check if a similar notification already exists (to avoid spam)
            // For simplicity, we'll just check if one with the same title exists created in the last 24h
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);

            const { data: existing } = await supabase
                .from('notifications')
                .select('id')
                .eq('company_id', companyId)
                .eq('title', notification.title)
                .gte('created_at', yesterday.toISOString())
                .limit(1);

            if (existing && existing.length > 0) {
                console.log('[Notifications] Similar notification already exists, skipping:', notification.title);
                return;
            }

            const { error } = await supabase
                .from('notifications')
                .insert({
                    company_id: companyId,
                    ...notification,
                    read: false
                });

            if (error) throw error;

            // Also show browser notification if permitted
            this.showBrowserNotification({
                title: notification.title,
                body: notification.message,
                data: { url: notification.link },
                tag: notification.type
            });

        } catch (error) {
            console.error('[Notifications] Error creating notification:', error);
        }
    }

    private async checkTrialStatus(companyId: string): Promise<void> {
        try {
            const currentTime = Date.now();
            // Check only once per day (24h)
            if (currentTime - this.lastChecks.trial < 24 * 60 * 60 * 1000) {
                console.log('[Notifications] Trial check skipped (cooldown)');
                return;
            }

            console.log('[Notifications] Checking trial status for company:', companyId);

            const { data: company, error } = await supabase
                .from('companies')
                .select('subscription_status, trial_ends_at')
                .eq('id', companyId)
                .single();

            if (error) throw error;

            if (company?.subscription_status === 'trial' && company.trial_ends_at) {
                this.lastChecks.trial = currentTime;
                const trialEnd = new Date(company.trial_ends_at);
                const now = new Date();
                const daysRemaining = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

                console.log(`[Notifications] Trial ends in ${daysRemaining} days`);

                if (daysRemaining <= 3 && daysRemaining > 0) {
                    await this.createNotification(companyId, {
                        title: '⏳ Período de Teste Acabando',
                        message: `Seu período de teste termina em ${daysRemaining} dias. Assine agora para não perder o acesso!`,
                        type: 'warning',
                        link: '/settings/billing'
                    });
                } else if (daysRemaining <= 0) {
                    await this.createNotification(companyId, {
                        title: '🚫 Período de Teste Expirado',
                        message: 'Seu período de teste expirou. Por favor, escolha um plano para continuar usando o sistema.',
                        type: 'error',
                        link: '/settings/billing'
                    });
                }
            }
        } catch (error) {
            console.error('[Notifications] Error checking trial status:', error);
        }
    }

    private async checkAppointments(companyId: string): Promise<void> {
        try {
            const now = new Date();
            const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

            const { data: appointments, error } = await supabase
                .from('appointments')
                .select('id, customer_id, scheduled_at, description, customers(name)')
                .eq('company_id', companyId)
                .eq('status', 'scheduled')
                .gte('scheduled_at', now.toISOString())
                .lte('scheduled_at', oneHourLater.toISOString());

            if (error) throw error;

            if (appointments && appointments.length > 0) {
                const currentTime = Date.now();
                if (currentTime - this.lastChecks.appointments > 30 * 60 * 1000) {
                    this.lastChecks.appointments = currentTime;

                    for (const appointment of appointments) {
                        const scheduledTime = new Date(appointment.scheduled_at);
                        const minutesUntil = Math.round((scheduledTime.getTime() - now.getTime()) / 60000);
                        const customerName = (appointment.customers as any)?.name || 'Cliente';

                        await this.createNotification(companyId, {
                            title: '📅 Agendamento Próximo',
                            message: `${customerName} em ${minutesUntil} minutos`,
                            type: 'info',
                            link: '/appointments'
                        });
                    }
                }
            }
        } catch (error) {
            console.error('Error checking appointments:', error);
        }
    }

    private async checkStock(companyId: string): Promise<void> {
        try {
            const { data: products, error } = await supabase
                .from('products')
                .select('id, name, quantity, min_stock')
                .eq('company_id', companyId)
                .not('min_stock', 'is', null);

            if (error) throw error;

            if (products && products.length > 0) {
                const lowStockProducts = products.filter((p) => {
                    const quantity = Number(p.quantity);
                    const minStock = Number(p.min_stock);
                    return minStock !== null && quantity <= minStock * 1.2;
                });

                if (lowStockProducts.length === 0) return;

                const currentTime = Date.now();
                if (currentTime - this.lastChecks.stock > 60 * 60 * 1000) {
                    this.lastChecks.stock = currentTime;

                    const criticalProducts = lowStockProducts.filter((p) => {
                        const quantity = Number(p.quantity);
                        const minStock = Number(p.min_stock);
                        return quantity < minStock;
                    });

                    const lowProducts = lowStockProducts.filter((p) => {
                        const quantity = Number(p.quantity);
                        const minStock = Number(p.min_stock);
                        return quantity >= minStock && quantity <= minStock * 1.2;
                    });

                    if (criticalProducts.length > 0) {
                        await this.createNotification(companyId, {
                            title: '🚨 Estoque Crítico',
                            message: `${criticalProducts.length} produto${criticalProducts.length > 1 ? 's' : ''} abaixo do mínimo`,
                            type: 'error',
                            link: '/inventory'
                        });
                    }

                    if (lowProducts.length > 0) {
                        await this.createNotification(companyId, {
                            title: '⚠️ Estoque Baixo',
                            message: `${lowProducts.length} produto${lowProducts.length > 1 ? 's' : ''} próximo${lowProducts.length > 1 ? 's' : ''} do mínimo`,
                            type: 'warning',
                            link: '/inventory'
                        });
                    }
                }
            }
        } catch (error) {
            console.error('Error checking stock:', error);
        }
    }

    private async checkReceivables(companyId: string): Promise<void> {
        try {
            const today = new Date();
            const threeDaysLater = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);

            const { data: transactions, error } = await supabase
                .from('financial_transactions')
                .select('id, description, amount, due_date')
                .eq('company_id', companyId)
                .eq('type', 'income')
                .eq('status', 'pending')
                .not('due_date', 'is', null)
                .gte('due_date', today.toISOString().split('T')[0])
                .lte('due_date', threeDaysLater.toISOString().split('T')[0]);

            if (error) throw error;

            if (transactions && transactions.length > 0) {
                const currentTime = Date.now();
                if (currentTime - this.lastChecks.receivables > 4 * 60 * 60 * 1000) {
                    this.lastChecks.receivables = currentTime;

                    const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);

                    await this.createNotification(companyId, {
                        title: '💰 Contas a Vencer',
                        message: `${transactions.length} conta${transactions.length > 1 ? 's' : ''} vencendo em até 3 dias - R$ ${totalAmount.toFixed(2)}`,
                        type: 'info',
                        link: '/financial'
                    });
                }
            }
        } catch (error) {
            console.error('Error checking receivables:', error);
        }
    }

    async sendTestNotification(): Promise<void> {
        // This method is mainly for testing browser notifications, 
        // but we can also use it to test persistence if needed.
        // For now, let's keep it simple and just show a browser notification.
        await this.showBrowserNotification({
            title: '🔔 Teste de Notificação',
            body: 'O sistema de notificações está funcionando corretamente!',
            tag: 'test-notification',
            data: { url: window.location.pathname }
        });
    }

    private async showBrowserNotification(options: {
        title: string;
        body: string;
        data?: any;
        tag?: string;
    }): Promise<void> {
        if (Notification.permission === 'granted') {
            try {
                const registration = await navigator.serviceWorker.ready;
                await registration.showNotification(options.title, {
                    body: options.body,
                    icon: '/logo.png',
                    badge: '/logo.png',
                    tag: options.tag,
                    data: options.data,
                    requireInteraction: false,
                    vibrate: [200, 100, 200],
                } as any);
            } catch (error) {
                console.error('[Notifications] Error showing notification via Service Worker:', error);
                new Notification(options.title, {
                    body: options.body,
                    icon: '/logo.png',
                    badge: '/logo.png',
                    tag: options.tag,
                    data: options.data,
                    requireInteraction: false,
                });
            }
        }
    }
}

export const notificationService = NotificationService.getInstance();
