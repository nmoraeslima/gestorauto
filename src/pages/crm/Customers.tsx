import React, { useEffect, useState } from 'react';
import { Search, Plus, Edit2, Trash2, Car, Crown } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Customer } from '@/types/database';
import { useAuth } from '@/contexts/AuthContext';
import { CustomerModal } from '@/components/crm/CustomerModal';
import { maskCPF, maskPhone } from '@/utils/masks';
import toast from 'react-hot-toast';

export const Customers: React.FC = () => {
    const { user } = useAuth();
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<string>('all');
    const [filterVIP, setFilterVIP] = useState<boolean | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

    useEffect(() => {
        if (user?.company) {
            loadCustomers();
        }
    }, [user]);

    useEffect(() => {
        filterCustomersList();
    }, [customers, searchTerm, filterType, filterVIP]);

    const loadCustomers = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('customers')
                .select('*')
                .is('deleted_at', null)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setCustomers(data || []);
        } catch (error: any) {
            console.error('Error loading customers:', error);
            toast.error('Erro ao carregar clientes');
        } finally {
            setLoading(false);
        }
    };

    const filterCustomersList = () => {
        let filtered = [...customers];

        // Search filter
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(
                (c) =>
                    c.name.toLowerCase().includes(term) ||
                    c.email?.toLowerCase().includes(term) ||
                    c.phone?.includes(term) ||
                    c.cpf?.includes(term)
            );
        }

        // Type filter
        if (filterType !== 'all') {
            filtered = filtered.filter((c) => c.customer_type === filterType);
        }

        // VIP filter
        if (filterVIP !== null) {
            filtered = filtered.filter((c) => c.vip === filterVIP);
        }

        setFilteredCustomers(filtered);
    };

    const handleEdit = (customer: Customer) => {
        setSelectedCustomer(customer);
        setIsModalOpen(true);
    };

    const handleDelete = async (customer: Customer) => {
        try {
            // First, check how many vehicles this customer has
            const { data: vehicles, error: vehiclesError } = await supabase
                .from('vehicles')
                .select('id')
                .eq('customer_id', customer.id);

            if (vehiclesError) throw vehiclesError;

            const vehicleCount = vehicles?.length || 0;

            // Build confirmation message
            let confirmMessage = `Tem certeza que deseja excluir o cliente "${customer.name}"?`;
            if (vehicleCount > 0) {
                confirmMessage += `\n\n⚠️ Este cliente possui ${vehicleCount} veículo${vehicleCount > 1 ? 's' : ''} cadastrado${vehicleCount > 1 ? 's' : ''}, que também ${vehicleCount > 1 ? 'serão excluídos' : 'será excluído'}.`;
            }

            if (!confirm(confirmMessage)) {
                return;
            }

            // Delete vehicles first (if any)
            if (vehicleCount > 0) {
                const { error: deleteVehiclesError } = await supabase
                    .from('vehicles')
                    .delete()
                    .eq('customer_id', customer.id);

                if (deleteVehiclesError) throw deleteVehiclesError;
            }

            // Then soft delete the customer
            const { error } = await supabase
                .from('customers')
                .update({ deleted_at: new Date().toISOString() })
                .eq('id', customer.id);

            if (error) throw error;

            if (vehicleCount > 0) {
                toast.success(`Cliente e ${vehicleCount} veículo${vehicleCount > 1 ? 's' : ''} excluído${vehicleCount > 1 ? 's' : ''} com sucesso`);
            } else {
                toast.success('Cliente excluído com sucesso');
            }

            loadCustomers();
        } catch (error: any) {
            console.error('Error deleting customer:', error);
            toast.error('Erro ao excluir cliente');
        }
    };

    const handleNewCustomer = () => {
        setSelectedCustomer(null);
        setIsModalOpen(true);
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setSelectedCustomer(null);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Gerencie seus clientes e suas informações
                    </p>
                </div>
                <button onClick={handleNewCustomer} className="btn-primary">
                    <Plus className="h-5 w-5" />
                    <span className="hidden sm:inline">Novo Cliente</span>
                    <span className="sm:hidden">Novo</span>
                </button>
            </div>

            {/* Filters */}
            <div className="rounded-lg bg-white p-4 shadow-sm">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                    {/* Search */}
                    <div className="md:col-span-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Buscar por nome, email, telefone ou CPF..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="input pl-10"
                            />
                        </div>
                    </div>

                    {/* Type Filter */}
                    <div>
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="input"
                        >
                            <option value="all">Todos os tipos</option>
                            <option value="individual">Individual</option>
                            <option value="corporate">Corporativo</option>
                        </select>
                    </div>

                    {/* VIP Filter */}
                    <div>
                        <select
                            value={filterVIP === null ? 'all' : filterVIP ? 'vip' : 'regular'}
                            onChange={(e) =>
                                setFilterVIP(e.target.value === 'all' ? null : e.target.value === 'vip')
                            }
                            className="input"
                        >
                            <option value="all">Todos</option>
                            <option value="vip">VIP</option>
                            <option value="regular">Regular</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="rounded-lg bg-white shadow-sm">
                {loading ? (
                    <div className="flex h-64 items-center justify-center">
                        <div className="loading-spinner" />
                    </div>
                ) : filteredCustomers.length === 0 ? (
                    <div className="flex h-64 flex-col items-center justify-center text-gray-500">
                        <p className="text-lg font-medium">Nenhum cliente encontrado</p>
                        <p className="mt-1 text-sm">
                            {searchTerm || filterType !== 'all' || filterVIP !== null
                                ? 'Tente ajustar os filtros'
                                : 'Comece criando seu primeiro cliente'}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Nome</th>
                                    <th>Contato</th>
                                    <th className="hidden md:table-cell">CPF</th>
                                    <th>Tipo</th>
                                    <th className="text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredCustomers.map((customer) => (
                                    <tr key={customer.id}>
                                        <td>
                                            <div className="flex items-center gap-2">
                                                {customer.vip && <Crown className="h-4 w-4 text-yellow-500" />}
                                                <span className="font-medium text-gray-900">{customer.name}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="text-sm">
                                                <div className="text-gray-900">{maskPhone(customer.phone)}</div>
                                                {customer.email && (
                                                    <div className="hidden md:block text-gray-500">{customer.email}</div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="text-sm text-gray-500 hidden md:table-cell">
                                            {customer.cpf ? maskCPF(customer.cpf) : '-'}
                                        </td>
                                        <td>
                                            <span
                                                className={`badge ${customer.customer_type === 'corporate'
                                                    ? 'badge-purple'
                                                    : 'badge-blue'
                                                    }`}
                                            >
                                                {customer.customer_type === 'corporate' ? 'Corporativo' : 'Individual'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleEdit(customer)}
                                                    className="rounded-lg p-2 text-gray-600 hover:bg-gray-100"
                                                    title="Editar"
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(customer)}
                                                    className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                                                    title="Excluir"
                                                >
                                                    <Trash2 className="h-4 w-4" />
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

            {/* Stats */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-lg bg-white p-4 shadow-sm">
                    <p className="text-sm font-medium text-gray-500">Total de Clientes</p>
                    <p className="mt-1 text-2xl font-bold text-gray-900">{customers.length}</p>
                </div>
                <div className="rounded-lg bg-white p-4 shadow-sm">
                    <p className="text-sm font-medium text-gray-500">Clientes VIP</p>
                    <p className="mt-1 text-2xl font-bold text-yellow-600">
                        {customers.filter((c) => c.vip).length}
                    </p>
                </div>
                <div className="rounded-lg bg-white p-4 shadow-sm">
                    <p className="text-sm font-medium text-gray-500">Corporativos</p>
                    <p className="mt-1 text-2xl font-bold text-purple-600">
                        {customers.filter((c) => c.customer_type === 'corporate').length}
                    </p>
                </div>
            </div>

            {/* Modal */}
            <CustomerModal
                isOpen={isModalOpen}
                onClose={handleModalClose}
                customer={selectedCustomer}
                onSuccess={loadCustomers}
            />
        </div>
    );
};
