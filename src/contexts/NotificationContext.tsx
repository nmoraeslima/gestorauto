import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';
import { AppNotification } from '@/types/database';
import { notificationService } from '@/services/notificationService';

interface NotificationContextType {
    notifications: AppNotification[];
    unreadCount: number;
    loading: boolean;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    refresh: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchNotifications = async () => {
        if (!user?.company?.id) return;

        try {
            const { data, error } = await supabase
                .from('app_notifications')
                .select('*')
                .eq('company_id', user.company.id)
                .order('created_at', { ascending: false })
                .limit(50); // Limit to last 50 notifications

            if (error) throw error;

            setNotifications(data || []);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (id: string) => {
        try {
            const { error } = await supabase
                .from('app_notifications')
                .update({ read: true })
                .eq('id', id);

            if (error) throw error;

            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, read: true } : n)
            );
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const markAllAsRead = async () => {
        if (!user?.company?.id) return;

        try {
            const { error } = await supabase
                .from('app_notifications')
                .update({ read: true })
                .eq('company_id', user.company.id)
                .eq('read', false);

            if (error) throw error;

            setNotifications(prev =>
                prev.map(n => ({ ...n, read: true }))
            );
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
        }
    };

    useEffect(() => {
        if (user?.company?.id) {
            fetchNotifications();
            notificationService.startPeriodicChecks(user.company.id);

            // Subscribe to new notifications
            const subscription = supabase
                .channel('notifications-changes')
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'app_notifications',
                        filter: `company_id=eq.${user.company.id}`,
                    },
                    (payload) => {
                        setNotifications(prev => [payload.new as AppNotification, ...prev]);
                    }
                )
                .subscribe();

            return () => {
                notificationService.stopPeriodicChecks();
                subscription.unsubscribe();
            };
        }
    }, [user?.company?.id]);

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <NotificationContext.Provider value={{
            notifications,
            unreadCount,
            loading,
            markAsRead,
            markAllAsRead,
            refresh: fetchNotifications
        }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};
