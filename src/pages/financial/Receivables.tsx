import React, { useEffect, useState } from 'react';
import { Plus, Search, Pencil, DollarSign, Calendar, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { FinancialTransaction, TransactionType, TransactionStatus } from '@/types/database';
import { TransactionModal } from '@/components/financial/TransactionModal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { formatCurrency, formatDate } from '@/utils/format';
import toast from 'react-hot-toast';
import { financialService } from '@/services/financialService';

interface ReceivablesProps {
    onDataChange?: () => void;
}

export const Receivables: React.FC<ReceivablesProps> = ({ onDataChange }) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
    const [filteredTransactions, setFilteredTransactions] = useState<FinancialTransaction[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState<FinancialTransaction | null>(null);
    const [lastTap, setLastTap] = useState(0);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [transactionToDelete, setTransactionToDelete] = useState<FinancialTransaction | null>(null);

    useEffect(() => {
        if (user?.company) {
            loadTransactions();
        }
    }, [user]);

    useEffect(() => {
        filterTransactions();
    }, [transactions, searchTerm, statusFilter, startDate, endDate]);

    const loadTransactions = async () => {
        try {
            setLoading(true);
            const data = await financialService.list(user!.company!.id, { type: TransactionType.INCOME });
            setTransactions(data || []);
        } catch (error: any) {
            console.error('Error loading transactions:', error);
            toast.error('Erro ao carregar contas a receber');
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

        // Date range filter (between dates)
        if (startDate && endDate) {
            filtered = filtered.filter(t => {
                const dueDate = t.due_date.split('T')[0]; // Extract YYYY-MM-DD
                return dueDate >= startDate && dueDate <= endDate;
            });
        } else if (startDate) {
            filtered = filtered.filter(t => {
                const dueDate = t.due_date.split('T')[0];
                return dueDate >= startDate;
            });
        } else if (endDate) {
            filtered = filtered.filter(t => {
                const dueDate = t.due_date.split('T')[0];
                return dueDate <= endDate;
            });
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
            await financialService.update(transaction.id, {
                status: TransactionStatus.PAID,
                paid_at: new Date().toISOString()
            });

            toast.success('Pagamento registrado com sucesso!');
            loadTransactions();
            onDataChange?.(); // Notify parent to refresh
        } catch (error: any) {
            console.error('Error marking as paid:', error);
            toast.error('Erro ao registrar pagamento');
        }
    };

    const handleDeleteClick = (transaction: FinancialTransaction) => {
        setTransactionToDelete(transaction);
        setShowDeleteConfirm(true);
    };

    const handleDeleteConfirm = async () => {
        if (!transactionToDelete) return;

        try {
            await financialService.delete(transactionToDelete.id);
            toast.success('Transação excluída com sucesso!');
            setShowDeleteConfirm(false);
            setTransactionToDelete(null);
            loadTransactions();
            onDataChange?.(); // Notify parent to refresh
        } catch (error: any) {
            console.error('Error deleting transaction:', error);
            toast.error('Erro ao excluir transação');
        }
    };

    const handleDeleteCancel = () => {
        setShowDeleteConfirm(false);
        setTransactionToDelete(null);
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

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Contas a Receber</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Gerencie suas receitas e pagamentos
                    </p>
                </div>
                <button onClick={handleNewTransaction} className="btn-primary">
                    <Plus className="h-5 w-5" />
                    <span className="hidden sm:inline">Nova Receita</span>
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
                    <p className="text-sm font-medium text-gray-500">Recebido</p>
                    <p className="mt-2 text-2xl font-bold text-green-600">
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
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
                    <div className="lg:col-span-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Buscar por descrição ou categoria..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="input pl-10"
                            />
                        </div>
                    </div>
                    <div>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="input"
                            placeholder="Data Inicial"
                        />
                    </div>
                    <div>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="input"
                            placeholder="Data Final"
                        />
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

            {/* Transactions List */}
            {loading ? (
                <div className="flex h-64 items-center justify-center">
                    <div className="loading-spinner" />
                </div>
            ) : filteredTransactions.length === 0 ? (
                <div className="flex h-64 flex-col items-center justify-center text-gray-500">
                    <DollarSign className="h-12 w-12 mb-4 text-gray-300" />
                    <p className="text-lg font-medium">Nenhuma receita encontrada</p>
                    <p className="text-sm mt-1">
                        {searchTerm || statusFilter !== 'all' || startDate || endDate
                            ? 'Tente ajustar os filtros'
                            : 'Comece criando sua primeira receita'}
                    </p>
                </div>
            ) : (
                <>
                    {/* Mobile Card View */}
                    <div className="md:hidden space-y-3">
                        {filteredTransactions.map((transaction) => {
                            const isOverdue = transaction.status === TransactionStatus.PENDING &&
                                transaction.due_date < new Date().toISOString().split('T')[0];

                            return (
                                <div
                                    key={transaction.id}
                                    className={`bg-white p-4 rounded-lg shadow-sm border space-y-3 cursor-pointer select-none ring-offset-2 focus:ring-2 focus:ring-primary-500 transition-all active:scale-[0.99] ${isOverdue ? 'border-red-300 bg-red-50' : 'border-gray-200'
                                        }`}
                                    onClick={() => {
                                        const now = Date.now();
                                        if (now - lastTap < 300) {
                                            handleEdit(transaction);
                                            setLastTap(0);
                                        } else {
                                            setLastTap(now);
                                        }
                                    }}
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-semibold text-gray-900">{transaction.description}</h3>
                                            <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                                                <Calendar className="h-4 w-4" />
                                                <span>{formatDate(transaction.due_date)}</span>
                                            </div>
                                        </div>
                                        <span className="badge badge-blue text-xs">
                                            {transaction.category}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <span className="text-2xl font-bold text-green-600">
                                            {formatCurrency(Number(transaction.amount))}
                                        </span>
                                        <span className={`badge ${transaction.status === TransactionStatus.PAID ? 'badge-green' :
                                            transaction.status === TransactionStatus.PENDING ? 'badge-yellow' :
                                                'badge-gray'
                                            }`}>
                                            {transaction.status === TransactionStatus.PAID ? 'Pago' :
                                                transaction.status === TransactionStatus.PENDING ? 'Pendente' :
                                                    'Cancelado'}
                                        </span>
                                    </div>

                                    <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                                        {transaction.status === TransactionStatus.PENDING && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleMarkAsPaid(transaction); }}
                                                className="p-2 text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                                                title="Marcar como pago"
                                            >
                                                <CheckCircle className="h-4 w-4" />
                                            </button>
                                        )}
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleEdit(transaction); }}
                                            className="p-2 text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                            title="Editar"
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDeleteClick(transaction); }}
                                            className="p-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                                            title="Excluir"
                                        >
                                            <XCircle className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Desktop Table View */}
                    <div className="hidden md:block card overflow-hidden">
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
                                        <tr
                                            key={transaction.id}
                                            className={`${isOverdue ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-gray-50'} transition-colors cursor-default`}
                                            onDoubleClick={() => handleEdit(transaction)}
                                        >
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
                                                <span className="badge badge-blue">
                                                    {transaction.category}
                                                </span>
                                            </td>
                                            <td className="font-semibold text-green-600">
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
                                                        <Pencil className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteClick(transaction)}
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
                </>
            )}

            {/* Modal */}
            <TransactionModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setSelectedTransaction(null);
                }}
                transaction={selectedTransaction}
                type={TransactionType.INCOME}
                onSuccess={() => {
                    loadTransactions();
                    onDataChange?.(); // Notify parent to refresh
                }}
            />

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                isOpen={showDeleteConfirm}
                title="Confirmar Exclusão"
                message={transactionToDelete ? `Tem certeza que deseja excluir a transação "${transactionToDelete.description}"?` : ''}
                confirmText="Excluir"
                cancelText="Cancelar"
                onConfirm={handleDeleteConfirm}
                onCancel={handleDeleteCancel}
                danger
            />
        </div>
    );
};
