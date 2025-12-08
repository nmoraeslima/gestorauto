import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
    Calendar as CalendarIcon,
    Plus,
    Search,
    Filter,
    Clock,
    User,
    Car,
    Edit2,
    Trash2,
    CheckCircle,
    X as XIcon,
} from 'lucide-react';
import { AppointmentModal } from '@/components/operations/AppointmentModal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import WhatsAppConfirmationModal from '@/components/whatsapp/WhatsAppConfirmationModal';
import WhatsAppCancellationModal from '@/components/whatsapp/WhatsAppCancellationModal';
import QuickWhatsAppButton from '@/components/whatsapp/QuickWhatsAppButton';
import { logWhatsAppMessage } from '@/utils/whatsapp-logging';
import { formatDate, formatTime } from '@/utils/datetime';
import { Appointment } from '@/types/database';
import { PLAN_LIMITS, SubscriptionPlan } from '@/types/database';
import { appointmentService, AppointmentWithDetails } from '@/services/appointmentService';
import toast from 'react-hot-toast';

export default function Appointments() {
    const { user } = useAuth();
    const [searchParams] = useSearchParams();
    const [appointments, setAppointments] = useState<AppointmentWithDetails[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [dateFilter, setDateFilter] = useState<string>('all'); // 'all', 'today', 'upcoming', 'past'
    const [showModal, setShowModal] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

    // WhatsApp modals
    const [showWhatsAppConfirmation, setShowWhatsAppConfirmation] = useState(false);
    const [showWhatsAppCancellation, setShowWhatsAppCancellation] = useState(false);
    const [whatsappAppointment, setWhatsappAppointment] = useState<any>(null);

    // Delete confirmation
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [appointmentToDelete, setAppointmentToDelete] = useState<string | null>(null);

    useEffect(() => {
        loadAppointments();
    }, [user, statusFilter, dateFilter, searchTerm]); // Trigger load on filters to use service filtering efficiently if needed, or just load once and filter in memory? 
    // The previous implementation loaded ONCE and filtered in render. 
    // But now I implemented filtering in the service.
    // Let's stick to the previous pattern of Client-Side filtering for responsiveness unless the dataset is huge, 
    // OR use the service's filtering capabilities. 
    // `appointmentService.list` SUPPORTS memory filtering options.
    // Let's use `appointmentService.list` with the options! This is cleaner.

    useEffect(() => {
        if (searchParams.get('new') === 'true') {
            setShowModal(true);
            setSelectedAppointment(null);
        }
    }, [searchParams]);

    const loadAppointments = async () => {
        if (!user?.company?.id) return;

        setLoading(true);
        try {
            const data = await appointmentService.list(user.company.id, {
                status: statusFilter,
                dateFilter: dateFilter as any,
                searchTerm: searchTerm
            });
            setAppointments(data);
        } catch (error) {
            console.error('Error loading appointments:', error);
            toast.error('Erro ao carregar agendamentos');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteClick = (id: string) => {
        setAppointmentToDelete(id);
        setShowDeleteConfirm(true);
    };

    const handleDeleteConfirm = async () => {
        if (!appointmentToDelete) return;

        try {
            await appointmentService.delete(appointmentToDelete);
            toast.success('Agendamento excluído com sucesso');
            setShowDeleteConfirm(false);
            setAppointmentToDelete(null);
            loadAppointments();
        } catch (error) {
            console.error('Error deleting appointment:', error);
            toast.error('Erro ao excluir agendamento');
        }
    };

    const handleDeleteCancel = () => {
        setShowDeleteConfirm(false);
        setAppointmentToDelete(null);
    };

    const handleEdit = (appointment: Appointment) => {
        setSelectedAppointment(appointment);
        setShowModal(true);
    };

    const handleCreate = () => {
        setSelectedAppointment(null);
        setShowModal(true);
    };

    const handleModalClose = () => {
        setShowModal(false);
        setSelectedAppointment(null);
    };

    const handleSuccess = async () => {
        await loadAppointments();

        // Get the newly created/updated appointment with full details
        if (selectedAppointment?.id) {
            try {
                // Use getById to get full details including relations
                const data = await appointmentService.getById(selectedAppointment.id);

                // Only show WhatsApp modal if status is 'confirmed' AND feature is enabled
                if (data && data.status === 'confirmed') {
                    const plan = user?.company?.subscription_plan || 'basic';
                    const canUseWhatsApp = PLAN_LIMITS[plan as SubscriptionPlan]?.features?.whatsapp_integration;

                    if (canUseWhatsApp) {
                        setWhatsappAppointment(data);
                        setShowWhatsAppConfirmation(true);
                    }
                }
            } catch (error) {
                console.error('Error fetching details for WA:', error);
            }
        }
    };

    const handleCancelClick = async (appointment: Appointment) => {
        try {
            // Fetch full appointment details for WhatsApp
            const data = await appointmentService.getById(appointment.id);

            if (data) {
                setWhatsappAppointment(data);
                setShowWhatsAppCancellation(true);
            }
        } catch (error) {
            console.error('Error fetching appointment details:', error);
            toast.error('Erro ao preparar cancelamento');
        }
    };

    const handleCancelConfirm = async (reason: string, customReason?: string) => {
        if (!whatsappAppointment) return;

        try {
            await appointmentService.update(whatsappAppointment.id, {
                status: 'cancelled',
                cancellation_reason: reason === 'Outro (especificar)' ? customReason : reason,
                cancelled_by: user?.id,
                cancelled_at: new Date().toISOString(),
            });

            // Log message (optional analytics)
            if (user?.company?.id && user?.id) {
                await logWhatsAppMessage({
                    appointmentId: whatsappAppointment.id,
                    customerName: whatsappAppointment.customer.name,
                    phone: whatsappAppointment.customer.phone,
                    messageType: 'cancellation',
                    messagePreview: `Cancelamento: ${reason}`,
                    companyId: user.company.id,
                    userId: user.id,
                });
            }

            loadAppointments();
        } catch (error) {
            console.error('Error cancelling appointment:', error);
            toast.error('Erro ao cancelar agendamento');
        }
    };

    // Filter appointments
    const filteredAppointments = appointments.filter((appointment) => {
        const matchesSearch =
            appointment.customer?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            appointment.vehicle?.license_plate.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'all' || appointment.status === statusFilter;

        let matchesDate = true;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const appointmentDate = new Date(appointment.scheduled_at);
        appointmentDate.setHours(0, 0, 0, 0);

        if (dateFilter === 'today') {
            matchesDate = appointmentDate.getTime() === today.getTime();
        } else if (dateFilter === 'upcoming') {
            matchesDate = appointmentDate.getTime() >= today.getTime();
        } else if (dateFilter === 'past') {
            matchesDate = appointmentDate.getTime() < today.getTime();
        }

        return matchesSearch && matchesStatus && matchesDate;
    });

    // Get status badge
    const getStatusBadge = (status: string) => {
        const badges: Record<string, { label: string; className: string }> = {
            pending: { label: 'Pendente', className: 'badge-yellow' },
            confirmed: { label: 'Confirmado', className: 'badge-green' },
            in_progress: { label: 'Em Andamento', className: 'badge-purple' },
            completed: { label: 'Concluído', className: 'badge-primary' },
            cancelled: { label: 'Cancelado', className: 'badge-red' },
        };

        const badge = badges[status] || badges.confirmed;
        return <span className={`badge ${badge.className}`}>{badge.label}</span>;
    };

    // Stats (based on filtered appointments)
    const stats = {
        total: filteredAppointments.length,
        pending: filteredAppointments.filter((a) => a.status === 'pending').length,
        confirmed: filteredAppointments.filter((a) => a.status === 'confirmed').length,
        cancelled: filteredAppointments.filter((a) => a.status === 'cancelled').length,
        today: filteredAppointments.filter((a) => {
            const date = new Date(a.scheduled_at);
            const today = new Date();
            return date.toDateString() === today.toDateString();
        }).length,
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-secondary-600">Agendamentos</h1>
                    <p className="text-neutral-500 mt-1">
                        Gerencie os agendamentos de serviços
                    </p>
                </div>
                <div className="flex gap-3">
                    <Link to="/tv-dashboard" className="btn btn-outline flex items-center gap-2">
                        <Clock className="w-5 h-5" />
                        Modo TV
                    </Link>
                    <button onClick={handleCreate} className="btn btn-primary flex items-center gap-2">
                        <Plus className="w-5 h-5" />
                        Novo Agendamento
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="card p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-neutral-500">Total</p>
                            <p className="text-2xl font-bold text-secondary-600">{stats.total}</p>
                        </div>
                        <CalendarIcon className="w-8 h-8 text-primary-300" />
                    </div>
                </div>
                <div className="card p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-neutral-500">Pendentes</p>
                            <p className="text-2xl font-bold text-warning-600">{stats.pending}</p>
                        </div>
                        <Clock className="w-8 h-8 text-warning-600" />
                    </div>
                </div>
                <div className="card p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-neutral-500">Confirmados</p>
                            <p className="text-2xl font-bold text-success-600">{stats.confirmed}</p>
                        </div>
                        <CheckCircle className="w-8 h-8 text-success-600" />
                    </div>
                </div>
                <div className="card p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-neutral-500">Cancelados</p>
                            <p className="text-2xl font-bold text-danger-600">{stats.cancelled}</p>
                        </div>
                        <XIcon className="w-8 h-8 text-danger-600" />
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="card p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Buscar por cliente ou placa..."
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
                            <option value="pending">Pendente</option>
                            <option value="confirmed">Confirmado</option>
                            <option value="cancelled">Cancelado</option>
                        </select>
                    </div>
                    <div className="relative">
                        <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
                        <select
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                            className="input pl-10"
                        >
                            <option value="all">Todas as Datas</option>
                            <option value="today">Hoje</option>
                            <option value="upcoming">Próximos</option>
                            <option value="past">Passados</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Appointments List */}
            <div className="card overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center">
                        <div className="spinner mx-auto mb-4"></div>
                        <p className="text-neutral-500">Carregando agendamentos...</p>
                    </div>
                ) : filteredAppointments.length === 0 ? (
                    <div className="p-8 text-center text-neutral-500">
                        <CalendarIcon className="w-12 h-12 mx-auto mb-4 text-neutral-300" />
                        <p>Nenhum agendamento encontrado</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Data/Hora</th>
                                    <th>Cliente</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredAppointments.map((appointment) => (
                                    <tr key={appointment.id}>
                                        <td>
                                            <div className="flex items-center gap-2">
                                                <CalendarIcon className="w-4 h-4 text-neutral-400" />
                                                <div>
                                                    <p className="font-medium">
                                                        {formatDate(appointment.scheduled_at)}
                                                    </p>
                                                    <p className="text-sm text-neutral-500">
                                                        {formatTime(appointment.scheduled_at)}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="flex flex-col gap-1">
                                                <p className="font-medium text-secondary-900">
                                                    {appointment.customer?.name || '-'}
                                                </p>
                                                {appointment.vehicle && (
                                                    <div className="flex items-center gap-1.5 text-sm text-neutral-600">
                                                        <Car className="w-3.5 h-3.5 text-neutral-400" />
                                                        <span>
                                                            {appointment.vehicle.brand} {appointment.vehicle.model} - {appointment.vehicle.license_plate}
                                                        </span>
                                                    </div>
                                                )}
                                                <div className="mt-1">
                                                    {getStatusBadge(appointment.status)}
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleEdit(appointment)}
                                                    className="text-primary-300 hover:text-primary-400 p-2 hover:bg-primary-50 rounded-lg transition-colors"
                                                    title="Editar"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>

                                                {appointment.status === 'confirmed' && appointment.customer?.phone && user?.company && (
                                                    <QuickWhatsAppButton
                                                        appointment={{ ...appointment, company: user.company } as any}
                                                        type="confirmation"
                                                        size="sm"
                                                    />
                                                )}

                                                {/* Cancel Button */}
                                                {appointment.status !== 'cancelled' && (
                                                    <button
                                                        onClick={() => handleCancelClick(appointment)}
                                                        className="text-danger-600 hover:text-danger-700 p-2 hover:bg-danger-50 rounded-lg transition-colors"
                                                        title="Cancelar agendamento"
                                                    >
                                                        <XIcon className="w-4 h-4" />
                                                    </button>
                                                )}

                                                <button
                                                    onClick={() => handleDeleteClick(appointment.id)}
                                                    className="text-danger-600 hover:text-danger-700 p-2 hover:bg-danger-50 rounded-lg transition-colors"
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

            {/* Appointment Modal */}
            <AppointmentModal
                isOpen={showModal}
                onClose={handleModalClose}
                appointment={selectedAppointment}
                onSuccess={handleSuccess}
            />

            {/* WhatsApp Confirmation Modal */}
            {showWhatsAppConfirmation && whatsappAppointment && user && (
                <WhatsAppConfirmationModal
                    appointment={{ ...whatsappAppointment, company: user.company }}
                    onClose={() => {
                        setShowWhatsAppConfirmation(false);
                        setWhatsappAppointment(null);
                    }}
                    onSent={async () => {
                        // Log message (optional analytics)
                        if (user?.company?.id && user?.id) {
                            await logWhatsAppMessage({
                                appointmentId: whatsappAppointment.id,
                                customerName: whatsappAppointment.customer.name,
                                phone: whatsappAppointment.customer.phone,
                                messageType: 'confirmation',
                                messagePreview: 'Agendamento confirmado',
                                companyId: user.company.id,
                                userId: user.id,
                            });
                        }
                    }}
                />
            )}

            {/* Filters */}
            <div className="card p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Buscar por cliente ou placa..."
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
                            <option value="pending">Pendente</option>
                            <option value="confirmed">Confirmado</option>
                            <option value="cancelled">Cancelado</option>
                        </select>
                    </div>
                    <div className="relative">
                        <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
                        <select
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                            className="input pl-10"
                        >
                            <option value="all">Todas as Datas</option>
                            <option value="today">Hoje</option>
                            <option value="upcoming">Próximos</option>
                            <option value="past">Passados</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Appointments List */}
            <div className="card overflow-hidden">
                {
                    loading ? (
                        <div className="p-8 text-center" >
                            <div className="spinner mx-auto mb-4"></div>
                            <p className="text-neutral-500">Carregando agendamentos...</p>
                        </div>
                    ) : filteredAppointments.length === 0 ? (
                        <div className="p-8 text-center text-neutral-500">
                            <CalendarIcon className="w-12 h-12 mx-auto mb-4 text-neutral-300" />
                            <p>Nenhum agendamento encontrado</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Data/Hora</th>
                                        <th>Cliente</th>
                                        <th>Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredAppointments.map((appointment) => (
                                        <tr key={appointment.id}>
                                            <td>
                                                <div className="flex items-center gap-2">
                                                    <CalendarIcon className="w-4 h-4 text-neutral-400" />
                                                    <div>
                                                        <p className="font-medium">
                                                            {formatDate(appointment.scheduled_at)}
                                                        </p>
                                                        <p className="text-sm text-neutral-500">
                                                            {formatTime(appointment.scheduled_at)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="flex flex-col gap-1">
                                                    <p className="font-medium text-secondary-900">
                                                        {appointment.customer?.name || '-'}
                                                    </p>
                                                    {appointment.vehicle && (
                                                        <div className="flex items-center gap-1.5 text-sm text-neutral-600">
                                                            <Car className="w-3.5 h-3.5 text-neutral-400" />
                                                            <span>
                                                                {appointment.vehicle.brand} {appointment.vehicle.model} - {appointment.vehicle.license_plate}
                                                            </span>
                                                        </div>
                                                    )}
                                                    <div className="mt-1">
                                                        {getStatusBadge(appointment.status)}
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleEdit(appointment)}
                                                        className="text-primary-300 hover:text-primary-400 p-2 hover:bg-primary-50 rounded-lg transition-colors"
                                                        title="Editar"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>

                                                    {appointment.status === 'confirmed' && appointment.customer?.phone && user?.company && (
                                                        <QuickWhatsAppButton
                                                            appointment={{ ...appointment, company: user.company } as any}
                                                            type="confirmation"
                                                            size="sm"
                                                        />
                                                    )}

                                                    {/* Cancel Button */}
                                                    {appointment.status !== 'cancelled' && (
                                                        <button
                                                            onClick={() => handleCancelClick(appointment)}
                                                            className="text-danger-600 hover:text-danger-700 p-2 hover:bg-danger-50 rounded-lg transition-colors"
                                                            title="Cancelar agendamento"
                                                        >
                                                            <XIcon className="w-4 h-4" />
                                                        </button>
                                                    )}

                                                    <button
                                                        onClick={() => handleDeleteClick(appointment.id)}
                                                        className="text-danger-600 hover:text-danger-700 p-2 hover:bg-danger-50 rounded-lg transition-colors"
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
                    )
                }
            </div>

            {/* Appointment Modal */}
            <AppointmentModal
                isOpen={showModal}
                onClose={handleModalClose}
                appointment={selectedAppointment}
                onSuccess={handleSuccess}
            />

            {/* WhatsApp Confirmation Modal */}
            {
                showWhatsAppConfirmation && whatsappAppointment && user && (
                    <WhatsAppConfirmationModal
                        appointment={{ ...whatsappAppointment, company: user.company }}
                        onClose={() => {
                            setShowWhatsAppConfirmation(false);
                            setWhatsappAppointment(null);
                        }}
                        onSent={async () => {
                            // Log message (optional analytics)
                            if (user?.company?.id && user?.id) {
                                await logWhatsAppMessage({
                                    appointmentId: whatsappAppointment.id,
                                    customerName: whatsappAppointment.customer.name,
                                    phone: whatsappAppointment.customer.phone,
                                    messageType: 'confirmation',
                                    messagePreview: 'Agendamento confirmado',
                                    companyId: user.company.id,
                                    userId: user.id,
                                });
                            }
                        }}
                    />
                )
            }

            {/* WhatsApp Cancellation Modal */}
            {
                showWhatsAppCancellation && whatsappAppointment && user && (
                    <WhatsAppCancellationModal
                        appointment={{ ...whatsappAppointment, company: user.company }}
                        onClose={() => {
                            setShowWhatsAppCancellation(false);
                            setWhatsappAppointment(null);
                        }}
                        onConfirm={handleCancelConfirm}
                        enableWhatsApp={
                            PLAN_LIMITS[(user?.company?.subscription_plan as SubscriptionPlan) || 'basic']?.features?.whatsapp_integration
                        }
                    />
                )
            }

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                isOpen={showDeleteConfirm}
                title="Confirmar Exclusão"
                message="Tem certeza que deseja excluir este agendamento? Esta ação não pode ser desfeita."
                confirmText="Excluir"
                cancelText="Cancelar"
                onConfirm={handleDeleteConfirm}
                onCancel={handleDeleteCancel}
                danger
            />
        </div >
    );
}
