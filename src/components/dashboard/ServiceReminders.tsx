import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Bell, Calendar, CheckCircle, MessageCircle, XCircle, Lock } from 'lucide-react';
import { addDays } from 'date-fns';
import type { ServiceReminderWithDetails } from '@/types/database';
import { formatDate } from '@/utils/datetime';
import toast from 'react-hot-toast';
import { PLAN_LIMITS, SubscriptionPlan } from '@/types/database';

export const ServiceReminders: React.FC = () => {
    const { user } = useAuth();
    const [reminders, setReminders] = useState<ServiceReminderWithDetails[]>([]);
    const [loading, setLoading] = useState(true);

    const plan = (user?.company?.subscription_plan as SubscriptionPlan) || 'basic';
    const isAllowed = PLAN_LIMITS[plan]?.features?.crm_recurrence;

    useEffect(() => {
        if (user?.company?.id && isAllowed) {
            loadReminders();
        } else if (!isAllowed) {
            // Set dummy data for blurred view
            setReminders([
                {
                    id: '1',
                    customer: { name: 'João Silva', phone: '11999999999' },
                    vehicle: { model: 'Toyota Corolla', brand: 'Toyota', license_plate: 'ABC-1234' },
                    service: { name: 'Polimento Técnico' },
                    due_date: new Date().toISOString(),
                    status: 'pending'
                },
                {
                    id: '2',
                    customer: { name: 'Maria Santos', phone: '11988888888' },
                    vehicle: { model: 'Honda Civic', brand: 'Honda', license_plate: 'XYZ-5678' },
                    service: { name: 'Higienização Interna' },
                    due_date: new Date().toISOString(),
                    status: 'pending'
                },
                {
                    id: '3',
                    customer: { name: 'Carlos Oliveira', phone: '11977777777' },
                    vehicle: { model: 'Jeep Compass', brand: 'Jeep', license_plate: 'DEF-9012' },
                    service: { name: 'Vitrificação' },
                    due_date: new Date().toISOString(),
                    status: 'pending'
                }
            ] as any);
            setLoading(false);
        }
    }, [user, isAllowed]);

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
                .lte('due_date', addDays(new Date(), 3).toISOString().split('T')[0]) // Show items due within 3 days (or overdue)
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

    if (reminders.length === 0 && isAllowed) return null;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-secondary-100 overflow-hidden mb-6 relative group">
            {!isAllowed && (
                <div
                    className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex flex-col items-center justify-center text-center p-4 cursor-pointer transition-colors hover:bg-white/70"
                    onClick={() => window.dispatchEvent(new CustomEvent('openUpgradeModal'))}
                >
                    <div className="bg-white p-3 rounded-full shadow-lg mb-3 transform group-hover:scale-110 transition-transform duration-200">
                        <Lock className="w-6 h-6 text-primary-600" />
                    </div>
                    <h3 className="text-base font-bold text-gray-900 mb-1">Fidelize seus Clientes</h3>
                    <p className="text-sm text-gray-600 max-w-sm mb-3">
                        Lembretes de retorno aumentam em 30% a recorrência.
                    </p>
                    <button className="btn btn-primary btn-sm shadow-md">
                        Desbloquear Lembretes
                    </button>
                </div>
            )}

            <div className="p-4 border-b border-secondary-100 bg-secondary-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Bell className="w-5 h-5 text-primary-600" />
                    <h3 className="font-semibold text-secondary-900">Lembretes de Retorno</h3>
                </div>
                <span className="bg-primary-100 text-primary-700 text-xs font-bold px-2 py-1 rounded-full">
                    {reminders.length}
                </span>
            </div>

            <div className={`divide-y divide-secondary-100 ${!isAllowed ? 'max-h-[320px] overflow-hidden' : ''}`}>
                {reminders.map((reminder) => (
                    <div key={reminder.id} className={`p-4 hover:bg-gray-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${!isAllowed ? 'select-none blur-[2px]' : ''}`}>
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
                                onClick={isAllowed ? () => handleSendWhatsApp(reminder) : undefined}
                                className="btn btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
                                title="Enviar WhatsApp"
                                disabled={!isAllowed}
                            >
                                <MessageCircle className="w-3.5 h-3.5 text-green-600" />
                                Enviar
                            </button>
                            <button
                                onClick={isAllowed ? () => handleDismiss(reminder.id) : undefined}
                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                title="Dispensar"
                                disabled={!isAllowed}
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
