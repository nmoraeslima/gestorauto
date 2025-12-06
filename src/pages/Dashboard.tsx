import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import {
    Users,
    ClipboardList,
    DollarSign,
    AlertTriangle,
    TrendingUp,
    Package,
    Loader2,
    Calendar,
    ArrowRight,
    Lock,
} from 'lucide-react';
import { DashboardStats } from '@/types/database';
import { Link } from 'react-router-dom';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';
import { formatCurrency } from '@/utils/calculations';
import { formatDate } from '@/utils/datetime';
import { ServiceReminders } from '@/components/dashboard/ServiceReminders';
import { QuickActions } from '@/components/dashboard/QuickActions';

export const Dashboard: React.FC = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [upcomingAppointments, setUpcomingAppointments] = useState<any[]>([]);
    const [revenueData, setRevenueData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
    }, [user]);

    const loadDashboardData = async () => {
        if (!user?.company) return;

        try {
            const companyId = user.company.id;

            // Buscar estatísticas
            const [customersRes, workOrdersRes, financialRes, productsRes, appointmentsRes] = await Promise.all([
                supabase
                    .from('customers')
                    .select('id', { count: 'exact', head: true })
                    .eq('company_id', companyId)
                    .is('deleted_at', null),

                supabase
                    .from('work_orders')
                    .select('id, status, total', { count: 'exact' })
                    .eq('company_id', companyId),

                supabase
                    .from('financial_transactions')
                    .select('amount, type, status, created_at')
                    .eq('company_id', companyId),

                supabase
                    .from('products')
                    .select('id, quantity, min_stock')
                    .eq('company_id', companyId)
                    .eq('is_active', true),

                supabase
                    .from('appointments')
                    .select(`
                        id,
                        title,
                        scheduled_at,
                        status,
                        customer:customers(name)
                    `)
                    .eq('company_id', companyId)
                    .gte('scheduled_at', new Date().toISOString())
                    .order('scheduled_at', { ascending: true })
                    .limit(5),
            ]);

            // Fetch 6 months of revenue data separately to avoid destructuring issues
            const { data: revenueRawData } = await supabase
                .from('financial_transactions')
                .select('amount, created_at')
                .eq('company_id', companyId)
                .eq('type', 'income')
                .eq('status', 'paid')
                .gte('created_at', new Date(new Date().setMonth(new Date().getMonth() - 6)).toISOString())
                .order('created_at', { ascending: true });

            // Calcular estatísticas
            const totalCustomers = customersRes.count || 0;
            const totalWorkOrders = workOrdersRes.count || 0;
            const workOrdersInProgress = workOrdersRes.data?.filter(
                (wo) => wo.status === 'in_progress'
            ).length || 0;

            // Receita mensal (últimos 30 dias)
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const monthlyRevenue = financialRes.data
                ?.filter(
                    (t) =>
                        t.type === 'income' &&
                        t.status === 'paid' &&
                        new Date(t.created_at) >= thirtyDaysAgo
                )
                .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

            // Pagamentos pendentes
            const pendingPayments = financialRes.data
                ?.filter((t) => t.type === 'income' && t.status === 'pending')
                .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

            // Produtos com estoque baixo
            const lowStockProducts = productsRes.data?.filter(
                (p) => Number(p.quantity) <= Number(p.min_stock)
            ).length || 0;

            setStats({
                total_customers: totalCustomers,
                total_work_orders: totalWorkOrders,
                work_orders_in_progress: workOrdersInProgress,
                monthly_revenue: monthlyRevenue,
                pending_payments: pendingPayments,
                low_stock_products: lowStockProducts,
            });

            if (appointmentsRes.data) {
                setUpcomingAppointments(appointmentsRes.data);
            }

            // Process Revenue Data for Chart
            const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
            const processedRevenue = (revenueRawData || []).reduce((acc: any[], curr) => {
                const date = new Date(curr.created_at);
                const monthYear = `${months[date.getMonth()]}/${date.getFullYear().toString().slice(2)}`;

                const existing = acc.find(item => item.name === monthYear);
                if (existing) {
                    existing.value += Number(curr.amount);
                } else {
                    acc.push({ name: monthYear, value: Number(curr.amount) });
                }
                return acc;
            }, []);

            // Ensure last 6 months are present even if 0
            const last6Months = [];
            for (let i = 5; i >= 0; i--) {
                const d = new Date();
                d.setMonth(d.getMonth() - i);
                const monthYear = `${months[d.getMonth()]}/${d.getFullYear().toString().slice(2)}`;
                const found = processedRevenue.find((item: any) => item.name === monthYear);
                last6Months.push(found || { name: monthYear, value: 0 });
            }

            setRevenueData(last6Months);

            if (appointmentsRes.data) {
                setUpcomingAppointments(appointmentsRes.data);
            }
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
            </div>
        );
    }

    const statCards = [
        {
            title: 'Total de Clientes',
            value: stats?.total_customers || 0,
            icon: Users,
            color: 'primary',
            bgColor: 'bg-primary-100',
            textColor: 'text-primary-600',
            restricted: false
        },
        {
            title: 'O.S. em Andamento',
            value: stats?.work_orders_in_progress || 0,
            icon: ClipboardList,
            color: 'warning',
            bgColor: 'bg-warning-100',
            textColor: 'text-warning-600',
            restricted: false
        },
        {
            title: 'Receita Mensal',
            value: formatCurrency(stats?.monthly_revenue || 0),
            icon: TrendingUp,
            color: 'success',
            bgColor: 'bg-success-100',
            textColor: 'text-success-600',
            restricted: user?.company?.subscription_plan === 'basic'
        },
        {
            title: 'A Receber',
            value: formatCurrency(stats?.pending_payments || 0),
            icon: DollarSign,
            color: 'warning',
            bgColor: 'bg-warning-100',
            textColor: 'text-warning-600',
            restricted: user?.company?.subscription_plan === 'basic'
        },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-secondary-900">
                    Dashboard
                </h1>
                <p className="text-base text-secondary-600 mt-1">
                    Aqui está um resumo do seu negócio hoje.
                </p>
            </div>

            <QuickActions />

            {/* Service Reminders (CRM) */}
            <ServiceReminders />

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <div
                            key={index}
                            className={`bg-white rounded-xl shadow-card p-6 border border-secondary-100 hover:shadow-soft transition-shadow duration-200 relative overflow-hidden ${stat.restricted ? 'cursor-pointer' : ''}`}
                            onClick={() => {
                                if (stat.restricted) {
                                    // Trigger global upgrade modal event or specific logic
                                    // ideally use a context or direct prop, but for now we can just use window dispatch or local state if component had it
                                    // Creating a Custom Event to trigger the modal from Layout
                                    window.dispatchEvent(new CustomEvent('openUpgradeModal'));
                                }
                            }}
                        >
                            {stat.restricted && (
                                <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex flex-col items-center justify-center text-center p-2 text-primary-600 font-semibold group">
                                    <Lock className="w-8 h-8 mb-2 text-primary-500 group-hover:scale-110 transition-transform" />
                                    <span className="text-sm">Recurso Premium</span>
                                </div>
                            )}
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-secondary-600">
                                        {stat.title}
                                    </p>
                                    <p className="text-2xl font-bold text-secondary-900 mt-2">
                                        {stat.value}
                                    </p>
                                </div>
                                <div className={`${stat.bgColor} p-3 rounded-lg`}>
                                    <Icon className={`w-6 h-6 ${stat.textColor}`} />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Alertas */}
            {stats && stats.low_stock_products > 0 && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <h3 className="text-sm font-semibold text-red-800">
                                🚨 Alerta de Estoque Baixo
                            </h3>
                            <p className="text-sm text-red-700 mt-1">
                                Você tem {stats.low_stock_products} produto(s) com estoque abaixo
                                do mínimo. Verifique o estoque para evitar falta de produtos.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Informação do Trial */}
            {user?.company?.subscription_status === 'trial' && user.company.trial_ends_at && (
                <div className="bg-primary-50 border-l-4 border-primary-500 p-4 rounded-lg">
                    <div className="flex items-start gap-3">
                        <Package className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <h3 className="text-sm font-semibold text-primary-800">
                                Período de Trial
                            </h3>
                            <p className="text-sm text-primary-700 mt-1">
                                Seu trial expira em{' '}
                                {new Date(user.company.trial_ends_at).toLocaleDateString('pt-BR')}.
                                Aproveite para explorar todas as funcionalidades!
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Revenue Chart */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-card p-6 border border-secondary-100 relative overflow-hidden group">
                    {user?.company?.subscription_plan === 'basic' && (
                        <div
                            className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex flex-col items-center justify-center text-center p-4 cursor-pointer"
                            onClick={() => window.dispatchEvent(new CustomEvent('openUpgradeModal'))}
                        >
                            <div className="bg-white p-4 rounded-full shadow-lg mb-4 transform group-hover:scale-110 transition-transform duration-200">
                                <Lock className="w-8 h-8 text-primary-600" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-1">Análise Financeira Avançada</h3>
                            <p className="text-gray-600 max-w-sm mb-4">
                                Desbloqueie gráficos detalhados de receita e tome decisões melhores com o Plano Profissional.
                            </p>
                            <button className="btn btn-primary shadow-lg animate-pulse">
                                Quero desbloquear agora
                            </button>
                        </div>
                    )}
                    <h2 className="text-xl font-semibold text-secondary-900 mb-6">
                        Receita (Últimos 6 Meses)
                    </h2>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: 25, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748b', fontSize: 12 }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748b', fontSize: 12 }}
                                    tickFormatter={(value) => formatCurrency(value)}
                                />
                                <Tooltip
                                    formatter={(value: number) => [formatCurrency(value), 'Receita']}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="value"
                                    stroke="#0ea5e9"
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill="url(#colorRevenue)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Upcoming Appointments */}
                <div className="bg-white rounded-xl shadow-card p-6 border border-secondary-100">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-semibold text-secondary-900">
                            Próximos Agendamentos
                        </h2>
                        <Link to="/appointments" className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
                            Ver todos <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>

                    <div className="space-y-4">
                        {upcomingAppointments.length === 0 ? (
                            <p className="text-neutral-500 text-center py-8">Nenhum agendamento próximo.</p>
                        ) : (
                            upcomingAppointments.map((apt) => (
                                <div key={apt.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-neutral-50 transition-colors border border-transparent hover:border-neutral-100">
                                    <div className="bg-primary-50 p-2 rounded-lg text-primary-600 shrink-0">
                                        <Calendar className="w-5 h-5" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="font-medium text-secondary-900 truncate">
                                            {apt.customer?.name}
                                        </p>
                                        <p className="text-sm text-secondary-600 truncate">
                                            {apt.title}
                                        </p>
                                        <p className="text-xs text-neutral-500 mt-1">
                                            {formatDate(apt.scheduled_at)}
                                        </p>
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
