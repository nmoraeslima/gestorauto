import React, { useEffect, useState } from 'react';
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    Calendar,
    AlertCircle,
    CreditCard,
    Wallet
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { FinancialTransaction, TransactionType, TransactionStatus } from '@/types/database';
import toast from 'react-hot-toast';
import { formatCurrency } from '@/utils/format';

interface FinancialStats {
    totalIncome: number;
    totalExpense: number;
    balance: number;
    pendingIncome: number;
    pendingExpense: number;
    overdueCount: number;
}

export const FinancialDashboard: React.FC = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<FinancialStats>({
        totalIncome: 0,
        totalExpense: 0,
        balance: 0,
        pendingIncome: 0,
        pendingExpense: 0,
        overdueCount: 0
    });
    const [recentTransactions, setRecentTransactions] = useState<FinancialTransaction[]>([]);

    useEffect(() => {
        if (user?.company) {
            loadFinancialData();
        }
    }, [user]);

    const loadFinancialData = async () => {
        try {
            setLoading(true);

            // Buscar todas as transações do mês atual
            const startOfMonth = new Date();
            startOfMonth.setDate(1);
            startOfMonth.setHours(0, 0, 0, 0);

            const { data: transactions, error } = await supabase
                .from('financial_transactions')
                .select('*')
                .gte('due_date', startOfMonth.toISOString().split('T')[0])
                .order('due_date', { ascending: false });

            if (error) throw error;

            // Calcular estatísticas
            const income = transactions?.filter(t => t.type === 'income' && t.status === 'paid')
                .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

            const expense = transactions?.filter(t => t.type === 'expense' && t.status === 'paid')
                .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

            const pendingIncome = transactions?.filter(t => t.type === 'income' && t.status === 'pending')
                .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

            const pendingExpense = transactions?.filter(t => t.type === 'expense' && t.status === 'pending')
                .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

            const today = new Date().toISOString().split('T')[0];
            const overdueCount = transactions?.filter(t =>
                t.status === 'pending' && t.due_date < today
            ).length || 0;

            setStats({
                totalIncome: income,
                totalExpense: expense,
                balance: income - expense,
                pendingIncome,
                pendingExpense,
                overdueCount
            });

            // Pegar últimas 10 transações
            setRecentTransactions(transactions?.slice(0, 10) || []);

        } catch (error: any) {
            console.error('Error loading financial data:', error);
            toast.error('Erro ao carregar dados financeiros');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="loading-spinner" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Financeiro</h1>
                <p className="mt-1 text-sm text-gray-500">
                    Visão geral das suas finanças
                </p>
            </div>

            {/* Alertas */}
            {stats.overdueCount > 0 && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-4">
                    <div className="flex items-center gap-3">
                        <AlertCircle className="h-5 w-5 text-red-600" />
                        <div>
                            <p className="text-sm font-medium text-red-800">
                                Você tem {stats.overdueCount} conta(s) vencida(s)
                            </p>
                            <p className="text-xs text-red-600 mt-1">
                                Regularize os pagamentos para manter o fluxo de caixa saudável
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Cards de Resumo */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* Receitas */}
                <div className="rounded-lg bg-white p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Receitas</p>
                            <p className="mt-2 text-2xl font-bold text-green-600">
                                {formatCurrency(stats.totalIncome)}
                            </p>
                            <p className="mt-1 text-xs text-gray-500">
                                Pendente: {formatCurrency(stats.pendingIncome)}
                            </p>
                        </div>
                        <div className="rounded-full bg-green-100 p-3">
                            <TrendingUp className="h-6 w-6 text-green-600" />
                        </div>
                    </div>
                </div>

                {/* Despesas */}
                <div className="rounded-lg bg-white p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Despesas</p>
                            <p className="mt-2 text-2xl font-bold text-red-600">
                                {formatCurrency(stats.totalExpense)}
                            </p>
                            <p className="mt-1 text-xs text-gray-500">
                                Pendente: {formatCurrency(stats.pendingExpense)}
                            </p>
                        </div>
                        <div className="rounded-full bg-red-100 p-3">
                            <TrendingDown className="h-6 w-6 text-red-600" />
                        </div>
                    </div>
                </div>

                {/* Saldo */}
                <div className="rounded-lg bg-white p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Saldo do Mês</p>
                            <p className={`mt-2 text-2xl font-bold ${stats.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatCurrency(stats.balance)}
                            </p>
                            <p className="mt-1 text-xs text-gray-500">
                                {stats.balance >= 0 ? 'Lucro' : 'Prejuízo'}
                            </p>
                        </div>
                        <div className={`rounded-full p-3 ${stats.balance >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                            <Wallet className={`h-6 w-6 ${stats.balance >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                        </div>
                    </div>
                </div>

                {/* Contas Vencidas */}
                <div className="rounded-lg bg-white p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Contas Vencidas</p>
                            <p className="mt-2 text-2xl font-bold text-orange-600">
                                {stats.overdueCount}
                            </p>
                            <p className="mt-1 text-xs text-gray-500">
                                Requer atenção
                            </p>
                        </div>
                        <div className="rounded-full bg-orange-100 p-3">
                            <AlertCircle className="h-6 w-6 text-orange-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Transações Recentes */}
            <div className="rounded-lg bg-white shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">Transações Recentes</h2>
                </div>

                {recentTransactions.length === 0 ? (
                    <div className="flex h-64 flex-col items-center justify-center text-gray-500">
                        <DollarSign className="h-12 w-12 mb-4 text-gray-300" />
                        <p className="text-lg font-medium">Nenhuma transação encontrada</p>
                        <p className="text-sm mt-1">
                            Comece criando sua primeira transação financeira
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Data</th>
                                    <th>Descrição</th>
                                    <th>Categoria</th>
                                    <th>Tipo</th>
                                    <th>Valor</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentTransactions.map((transaction) => (
                                    <tr key={transaction.id}>
                                        <td className="text-sm text-gray-500">
                                            {new Date(transaction.due_date).toLocaleDateString('pt-BR')}
                                        </td>
                                        <td className="font-medium text-gray-900">
                                            {transaction.description}
                                        </td>
                                        <td>
                                            <span className="badge badge-blue">
                                                {transaction.category}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`badge ${transaction.type === 'income' ? 'badge-green' : 'badge-red'}`}>
                                                {transaction.type === 'income' ? 'Receita' : 'Despesa'}
                                            </span>
                                        </td>
                                        <td className={`font-semibold ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                            {transaction.type === 'income' ? '+' : '-'} {formatCurrency(Number(transaction.amount))}
                                        </td>
                                        <td>
                                            <span className={`badge ${transaction.status === 'paid' ? 'badge-green' :
                                                    transaction.status === 'pending' ? 'badge-yellow' :
                                                        'badge-gray'
                                                }`}>
                                                {transaction.status === 'paid' ? 'Pago' :
                                                    transaction.status === 'pending' ? 'Pendente' :
                                                        'Cancelado'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};
