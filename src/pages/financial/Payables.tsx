import React, { useEffect, useState } from 'react';
import { Plus, Search, Filter, TrendingDown, Calendar, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { FinancialTransaction, TransactionType, TransactionStatus } from '@/types/database';
import { TransactionModal } from '@/components/financial/TransactionModal';
import { formatCurrency, formatDate } from '@/utils/format';
import toast from 'react-hot-toast';

export const Payables: React.FC = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
    const [filteredTransactions, setFilteredTransactions] = useState<FinancialTransaction[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [categoryFilter, setCategoryFilter] = useState<string>('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState<FinancialTransaction | null>(null);

    useEffect(() => {
        if (user?.company) {
            loadTransactions();
        }
    }, [user]);

    useEffect(() => {
        filterTransactions();
    }, [transactions, searchTerm, statusFilter, categoryFilter]);

    const loadTransactions = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('financial_transactions')
                .select('*')
                .eq('type', TransactionType.EXPENSE)
                .order('due_date', { ascending: false });

            if (error) throw error;
            setTransactions(data || []);
        } catch (error: any) {
            console.error('Error loading transactions:', error);
            toast.error('Erro ao carregar contas a pagar');
        } finally {
            setLoading(false);
        }
    };

    const filterTransactions = () => {
        let filtered = [...transactions];

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(t =>
                t.description.toLowerCase().includes(term) ||
                t.category.toLowerCase().includes(term)
            );
        }

        if (statusFilter !== 'all') {
            filtered = filtered.filter(t => t.status === statusFilter);
        }

        if (categoryFilter !== 'all') {
            filtered = filtered.filter(t => t.category === categoryFilter);
        }

        setFilteredTransactions(filtered);
    };

    const handleEdit = (transaction: FinancialTransaction) => {
        setSelectedTransaction(transaction);
        setIsModalOpen(true);
    };

    const handleNewTransaction = () => {
        setSelectedTransaction(null);
        setIsModalOpen(true);
    };

    const handleMarkAsPaid = async (transaction: FinancialTransaction) => {
        try {
            const { error } = await supabase
                .from('financial_transactions')
                .update({
                    status: TransactionStatus.PAID,
                    paid_at: new Date().toISOString()
                })
                .eq('id', transaction.id);

            if (error) throw error;
            toast.success('Pagamento registrado com sucesso!');
            loadTransactions();
        } catch (error: any) {
            console.error('Error marking as paid:', error);
            toast.error('Erro ao registrar pagamento');
        }
    };

    const handleDelete = async (transaction: FinancialTransaction) => {
        if (!confirm('Tem certeza que deseja excluir esta transação?')) return;

        try {
            const { error } = await supabase
                .from('financial_transactions')
                .delete()
                .eq('id', transaction.id);

            if (error) throw error;
            toast.success('Transação excluída com sucesso!');
            loadTransactions();
        } catch (error: any) {
            console.error('Error deleting transaction:', error);
            toast.error('Erro ao excluir transação');
        }
    };

    const stats = {
        total: filteredTransactions.reduce((sum, t) => sum + Number(t.amount), 0),
        pending: filteredTransactions.filter(t => t.status === TransactionStatus.PENDING)
            .reduce((sum, t) => sum + Number(t.amount), 0),
        paid: filteredTransactions.filter(t => t.status === TransactionStatus.PAID)
            .reduce((sum, t) => sum + Number(t.amount), 0),
        overdue: filteredTransactions.filter(t =>
            t.status === TransactionStatus.PENDING &&
            t.due_date < new Date().toISOString().split('T')[0]
        ).length
    };

    const categories = Array.from(new Set(transactions.map(t => t.category))).sort();

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Contas a Pagar</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Gerencie suas despesas e pagamentos
                    </p>
                </div>
                <button onClick={handleNewTransaction} className="btn-primary">
                    <Plus className="h-5 w-5" />
                    <span className="hidden sm:inline">Nova Despesa</span>
                    <span className="sm:hidden">Nova</span>
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg bg-white p-4 shadow-sm border border-gray-200">
                    <p className="text-sm font-medium text-gray-500">Total</p>
                    <p className="mt-2 text-2xl font-bold text-gray-900">
                        {formatCurrency(stats.total)}
                    </p>
                </div>
                <div className="rounded-lg bg-white p-4 shadow-sm border border-gray-200">
                    <p className="text-sm font-medium text-gray-500">Pendente</p>
                    <p className="mt-2 text-2xl font-bold text-yellow-600">
                        {formatCurrency(stats.pending)}
                    </p>
                </div>
                <div className="rounded-lg bg-white p-4 shadow-sm border border-gray-200">
                    <p className="text-sm font-medium text-gray-500">Pago</p>
                    <p className="mt-2 text-2xl font-bold text-red-600">
                        {formatCurrency(stats.paid)}
                    </p>
                </div>
                <div className="rounded-lg bg-white p-4 shadow-sm border border-gray-200">
                    <p className="text-sm font-medium text-gray-500">Vencidas</p>
                    <p className="mt-2 text-2xl font-bold text-red-600">
                        {stats.overdue}
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="rounded-lg bg-white p-4 shadow-sm border border-gray-200">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                    <div className="md:col-span-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Buscar por descrição..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="input pl-10"
                            />
                        </div>
                    </div>
                    <div>
                        <select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            className="input"
                        >
                            <option value="all">Todas as categorias</option>
                            {categories.map((cat) => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="input"
                        >
                            <option value="all">Todos os status</option>
                            <option value={TransactionStatus.PENDING}>Pendente</option>
                            <option value={TransactionStatus.PAID}>Pago</option>
                            <option value={TransactionStatus.CANCELLED}>Cancelado</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="rounded-lg bg-white shadow-sm border border-gray-200">
                {loading ? (
                    <div className="flex h-64 items-center justify-center">
                        <div className="loading-spinner" />
                    </div>
                ) : filteredTransactions.length === 0 ? (
                    <div className="flex h-64 flex-col items-center justify-center text-gray-500">
                        <TrendingDown className="h-12 w-12 mb-4 text-gray-300" />
                        <p className="text-lg font-medium">Nenhuma despesa encontrada</p>
                        <p className="text-sm mt-1">
                            {searchTerm || statusFilter !== 'all' || categoryFilter !== 'all'
                                ? 'Tente ajustar os filtros'
                                : 'Comece criando sua primeira despesa'}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Vencimento</th>
                                    <th>Descrição</th>
                                    <th>Categoria</th>
                                    <th>Valor</th>
                                    <th>Status</th>
                                    <th className="text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTransactions.map((transaction) => {
                                    const isOverdue = transaction.status === TransactionStatus.PENDING &&
                                        transaction.due_date < new Date().toISOString().split('T')[0];

                                    return (
                                        <tr key={transaction.id} className={isOverdue ? 'bg-red-50' : ''}>
                                            <td className="text-sm text-gray-500">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="h-4 w-4" />
                                                    {formatDate(transaction.due_date)}
                                                </div>
                                            </td>
                                            <td className="font-medium text-gray-900">
                                                {transaction.description}
                                            </td>
                                            <td>
                                                <span className="badge badge-purple">
                                                    {transaction.category}
                                                </span>
                                            </td>
                                            <td className="font-semibold text-red-600">
                                                {formatCurrency(Number(transaction.amount))}
                                            </td>
                                            <td>
                                                <span className={`badge ${transaction.status === TransactionStatus.PAID ? 'badge-green' :
                                                        transaction.status === TransactionStatus.PENDING ? 'badge-yellow' :
                                                            'badge-gray'
                                                    }`}>
                                                    {transaction.status === TransactionStatus.PAID ? 'Pago' :
                                                        transaction.status === TransactionStatus.PENDING ? 'Pendente' :
                                                            'Cancelado'}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="flex items-center justify-end gap-2">
                                                    {transaction.status === TransactionStatus.PENDING && (
                                                        <button
                                                            onClick={() => handleMarkAsPaid(transaction)}
                                                            className="rounded-lg p-2 text-green-600 hover:bg-green-50"
                                                            title="Marcar como pago"
                                                        >
                                                            <CheckCircle className="h-4 w-4" />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleEdit(transaction)}
                                                        className="rounded-lg p-2 text-gray-600 hover:bg-gray-100"
                                                        title="Editar"
                                                    >
                                                        <Filter className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(transaction)}
                                                        className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                                                        title="Excluir"
                                                    >
                                                        <XCircle className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal */}
            <TransactionModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setSelectedTransaction(null);
                }}
                transaction={selectedTransaction}
                type={TransactionType.EXPENSE}
                onSuccess={loadTransactions}
            />
        </div>
    );
};
