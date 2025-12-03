import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import {
    Package,
    Search,
    Filter,
    AlertTriangle,
    History,
    ArrowRightLeft,
} from 'lucide-react';
import { StockMovementModal } from '@/components/inventory/StockMovementModal';
import { StockHistoryModal } from '@/components/inventory/StockHistoryModal';
import type { Product } from '@/types/database';

export default function Inventory() {
    const { user } = useAuth();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'low' | 'ok'>('all');

    // Modals
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [showMovementModal, setShowMovementModal] = useState(false);
    const [showHistoryModal, setShowHistoryModal] = useState(false);

    useEffect(() => {
        loadInventory();
    }, [user]);

    const loadInventory = async () => {
        if (!user?.company?.id) return;

        setLoading(true);
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('company_id', user.company.id)
            .order('name');

        if (!error && data) {
            setProducts(data);
        }
        setLoading(false);
    };

    const handleMovement = (product: Product) => {
        setSelectedProduct(product);
        setShowMovementModal(true);
    };

    const handleHistory = (product: Product) => {
        setSelectedProduct(product);
        setShowHistoryModal(true);
    };

    // Filter products
    const filteredProducts = products.filter((product) => {
        const matchesSearch =
            product.name.toLowerCase().includes(searchTerm.toLowerCase());

        const isLowStock = (product.quantity || 0) <= (product.min_stock || 0);

        const matchesStatus =
            filterStatus === 'all' ? true :
                filterStatus === 'low' ? isLowStock :
                    !isLowStock;

        return matchesSearch && matchesStatus;
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-secondary-600">Controle de Estoque</h1>
                    <p className="text-neutral-500 mt-1">
                        Gerencie entradas, saídas e ajustes de estoque
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="card p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Buscar produto..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="input pl-10"
                        />
                    </div>
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value as any)}
                            className="input pl-10"
                        >
                            <option value="all">Todos os Status</option>
                            <option value="low">Estoque Baixo</option>
                            <option value="ok">Estoque Normal</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Inventory List */}
            <div className="card overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center">
                        <div className="spinner mx-auto mb-4"></div>
                        <p className="text-neutral-500">Carregando estoque...</p>
                    </div>
                ) : filteredProducts.length === 0 ? (
                    <div className="p-8 text-center text-neutral-500">
                        <Package className="w-12 h-12 mx-auto mb-4 text-neutral-300" />
                        <p>Nenhum produto encontrado</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Produto</th>

                                    <th>Estoque Atual</th>
                                    <th>Mínimo</th>
                                    <th>Status</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredProducts.map((product) => {
                                    const isLowStock = (product.quantity || 0) <= (product.min_stock || 0);
                                    return (
                                        <tr key={product.id} className={isLowStock ? 'bg-red-50' : ''}>
                                            <td>
                                                <p className="font-medium text-secondary-900">{product.name}</p>
                                                <p className="text-xs text-neutral-500">{product.category}</p>
                                            </td>

                                            <td>
                                                <span className="font-bold text-secondary-900">
                                                    {product.quantity} {product.unit}
                                                </span>
                                            </td>
                                            <td>
                                                {product.min_stock} {product.unit}
                                            </td>
                                            <td>
                                                {isLowStock ? (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                        <AlertTriangle className="w-3 h-3 mr-1" />
                                                        Baixo
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                        Normal
                                                    </span>
                                                )}
                                            </td>
                                            <td>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleMovement(product)}
                                                        className="btn btn-sm btn-secondary flex items-center gap-1"
                                                        title="Movimentar Estoque"
                                                    >
                                                        <ArrowRightLeft className="w-4 h-4" />
                                                        Ajustar
                                                    </button>
                                                    <button
                                                        onClick={() => handleHistory(product)}
                                                        className="btn btn-sm btn-ghost text-neutral-500 hover:text-secondary-600"
                                                        title="Ver Histórico"
                                                    >
                                                        <History className="w-4 h-4" />
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

            {/* Modals */}
            {selectedProduct && (
                <>
                    <StockMovementModal
                        isOpen={showMovementModal}
                        onClose={() => setShowMovementModal(false)}
                        product={selectedProduct}
                        onSuccess={loadInventory}
                    />
                    <StockHistoryModal
                        isOpen={showHistoryModal}
                        onClose={() => setShowHistoryModal(false)}
                        product={selectedProduct}
                    />
                </>
            )}
        </div>
    );
}
