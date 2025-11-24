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
} from 'lucide-react';
import { DashboardStats } from '@/types/database';

export const Dashboard: React.FC = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [upcomingAppointments, setUpcomingAppointments] = useState<any[]>([]);
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
        },
        {
            title: 'O.S. em Andamento',
            value: stats?.work_orders_in_progress || 0,
            icon: ClipboardList,
            color: 'warning',
            bgColor: 'bg-warning-100',
            textColor: 'text-warning-600',
        },
        {
            title: 'Receita Mensal',
            value: `R$ ${(stats?.monthly_revenue || 0).toFixed(2)}`,
            icon: TrendingUp,
            color: 'success',
            bgColor: 'bg-success-100',
            textColor: 'text-success-600',
        },
        {
            title: 'Pagamentos Pendentes',
            value: `R$ ${(stats?.pending_payments || 0).toFixed(2)}`,
            icon: DollarSign,
            color: 'danger',
            bgColor: 'bg-danger-100',
            textColor: 'text-danger-600',
        },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-secondary-900">
                    Olá, {user?.profile?.full_name}!
                </h1>
                <p className="text-base text-secondary-600 mt-1">
                    Aqui está um resumo do seu negócio hoje.
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <div
                            key={index}
                            className="bg-white rounded-xl shadow-card p-6 border border-secondary-100 hover:shadow-soft transition-shadow duration-200"
                        >
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
                <div className="bg-warning-50 border-l-4 border-warning-500 p-4 rounded-lg">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-warning-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <h3 className="text-sm font-semibold text-warning-800">
                                Alerta de Estoque Baixo
                            </h3>
                            <p className="text-sm text-warning-700 mt-1">
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

            {/* Ações Rápidas */}
            <div className="bg-white rounded-xl shadow-card p-6 border border-secondary-100">
                <h2 className="text-xl font-semibold text-secondary-900 mb-4">
                    Ações Rápidas
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button className="btn btn-primary text-left p-4 flex flex-col items-start gap-2">
                        <ClipboardList className="w-6 h-6" />
                        <span className="font-semibold">Nova O.S.</span>
                        <span className="text-sm opacity-90">Criar ordem de serviço</span>
                    </button>
                    <button className="btn btn-secondary text-left p-4 flex flex-col items-start gap-2">
                        <Users className="w-6 h-6" />
                        <span className="font-semibold">Novo Cliente</span>
                        <span className="text-sm opacity-90">Cadastrar cliente</span>
                    </button>
                    <button className="btn btn-secondary text-left p-4 flex flex-col items-start gap-2">
                        <Package className="w-6 h-6" />
                        <span className="font-semibold">Novo Produto</span>
                        <span className="text-sm opacity-90">Adicionar ao estoque</span>
                    </button>
                </div>
            </div>
        </div>
    );
};
