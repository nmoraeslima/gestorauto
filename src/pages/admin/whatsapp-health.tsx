import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface WhatsAppStats {
    queueSize: number;
    dailyCount: number;
    dailyLimit: number;
    remaining: number;
    lastMessageTime: string | null;
    isBusinessHours: boolean;
    isProcessing: boolean;
}

interface DailyStats {
    date: string;
    total_messages: number;
    sent_messages: number;
    failed_messages: number;
    success_rate: number;
}

export default function WhatsAppHealthMonitor() {
    const { user } = useAuth();
    const [stats, setStats] = useState<WhatsAppStats | null>(null);
    const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
    const [alerts, setAlerts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
        const interval = setInterval(loadData, 30000); // Atualizar a cada 30s
        return () => clearInterval(interval);
    }, []);

    async function loadData() {
        try {
            // Carregar estatísticas em tempo real (via API)
            const response = await fetch('/api/whatsapp/stats');
            const statsData = await response.json();
            setStats(statsData);

            // Carregar estatísticas diárias
            const { data: daily } = await supabase
                .from('whatsapp_daily_stats')
                .select('*')
                .eq('company_id', user?.company?.id)
                .order('date', { ascending: false })
                .limit(7);

            setDailyStats(daily || []);

            // Carregar alertas não resolvidos
            const { data: alertsData } = await supabase
                .from('system_alerts')
                .select('*')
                .eq('resolved', false)
                .order('created_at', { ascending: false })
                .limit(10);

            setAlerts(alertsData || []);

            setLoading(false);
        } catch (error) {
            console.error('Error loading WhatsApp health data:', error);
        }
    }

    function calculateRiskScore(): number {
        if (!stats) return 0;

        let score = 0;

        // Fator 1: Volume de mensagens (0-40 pontos)
        const volumeRatio = stats.dailyCount / stats.dailyLimit;
        if (volumeRatio > 0.9) score += 40;
        else if (volumeRatio > 0.7) score += 25;
        else if (volumeRatio > 0.5) score += 15;

        // Fator 2: Tamanho da fila (0-30 pontos)
        if (stats.queueSize > 30) score += 30;
        else if (stats.queueSize > 20) score += 20;
        else if (stats.queueSize > 10) score += 10;

        // Fator 3: Alertas críticos (0-30 pontos)
        const criticalAlerts = alerts.filter(a => a.severity === 'critical').length;
        if (criticalAlerts > 0) score += 30;
        else if (alerts.length > 5) score += 15;

        return Math.min(score, 100);
    }

    function getHealthStatus(): { status: string; color: string; message: string } {
        const riskScore = calculateRiskScore();

        if (riskScore < 30) {
            return {
                status: 'SAUDÁVEL',
                color: 'green',
                message: 'Sistema operando normalmente',
            };
        } else if (riskScore < 60) {
            return {
                status: 'ATENÇÃO',
                color: 'yellow',
                message: 'Monitorar de perto',
            };
        } else {
            return {
                status: 'CRÍTICO',
                color: 'red',
                message: 'Ação imediata necessária',
            };
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-gray-500">Carregando...</div>
            </div>
        );
    }

    const health = getHealthStatus();
    const riskScore = calculateRiskScore();

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Monitor de Saúde WhatsApp</h1>
                <button
                    onClick={loadData}
                    className="btn-secondary text-sm"
                >
                    🔄 Atualizar
                </button>
            </div>

            {/* Status Geral */}
            <div className={`p-6 rounded-lg border-2 ${health.color === 'green' ? 'bg-green-50 border-green-500' :
                    health.color === 'yellow' ? 'bg-yellow-50 border-yellow-500' :
                        'bg-red-50 border-red-500'
                }`}>
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold">{health.status}</h2>
                        <p className="text-gray-700 mt-1">{health.message}</p>
                    </div>
                    <div className="text-right">
                        <div className="text-4xl font-bold">{riskScore}</div>
                        <div className="text-sm text-gray-600">Score de Risco</div>
                    </div>
                </div>
            </div>

            {/* Métricas em Tempo Real */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <MetricCard
                        title="Mensagens Hoje"
                        value={`${stats.dailyCount}/${stats.dailyLimit}`}
                        subtitle={`${stats.remaining} restantes`}
                        percentage={(stats.dailyCount / stats.dailyLimit) * 100}
                    />
                    <MetricCard
                        title="Fila"
                        value={stats.queueSize}
                        subtitle={stats.isProcessing ? 'Processando...' : 'Aguardando'}
                        color={stats.queueSize > 20 ? 'red' : stats.queueSize > 10 ? 'yellow' : 'green'}
                    />
                    <MetricCard
                        title="Horário"
                        value={stats.isBusinessHours ? 'Comercial' : 'Fora'}
                        subtitle={stats.isBusinessHours ? '8h - 20h' : 'Pausado'}
                        color={stats.isBusinessHours ? 'green' : 'gray'}
                    />
                    <MetricCard
                        title="Última Mensagem"
                        value={stats.lastMessageTime ? new Date(stats.lastMessageTime).toLocaleTimeString('pt-BR') : 'Nunca'}
                        subtitle={stats.lastMessageTime ? new Date(stats.lastMessageTime).toLocaleDateString('pt-BR') : ''}
                    />
                </div>
            )}

            {/* Alertas */}
            {alerts.length > 0 && (
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold mb-4">⚠️ Alertas Ativos</h3>
                    <div className="space-y-2">
                        {alerts.map((alert) => (
                            <div
                                key={alert.id}
                                className={`p-3 rounded border-l-4 ${alert.severity === 'critical' ? 'bg-red-50 border-red-500' :
                                        alert.severity === 'error' ? 'bg-orange-50 border-orange-500' :
                                            alert.severity === 'warning' ? 'bg-yellow-50 border-yellow-500' :
                                                'bg-blue-50 border-blue-500'
                                    }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="font-medium">{alert.type}</div>
                                        <div className="text-sm text-gray-600">{alert.message}</div>
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {new Date(alert.created_at).toLocaleString('pt-BR')}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Estatísticas dos Últimos 7 Dias */}
            <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">📊 Últimos 7 Dias</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Enviadas</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Falhas</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Taxa Sucesso</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {dailyStats.map((day) => (
                                <tr key={day.date}>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                                        {new Date(day.date).toLocaleDateString('pt-BR')}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm">{day.total_messages}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-green-600">{day.sent_messages}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-red-600">{day.failed_messages}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                                        <span className={`font-medium ${day.success_rate >= 90 ? 'text-green-600' :
                                                day.success_rate >= 70 ? 'text-yellow-600' :
                                                    'text-red-600'
                                            }`}>
                                            {day.success_rate}%
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function MetricCard({ title, value, subtitle, percentage, color = 'blue' }: any) {
    return (
        <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600 mb-1">{title}</div>
            <div className="text-2xl font-bold text-gray-900">{value}</div>
            {subtitle && <div className="text-xs text-gray-500 mt-1">{subtitle}</div>}
            {percentage !== undefined && (
                <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                            className={`h-2 rounded-full ${percentage > 80 ? 'bg-red-500' :
                                    percentage > 50 ? 'bg-yellow-500' :
                                        'bg-green-500'
                                }`}
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
