import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Search, Package, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { Product } from '@/types/database';

interface ProductSelectorProps {
    selectedProducts: Array<{
        product_id: string;
        product_name: string;
        quantity: number;
        available_stock: number;
        unit?: string;
    }>;
    onProductsChange: (products: any[]) => void;
}

export const ProductSelector: React.FC<ProductSelectorProps> = ({
    selectedProducts,
    onProductsChange,
}) => {
    const { user } = useAuth();
    const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);

    useEffect(() => {
        loadProducts();
    }, [user]);

    const loadProducts = async () => {
        if (!user?.company?.id) return;

        const { data } = await supabase
            .from('products')
            .select('*')
            .eq('company_id', user.company.id)
            .order('name');

        if (data) {
            setAvailableProducts(data);
        }
    };

    const handleAddProduct = (product: Product) => {
        const existingIndex = selectedProducts.findIndex(p => p.product_id === product.id);

        if (existingIndex >= 0) {
            // Increment quantity if already added
            const newProducts = [...selectedProducts];
            newProducts[existingIndex].quantity += 1;
            onProductsChange(newProducts);
        } else {
            // Add new product
            onProductsChange([
                ...selectedProducts,
                {
                    product_id: product.id,
                    product_name: product.name,
                    quantity: 1,
                    available_stock: product.quantity || 0,
                    unit: product.unit,
                },
            ]);
        }
        setSearchTerm('');
        setShowDropdown(false);
    };

    const handleRemoveProduct = (index: number) => {
        const newProducts = [...selectedProducts];
        newProducts.splice(index, 1);
        onProductsChange(newProducts);
    };

    const handleQuantityChange = (index: number, newQuantity: number) => {
        if (newQuantity < 1) return;
        const newProducts = [...selectedProducts];
        newProducts[index].quantity = newQuantity;
        onProductsChange(newProducts);
    };

    const filteredProducts = availableProducts.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-4">
            {/* Search and Add */}
            <div className="relative">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Buscar produto para adicionar..."
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setShowDropdown(true);
                        }}
                        onFocus={() => setShowDropdown(true)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                if (filteredProducts.length > 0) {
                                    handleAddProduct(filteredProducts[0]);
                                }
                            }
                        }}
                        className="input pl-10"
                    />
                </div>

                {showDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-secondary-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {filteredProducts.length === 0 ? (
                            <div className="p-4 text-center text-neutral-500">
                                Nenhum produto encontrado
                            </div>
                        ) : (
                            filteredProducts.map((product) => (
                                <button
                                    key={product.id}
                                    type="button"
                                    onMouseDown={(e) => {
                                        e.preventDefault(); // Prevent blur
                                        handleAddProduct(product);
                                    }}
                                    className="w-full text-left px-4 py-3 hover:bg-secondary-50 flex items-center justify-between border-b border-secondary-100 last:border-0 focus:outline-none focus:bg-secondary-50"
                                >
                                    <div>
                                        <p className="font-medium text-secondary-900">{product.name}</p>
                                        <p className="text-xs text-neutral-500">
                                            SKU: {product.sku || '-'} | Estoque: {product.quantity} {product.unit}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <Plus className="w-4 h-4 text-primary-600" />
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                )}

                {showDropdown && (
                    <div
                        className="fixed inset-0 z-0"
                        onClick={() => setShowDropdown(false)}
                    />
                )}
            </div>

            {/* Selected Products List */}
            <div className="space-y-3">
                {selectedProducts.map((item, index) => (
                    <div
                        key={index}
                        className="flex items-center gap-4 p-4 bg-white border border-secondary-200 rounded-lg shadow-sm"
                    >
                        <div className="p-2 bg-primary-50 rounded-lg">
                            <Package className="w-5 h-5 text-primary-600" />
                        </div>

                        <div className="flex-1 min-w-0">
                            <p className="font-medium text-secondary-900 truncate">
                                {item.product_name} <span className="text-sm text-neutral-500 font-normal">({item.unit || 'un'})</span>
                            </p>
                            <div className="flex items-center gap-2 text-xs text-neutral-500">
                                <span>Estoque Disp: {item.available_stock} {item.unit}</span>
                                {item.quantity > item.available_stock && (
                                    <span className="flex items-center text-red-500 font-medium">
                                        <AlertTriangle className="w-3 h-3 mr-1" />
                                        Estoque Insuficiente
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="w-24">
                                <label className="text-xs text-neutral-500 mb-1 block">Qtd</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={item.quantity}
                                    onChange={(e) => handleQuantityChange(index, parseFloat(e.target.value))}
                                    className="input py-1 px-2 text-sm"
                                />
                            </div>

                            <button
                                onClick={() => handleRemoveProduct(index)}
                                className="p-2 text-neutral-400 hover:text-red-500 transition-colors mt-4"
                                title="Remover produto"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}

                {selectedProducts.length === 0 && (
                    <div className="text-center py-8 bg-neutral-50 rounded-lg border border-dashed border-neutral-300">
                        <Package className="w-8 h-8 mx-auto text-neutral-400 mb-2" />
                        <p className="text-neutral-500">Nenhum produto adicionado</p>
                    </div>
                )}
            </div>
        </div>
    );
};
