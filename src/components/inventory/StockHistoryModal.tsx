import React, { useState, useEffect } from 'react';
import { X, ArrowDown, ArrowUp, Calendar, User } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Product } from '@/types/database';

interface StockHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: Product;
}

interface StockMovement {
    id: string;
    type: 'entry' | 'exit';
    quantity: number;
    reason: string;
    created_at: string;
    created_by_profile?: {
        full_name: string;
    };
}

export const StockHistoryModal: React.FC<StockHistoryModalProps> = ({
    isOpen,
    onClose,
    product,
}) => {
    const [movements, setMovements] = useState<StockMovement[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen && product) {
            loadHistory();
        }
    }, [isOpen, product]);

    const loadHistory = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('stock_movements')
            .select(`
                *,
                created_by_profile:profiles(full_name)
            `)
            .eq('product_id', product.id)
            .order('created_at', { ascending: false });

        if (!error && data) {
            // Map the profile data correctly if needed, Supabase returns it as an object or array depending on relation
            // Here we assume it returns an object because of single relation
            setMovements(data as any);
        }
        setLoading(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity bg-secondary-900 bg-opacity-75" onClick={onClose} />

                <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

                <div className="relative inline-block w-full max-w-2xl p-6 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-card">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-xl font-semibold text-secondary-600">
                                Histórico de Movimentações
                            </h3>
                            <p className="text-sm text-neutral-500 mt-1">
                                {product.name}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-neutral-400 hover:text-neutral-600 transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="overflow-hidden">
                        {loading ? (
                            <div className="p-8 text-center">
                                <div className="spinner mx-auto mb-4"></div>
                                <p className="text-neutral-500">Carregando histórico...</p>
                            </div>
                        ) : movements.length === 0 ? (
                            <div className="p-8 text-center text-neutral-500 bg-neutral-50 rounded-lg">
                                <p>Nenhuma movimentação registrada.</p>
                            </div>
                        ) : (
                            <div className="flow-root max-h-[60vh] overflow-y-auto pr-2">
                                <ul className="-mb-8">
                                    {movements.map((movement, movementIdx) => (
                                        <li key={movement.id}>
                                            <div className="relative pb-8">
                                                {movementIdx !== movements.length - 1 ? (
                                                    <span
                                                        className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-neutral-200"
                                                        aria-hidden="true"
                                                    />
                                                ) : null}
                                                <div className="relative flex space-x-3">
                                                    <div>
                                                        <span
                                                            className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${movement.type === 'entry'
                                                                    ? 'bg-green-100'
                                                                    : 'bg-red-100'
                                                                }`}
                                                        >
                                                            {movement.type === 'entry' ? (
                                                                <ArrowUp className="h-5 w-5 text-green-600" />
                                                            ) : (
                                                                <ArrowDown className="h-5 w-5 text-red-600" />
                                                            )}
                                                        </span>
                                                    </div>
                                                    <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                                                        <div>
                                                            <p className="text-sm text-secondary-900">
                                                                <span className="font-medium">
                                                                    {movement.type === 'entry' ? 'Entrada' : 'Saída'}
                                                                </span>
                                                                {' de '}
                                                                <span className="font-bold">
                                                                    {movement.quantity} {product.unit}
                                                                </span>
                                                            </p>
                                                            <p className="text-sm text-neutral-500 mt-1">
                                                                {movement.reason}
                                                            </p>
                                                        </div>
                                                        <div className="text-right text-sm whitespace-nowrap text-neutral-500">
                                                            <div className="flex items-center justify-end gap-1">
                                                                <Calendar className="w-3 h-3" />
                                                                <time dateTime={movement.created_at}>
                                                                    {format(new Date(movement.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                                                                </time>
                                                            </div>
                                                            {movement.created_by_profile && (
                                                                <div className="flex items-center justify-end gap-1 mt-1">
                                                                    <User className="w-3 h-3" />
                                                                    <span>{movement.created_by_profile.full_name}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
