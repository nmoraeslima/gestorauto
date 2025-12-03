import React, { useState, useEffect } from 'react';
import { X, Save, Package, Tag, DollarSign, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import type { Product } from '@/types/database';

interface ProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    product?: Product | null;
    onSuccess: () => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({
    isOpen,
    onClose,
    product,
    onSuccess,
}) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        category: '',
        unit: 'un',
        cost_price: 0,
        quantity: 0,
        min_stock: 5,
    });

    useEffect(() => {
        if (product) {
            setFormData({
                name: product.name,
                description: product.description || '',
                category: product.category || '',
                unit: product.unit || 'un',
                cost_price: product.cost_price || 0,
                quantity: product.quantity || 0,
                min_stock: product.min_stock || 0,
            });
        } else {
            setFormData({
                name: '',
                description: '',
                category: '',
                unit: 'un',
                cost_price: 0,
                quantity: 0,
                min_stock: 5,
            });
        }
    }, [product, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.company?.id) return;

        setLoading(true);

        try {
            const productData = {
                company_id: user.company.id,
                name: formData.name,
                description: formData.description,
                category: formData.category,
                unit: formData.unit,
                cost_price: formData.cost_price,
                quantity: formData.quantity,
                min_stock: formData.min_stock,
            };

            if (product) {
                const { error } = await supabase
                    .from('products')
                    .update(productData)
                    .eq('id', product.id);

                if (error) throw error;
                toast.success('Produto atualizado com sucesso!');
            } else {
                const { error } = await supabase
                    .from('products')
                    .insert(productData);

                if (error) throw error;
                toast.success('Produto criado com sucesso!');
            }

            onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Error saving product:', error);
            toast.error('Erro ao salvar produto');
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

                <div className="relative inline-block w-full max-w-2xl p-6 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-card">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-semibold text-secondary-600">
                            {product ? 'Editar Produto' : 'Novo Produto'}
                        </h3>
                        <button
                            onClick={onClose}
                            className="text-neutral-400 hover:text-neutral-600 transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="sm:col-span-2">
                                <label className="label">
                                    <Package className="w-4 h-4 inline mr-2" />
                                    Nome do Produto *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="input"
                                    placeholder="Ex: Shampoo Automotivo"
                                />
                            </div>

                            <div className="sm:col-span-2">
                                <label className="label">Descrição</label>
                                <textarea
                                    rows={2}
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="input"
                                    placeholder="Detalhes do produto..."
                                />
                            </div>

                            <div>
                                <label className="label">
                                    <Tag className="w-4 h-4 inline mr-2" />
                                    Categoria
                                </label>
                                <input
                                    type="text"
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    className="input"
                                    placeholder="Ex: Limpeza, Polimento"
                                    list="categories-list"
                                />
                                <datalist id="categories-list">
                                    <option value="Limpeza" />
                                    <option value="Polimento" />
                                    <option value="Acessórios" />
                                    <option value="Peças" />
                                </datalist>
                            </div>



                            <div>
                                <label className="label">Unidade</label>
                                <select
                                    value={formData.unit}
                                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                                    className="input"
                                >
                                    <option value="un">Unidade (un)</option>
                                    <option value="L">Litros (L)</option>
                                    <option value="ml">Mililitros (ml)</option>
                                    <option value="kg">Quilogramas (kg)</option>
                                    <option value="g">Gramas (g)</option>
                                    <option value="m">Metros (m)</option>
                                    <option value="cx">Caixa (cx)</option>
                                </select>
                            </div>

                            <div>
                                <label className="label">Estoque Mínimo</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={formData.min_stock}
                                    onChange={(e) => setFormData({ ...formData, min_stock: parseFloat(e.target.value) })}
                                    className="input"
                                />
                            </div>

                            <div>
                                <label className="label">
                                    <DollarSign className="w-4 h-4 inline mr-2" />
                                    Preço de Custo (R$)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={formData.cost_price}
                                    onChange={(e) => setFormData({ ...formData, cost_price: parseFloat(e.target.value) })}
                                    className="input"
                                />
                            </div>



                            {!product && (
                                <div className="sm:col-span-2 bg-neutral-50 p-4 rounded-lg border border-neutral-200">
                                    <label className="label text-secondary-700">
                                        <Package className="w-4 h-4 inline mr-2" />
                                        Estoque Inicial
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={formData.quantity}
                                        onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) })}
                                        className="input"
                                        placeholder="Quantidade atual em estoque"
                                    />
                                    <p className="text-xs text-neutral-500 mt-1">
                                        Você poderá ajustar o estoque posteriormente através de movimentações.
                                    </p>
                                </div>
                            )}
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
                                className="btn btn-primary"
                                disabled={loading}
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <Save className="w-4 h-4 mr-2" />
                                        Salvar Produto
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
