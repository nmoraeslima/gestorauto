import { supabase } from '@/lib/supabase';

export class NotificationService {
    private static instance: NotificationService;
    private checkInterval: number | null = null;
    private lastChecks: {
        appointments: number;
        stock: number;
        receivables: number;
    } = {
            appointments: 0,
            stock: 0,
            receivables: 0,
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
        console.log('[Notifications] Permission status:', Notification.permission);

        if (Notification.permission !== 'granted') {
            console.warn('[Notifications] Permission not granted, skipping checks');
            return;
        }

        await Promise.all([
            this.checkAppointments(companyId),
            this.checkStock(companyId),
            this.checkReceivables(companyId),
        ]);

        console.log('[Notifications] Check completed');
    }

    private async checkAppointments(companyId: string): Promise<void> {
        try {
            console.log('[Notifications] Checking appointments for company:', companyId);
            const now = new Date();
            const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

            const { data: appointments, error } = await supabase
                .from('appointments')
                .select('id, customer_id, scheduled_at, description, customers(name)')
                .eq('company_id', companyId)
                .eq('status', 'scheduled')
                .gte('scheduled_at', now.toISOString())
                .lte('scheduled_at', oneHourLater.toISOString());

            if (error) {
                console.error('[Notifications] Error querying appointments:', error);
                throw error;
            }

            console.log('[Notifications] Found appointments:', appointments?.length || 0);

            if (appointments && appointments.length > 0) {
                const currentTime = Date.now();
                // Only notify if we haven't checked in the last 30 minutes
                if (currentTime - this.lastChecks.appointments > 30 * 60 * 1000) {
                    this.lastChecks.appointments = currentTime;

                    for (const appointment of appointments) {
                        const scheduledTime = new Date(appointment.scheduled_at);
                        const minutesUntil = Math.round((scheduledTime.getTime() - now.getTime()) / 60000);

                        const customerName = (appointment.customers as any)?.name || 'Cliente';

                        console.log('[Notifications] Sending appointment notification:', {
                            customer: customerName,
                            minutesUntil,
                        });

                        this.showNotification({
                            title: '📅 Agendamento Próximo',
                            body: `${customerName} em ${minutesUntil} minutos`,
                            data: { url: '/agenda' },
                            tag: `appointment-${appointment.id}`,
                        });
                    }
                } else {
                    console.log('[Notifications] Skipping appointments - cooldown active');
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
                .select('id, name, stock, minimum_stock')
                .eq('company_id', companyId)
                .not('minimum_stock', 'is', null);

            if (error) throw error;

            if (products && products.length > 0) {
                // Filter products where stock <= minimum_stock * 1.2
                const lowStockProducts = products.filter(
                    (p) => p.minimum_stock && p.stock <= p.minimum_stock * 1.2
                );

                if (lowStockProducts.length === 0) return;

                const currentTime = Date.now();
                // Only notify if we haven't checked in the last hour
                if (currentTime - this.lastChecks.stock > 60 * 60 * 1000) {
                    this.lastChecks.stock = currentTime;

                    const criticalProducts = lowStockProducts.filter((p) => p.stock < p.minimum_stock!);
                    const lowProducts = lowStockProducts.filter(
                        (p) => p.stock >= p.minimum_stock! && p.stock <= p.minimum_stock! * 1.2
                    );

                    if (criticalProducts.length > 0) {
                        this.showNotification({
                            title: '🚨 Estoque Crítico',
                            body: `${criticalProducts.length} produto${criticalProducts.length > 1 ? 's' : ''} abaixo do mínimo`,
                            data: { url: '/catalogo' },
                            tag: 'stock-critical',
                        });
                    }

                    if (lowProducts.length > 0) {
                        this.showNotification({
                            title: '⚠️ Estoque Baixo',
                            body: `${lowProducts.length} produto${lowProducts.length > 1 ? 's' : ''} próximo${lowProducts.length > 1 ? 's' : ''} do mínimo`,
                            data: { url: '/catalogo' },
                            tag: 'stock-low',
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
                .from('transactions')
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
                // Only notify if we haven't checked in the last 4 hours
                if (currentTime - this.lastChecks.receivables > 4 * 60 * 60 * 1000) {
                    this.lastChecks.receivables = currentTime;

                    const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);

                    this.showNotification({
                        title: '💰 Contas a Vencer',
                        body: `${transactions.length} conta${transactions.length > 1 ? 's' : ''} vencendo em até 3 dias - R$ ${totalAmount.toFixed(2)}`,
                        data: { url: '/financeiro/receber' },
                        tag: 'receivables-due',
                    });
                }
            }
        } catch (error) {
            console.error('Error checking receivables:', error);
        }
    }

    async sendTestNotification(): Promise<void> {
        await this.showNotification({
            title: '🔔 Teste de Notificação',
            body: 'O sistema de notificações está funcionando corretamente!',
            tag: 'test-notification',
            data: { url: window.location.pathname }
        });
    }

    private async showNotification(options: {
        title: string;
        body: string;
        data?: any;
        tag?: string;
    }): Promise<void> {
        console.log('[Notifications] Showing notification:', options.title, options.body);

        if (Notification.permission === 'granted') {
            try {
                // Use Service Worker registration to show notification (required for PWA/Android)
                const registration = await navigator.serviceWorker.ready;

                await registration.showNotification(options.title, {
                    body: options.body,
                    icon: '/logo.png',
                    badge: '/logo.png',
                    tag: options.tag,
                    data: options.data,
                    requireInteraction: false,
                    vibrate: [200, 100, 200], // Add vibration for mobile
                } as any);
            } catch (error) {
                console.error('[Notifications] Error showing notification via Service Worker:', error);
                // Fallback to standard Notification API if SW fails (desktop fallback)
                new Notification(options.title, {
                    body: options.body,
                    icon: '/logo.png',
                    badge: '/logo.png',
                    tag: options.tag,
                    data: options.data,
                    requireInteraction: false,
                });
            }
        } else {
            console.warn('[Notifications] Cannot show notification - permission:', Notification.permission);
        }
    }
}

export const notificationService = NotificationService.getInstance();
