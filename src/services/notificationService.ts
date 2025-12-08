import { supabase } from '@/lib/supabase';
import { AppNotification } from '@/types/database';
import { RealtimeChannel } from '@supabase/supabase-js';

export class NotificationService {
    private static instance: NotificationService;
    private checkInterval: NodeJS.Timeout | null = null;
    private realtimeChannel: RealtimeChannel | null = null;

    // Local Cache for Time-Based Notifications
    private upcomingAppointments: any[] = [];
    private lastStockCheck: Record<string, number> = {}; // Debounce stock processing
    private lastTrialCheck: number = 0;

    private constructor() { }

    static getInstance(): NotificationService {
        if (!NotificationService.instance) {
            NotificationService.instance = new NotificationService();
        }
        return NotificationService.instance;
    }

    async requestPermission(): Promise<boolean> {
        if (!('Notification' in window)) {
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
                // Check if we are in development or production to determine SW path if needed
                // For now assuming /sw.js exists in public
                const registration = await navigator.serviceWorker.register('/sw.js');
                console.log('Service Worker registered:', registration);
            } catch (error) {
                console.error('Service Worker registration failed:', error);
            }
        }
    }

    /**
     * Start the Hybrid Notification System
     * 1. Loads initial data (Assignments/Stock)
     * 2. Subscribes to Realtime changes to keep data fresh
     * 3. Starts a local lightweight timer for time-sensitive alerts
     */
    async startService(companyId: string): Promise<void> {
        console.log('[Notifications] Starting Realtime Service...');

        // 1. Initial Load
        await this.loadUpcomingAppointments(companyId);
        await this.checkCurrentStock(companyId); // Initial stock check
        await this.checkTrialStatus(companyId);

        // 2. Realtime Subscription (Stock Changes + Appointment Changes)
        this.subscribeToRealtime(companyId);

        // 3. Local Timer (Checks memory every 1 minute - Zero DB Cost)
        if (this.checkInterval) clearInterval(this.checkInterval);

        // Check every minute
        this.checkInterval = setInterval(() => {
            this.checkLocalAppointments(companyId);
        }, 60 * 1000);

        // Run initial check
        this.checkLocalAppointments(companyId);
    }

    stopService(): void {
        this.stopPeriodicChecks(); // Alias for compatibility
    }

    // Compatibilidade com código antigo que chama stopPeriodicChecks
    stopPeriodicChecks(): void {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
        if (this.realtimeChannel) {
            supabase.removeChannel(this.realtimeChannel);
            this.realtimeChannel = null;
        }
    }

    // Alias for compatibility if needed, but we should change calls to startService
    startPeriodicChecks(companyId: string): void {
        this.startService(companyId);
    }

    private subscribeToRealtime(companyId: string) {
        if (this.realtimeChannel) return;

        this.realtimeChannel = supabase
            .channel('notification-changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'appointments', filter: `company_id=eq.${companyId}` },
                () => {
                    console.log('[Notifications] Appointment changed, reloading agenda...');
                    this.loadUpcomingAppointments(companyId);
                }
            )
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'products', filter: `company_id=eq.${companyId}` },
                (payload) => {
                    this.handleStockUpdate(companyId, payload.new);
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log('[Notifications] Realtime connected!');
                }
            });
    }

    // ==============================================================================
    // LOGIC: Stock (Event Driven + Initial Check)
    // ==============================================================================
    private async checkCurrentStock(companyId: string) {
        try {
            // Find all active products with stock below minimum
            const { data: products } = await supabase
                .from('products')
                .select('*')
                .eq('company_id', companyId)
                .eq('is_active', true); // Check only active products

            if (products) {
                for (const product of products) {
                    if (product.min_stock !== null && product.quantity < product.min_stock) {
                        await this.handleStockUpdate(companyId, product);
                    }
                }
            }
        } catch (error) {
            console.error('[Notifications] Error checking initial stock:', error);
        }
    }

    private async handleStockUpdate(companyId: string, product: any) {
        if (!product.min_stock) return;

        const quantity = Number(product.quantity);
        const minStock = Number(product.min_stock);

        // Debounce: Don't notify about same product more than once per hour (memory cache)
        const lastCheck = this.lastStockCheck[product.id] || 0;
        if (Date.now() - lastCheck < 60 * 60 * 1000) return;

        if (quantity < minStock) {
            this.lastStockCheck[product.id] = Date.now();

            // Generate unique title to avoid global deduplication blocking different products
            const title = `🚨 Estoque Baixo: ${product.name}`;

            await this.createNotification(companyId, {
                title: title,
                message: `O estoque atual (${quantity}) está abaixo do mínimo definido (${minStock}).`,
                type: 'warning', // Changed to warning as it is more appropriate usually, or keep error if critical
                link: '/inventory'
            });
        }
    }

    // ==============================================================================
    // LOGIC: Appointments (Memory Cached + Local Timer)
    // ==============================================================================
    private async loadUpcomingAppointments(companyId: string) {
        const now = new Date();
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const { data } = await supabase
            .from('appointments')
            .select('id, customer_id, scheduled_at, description, customers(name)')
            .eq('company_id', companyId)
            .in('status', ['confirmed', 'scheduled'])
            .gte('scheduled_at', now.toISOString())
            .lte('scheduled_at', endOfDay.toISOString());

        if (data) {
            // Map and add "notified" flag
            this.upcomingAppointments = data.map(app => ({
                ...app,
                notified: false
            }));
        }
    }

    private async checkLocalAppointments(companyId: string) {
        const now = new Date();
        const notificationWindow = 30 * 60 * 1000; // 30 minutes

        for (const app of this.upcomingAppointments) {
            if (app.notified) continue;

            const scheduledTime = new Date(app.scheduled_at);
            const timeDiff = scheduledTime.getTime() - now.getTime();

            // Notify if within window (e.g., 0-30 mins away)
            if (timeDiff > 0 && timeDiff <= notificationWindow) {
                app.notified = true; // Mark locally as notified
                const minutesUntil = Math.round(timeDiff / 60000);
                const customerName = (app.customers as any)?.name || 'Cliente';

                await this.createNotification(companyId, {
                    title: '📅 Agendamento Próximo',
                    message: `${customerName} em ${minutesUntil} minutos`,
                    type: 'info',
                    link: '/appointments'
                });
            }
        }
    }

    // ==============================================================================
    // SHARED HELPERS
    // ==============================================================================

    private async createNotification(companyId: string, notification: Omit<AppNotification, 'id' | 'created_at' | 'read' | 'company_id'>): Promise<void> {
        try {
            // Check for recent duplicate to avoid spam
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);

            const { data: existing } = await supabase
                .from('app_notifications')
                .select('id')
                .eq('company_id', companyId)
                .eq('title', notification.title)
                .gte('created_at', yesterday.toISOString())
                .limit(1);

            if (existing && existing.length > 0) return;

            const { error } = await supabase
                .from('app_notifications')
                .insert({
                    company_id: companyId,
                    ...notification,
                    read: false
                });

            if (error) throw error;

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
            if (currentTime - this.lastTrialCheck < 24 * 60 * 60 * 1000) return;

            const { data: company, error } = await supabase
                .from('companies')
                .select('subscription_status, trial_ends_at')
                .eq('id', companyId)
                .single();

            if (error) throw error;

            if (company?.subscription_status === 'trial' && company.trial_ends_at) {
                this.lastTrialCheck = currentTime;
                const trialEnd = new Date(company.trial_ends_at);
                const now = new Date();
                const daysRemaining = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

                if (daysRemaining <= 3 && daysRemaining > 0) {
                    await this.createNotification(companyId, {
                        title: '⏳ Período de Teste Acabando',
                        message: `Seu período de teste termina em ${daysRemaining} dias.`,
                        type: 'warning',
                        link: '/settings/billing'
                    });
                } else if (daysRemaining <= 0) {
                    await this.createNotification(companyId, {
                        title: '🚫 Período de Teste Expirado',
                        message: 'Seu período de teste expirou.',
                        type: 'error',
                        link: '/settings/billing'
                    });
                }
            }
        } catch (error) {
            console.error('[Notifications] Error checking trial status:', error);
        }
    }

    private async showBrowserNotification(options: {
        title: string;
        body: string;
        data?: any;
        tag?: string;
    }): Promise<void> {
        if (Notification.permission === 'granted') {
            try {
                // Try Service Worker first
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
                // Fallback to standard API
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
