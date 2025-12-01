import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Clock, AlertCircle, Calendar, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface Appointment {
    id: string;
    title: string;
    scheduled_at: string;
    status: string;
    customer: {
        name: string;
        phone: string;
    };
    vehicle: {
        brand: string;
        model: string;
        license_plate: string;
    };
    services: {
        service: {
            name: string;
        };
    }[];
}

export const TVDashboard: React.FC = () => {
    const { user } = useAuth();
    const [pendingAppointments, setPendingAppointments] = useState<Appointment[]>([]);
    const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
    const [currentTime, setCurrentTime] = useState(new Date());
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        // Clock timer
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (!user?.company?.id) return;

        loadAppointments();
        setupRealtimeSubscription();

        // Initialize audio
        audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'); // Simple notification bell

        return () => {
            supabase.removeAllChannels();
        };
    }, [user]);

    const loadAppointments = async () => {
        if (!user?.company?.id) return;

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Fetch Pending
        const { data: pending } = await supabase
            .from('appointments')
            .select(`
                *,
                customer:customers(name, phone),
                vehicle:vehicles(brand, model, license_plate),
                services:appointment_services(service:services(name))
            `)
            .eq('company_id', user.company.id)
            .eq('status', 'pending')
            .order('created_at', { ascending: true });

        if (pending) setPendingAppointments(pending);

        // Fetch Today's Schedule
        const { data: scheduled } = await supabase
            .from('appointments')
            .select(`
                *,
                customer:customers(name, phone),
                vehicle:vehicles(brand, model, license_plate),
                services:appointment_services(service:services(name))
            `)
            .eq('company_id', user.company.id)
            .in('status', ['scheduled', 'confirmed', 'in_progress', 'completed'])
            .gte('scheduled_at', today.toISOString())
            .lt('scheduled_at', tomorrow.toISOString())
            .order('scheduled_at', { ascending: true });

        if (scheduled) setTodayAppointments(scheduled);
    };

    const setupRealtimeSubscription = () => {
        if (!user?.company?.id) return;

        supabase
            .channel('tv-dashboard')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'appointments',
                    filter: `company_id=eq.${user.company.id}`,
                },
                (payload) => {
                    console.log('Realtime update:', payload);

                    // Play sound on new pending appointment
                    if (payload.eventType === 'INSERT' && payload.new.status === 'pending') {
                        playAlert();
                        toast('Novo agendamento pendente!', { icon: '🔔' });
                    }

                    // Reload data on any change
                    loadAppointments();
                }
            )
            .subscribe();
    };

    const playAlert = () => {
        if (audioRef.current) {
            audioRef.current.play().catch(e => console.log('Audio play failed:', e));
        }
    };

    const handleApprove = async (id: string) => {
        try {
            const { error } = await supabase
                .from('appointments')
                .update({ status: 'scheduled' })
                .eq('id', id);

            if (error) throw error;
            toast.success('Agendamento aprovado!');
            loadAppointments();
        } catch (error) {
            console.error('Error approving:', error);
            toast.error('Erro ao aprovar');
        }
    };

    const handleReject = async (id: string) => {
        if (!confirm('Tem certeza que deseja rejeitar este agendamento?')) return;

        try {
            const { error } = await supabase
                .from('appointments')
                .update({ status: 'cancelled' })
                .eq('id', id);

            if (error) throw error;
            toast.success('Agendamento rejeitado');
            loadAppointments();
        } catch (error) {
            console.error('Error rejecting:', error);
            toast.error('Erro ao rejeitar');
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 text-white p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-8 border-b border-slate-700 pb-6">
                <div>
                    <h1 className="text-3xl font-bold text-blue-400">Painel de Monitoramento</h1>
                    <p className="text-slate-400 mt-1">Gestão em Tempo Real</p>
                </div>
                <div className="text-right">
                    <div className="text-4xl font-mono font-bold text-white">
                        {format(currentTime, 'HH:mm:ss')}
                    </div>
                    <div className="text-slate-400 text-lg capitalize">
                        {format(currentTime, "EEEE, d 'de' MMMM", { locale: ptBR })}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-180px)]">
                {/* Pending Column */}
                <div className="lg:col-span-1 bg-slate-800/50 rounded-2xl p-6 border border-slate-700 overflow-y-auto">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="bg-yellow-500/20 p-3 rounded-xl">
                            <AlertCircle className="w-8 h-8 text-yellow-500 animate-pulse" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white">Aguardando Aprovação</h2>
                            <p className="text-slate-400">{pendingAppointments.length} solicitações</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {pendingAppointments.length === 0 ? (
                            <div className="text-center py-12 text-slate-500">
                                <CheckCircle className="w-16 h-16 mx-auto mb-4 opacity-20" />
                                <p>Nenhuma solicitação pendente</p>
                            </div>
                        ) : (
                            pendingAppointments.map((apt) => (
                                <div key={apt.id} className="bg-slate-800 rounded-xl p-5 border-l-4 border-yellow-500 shadow-lg animate-fade-in">
                                    <div className="flex justify-between items-start mb-3">
                                        <h3 className="text-xl font-bold text-white">{apt.customer?.name}</h3>
                                        <span className="bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded text-sm font-bold">
                                            PENDENTE
                                        </span>
                                    </div>

                                    <div className="space-y-2 mb-4 text-slate-300">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-slate-500" />
                                            <span>
                                                {format(new Date(apt.scheduled_at), "dd/MM 'às' HH:mm")}
                                            </span>
                                        </div>
                                        <div className="text-sm">
                                            {apt.vehicle?.brand} {apt.vehicle?.model} • {apt.vehicle?.license_plate}
                                        </div>
                                        <div className="text-sm font-medium text-blue-300">
                                            {apt.services?.[0]?.service?.name}
                                            {apt.services?.length > 1 && ` + ${apt.services.length - 1} serviços`}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={() => handleReject(apt.id)}
                                            className="bg-red-500/10 hover:bg-red-500/20 text-red-400 py-3 rounded-lg font-bold transition-colors flex items-center justify-center gap-2"
                                        >
                                            <XCircle className="w-5 h-5" />
                                            Rejeitar
                                        </button>
                                        <button
                                            onClick={() => handleApprove(apt.id)}
                                            className="bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-bold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-green-500/20"
                                        >
                                            <CheckCircle className="w-5 h-5" />
                                            Aprovar
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Today's Schedule Column */}
                <div className="lg:col-span-2 bg-slate-800/30 rounded-2xl p-6 border border-slate-700 overflow-y-auto">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="bg-blue-500/20 p-3 rounded-xl">
                            <Clock className="w-8 h-8 text-blue-500" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white">Agenda de Hoje</h2>
                            <p className="text-slate-400">{todayAppointments.length} agendamentos</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {todayAppointments.length === 0 ? (
                            <div className="col-span-full text-center py-12 text-slate-500">
                                <p>Nenhum agendamento para hoje</p>
                            </div>
                        ) : (
                            todayAppointments.map((apt) => (
                                <div key={apt.id} className="bg-slate-800 rounded-xl p-4 border border-slate-700 hover:border-blue-500/50 transition-colors">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-2xl font-bold text-blue-400">
                                            {format(new Date(apt.scheduled_at), 'HH:mm')}
                                        </span>
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${apt.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                                                apt.status === 'in_progress' ? 'bg-blue-500/20 text-blue-400' :
                                                    'bg-slate-700 text-slate-300'
                                            }`}>
                                            {apt.status === 'in_progress' ? 'EM ANDAMENTO' :
                                                apt.status === 'completed' ? 'CONCLUÍDO' : 'AGENDADO'}
                                        </span>
                                    </div>

                                    <h3 className="text-lg font-bold text-white mb-1">{apt.customer?.name}</h3>
                                    <p className="text-slate-400 text-sm mb-3">
                                        {apt.vehicle?.brand} {apt.vehicle?.model}
                                    </p>

                                    <div className="flex items-center gap-2 text-sm text-blue-300 bg-blue-500/5 p-2 rounded">
                                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                        {apt.services?.[0]?.service?.name}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
