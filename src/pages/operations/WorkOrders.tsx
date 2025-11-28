import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import {
    FileText,
    Plus,
    Search,
    Filter,
    User,
    Car,
    Edit2,
    Eye,
    DollarSign,
    Calendar,
    CheckCircle,
    Trash2,
} from 'lucide-react';
import { WorkOrderModal } from '@/components/operations/WorkOrderModal';
import { formatDate } from '@/utils/datetime';
import { formatCurrency } from '@/utils/calculations';
import type { WorkOrder } from '@/types/database';
import toast from 'react-hot-toast';

interface WorkOrderWithDetails extends WorkOrder {
    customer?: { name: string };
    vehicle?: { brand: string; model: string; license_plate: string };
}

export default function WorkOrders() {
    const { user } = useAuth();
    const [workOrders, setWorkOrders] = useState<WorkOrderWithDetails[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [showModal, setShowModal] = useState(false);
    const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(null);

    useEffect(() => {
        loadWorkOrders();
    }, [user]);

    const loadWorkOrders = async () => {
        if (!user?.company?.id) return;

        setLoading(true);
        const { data, error } = await supabase
            .from('work_orders')
            .select(`
                *,
                customer:customers(name),
                vehicle:vehicles(brand, model, license_plate)
            `)
            .eq('company_id', user.company.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error loading work orders:', error);
            toast.error('Erro ao carregar ordens de serviço');
        } else if (data) {
            console.log('Loaded work orders:', data.length);
            setWorkOrders(data as WorkOrderWithDetails[]);
        }
        setLoading(false);
    };

    const handleCreate = () => {
        setSelectedWorkOrder(null);
        setShowModal(true);
    };

    const handleModalClose = () => {
        setShowModal(false);
        setSelectedWorkOrder(null);
    };

    const handleSuccess = () => {
        loadWorkOrders();
    };

    const handleEdit = (workOrder: WorkOrderWithDetails) => {
        setSelectedWorkOrder(workOrder);
        setShowModal(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir esta Ordem de Serviço?')) return;

        try {
            const { error } = await supabase
                .from('work_orders')
                .delete()
                .eq('id', id);

            if (error) throw error;

            toast.success('Ordem de Serviço excluída com sucesso');
            loadWorkOrders();
        } catch (error: any) {
            console.error('Error deleting work order:', error);
            toast.error('Erro ao excluir ordem de serviço');
        }
    };

    // Filter work orders
    const filteredWorkOrders = workOrders.filter((wo) => {
        const matchesSearch =
            wo.customer?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            wo.vehicle?.license_plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
            wo.id.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'all' || wo.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    // Get status badge
    const getStatusBadge = (status: string) => {
        const badges: Record<string, { label: string; className: string }> = {
            pending: { label: 'Pendente', className: 'badge-yellow' },
            in_progress: { label: 'Em Andamento', className: 'badge-blue' },
            completed: { label: 'Concluído', className: 'badge-green' },
            cancelled: { label: 'Cancelado', className: 'badge-red' },
        };

        const badge = badges[status] || badges.pending;
        return <span className={`badge ${badge.className}`}>{badge.label}</span>;
    };

    // Get payment status badge
    const getPaymentBadge = (status: string) => {
        const badges: Record<string, { label: string; className: string }> = {
            pending: { label: 'Pendente', className: 'badge-red' },
            partial: { label: 'Parcial', className: 'badge-yellow' },
            paid: { label: 'Pago', className: 'badge-green' },
        };

        const badge = badges[status] || badges.pending;
        return <span className={`badge ${badge.className}`}>{badge.label}</span>;
    };

    // Stats
    const stats = {
        total: workOrders.length,
        pending: workOrders.filter((wo) => wo.status === 'draft').length,
        inProgress: workOrders.filter((wo) => wo.status === 'in_progress').length,
        completed: workOrders.filter((wo) => wo.status === 'completed').length,
        totalRevenue: workOrders
            .filter((wo) => wo.status === 'completed')
            .reduce((sum, wo) => sum + (wo.total_amount || 0), 0),
        pendingPayment: workOrders
            .filter((wo) => wo.payment_status === 'pending')
            .reduce((sum, wo) => sum + (wo.total_amount || 0), 0),
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-secondary-600">Ordens de Serviço</h1>
                    <p className="text-neutral-500 mt-1">
                        Gerencie as ordens de serviço (O.S.)
                    </p>
                </div>
                <button onClick={handleCreate} className="btn btn-primary">
                    <Plus className="w-5 h-5 mr-2" />
                    Nova O.S.
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="card p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-neutral-500">Total</p>
                            <p className="text-2xl font-bold text-secondary-600">{stats.total}</p>
                        </div>
                        <FileText className="w-8 h-8 text-primary-300" />
                    </div>
                </div>
                <div className="card p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-neutral-500">Pendentes</p>
                            <p className="text-2xl font-bold text-warning-600">{stats.pending}</p>
                        </div>
                        <Calendar className="w-8 h-8 text-warning-600" />
                    </div>
                </div>
                <div className="card p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-neutral-500">Em Andamento</p>
                            <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
                        </div>
                        <FileText className="w-8 h-8 text-blue-600" />
                    </div>
                </div>
                <div className="card p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-neutral-500">Concluídas</p>
                            <p className="text-2xl font-bold text-success-600">{stats.completed}</p>
                        </div>
                        <CheckCircle className="w-8 h-8 text-success-600" />
                    </div>
                </div>
                <div className="card p-4 md:col-span-2">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-neutral-500">Receita Total</p>
                            <p className="text-xl font-bold text-primary-300">
                                {formatCurrency(stats.totalRevenue)}
                            </p>
                        </div>
                        <DollarSign className="w-8 h-8 text-primary-300" />
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="card p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Buscar por cliente, placa ou ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="input pl-10"
                        />
                    </div>
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="input pl-10"
                        >
                            <option value="all">Todos os Status</option>
                            <option value="draft">Pendente</option>
                            <option value="in_progress">Em Andamento</option>
                            <option value="completed">Concluído</option>
                            <option value="cancelled">Cancelado</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Work Orders List */}
            <div className="card overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center">
                        <div className="spinner mx-auto mb-4"></div>
                        <p className="text-neutral-500">Carregando ordens de serviço...</p>
                    </div>
                ) : filteredWorkOrders.length === 0 ? (
                    <div className="p-8 text-center text-neutral-500">
                        <FileText className="w-12 h-12 mx-auto mb-4 text-neutral-300" />
                        <p>Nenhuma ordem de serviço encontrada</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Data</th>
                                    <th>Cliente</th>
                                    <th>Valor</th>
                                    <th>Status</th>
                                    <th>Pagamento</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredWorkOrders.map((wo) => (
                                    <tr key={wo.id}>
                                        <td>
                                            <span className="font-mono text-sm text-neutral-600">
                                                #{wo.id.slice(0, 8)}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-neutral-400" />
                                                {formatDate(wo.entry_date)}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-2">
                                                <User className="w-4 h-4 text-neutral-400" />
                                                <div>
                                                    <p className="font-medium">{wo.customer?.name || '-'}</p>
                                                    {wo.vehicle && (
                                                        <p className="text-sm text-neutral-500">
                                                            {wo.vehicle.brand} {wo.vehicle.model} - {wo.vehicle.license_plate}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="font-semibold text-primary-300">
                                                {formatCurrency(wo.total_amount || 0)}
                                            </span>
                                        </td>
                                        <td>{getStatusBadge(wo.status)}</td>
                                        <td>{getPaymentBadge(wo.payment_status || 'pending')}</td>
                                        <td>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleEdit(wo)}
                                                    className="text-primary-300 hover:text-primary-400 p-2 hover:bg-primary-50 rounded-lg transition-colors"
                                                    title="Editar"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(wo.id)}
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
            <WorkOrderModal
                isOpen={showModal}
                onClose={handleModalClose}
                workOrder={selectedWorkOrder}
                onSuccess={handleSuccess}
            />
        </div>
    );
}
