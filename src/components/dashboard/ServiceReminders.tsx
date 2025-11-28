import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Bell, Calendar, CheckCircle, MessageCircle, XCircle } from 'lucide-react';
import type { ServiceReminderWithDetails } from '@/types/database';
import { formatDate } from '@/utils/datetime';
import toast from 'react-hot-toast';

export const ServiceReminders: React.FC = () => {
    const { user } = useAuth();
    const [reminders, setReminders] = useState<ServiceReminderWithDetails[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user?.company?.id) {
            loadReminders();
        }
    }, [user]);

    const loadReminders = async () => {
        try {
            const { data, error } = await supabase
                .from('service_reminders')
                .select(`
                    *,
                    customer:customers(name, phone),
                    vehicle:vehicles(brand, model, license_plate),
                    service:services(name)
                `)
                .eq('company_id', user?.company?.id)
                .eq('status', 'pending')
                .lte('due_date', new Date().toISOString().split('T')[0]) // Due today or before
                .order('due_date', { ascending: true });

            if (error) throw error;
            setReminders(data || []);
        } catch (error) {
            console.error('Error loading reminders:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSendWhatsApp = async (reminder: ServiceReminderWithDetails) => {
        if (!reminder.customer?.phone) {
            toast.error('Cliente sem telefone cadastrado');
            return;
        }

        const phone = reminder.customer.phone.replace(/\D/g, '');
        const customerName = reminder.customer.name.split(' ')[0];
        const vehicleModel = reminder.vehicle?.model || 'seu veículo';
        const serviceName = reminder.service?.name || 'serviço';

        const message = `Olá ${customerName}! 👋\n\nPassando para lembrar que já está na hora de realizar a manutenção do serviço de *${serviceName}* no ${vehicleModel}.\n\nPodemos agendar um horário para você? 🚗✨`;

        const whatsappUrl = `https://wa.me/55${phone}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');

        // Update status to 'sent'
        try {
            const { error } = await supabase
                .from('service_reminders')
                .update({ status: 'sent' })
                .eq('id', reminder.id);

            if (error) throw error;

            // Refresh list
            setReminders(prev => prev.filter(r => r.id !== reminder.id));
            toast.success('Lembrete enviado!');
        } catch (error) {
            console.error('Error updating reminder:', error);
        }
    };

    const handleDismiss = async (id: string) => {
        try {
            const { error } = await supabase
                .from('service_reminders')
                .update({ status: 'cancelled' })
                .eq('id', id);

            if (error) throw error;

            setReminders(prev => prev.filter(r => r.id !== id));
            toast.success('Lembrete removido');
        } catch (error) {
            console.error('Error dismissing reminder:', error);
            toast.error('Erro ao remover lembrete');
        }
    };

    if (loading) return <div className="animate-pulse h-20 bg-gray-100 rounded-lg"></div>;

    if (reminders.length === 0) return null;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-secondary-100 overflow-hidden mb-6">
            <div className="p-4 border-b border-secondary-100 bg-secondary-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Bell className="w-5 h-5 text-primary-600" />
                    <h3 className="font-semibold text-secondary-900">Lembretes de Retorno</h3>
                </div>
                <span className="bg-primary-100 text-primary-700 text-xs font-bold px-2 py-1 rounded-full">
                    {reminders.length}
                </span>
            </div>

            <div className="divide-y divide-secondary-100">
                {reminders.map((reminder) => (
                    <div key={reminder.id} className="p-4 hover:bg-gray-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-secondary-900">{reminder.customer?.name}</span>
                                <span className="text-xs text-gray-400">• {reminder.vehicle?.model}</span>
                            </div>
                            <p className="text-sm text-secondary-600">
                                Retorno sugerido: <span className="font-medium text-primary-600">{reminder.service?.name}</span>
                            </p>
                            <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                                <Calendar className="w-3 h-3" />
                                Vencimento: {formatDate(reminder.due_date)}
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => handleSendWhatsApp(reminder)}
                                className="btn btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
                                title="Enviar WhatsApp"
                            >
                                <MessageCircle className="w-3.5 h-3.5 text-green-600" />
                                Enviar
                            </button>
                            <button
                                onClick={() => handleDismiss(reminder.id)}
                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                title="Dispensar"
                            >
                                <XCircle className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
