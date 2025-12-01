import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { X, Calendar as CalendarIcon, Clock, User, Car as CarIcon, FileText, Tag, Search } from 'lucide-react';
import type { Customer, Vehicle, Appointment, Service } from '@/types/database';
import toast from 'react-hot-toast';

interface AppointmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    appointment?: Appointment | null;
    onSuccess: () => void;
}

export const AppointmentModal: React.FC<AppointmentModalProps> = ({
    isOpen,
    onClose,
    appointment,
    onSuccess,
}) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    const [serviceSearch, setServiceSearch] = useState('');
    const [showServiceDropdown, setShowServiceDropdown] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        customer_id: '',
        vehicle_id: '',
        service_ids: [] as string[],
        scheduled_date: '',
        scheduled_time: '',
        duration_minutes: 60,
        status: 'scheduled' as 'pending' | 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled',
        notes: '',
    });

    useEffect(() => {
        if (isOpen && user?.company?.id) {
            loadData();
        }

        // Reset form when modal closes
        if (!isOpen) {
            setFormData({
                title: '',
                customer_id: '',
                vehicle_id: '',
                service_ids: [],
                scheduled_date: '',
                scheduled_time: '',
                duration_minutes: 60,
                status: 'scheduled' as 'pending' | 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled',
                notes: '',
            });
            setVehicles([]);
            setServiceSearch('');
            setShowServiceDropdown(false);
        }
    }, [isOpen, user]);

    useEffect(() => {
        if (appointment) {
            const scheduledDate = new Date(appointment.scheduled_at);

            // Load appointment services
            const loadAppointmentServices = async () => {
                const { data } = await supabase
                    .from('appointment_services')
                    .select('service_id')
                    .eq('appointment_id', appointment.id);

                if (data) {
                    const serviceIds = data.map(s => s.service_id);
                    setFormData(prev => ({
                        ...prev,
                        service_ids: serviceIds
                    }));
                }
            };

            loadAppointmentServices();

            setFormData({
                title: appointment.title,
                customer_id: appointment.customer_id,
                vehicle_id: appointment.vehicle_id || '',
                service_ids: [], // Will be updated by loadAppointmentServices
                scheduled_date: scheduledDate.toISOString().split('T')[0],
                scheduled_time: scheduledDate.toTimeString().slice(0, 5),
                duration_minutes: appointment.duration_minutes || 60,
                status: appointment.status as any,
                notes: appointment.description || '',
            });
            if (appointment.customer_id) {
                loadVehicles(appointment.customer_id);
            }
        } else {
            // Reset form for new appointment
            setFormData({
                title: '',
                customer_id: '',
                vehicle_id: '',
                service_ids: [],
                scheduled_date: '',
                scheduled_time: '',
                duration_minutes: 60,
                status: 'scheduled' as 'pending' | 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled',
                notes: '',
            });
            setVehicles([]);
            setServiceSearch('');
            setShowServiceDropdown(false);
        }
    }, [appointment]);

    const loadData = async () => {
        if (!user?.company?.id) return;

        // Load customers
        const { data: customersData } = await supabase
            .from('customers')
            .select('*')
            .eq('company_id', user.company.id)
            .order('name');

        if (customersData) setCustomers(customersData);

        // Load services
        const { data: servicesData } = await supabase
            .from('services')
            .select('*')
            .eq('company_id', user.company.id)
            .eq('is_active', true)
            .order('name');

        if (servicesData) setServices(servicesData);
    };

    const loadVehicles = async (customerId: string) => {
        const { data } = await supabase
            .from('vehicles')
            .select('*')
            .eq('customer_id', customerId)
            .order('model');

        if (data) setVehicles(data);
    };

    const handleCustomerChange = (customerId: string) => {
        setFormData({ ...formData, customer_id: customerId, vehicle_id: '' });
        if (customerId) {
            loadVehicles(customerId);
        } else {
            setVehicles([]);
        }
    };

    const handleServiceToggle = (serviceId: string) => {
        const currentServices = formData.service_ids;
        let newServices: string[];

        if (currentServices.includes(serviceId)) {
            newServices = currentServices.filter(id => id !== serviceId);
        } else {
            newServices = [...currentServices, serviceId];
        }

        // Calculate new duration and generate title
        const selectedServicesList = services.filter(s => newServices.includes(s.id));
        const totalDuration = selectedServicesList.reduce((acc, curr) => acc + curr.duration_minutes, 0);
        const newTitle = selectedServicesList.map(s => s.name).join(' + ');

        setFormData({
            ...formData,
            service_ids: newServices,
            duration_minutes: totalDuration || 60,
            title: newTitle
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.company?.id) return;

        setLoading(true);

        try {
            // Combine date and time
            const scheduledDateTime = new Date(
                `${formData.scheduled_date}T${formData.scheduled_time}`
            );

            const appointmentData = {
                company_id: user.company.id,
                title: formData.title,
                customer_id: formData.customer_id,
                vehicle_id: formData.vehicle_id || null,
                scheduled_at: scheduledDateTime.toISOString(),
                duration_minutes: formData.duration_minutes,
                status: formData.status,
                description: formData.notes || null,
            };

            let appointmentId = appointment?.id;

            if (appointment) {
                // Update
                const { error } = await supabase
                    .from('appointments')
                    .update(appointmentData)
                    .eq('id', appointment.id);

                if (error) throw error;
                toast.success('Agendamento atualizado com sucesso!');
            } else {
                // Create
                const { data, error } = await supabase
                    .from('appointments')
                    .insert(appointmentData)
                    .select()
                    .single();

                if (error) throw error;
                appointmentId = data.id;
                toast.success('Agendamento criado com sucesso!');
            }

            // Update services
            if (appointmentId) {
                // First delete existing services
                if (appointment) {
                    await supabase
                        .from('appointment_services')
                        .delete()
                        .eq('appointment_id', appointmentId);
                }

                // Insert new services
                if (formData.service_ids.length > 0) {
                    const servicesToInsert = formData.service_ids.map(serviceId => {
                        const service = services.find(s => s.id === serviceId);
                        return {
                            appointment_id: appointmentId,
                            service_id: serviceId,
                            price: service?.price || 0,
                            duration_minutes: service?.duration_minutes || 0
                        };
                    });

                    const { error: servicesError } = await supabase
                        .from('appointment_services')
                        .insert(servicesToInsert);

                    if (servicesError) throw servicesError;
                }
            }

            onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Error saving appointment:', error);
            toast.error(error.message || 'Erro ao salvar agendamento');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
                <div className="fixed inset-0 transition-opacity bg-secondary-900 bg-opacity-75" onClick={onClose} />

                <div className="relative inline-block w-full max-w-2xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-card">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-semibold text-secondary-600">
                            {appointment ? 'Editar Agendamento' : 'Novo Agendamento'}
                        </h3>
                        <button
                            onClick={onClose}
                            className="text-neutral-400 hover:text-neutral-600 transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Services Selection */}
                        <div className="relative">
                            <label className="label mb-2">
                                <Tag className="w-4 h-4 inline mr-2" />
                                Serviços *
                            </label>

                            {/* Selected Services Tags */}
                            <div className="flex flex-wrap gap-2 mb-2">
                                {formData.service_ids.map(id => {
                                    const service = services.find(s => s.id === id);
                                    if (!service) return null;
                                    return (
                                        <span key={id} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-primary-100 text-primary-800">
                                            {service.name}
                                            <button
                                                type="button"
                                                onClick={() => handleServiceToggle(id)}
                                                className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-primary-400 hover:bg-primary-200 hover:text-primary-500 focus:outline-none"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </span>
                                    );
                                })}
                            </div>

                            {/* Search Input */}
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Buscar e adicionar serviços..."
                                    className="input pl-10"
                                    value={serviceSearch}
                                    onChange={(e) => setServiceSearch(e.target.value)}
                                    onFocus={() => setShowServiceDropdown(true)}
                                />
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-4 h-4" />
                            </div>

                            {/* Dropdown Results */}
                            {showServiceDropdown && (
                                <>
                                    <div
                                        className="fixed inset-0 z-10"
                                        onClick={() => setShowServiceDropdown(false)}
                                    />
                                    <div className="absolute z-20 w-full mt-1 bg-white border border-secondary-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                        {services
                                            .filter(s =>
                                                !formData.service_ids.includes(s.id) &&
                                                s.name.toLowerCase().includes(serviceSearch.toLowerCase())
                                            )
                                            .length === 0 ? (
                                            <div className="p-3 text-sm text-secondary-500 text-center">
                                                Nenhum serviço encontrado
                                            </div>
                                        ) : (
                                            services
                                                .filter(s =>
                                                    !formData.service_ids.includes(s.id) &&
                                                    s.name.toLowerCase().includes(serviceSearch.toLowerCase())
                                                )
                                                .map((service) => (
                                                    <button
                                                        key={service.id}
                                                        type="button"
                                                        onClick={() => {
                                                            handleServiceToggle(service.id);
                                                            setServiceSearch('');
                                                            // Keep dropdown open for multiple selection or close? 
                                                            // User wants to avoid expanding screen, so maybe keep open is better for flow, 
                                                            // but closing feels cleaner. Let's keep open but focus input.
                                                        }}
                                                        className="w-full text-left px-4 py-3 hover:bg-secondary-50 transition-colors border-b border-secondary-100 last:border-0 flex justify-between items-center"
                                                    >
                                                        <div>
                                                            <p className="font-medium text-secondary-900">{service.name}</p>
                                                            <p className="text-xs text-secondary-500">{service.duration_minutes} min</p>
                                                        </div>
                                                        <span className="text-sm font-medium text-primary-600">
                                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(service.price)}
                                                        </span>
                                                    </button>
                                                ))
                                        )}
                                    </div>
                                </>
                            )}

                            {formData.title && (
                                <p className="mt-2 text-xs text-secondary-500">
                                    Resumo: {formData.title}
                                </p>
                            )}
                        </div>

                        {/* Customer Selection */}
                        <div>
                            <label className="label">
                                <User className="w-4 h-4 inline mr-2" />
                                Cliente *
                            </label>
                            <select
                                required
                                value={formData.customer_id}
                                onChange={(e) => handleCustomerChange(e.target.value)}
                                className="input"
                            >
                                <option value="">Selecione um cliente</option>
                                {customers.map((customer) => (
                                    <option key={customer.id} value={customer.id}>
                                        {customer.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Vehicle Selection */}
                        <div>
                            <label className="label">
                                <CarIcon className="w-4 h-4 inline mr-2" />
                                Veículo *
                            </label>
                            <select
                                required
                                value={formData.vehicle_id}
                                onChange={(e) =>
                                    setFormData({ ...formData, vehicle_id: e.target.value })
                                }
                                className="input"
                                disabled={!formData.customer_id}
                            >
                                <option value="">Selecione um veículo</option>
                                {vehicles.map((vehicle) => (
                                    <option key={vehicle.id} value={vehicle.id}>
                                        {vehicle.brand} {vehicle.model} - {vehicle.license_plate}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Date and Time */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="label">
                                    <CalendarIcon className="w-4 h-4 inline mr-2" />
                                    Data *
                                </label>
                                <input
                                    type="date"
                                    required
                                    value={formData.scheduled_date}
                                    onChange={(e) =>
                                        setFormData({ ...formData, scheduled_date: e.target.value })
                                    }
                                    className="input"
                                />
                            </div>
                            <div>
                                <label className="label">
                                    <Clock className="w-4 h-4 inline mr-2" />
                                    Horário *
                                </label>
                                <input
                                    type="time"
                                    required
                                    value={formData.scheduled_time}
                                    onChange={(e) =>
                                        setFormData({ ...formData, scheduled_time: e.target.value })
                                    }
                                    className="input"
                                />
                            </div>
                        </div>

                        {/* Duration and Status */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="label">Duração (minutos)</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={formData.duration_minutes}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            duration_minutes: parseInt(e.target.value) || 60,
                                        })
                                    }
                                    className="input"
                                />
                            </div>
                            <div>
                                <label className="label">Status</label>
                                <select
                                    value={formData.status}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            status: e.target.value as any,
                                        })
                                    }
                                    className="input"
                                    disabled={formData.status === 'in_progress' || formData.status === 'completed'}
                                >
                                    <option value="pending">Pendente</option>
                                    <option value="scheduled">Agendado</option>
                                    <option value="confirmed">Confirmado</option>
                                    <option value="cancelled">Cancelado</option>
                                    {(formData.status === 'in_progress' || formData.status === 'completed') && (
                                        <>
                                            <option value="in_progress">Em Andamento (Gerido pela O.S.)</option>
                                            <option value="completed">Concluído (Gerido pela O.S.)</option>
                                        </>
                                    )}
                                </select>
                                {(formData.status === 'in_progress' || formData.status === 'completed') && (
                                    <p className="text-xs text-neutral-500 mt-1">
                                        Status gerenciado pela Ordem de Serviço.
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Notes */}
                        <div>
                            <label className="label">
                                <FileText className="w-4 h-4 inline mr-2" />
                                Observações
                            </label>
                            <textarea
                                rows={3}
                                value={formData.notes}
                                onChange={(e) =>
                                    setFormData({ ...formData, notes: e.target.value })
                                }
                                className="input"
                                placeholder="Observações sobre o agendamento..."
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200">
                            <button
                                type="button"
                                onClick={onClose}
                                className="btn btn-secondary"
                                disabled={loading}
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={loading}
                            >
                                {loading ? 'Salvando...' : appointment ? 'Atualizar' : 'Criar Agendamento'}
                            </button>
                        </div>

                        {/* Approval Actions */}
                        {appointment?.status === 'pending' && (
                            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 mb-4">
                                <h4 className="font-bold text-yellow-800 mb-2">Aprovação Necessária</h4>
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setFormData({ ...formData, status: 'scheduled' });
                                        }}
                                        className="btn bg-green-600 hover:bg-green-700 text-white flex-1"
                                    >
                                        Aprovar Agendamento
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, status: 'cancelled' })}
                                        className="btn bg-red-100 hover:bg-red-200 text-red-700 flex-1"
                                    >
                                        Rejeitar
                                    </button>
                                </div>
                                <p className="text-xs text-yellow-700 mt-2 text-center">
                                    Selecione uma ação e clique em "Atualizar" para confirmar.
                                </p>
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </div>
    );
};
