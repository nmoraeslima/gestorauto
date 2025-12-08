import React, { useState } from 'react';
import { X, Lock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { TransactionType, TransactionStatus, FinancialTransaction } from '@/types/database';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import toast from 'react-hot-toast';
import { financialService } from '@/services/financialService';

interface TransactionModalProps {
    isOpen: boolean;
    onClose: () => void;
    transaction?: FinancialTransaction | null;
    type: TransactionType;
    onSuccess: () => void;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
    isOpen,
    onClose,
    transaction,
    type,
    onSuccess,
}) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        category: transaction?.category || '',
        description: transaction?.description || '',
        amount: transaction?.amount || 0,
        due_date: transaction?.due_date || new Date().toISOString().split('T')[0],
        status: transaction?.status || TransactionStatus.PENDING,
    });

    React.useEffect(() => {
        if (isOpen) {
            setFormData({
                category: transaction?.category || '',
                description: transaction?.description || '',
                amount: transaction?.amount || 0,
                due_date: transaction?.due_date || new Date().toISOString().split('T')[0],
                status: transaction?.status || TransactionStatus.PENDING,
            });
        }
    }, [transaction, isOpen]);

    // Verifica se a transação foi gerada automaticamente por outra rotina do sistema (ex: Ordem de Serviço)
    const isSystemGenerated = !!transaction?.work_order_id;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.company?.id) return;

        setLoading(true);

        try {
            const transactionData = {
                company_id: user.company.id,
                type,
                ...formData,
                amount: Number(formData.amount),
            };

            if (transaction) {
                await financialService.update(transaction.id, transactionData);
                toast.success('Transação atualizada com sucesso!');
            } else {
                await financialService.create(transactionData);
                toast.success('Transação criada com sucesso!');
            }

            onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Error saving transaction:', error);
            toast.error(error.message || 'Erro ao salvar transação');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const categories = type === TransactionType.INCOME
        ? ['Serviços', 'Produtos', 'Outros']
        : ['Fornecedores', 'Salários', 'Aluguel', 'Impostos', 'Utilities', 'Marketing', 'Outros'];

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
                <div className="fixed inset-0 transition-opacity bg-secondary-900 bg-opacity-75" onClick={onClose} />

                <div className="relative inline-block w-full max-w-lg p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-card">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-semibold text-secondary-600">
                            {transaction ? 'Editar' : 'Nova'} {type === TransactionType.INCOME ? 'Receita' : 'Despesa'}
                        </h3>
                        <button
                            onClick={onClose}
                            className="text-neutral-400 hover:text-neutral-600 transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <label className="label">Categoria *</label>
                                {isSystemGenerated && (
                                    <span className="text-xs text-gray-500 flex items-center gap-1" title="Campo gerado automaticamente pelo sistema">
                                        <Lock className="w-3 h-3" />
                                        Gerado pelo sistema
                                    </span>
                                )}
                            </div>
                            <SearchableSelect
                                value={formData.category}
                                onChange={(value) => setFormData({ ...formData, category: value })}
                                options={categories.map(cat => ({ value: cat, label: cat }))}
                                placeholder="Selecione..."
                                disabled={isSystemGenerated}
                                className={isSystemGenerated ? 'bg-gray-100 cursor-not-allowed text-gray-500' : ''}
                            />
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <label className="label">Descrição *</label>
                                {isSystemGenerated && (
                                    <span className="text-xs text-gray-500 flex items-center gap-1" title="Campo gerado automaticamente pelo sistema">
                                        <Lock className="w-3 h-3" />
                                        Gerado pelo sistema
                                    </span>
                                )}
                            </div>
                            <input
                                type="text"
                                required
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className={`input ${isSystemGenerated ? 'bg-gray-100 cursor-not-allowed text-gray-500' : ''}`}
                                placeholder="Ex: Pagamento de serviço"
                                disabled={isSystemGenerated}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="label">Valor (R$) *</label>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    step="0.01"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                                    className="input"
                                />
                            </div>

                            <div>
                                <label className="label">Data de Vencimento *</label>
                                <input
                                    type="date"
                                    required
                                    value={formData.due_date}
                                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                                    className="input"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="label">Status</label>
                            <select
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value as TransactionStatus })}
                                className="input"
                            >
                                <option value={TransactionStatus.PENDING}>Pendente</option>
                                <option value={TransactionStatus.PAID}>Pago</option>
                                <option value={TransactionStatus.CANCELLED}>Cancelado</option>
                            </select>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={loading}
                                className="btn-secondary"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className={`btn-primary ${loading ? 'btn-loading' : ''}`}
                            >
                                {loading ? 'Salvando...' : (transaction ? 'Salvar' : 'Criar')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
