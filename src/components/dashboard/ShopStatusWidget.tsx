import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Gauge, Zap, Coffee } from 'lucide-react';

export const ShopStatusWidget: React.FC = () => {
    const { user } = useAuth();
    const [status, setStatus] = useState<'quiet' | 'moderate' | 'busy'>('quiet');
    const [count, setCount] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadTodayAppointments();
    }, [user]);

    const loadTodayAppointments = async () => {
        if (!user?.company?.id) return;

        const today = new Date();
        const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
        const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();

        const { count, error } = await supabase
            .from('appointments')
            .select('*', { count: 'exact', head: true })
            .eq('company_id', user.company.id)
            .gte('scheduled_at', startOfDay)
            .lte('scheduled_at', endOfDay)
            .neq('status', 'cancelled');

        if (!error && count !== null) {
            setCount(count);
            if (count <= 2) setStatus('quiet');
            else if (count <= 5) setStatus('moderate');
            else setStatus('busy');
        }
        setLoading(false);
    };

    if (loading) return null;

    const config = {
        quiet: {
            icon: Coffee,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50',
            border: 'border-emerald-200',
            title: 'Dia Tranquilo',
            message: 'Ótimo momento para organizar o estoque e contatar clientes antigos.'
        },
        moderate: {
            icon: Gauge,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
            border: 'border-blue-200',
            title: 'Movimento Moderado',
            message: 'Fluxo constante. Mantenha o ritmo e a qualidade!'
        },
        busy: {
            icon: Zap,
            color: 'text-amber-600',
            bg: 'bg-amber-50',
            border: 'border-amber-200',
            title: 'A Todo Vapor!',
            message: 'Oficina cheia! Foco total nos prazos e na experiência do cliente.'
        }
    };

    const current = config[status];
    const Icon = current.icon;

    return (
        <div className={`rounded-xl border ${current.border} ${current.bg} p-4 mb-6 animate-in fade-in slide-in-from-top-4 duration-500`}>
            <div className="flex items-start gap-4">
                <div className={`p-3 rounded-lg bg-white/60 ${current.color}`}>
                    <Icon className="w-6 h-6" />
                </div>
                <div>
                    <h3 className={`font-bold text-lg ${current.color} flex items-center gap-2`}>
                        {current.title}
                        <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-white/60 text-secondary-600 border border-secondary-100">
                            {count} agendamentos hoje
                        </span>
                    </h3>
                    <p className="text-sm text-secondary-700 mt-1">
                        {current.message}
                    </p>
                </div>
            </div>
        </div>
    );
};
