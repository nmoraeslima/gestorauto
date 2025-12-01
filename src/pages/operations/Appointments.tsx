import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
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
} from 'lucide-react';
import { AppointmentModal } from '@/components/operations/AppointmentModal';
import { formatDate, formatTime } from '@/utils/datetime';
import type { Appointment } from '@/types/database';
import toast from 'react-hot-toast';

interface AppointmentWithDetails extends Appointment {
    customer?: { name: string };
    vehicle?: { brand: string; model: string; license_plate: string };
}

export default function Appointments() {
    const { user } = useAuth();
    const [appointments, setAppointments] = useState<AppointmentWithDetails[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [dateFilter, setDateFilter] = useState<string>('all'); // 'all', 'today', 'upcoming', 'past'
    const [showModal, setShowModal] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

    useEffect(() => {
        loadAppointments();
    }, [user]);

    const loadAppointments = async () => {
        if (!user?.company?.id) return;

        setLoading(true);
        const { data, error } = await supabase
            .from('appointments')
            .select(`
                *,
                customer:customers(name),
                vehicle:vehicles(brand, model, license_plate)
            `)
            .eq('company_id', user.company.id)
            .order('scheduled_at', { ascending: true });

        if (!error && data) {
            setAppointments(data as AppointmentWithDetails[]);
        }
        setLoading(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este agendamento?')) return;

        const { error } = await supabase.from('appointments').delete().eq('id', id);

        if (error) {
            toast.error('Erro ao excluir agendamento');
        } else {
            toast.success('Agendamento excluído com sucesso');
            loadAppointments();
        }
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

    const handleSuccess = () => {
        loadAppointments();
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
            scheduled: { label: 'Agendado', className: 'badge-blue' },
            confirmed: { label: 'Confirmado', className: 'badge-green' },
            in_progress: { label: 'Em Andamento', className: 'badge-yellow' },
            completed: { label: 'Concluído', className: 'badge-primary' },
            cancelled: { label: 'Cancelado', className: 'badge-red' },
        };

        const badge = badges[status] || badges.scheduled;
        return <span className={`badge ${badge.className}`}>{badge.label}</span>;
    };

    // Stats
    const stats = {
        total: appointments.length,
        scheduled: appointments.filter((a) => a.status === 'scheduled').length,
        confirmed: appointments.filter((a) => a.status === 'confirmed').length,
        today: appointments.filter((a) => {
            const date = new Date(a.scheduled_at);
            const today = new Date();
            return date.toDateString() === today.toDateString();
        }).length,
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-secondary-600">Agendamentos</h1>
                    <p className="text-neutral-500 mt-1">
                        Gerencie os agendamentos de serviços
                    </p>
                </div>
                <button onClick={handleCreate} className="btn btn-primary">
                    <Plus className="w-5 h-5 mr-2" />
                    Novo Agendamento
                </button>
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
                            <p className="text-sm text-neutral-500">Hoje</p>
                            <p className="text-2xl font-bold text-primary-300">{stats.today}</p>
                        </div>
                        <Clock className="w-8 h-8 text-primary-300" />
                    </div>
                </div>
                <div className="card p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-neutral-500">Agendados</p>
                            <p className="text-2xl font-bold text-blue-600">{stats.scheduled}</p>
                        </div>
                        <CalendarIcon className="w-8 h-8 text-blue-600" />
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
                            <option value="scheduled">Agendado</option>
                            <option value="confirmed">Confirmado</option>
                            <option value="in_progress">Em Andamento</option>
                            <option value="completed">Concluído</option>
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
                                            <div className="flex items-center gap-2">
                                                <User className="w-4 h-4 text-neutral-400" />
                                                <div>
                                                    <p className="font-medium">{appointment.customer?.name || '-'}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        {getStatusBadge(appointment.status)}
                                                        {appointment.vehicle && (
                                                            <p className="text-sm text-neutral-500">
                                                                {appointment.vehicle.brand} {appointment.vehicle.model} - {appointment.vehicle.license_plate}
                                                            </p>
                                                        )}
                                                    </div>
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
                                                <button
                                                    onClick={() => handleDelete(appointment.id)}
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

            {/* Modal */}
            <AppointmentModal
                isOpen={showModal}
                onClose={handleModalClose}
                appointment={selectedAppointment}
                onSuccess={handleSuccess}
            />
        </div>
    );
}
