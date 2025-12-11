import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
    FileText,
    Plus,
    Search,
    Filter,
    User,
    Calendar,
    CheckCircle,
    Trash2,
    Edit2,
    DollarSign,
    List as ListIcon,
    Loader2,
    Link as LinkIcon,
    Lock,
    Share2
} from 'lucide-react';
import { WorkOrderModal } from '@/components/operations/WorkOrderModal';
import WorkOrderWhatsAppModal from '@/components/whatsapp/WorkOrderWhatsAppModal';
import { StatusBadgeDropdown } from '@/components/operations/StatusBadgeDropdown';
import { formatDate } from '@/utils/datetime';
import { formatCurrency } from '@/utils/calculations';
import type { WorkOrder, SubscriptionPlan } from '@/types/database';
import { PLAN_LIMITS } from '@/types/database';
import toast from 'react-hot-toast';
import { workOrderService, WorkOrderWithDetails } from '@/services/workOrderService';

export default function WorkOrders() {
    const { user } = useAuth();
    const [searchParams] = useSearchParams();
    const [workOrders, setWorkOrders] = useState<WorkOrderWithDetails[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    // Removed viewMode state as we are single view (Responsive List/Card)
    const [showModal, setShowModal] = useState(false);
    const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(null);

    // WhatsApp Modal State
    const [showWhatsAppConfirmation, setShowWhatsAppConfirmation] = useState(false);
    const [completedWorkOrder, setCompletedWorkOrder] = useState<any>(null);
    const [lastTap, setLastTap] = useState(0);

    useEffect(() => {
        loadWorkOrders();
    }, [user]);

    useEffect(() => {
        if (searchParams.get('new') === 'true') {
            setShowModal(true);
            setSelectedWorkOrder(null);
        }
    }, [searchParams]);

    const loadWorkOrders = async () => {
        if (!user?.company?.id) return;

        setLoading(true);
        try {
            const data = await workOrderService.list(user.company.id);
            setWorkOrders(data);
        } catch (error) {
            console.error('Error loading work orders:', error);
            toast.error('Erro ao carregar ordens de serviço');
        } finally {
            setLoading(false);
        }
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
            await workOrderService.delete(id);
            toast.success('Ordem de Serviço excluída com sucesso');
            loadWorkOrders();
        } catch (error) {
            console.error('Error deleting work order:', error);
            toast.error('Erro ao excluir ordem de serviço');
        }
    };

    const handleWhatsAppShare = (workOrder: WorkOrderWithDetails) => {
        const plan = user?.company?.subscription_plan || 'basic';
        const canUseWhatsApp = PLAN_LIMITS[plan as SubscriptionPlan]?.features?.whatsapp_integration;

        if (!canUseWhatsApp) {
            window.dispatchEvent(new Event('openUpgradeModal'));
            return;
        }

        const url = `${window.location.origin}/tracker/${workOrder.id}`;
        const customerName = workOrder.customer?.name || 'Cliente';
        const vehicleModel = workOrder.vehicle?.model || 'seu veículo';

        const message = `Olá ${customerName}! 🚗\n\nAcesse o checklist e acompanhe o serviço do ${vehicleModel} em tempo real pelo nosso link exclusivo:\n\n${url}\n\nQualquer dúvida, estamos à disposição!`;

        const phone = workOrder.customer?.phone?.replace(/\D/g, '');
        const whatsappUrl = phone
            ? `https://wa.me/55${phone}?text=${encodeURIComponent(message)}`
            : `https://wa.me/?text=${encodeURIComponent(message)}`;

        window.open(whatsappUrl, '_blank');
    };

    const handleStatusChange = async (id: string, newStatus: string) => {
        // Optimistic update
        const oldWorkOrders = [...workOrders];
        const targetWO = workOrders.find(wo => wo.id === id);

        if (!targetWO || targetWO.status === newStatus) return;

        // Optimistic UI update
        setWorkOrders(prev => prev.map(wo => {
            if (wo.id === id) {
                return { ...wo, status: newStatus as any };
            }
            return wo;
        }));

        try {
            // Get full details *before* updating if moving to completed (for WhatsApp)
            let workOrderForMessage = null;
            if (newStatus === 'completed') {
                const fullData = await workOrderService.getById(id);
                if (fullData) {
                    workOrderForMessage = {
                        ...fullData,
                        services: fullData.services?.map((s: any) => ({
                            name: s.service_name,
                            quantity: s.quantity
                        })) || [],
                        company: user?.company
                    };
                }
            }

            await workOrderService.update(id, { status: newStatus });
            toast.success(`Status atualizado para ${newStatus === 'completed' ? 'Concluído' : newStatus === 'in_progress' ? 'Em Andamento' : 'Pendente'}`);

            if (newStatus === 'completed') {
                // Reload to populate server-side fields
                loadWorkOrders();

                // Trigger WhatsApp if enabled and data is available
                const plan = user?.company?.subscription_plan || 'basic';
                const canUseWhatsApp = PLAN_LIMITS[plan as SubscriptionPlan]?.features?.whatsapp_integration;

                if (canUseWhatsApp && workOrderForMessage) {
                    setCompletedWorkOrder(workOrderForMessage);
                    setShowWhatsAppConfirmation(true);
                }
            }
        } catch (error) {
            console.error('Error updating status:', error);
            toast.error('Erro ao atualizar status');
            setWorkOrders(oldWorkOrders); // Revert on error
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
            .reduce((sum, wo) => {
                return sum + (Number(wo.total) || 0);
            }, 0),
        pendingPayment: workOrders
            .filter((wo) => wo.payment_status === 'pending')
            .reduce((sum, wo) => sum + (Number(wo.total) || 0), 0),
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
                <div className="flex flex-col md:flex-row gap-4 justify-between">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </div>

            {/* Work Orders Content */}
            {loading ? (
                <div className="p-12 text-center flex flex-col items-center justify-center">
                    <Loader2 className="w-10 h-10 text-primary-300 animate-spin mb-4" />
                    <p className="text-neutral-500">Carregando ordens de serviço...</p>
                </div>
            ) : (
                <>
                    {/* Mobile Card View (md:hidden) */}
                    <div className="md:hidden space-y-4">
                        {filteredWorkOrders.length === 0 ? (
                            <div className="card p-8 text-center text-neutral-500">
                                <FileText className="w-12 h-12 mx-auto mb-4 text-neutral-300" />
                                <p>Nenhuma ordem de serviço encontrada</p>
                            </div>
                        ) : (
                            filteredWorkOrders.map((wo) => (
                                <div
                                    key={wo.id}
                                    className="card p-4 space-y-3 cursor-pointer select-none ring-offset-2 focus:ring-2 focus:ring-primary-500 transition-all active:scale-[0.99]"
                                    onClick={(e) => {
                                        const now = Date.now();
                                        if (now - lastTap < 300) {
                                            handleEdit(wo);
                                            setLastTap(0);
                                        } else {
                                            setLastTap(now);
                                        }
                                    }}
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-semibold text-neutral-800">{wo.customer?.name || 'Cliente sem nome'}</h3>
                                            <div className="text-sm text-neutral-500 flex items-center gap-1 mt-1">
                                                <User className="w-3 h-3" />
                                                {wo.vehicle ? `${wo.vehicle.brand} ${wo.vehicle.model}` : 'Veículo não informado'}
                                            </div>
                                            <div className="text-xs text-neutral-400 mt-1">
                                                {wo.vehicle?.license_plate}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="font-bold text-primary-600 block">
                                                {formatCurrency(wo.total || 0)}
                                            </span>
                                            <div className="mt-1">
                                                {getPaymentBadge(wo.payment_status || 'pending')}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between text-sm text-neutral-500 border-t border-neutral-100 pt-3">
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono text-xs bg-neutral-100 px-2 py-1 rounded">#{wo.order_number}</span>
                                            <span className="flex items-center gap-1 text-xs">
                                                <Calendar className="w-3 h-3" />
                                                {formatDate(wo.entry_date)}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between border-t border-neutral-100 pt-3">
                                        <div className="flex-1 mr-4">
                                            <StatusBadgeDropdown
                                                currentStatus={wo.status}
                                                onStatusChange={(newStatus) => handleStatusChange(wo.id, newStatus)}
                                                align="left"
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleWhatsAppShare(wo)}
                                                className="btn btn-secondary text-xs py-1 px-3 flex items-center gap-2"
                                                title={user?.company?.subscription_plan === 'basic' ? 'Disponível no plano Profissional' : 'Enviar Link por WhatsApp'}
                                            >
                                                <Share2 className="w-3 h-3" />
                                                Enviar Link
                                                {user?.company?.subscription_plan === 'basic' && <Lock className="w-3 h-3 text-amber-500 ml-1" />}
                                            </button>
                                            <button
                                                onClick={() => handleEdit(wo)}
                                                className="p-2 text-primary-600 bg-primary-50 rounded-lg"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(wo.id)}
                                                className="p-2 text-red-600 bg-red-50 rounded-lg"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Desktop Table View (hidden until md) */}
                    <div className="hidden md:block card overflow-hidden">
                        {filteredWorkOrders.length === 0 ? (
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
                                            <tr
                                                key={wo.id}
                                                className="hover:bg-gray-50 transition-colors cursor-default"
                                                onDoubleClick={() => handleEdit(wo)}
                                            >
                                                <td>
                                                    <span className="font-mono text-sm text-neutral-600">
                                                        #{wo.order_number}
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
                                                        {formatCurrency(wo.total || 0)}
                                                    </span>
                                                </td>
                                                <td>
                                                    <StatusBadgeDropdown
                                                        currentStatus={wo.status}
                                                        onStatusChange={(newStatus) => handleStatusChange(wo.id, newStatus)}
                                                        align="left"
                                                    />
                                                </td>
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
                </>
            )}

            {/* Modal */}
            <WorkOrderModal
                isOpen={showModal}
                onClose={handleModalClose}
                workOrder={selectedWorkOrder}
                onSuccess={handleSuccess}
            />

            {/* WhatsApp Confirmation Modal */}
            {showWhatsAppConfirmation && completedWorkOrder && (
                <WorkOrderWhatsAppModal
                    workOrder={completedWorkOrder}
                    onClose={() => {
                        setShowWhatsAppConfirmation(false);
                        setCompletedWorkOrder(null);
                    }}
                    onSent={() => {
                        toast.success('✅ Notificação WhatsApp enviada!');
                    }}
                />
            )}
        </div>
    );
}
