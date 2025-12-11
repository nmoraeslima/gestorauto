import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Plus, Edit2, Trash2, Car, Crown, Check, Phone, Mail, FileText } from 'lucide-react';
import { Customer } from '@/types/database';
import { useAuth } from '@/contexts/AuthContext';
import { CustomerModal } from '@/components/crm/CustomerModal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { customerService } from '@/services/customerService';
import { birthdayService, BirthdayCustomer } from '@/services/birthdayService';
import { maskCPF, maskPhone } from '@/utils/masks';
import toast from 'react-hot-toast';
import { Cake } from 'lucide-react';

export const Customers: React.FC = () => {
    const { user } = useAuth();
    const [searchParams] = useSearchParams();
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<string>('all');
    const [filterVIP, setFilterVIP] = useState<boolean | null>(null);
    const [showInactive, setShowInactive] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [lastTap, setLastTap] = useState(0);
    const [upcomingBirthdaysMap, setUpcomingBirthdaysMap] = useState<Record<string, BirthdayCustomer>>({});

    // Delete confirmation state
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteConfirmMessage, setDeleteConfirmMessage] = useState('');
    const [deleteConfirmTitle, setDeleteConfirmTitle] = useState('');
    const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
    const [deleteAction, setDeleteAction] = useState<'delete' | 'deactivate'>('delete');
    const [deleteCounts, setDeleteCounts] = useState<any>(null);

    useEffect(() => {
        if (user?.company) {
            loadCustomers();
        }
    }, [user, showInactive]);

    useEffect(() => {
        if (searchParams.get('new') === 'true') {
            setIsModalOpen(true);
            setSelectedCustomer(null);
        }
    }, [searchParams]);

    useEffect(() => {
        filterCustomersList();
    }, [customers, searchTerm, filterType, filterVIP]);

    const loadCustomers = async () => {
        try {
            setLoading(true);
            const data = await customerService.list(user!.company!.id, showInactive);
            setCustomers(data || []);

            // Load birthdays
            try {
                const birthdays = await birthdayService.getUpcomingBirthdays(user!.company!.id);
                const map: Record<string, BirthdayCustomer> = {};
                birthdays.forEach(b => map[b.id] = b);
                setUpcomingBirthdaysMap(map);
            } catch (err) {
                console.error("Failed to load birthdays", err);
            }
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

    const handleDeleteClick = async (customer: Customer) => {
        try {
            const { hasDependencies, counts } = await customerService.checkDependencies(customer.id);

            setCustomerToDelete(customer);
            setDeleteCounts(counts);

            if (hasDependencies) {
                setDeleteAction('deactivate');
                setDeleteConfirmTitle('Inativar Cliente');
                setDeleteConfirmMessage(
                    `Este cliente possui movimentações operacionais (${counts.appointments} agendamento${counts.appointments !== 1 ? 's' : ''}, ${counts.workOrders} O.S., ${counts.transactions} transação${counts.transactions !== 1 ? 'ões' : ''}) e não pode ser excluído.\n\nDeseja inativar este cliente? Ele ficará oculto mas seus dados serão preservados.`
                );
            } else {
                setDeleteAction('delete');
                setDeleteConfirmTitle('Confirmar Exclusão');
                let message = `Tem certeza que deseja excluir o cliente "${customer.name}"?`;
                if (counts.vehicles > 0) {
                    message += `\n\n⚠️ Este cliente possui ${counts.vehicles} veículo${counts.vehicles > 1 ? 's' : ''} cadastrado${counts.vehicles > 1 ? 's' : ''}, que também ${counts.vehicles > 1 ? 'serão excluídos' : 'será excluído'}.`;
                }
                setDeleteConfirmMessage(message);
            }

            setShowDeleteConfirm(true);
        } catch (error: any) {
            console.error('Error checking dependencies:', error);
            toast.error('Erro ao verificar dependências do cliente');
        }
    };

    const handleDeleteConfirm = async () => {
        if (!customerToDelete) return;

        try {
            if (deleteAction === 'deactivate') {
                await customerService.toggleActive(customerToDelete.id, false);
                toast.success('Cliente inativado com sucesso');
            } else {
                if (deleteCounts && deleteCounts.vehicles > 0) {
                    await customerService.deleteVehicles(customerToDelete.id);
                }

                await customerService.delete(customerToDelete.id);

                if (deleteCounts && deleteCounts.vehicles > 0) {
                    toast.success(`Cliente e ${deleteCounts.vehicles} veículo${deleteCounts.vehicles > 1 ? 's' : ''} excluído${deleteCounts.vehicles > 1 ? 's' : ''} com sucesso`);
                } else {
                    toast.success('Cliente excluído com sucesso');
                }
            }

            setShowDeleteConfirm(false);
            setCustomerToDelete(null);
            setDeleteCounts(null);
            loadCustomers();
        } catch (error: any) {
            console.error('Error deleting/deactivating customer:', error);
            toast.error('Erro ao processar solicitação');
        }
    };

    const handleDeleteCancel = () => {
        setShowDeleteConfirm(false);
        setCustomerToDelete(null);
        setDeleteCounts(null);
    };

    const handleActivate = async (customer: Customer) => {
        if (!confirm(`Deseja reativar o cliente "${customer.name}"?`)) {
            return;
        }

        try {
            await customerService.toggleActive(customer.id, true);
            toast.success('Cliente reativado com sucesso');
            loadCustomers();
        } catch (error: any) {
            console.error('Error activating customer:', error);
            toast.error('Erro ao reativar cliente');
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

            {/* Stats */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
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
                <div className="rounded-lg bg-white p-4 shadow-sm">
                    <p className="text-sm font-medium text-gray-500">Individuais</p>
                    <p className="mt-1 text-2xl font-bold text-blue-600">
                        {customers.filter((c) => c.customer_type === 'individual').length}
                    </p>
                </div>
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

                    {/* Show Inactive Toggle */}
                    <div className="flex items-center">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={showInactive}
                                onChange={(e) => setShowInactive(e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                            <span className="text-sm text-gray-700">Mostrar inativos</span>
                        </label>
                    </div>
                </div>
            </div>

            {/* Table */}
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
                <>
                    {/* Mobile Card View */}
                    <div className="md:hidden space-y-3">
                        {filteredCustomers.map((customer) => (
                            <div
                                key={customer.id}
                                className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 space-y-3 cursor-pointer select-none ring-offset-2 focus:ring-2 focus:ring-primary-500 transition-all active:scale-[0.99]"
                                onClick={() => {
                                    const now = Date.now();
                                    if (now - lastTap < 300) {
                                        handleEdit(customer);
                                        setLastTap(0);
                                    } else {
                                        setLastTap(now);
                                    }
                                }}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className="font-bold text-gray-900 flex items-center gap-2">
                                        {customer.name}
                                        {customer.vip && <Crown className="w-4 h-4 text-yellow-500 fill-yellow-500" />}
                                        {upcomingBirthdaysMap[customer.id] && (
                                            <Cake
                                                className={`w-4 h-4 ${upcomingBirthdaysMap[customer.id].is_today ? 'text-pink-500 animate-bounce' : 'text-pink-300'}`}
                                            />
                                        )}
                                    </span>
                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${customer.customer_type === 'individual'
                                        ? 'bg-blue-100 text-blue-800'
                                        : 'bg-purple-100 text-purple-800'
                                        }`}>
                                        {customer.customer_type === 'individual' ? 'PF' : 'PJ'}
                                    </span>
                                </div>
                                <div className="space-y-2 text-sm text-gray-600">
                                    {customer.phone && (
                                        <div className="flex items-center gap-2">
                                            <Phone className="h-4 w-4 text-gray-400" />
                                            <span>{maskPhone(customer.phone)}</span>
                                        </div>
                                    )}
                                    {customer.email && (
                                        <div className="flex items-center gap-2">
                                            <Mail className="h-4 w-4 text-gray-400" />
                                            <span className="truncate">{customer.email}</span>
                                        </div>
                                    )}
                                    {customer.cpf && (
                                        <div className="flex items-center gap-2">
                                            <FileText className="h-4 w-4 text-gray-400" />
                                            <span>{maskCPF(customer.cpf)}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                                    <div>
                                        {!customer.is_active && (
                                            <span className="badge badge-gray text-xs">Inativo</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleEdit(customer); }}
                                            className="p-2 text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
                                        >
                                            <Edit2 className="h-4 w-4" />
                                        </button>
                                        {customer.is_active ? (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDeleteClick(customer); }}
                                                className="p-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        ) : (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleActivate(customer); }}
                                                className="p-2 text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                                            >
                                                <Check className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Desktop Table View */}
                    <div className="hidden md:block card overflow-hidden">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Nome / Contato</th>
                                    <th className="hidden md:table-cell">CPF</th>
                                    <th>Tipo</th>
                                    <th className="text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredCustomers.map((customer) => (
                                    <tr
                                        key={customer.id}
                                        onDoubleClick={() => handleEdit(customer)}
                                        className="hover:bg-gray-50 transition-colors"
                                    >
                                        <td>
                                            <div className="flex flex-col">
                                                <div className="font-medium text-gray-900 flex items-center gap-2">
                                                    {customer.name}
                                                    {customer.vip && (
                                                        <div title="Cliente VIP">
                                                            <Crown className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                                        </div>
                                                    )}
                                                    {!customer.is_active && (
                                                        <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs">Inativo</span>
                                                    )}
                                                    {upcomingBirthdaysMap[customer.id] && (
                                                        <div className="relative group">
                                                            <Cake
                                                                className={`w-4 h-4 cursor-help ${upcomingBirthdaysMap[customer.id].is_today ? 'text-pink-500 animate-bounce' : 'text-pink-300'}`}
                                                            />
                                                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                                                                {upcomingBirthdaysMap[customer.id].is_today ? "Aniversário Hoje!" : `Em ${upcomingBirthdaysMap[customer.id].days_until} dias`}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="text-sm text-gray-500 mt-0.5">
                                                    {maskPhone(customer.phone)}
                                                </div>
                                                {customer.email && (
                                                    <div className="text-xs text-gray-400 hidden md:block">
                                                        {customer.email}
                                                    </div>
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
                                                {customer.is_active ? (
                                                    <button
                                                        onClick={() => handleDeleteClick(customer)}
                                                        className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                                                        title="Excluir"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleActivate(customer)}
                                                        className="rounded-lg p-2 text-green-600 hover:bg-green-50"
                                                        title="Ativar"
                                                    >
                                                        <Check className="h-4 w-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {/* Modal */}
            <CustomerModal
                isOpen={isModalOpen}
                onClose={handleModalClose}
                customer={selectedCustomer}
                onSuccess={loadCustomers}
            />

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                isOpen={showDeleteConfirm}
                title={deleteConfirmTitle}
                message={deleteConfirmMessage}
                confirmText={deleteAction === 'deactivate' ? 'Inativar' : 'Excluir'}
                cancelText="Cancelar"
                onConfirm={handleDeleteConfirm}
                onCancel={handleDeleteCancel}
                danger
            />
        </div>
    );
};
