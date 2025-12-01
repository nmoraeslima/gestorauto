import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import {
    Package,
    Plus,
    Search,
    Filter,
    Edit2,
    Trash2,
    AlertTriangle,
    Tag,
} from 'lucide-react';
import { ProductModal } from '@/components/catalog/ProductModal';
import { formatCurrency } from '@/utils/calculations';
import type { Product } from '@/types/database';
import toast from 'react-hot-toast';

export default function Products() {
    const { user } = useAuth();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [showModal, setShowModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

    useEffect(() => {
        loadProducts();
    }, [user]);

    const loadProducts = async () => {
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

    const handleCreate = () => {
        setSelectedProduct(null);
        setShowModal(true);
    };

    const handleEdit = (product: Product) => {
        setSelectedProduct(product);
        setShowModal(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este produto?')) return;

        try {
            const { error } = await supabase
                .from('products')
                .delete()
                .eq('id', id);

            if (error) throw error;

            toast.success('Produto excluído com sucesso');
            loadProducts();
        } catch (error: any) {
            console.error('Error deleting product:', error);
            toast.error('Erro ao excluir produto');
        }
    };

    // Get unique categories
    const categories = Array.from(new Set(products.map((p) => p.category).filter(Boolean)));

    // Filter products
    const filteredProducts = products.filter((product) => {
        const matchesSearch =
            product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.category?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;

        return matchesSearch && matchesCategory;
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-secondary-600">Produtos</h1>
                    <p className="text-neutral-500 mt-1">
                        Gerencie seu catálogo de produtos e estoque
                    </p>
                </div>
                <button onClick={handleCreate} className="btn btn-primary">
                    <Plus className="w-5 h-5 mr-2" />
                    Novo Produto
                </button>
            </div>

            {/* Filters */}
            <div className="card p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Buscar por nome, SKU ou categoria..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="input pl-10"
                        />
                    </div>
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
                        <select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            className="input pl-10"
                        >
                            <option value="all">Todas as Categorias</option>
                            {categories.map((cat) => (
                                <option key={cat} value={cat as string}>
                                    {cat}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Products List */}
            <div className="card overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center">
                        <div className="spinner mx-auto mb-4"></div>
                        <p className="text-neutral-500">Carregando produtos...</p>
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
                                    <th>Preço Venda</th>
                                    <th>Estoque</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredProducts.map((product) => (
                                    <tr key={product.id}>
                                        <td>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-medium text-secondary-900">{product.name}</p>
                                                    {product.category && (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-neutral-100 text-neutral-600">
                                                            {product.category}
                                                        </span>
                                                    )}
                                                </div>
                                                {product.sku && (
                                                    <p className="text-xs text-neutral-500">SKU: {product.sku}</p>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <span className="font-medium text-secondary-900">
                                                {formatCurrency(product.sale_price || 0)}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className={`font-medium ${(product.quantity || 0) <= (product.min_stock || 0)
                                                        ? 'text-red-600'
                                                        : 'text-green-600'
                                                        }`}
                                                >
                                                    {product.quantity || 0} {product.unit}
                                                </span>
                                                {(product.quantity || 0) <= (product.min_stock || 0) && (
                                                    <div title="Estoque Baixo">
                                                        <AlertTriangle className="w-4 h-4 text-red-500" />
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleEdit(product)}
                                                    className="text-primary-300 hover:text-primary-400 p-2 hover:bg-primary-50 rounded-lg transition-colors"
                                                    title="Editar"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(product.id)}
                                                    className="text-red-400 hover:text-red-500 p-2 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Excluir"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal */}
            <ProductModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                product={selectedProduct}
                onSuccess={loadProducts}
            />
        </div>
    );
}
