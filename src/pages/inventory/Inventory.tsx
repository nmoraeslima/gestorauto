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
            <div className="bg-white rounded-lg shadow-sm border border-secondary-200 p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Buscar produto..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="input pl-10 w-full"
                        />
                    </div>
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value as any)}
                            className="input pl-10 w-full"
                        >
                            <option value="all">Todos os Status</option>
                            <option value="low">Estoque Baixo</option>
                            <option value="ok">Estoque Normal</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Inventory List */}
            <div className="w-full">
                {/* Mobile Card View */}
                <div className="md:hidden space-y-4">
                    {loading ? (
                        <div className="text-center text-secondary-500 py-4">Carregando estoque...</div>
                    ) : filteredProducts.length === 0 ? (
                        <div className="text-center text-secondary-500 py-4">
                            <Package className="w-12 h-12 mx-auto mb-4 text-neutral-300" />
                            <p>Nenhum produto encontrado</p>
                        </div>
                    ) : (
                        filteredProducts.map((product) => {
                            const isLowStock = (product.quantity || 0) <= (product.min_stock || 0);
                            return (
                                <div
                                    key={product.id}
                                    className={`p-4 rounded-lg shadow-sm border space-y-3 cursor-pointer select-none ring-offset-2 focus:ring-2 focus:ring-primary-500 transition-all active:scale-[0.99] ${isLowStock ? 'bg-red-50 border-red-200' : 'bg-white border-secondary-200'}`}
                                    onClick={() => handleMovement(product)}
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-3">
                                            <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${isLowStock ? 'bg-red-100 text-red-600' : 'bg-primary-100 text-primary-600'}`}>
                                                <Package className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-secondary-900">{product.name}</h3>
                                                <p className="text-xs text-secondary-500">{product.category}</p>
                                            </div>
                                        </div>
                                        {isLowStock && (
                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                                Baixo
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2">
                                            <span className="text-secondary-600">Estoque:</span>
                                            <div className={`flex items-center gap-1 font-bold ${isLowStock ? 'text-red-700' : 'text-secondary-900'}`}>
                                                {product.quantity} {product.unit}
                                            </div>
                                        </div>
                                        <div className="text-secondary-500 text-xs">
                                            Min: {product.min_stock} {product.unit}
                                        </div>
                                    </div>

                                    <div className="pt-3 border-t border-secondary-100 flex items-center justify-end gap-2">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleMovement(product); }}
                                            className="btn btn-sm btn-secondary flex items-center gap-1 bg-white"
                                        >
                                            <ArrowRightLeft className="w-4 h-4" />
                                            Ajustar
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleHistory(product); }}
                                            className="btn btn-sm btn-ghost text-neutral-500 hover:text-secondary-600"
                                        >
                                            <History className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block bg-white rounded-lg shadow-sm border border-secondary-200 overflow-hidden">
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
                                        <tr
                                            key={product.id}
                                            className={`${isLowStock ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-gray-50'} transition-colors cursor-default`}
                                            onDoubleClick={() => handleMovement(product)}
                                        >
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
                </div>
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
