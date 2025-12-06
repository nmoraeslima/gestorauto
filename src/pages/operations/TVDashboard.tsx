import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Clock, AlertCircle, Calendar, CheckCircle, XCircle, Loader2 } from 'lucide-react';
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
    const { user, session, loading, dataLoading } = useAuth();
    const [pendingAppointments, setPendingAppointments] = useState<Appointment[]>([]);
    const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [error, setError] = useState<string | null>(null);
    const [isAudioEnabled, setIsAudioEnabled] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const channelRef = useRef<any>(null);
    const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const previousAppointmentIdsRef = useRef<Set<string>>(new Set());

    useEffect(() => {
        // Clock timer
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (!user?.company?.id) return;

        loadAppointments();
        setupRealtimeSubscription();
        setupPollingFallback();

        // Initialize audio
        audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');

        return () => {
            // Properly cleanup channel
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
            }
            // Cleanup polling
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
            }
        };
    }, [user?.company?.id]);

    // Show loading while checking auth or loading user data
    if (loading || dataLoading) {
        return (
            <div className="min-h-screen bg-secondary-900 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-primary-300 animate-spin mx-auto mb-4" />
                    <p className="text-secondary-400">Carregando painel...</p>
                </div>
            </div>
        );
    }

    // Show error state
    if (error) {
        return (
            <div className="min-h-screen bg-secondary-900 flex items-center justify-center">
                <div className="text-center">
                    <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                    <p className="text-red-400 mb-4">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
                    >
                        Recarregar
                    </button>
                </div>
            </div>
        );
    }

    // Require authentication
    if (!user) {
        return (
            <div className="min-h-screen bg-secondary-900 flex items-center justify-center">
                <div className="text-center">
                    <AlertCircle className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
                    <p className="text-secondary-400 mb-4">Você precisa estar logado para acessar o painel</p>
                    <a
                        href="/signin"
                        className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 inline-block"
                    >
                        Fazer Login
                    </a>
                </div>
            </div>
        );
    }

    const loadAppointments = async (checkForNew = false) => {
        if (!user?.company?.id) return;

        console.log(`📊 loadAppointments called - checkForNew: ${checkForNew}, isAudioEnabled: ${isAudioEnabled}`);

        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            // Fetch Pending
            const { data: pending, error: pendingError } = await supabase
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

            if (pendingError) throw pendingError;

            // Fetch Today's Schedule
            const { data: scheduled, error: scheduledError } = await supabase
                .from('appointments')
                .select(`
                    *,
                    customer:customers(name, phone),
                    vehicle:vehicles(brand, model, license_plate),
                    services:appointment_services(service:services(name))
                `)
                .eq('company_id', user.company.id)
                .in('status', ['pending', 'confirmed', 'in_progress', 'completed'])
                .gte('scheduled_at', today.toISOString())
                .lt('scheduled_at', tomorrow.toISOString())
                .order('scheduled_at', { ascending: true });

            if (scheduledError) throw scheduledError;

            console.log(`📋 Fetched: ${pending?.length || 0} pending, ${scheduled?.length || 0} scheduled`);

            // Detect new appointments and play sound
            if (checkForNew && isAudioEnabled) {
                const allCurrentIds = new Set([
                    ...(pending || []).map(a => a.id),
                    ...(scheduled || []).map(a => a.id)
                ]);

                console.log(`🔍 Current IDs: ${allCurrentIds.size}, Previous IDs: ${previousAppointmentIdsRef.current.size}`);

                const newAppointments = Array.from(allCurrentIds).filter(
                    id => !previousAppointmentIdsRef.current.has(id)
                );

                console.log(`🆕 New appointments detected: ${newAppointments.length}`, newAppointments);

                if (newAppointments.length > 0) {
                    console.log('🔔 Playing alert sound...');
                    playAlert();
                    toast('Novo agendamento!', { icon: '🔔' });
                }

                previousAppointmentIdsRef.current = allCurrentIds;
            } else if (!checkForNew) {
                // Initial load - just populate the ref
                const initialIds = new Set([
                    ...(pending || []).map(a => a.id),
                    ...(scheduled || []).map(a => a.id)
                ]);
                previousAppointmentIdsRef.current = initialIds;
                console.log(`📝 Initial load - stored ${initialIds.size} appointment IDs`);
            } else {
                console.log(`⚠️ Skipping new appointment check - checkForNew: ${checkForNew}, isAudioEnabled: ${isAudioEnabled}`);
            }

            if (pending) setPendingAppointments(pending);
            if (scheduled) setTodayAppointments(scheduled);
        } catch (err: any) {
            console.error('Error loading appointments:', err);
            setError('Erro ao carregar agendamentos: ' + err.message);
        }
    };

    const setupRealtimeSubscription = () => {
        if (!user?.company?.id) return;

        try {
            const channel = supabase
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

                        // Reload data on any change and check for new appointments
                        loadAppointments(true);
                    }
                )
                .subscribe((status) => {
                    console.log('Subscription status:', status);
                    if (status === 'SUBSCRIBED') {
                        console.log('✅ Realtime connected');
                    } else if (status === 'CHANNEL_ERROR') {
                        console.error('❌ Realtime connection error');
                    }
                });

            channelRef.current = channel;
        } catch (err: any) {
            console.error('Error setting up realtime:', err);
            setError('Erro ao configurar atualização em tempo real');
        }
    };

    const setupPollingFallback = () => {
        // Poll every 45 seconds as a fallback
        pollingIntervalRef.current = setInterval(() => {
            console.log('🔄 Polling fallback triggered');
            loadAppointments(true);
        }, 45000);
    };

    const playAlert = () => {
        console.log(`🔊 playAlert called - isAudioEnabled: ${isAudioEnabled}`);

        if (!isAudioEnabled) {
            console.log('⚠️ Audio not enabled yet');
            return;
        }

        if (audioRef.current) {
            // Reset and ensure volume is correct
            audioRef.current.currentTime = 0;
            audioRef.current.volume = 1;

            console.log('🎵 Attempting to play audio...');
            audioRef.current.play()
                .then(() => {
                    console.log('✅ Alert sound played successfully');
                })
                .catch((e) => {
                    console.error('❌ Audio play failed:', e);
                    // Fallback: show visual notification
                    toast.error('🔔 Novo agendamento!', {
                        duration: 5000,
                    });
                });
        } else {
            console.error('❌ Audio ref is null');
        }
    };

    const enableAudio = () => {
        // Play a silent sound to enable audio context
        if (audioRef.current) {
            audioRef.current.volume = 0.01;
            audioRef.current.play()
                .then(() => {
                    audioRef.current!.volume = 1;
                    setIsAudioEnabled(true);
                    toast.success('🔊 Monitoramento ativado!');
                })
                .catch((e) => {
                    console.error('Failed to enable audio:', e);
                    toast.error('Erro ao ativar áudio');
                });
        }
    };

    const handleApprove = async (id: string) => {
        try {
            const { error } = await supabase
                .from('appointments')
                .update({ status: 'confirmed' })
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
        <div className="min-h-screen bg-secondary-900 text-white p-6">
            {/* Audio Enablement Overlay */}
            {!isAudioEnabled && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
                    <div className="bg-secondary-800 rounded-2xl p-8 border border-primary-500/30 shadow-2xl max-w-md text-center">
                        <div className="bg-primary-500/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <AlertCircle className="w-10 h-10 text-primary-400 animate-pulse" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-3">Ativar Monitoramento</h2>
                        <p className="text-secondary-300 mb-6">
                            Clique no botão abaixo para ativar as notificações sonoras quando novos agendamentos chegarem.
                        </p>
                        <button
                            onClick={enableAudio}
                            className="w-full bg-primary-500 hover:bg-primary-600 text-white font-bold py-4 px-6 rounded-xl transition-all transform hover:scale-105 shadow-lg shadow-primary-500/30 flex items-center justify-center gap-3"
                        >
                            <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                            Iniciar Monitoramento
                        </button>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex justify-between items-center mb-8 border-b border-secondary-700 pb-6">
                <div>
                    <h1 className="text-3xl font-bold text-primary-300">Painel de Monitoramento</h1>
                    <p className="text-secondary-400 mt-1">Gestão em Tempo Real</p>
                </div>
                <div className="text-right">
                    <div className="text-4xl font-mono font-bold text-white">
                        {format(currentTime, 'HH:mm:ss')}
                    </div>
                    <div className="text-secondary-400 text-lg capitalize">
                        {format(currentTime, "EEEE, d 'de' MMMM", { locale: ptBR })}
                    </div>
                </div>
            </div>

            <div className={`grid gap-8 h-[calc(100vh-180px)] ${pendingAppointments.length > 0 ? 'grid-cols-1 lg:grid-cols-4' : 'grid-cols-1'
                }`}>
                {/* Pending Column - Only show if there are pending appointments */}
                {pendingAppointments.length > 0 && (
                    <div className="lg:col-span-1 bg-secondary-800/50 rounded-2xl p-4 border border-secondary-700 overflow-y-auto">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="bg-warning-500/20 p-2 rounded-lg">
                                <AlertCircle className="w-6 h-6 text-warning-500 animate-pulse" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-white">Pendentes</h2>
                                <p className="text-xs text-secondary-400">{pendingAppointments.length} solicitações</p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {pendingAppointments.map((apt) => (
                                <div key={apt.id} className="bg-secondary-800 rounded-lg p-3 border-l-4 border-warning-500 shadow-lg animate-fade-in">
                                    <div className="mb-2">
                                        <h3 className="text-sm font-bold text-white truncate">{apt.customer?.name}</h3>
                                        <span className="bg-warning-500/20 text-warning-400 px-2 py-0.5 rounded text-xs font-bold">
                                            PENDENTE
                                        </span>
                                    </div>

                                    <div className="space-y-1 mb-3 text-secondary-300 text-xs">
                                        <div className="flex items-center gap-1">
                                            <Calendar className="w-3 h-3 text-secondary-500" />
                                            <span>
                                                {format(new Date(apt.scheduled_at), "dd/MM 'às' HH:mm")}
                                            </span>
                                        </div>
                                        <div className="truncate">
                                            {apt.vehicle?.brand} {apt.vehicle?.model}
                                        </div>
                                        <div className="font-medium text-primary-300 text-xs">
                                            {apt.services?.map(s => s.service?.name).filter(Boolean).join(', ') || 'Sem serviços'}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            onClick={() => handleReject(apt.id)}
                                            className="bg-danger-500/10 hover:bg-danger-500/20 text-danger-400 py-2 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1"
                                        >
                                            <XCircle className="w-4 h-4" />
                                            Rejeitar
                                        </button>
                                        <button
                                            onClick={() => handleApprove(apt.id)}
                                            className="bg-success-500 hover:bg-success-600 text-white py-2 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1 shadow-lg shadow-success-500/20"
                                        >
                                            <CheckCircle className="w-4 h-4" />
                                            Aprovar
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Today's Schedule Column - Takes full width when no pending, 75% when there are pending */}
                <div className={pendingAppointments.length > 0 ? 'lg:col-span-3' : 'col-span-1'}>
                    <div className="bg-secondary-800/30 rounded-2xl p-6 border border-secondary-700 h-full overflow-y-auto">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="bg-primary-500/20 p-3 rounded-xl">
                                <Clock className="w-8 h-8 text-primary-500" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white">Agenda de Hoje</h2>
                                <p className="text-secondary-400">{todayAppointments.length} agendamentos</p>
                            </div>
                        </div>

                        <div className={`grid gap-4 ${pendingAppointments.length > 0
                            ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'
                            : 'grid-cols-1 md:grid-cols-3 xl:grid-cols-4'
                            }`}>
                            {todayAppointments.length === 0 ? (
                                <div className="col-span-full text-center py-12 text-secondary-500">
                                    <p>Nenhum agendamento para hoje</p>
                                </div>
                            ) : (
                                todayAppointments.map((apt) => (
                                    <div key={apt.id} className="bg-secondary-800 rounded-xl p-4 border border-secondary-700 hover:border-primary-500/50 transition-colors">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-2xl font-bold text-primary-400">
                                                {format(new Date(apt.scheduled_at), 'HH:mm')}
                                            </span>
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${apt.status === 'completed' ? 'bg-success-500/20 text-success-400' :
                                                apt.status === 'in_progress' ? 'bg-primary-500/20 text-primary-400' :
                                                    'bg-secondary-700 text-secondary-300'
                                                }`}>
                                                {apt.status === 'in_progress' ? 'EM ANDAMENTO' :
                                                    apt.status === 'completed' ? 'CONCLUÍDO' : 'AGENDADO'}
                                            </span>
                                        </div>

                                        <h3 className="text-lg font-bold text-white mb-1">{apt.customer?.name}</h3>
                                        <p className="text-secondary-400 text-sm mb-3">
                                            {apt.vehicle?.brand} {apt.vehicle?.model}
                                        </p>

                                        <div className="flex items-center gap-2 text-sm text-primary-300 bg-primary-500/5 p-2 rounded">
                                            <div className="w-2 h-2 rounded-full bg-primary-500"></div>
                                            <span className="flex-1">
                                                {apt.services?.map(s => s.service?.name).filter(Boolean).join(', ') || 'Sem serviços'}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
