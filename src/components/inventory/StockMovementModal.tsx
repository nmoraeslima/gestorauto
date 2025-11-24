import React, { useState } from 'react';
import { X, Save, ArrowDown, ArrowUp, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import type { Product } from '@/types/database';

interface StockMovementModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: Product;
    onSuccess: () => void;
}

type MovementType = 'entry' | 'exit' | 'adjustment';

export const StockMovementModal: React.FC<StockMovementModalProps> = ({
    isOpen,
    onClose,
    product,
    onSuccess,
}) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [type, setType] = useState<MovementType>('entry');
    const [quantity, setQuantity] = useState<string>('');
    const [reason, setReason] = useState('');
    const [adjustmentType, setAdjustmentType] = useState<'add' | 'remove'>('add');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.company?.id || !quantity || !reason) return;

        setLoading(true);

        try {
            let finalType = type;
            let finalQuantity = parseFloat(quantity);
            let finalReason = reason;

            if (type === 'adjustment') {
                // For adjustment, we rely on the user selecting Add or Remove
                // The DB only accepts 'entry' or 'exit' for calculation logic in trigger
                // But wait, the DB constraint allows 'adjustment'.
                // However, my trigger logic only handles 'entry' and 'exit'.
                // So I MUST send 'entry' or 'exit' to the DB.
                // I will prepend "Ajuste: " to the reason.

                finalType = adjustmentType === 'add' ? 'entry' : 'exit';
                finalReason = `Ajuste: ${reason}`;
            }

            const movementData = {
                company_id: user.company.id,
                product_id: product.id,
                type: finalType,
                quantity: finalQuantity,
                reason: finalReason,
                created_by: user.id,
            };

            const { error } = await supabase
                .from('stock_movements')
                .insert(movementData);

            if (error) throw error;

            toast.success('Movimentação registrada com sucesso!');
            onSuccess();
            onClose();

            // Reset form
            setQuantity('');
            setReason('');
            setType('entry');
        } catch (error: any) {
            console.error('Error saving movement:', error);
            toast.error('Erro ao registrar movimentação');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity bg-secondary-900 bg-opacity-75" onClick={onClose} />

                <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

                <div className="relative inline-block w-full max-w-md p-6 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-card">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-semibold text-secondary-600">
                            Movimentação de Estoque
                        </h3>
                        <button
                            onClick={onClose}
                            className="text-neutral-400 hover:text-neutral-600 transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="mb-6">
                        <p className="text-sm text-neutral-500">Produto</p>
                        <p className="font-medium text-secondary-900">{product.name}</p>
                        <p className="text-xs text-neutral-400">
                            Estoque Atual: {product.quantity} {product.unit}
                        </p>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-neutral-200 mb-6">
                        <button
                            className={`flex-1 pb-2 text-sm font-medium border-b-2 transition-colors ${type === 'entry'
                                    ? 'border-green-500 text-green-600'
                                    : 'border-transparent text-neutral-500 hover:text-neutral-700'
                                }`}
                            onClick={() => setType('entry')}
                        >
                            <div className="flex items-center justify-center gap-2">
                                <ArrowUp className="w-4 h-4" />
                                Entrada
                            </div>
                        </button>
                        <button
                            className={`flex-1 pb-2 text-sm font-medium border-b-2 transition-colors ${type === 'exit'
                                    ? 'border-red-500 text-red-600'
                                    : 'border-transparent text-neutral-500 hover:text-neutral-700'
                                }`}
                            onClick={() => setType('exit')}
                        >
                            <div className="flex items-center justify-center gap-2">
                                <ArrowDown className="w-4 h-4" />
                                Saída
                            </div>
                        </button>
                        <button
                            className={`flex-1 pb-2 text-sm font-medium border-b-2 transition-colors ${type === 'adjustment'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-neutral-500 hover:text-neutral-700'
                                }`}
                            onClick={() => setType('adjustment')}
                        >
                            <div className="flex items-center justify-center gap-2">
                                <RefreshCw className="w-4 h-4" />
                                Ajuste
                            </div>
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {type === 'adjustment' && (
                            <div className="flex gap-4 p-3 bg-neutral-50 rounded-lg">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="adjType"
                                        checked={adjustmentType === 'add'}
                                        onChange={() => setAdjustmentType('add')}
                                        className="text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-secondary-700">Adicionar (+)</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="adjType"
                                        checked={adjustmentType === 'remove'}
                                        onChange={() => setAdjustmentType('remove')}
                                        className="text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-secondary-700">Remover (-)</span>
                                </label>
                            </div>
                        )}

                        <div>
                            <label className="label">
                                Quantidade ({product.unit}) *
                            </label>
                            <input
                                type="number"
                                required
                                min="0.01"
                                step="0.01"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                                className="input"
                                placeholder="0.00"
                            />
                        </div>

                        <div>
                            <label className="label">
                                Justificativa *
                            </label>
                            <textarea
                                required
                                rows={3}
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                className="input"
                                placeholder={
                                    type === 'entry' ? 'Ex: Compra de fornecedor, Devolução...' :
                                        type === 'exit' ? 'Ex: Uso interno, Perda, Validade...' :
                                            'Ex: Contagem de estoque, Correção...'
                                }
                            />
                            <p className="text-xs text-neutral-400 mt-1">
                                Obrigatório informar o motivo da movimentação.
                            </p>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200">
                            <button
                                type="button"
                                onClick={onClose}
                                className="btn btn-ghost"
                                disabled={loading}
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className={`btn ${type === 'entry' ? 'btn-success' :
                                        type === 'exit' ? 'btn-danger' :
                                            'btn-primary'
                                    }`}
                                disabled={loading}
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <Save className="w-4 h-4 mr-2" />
                                        Confirmar {
                                            type === 'entry' ? 'Entrada' :
                                                type === 'exit' ? 'Saída' :
                                                    'Ajuste'
                                        }
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
