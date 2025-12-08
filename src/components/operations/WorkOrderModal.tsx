import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
    X,
    User,
    Car as CarIcon,
    FileText,
    DollarSign,
    Save,
    AlertTriangle,
    Calendar,
    PlusCircle,
    Link as LinkIcon,
    Camera,
    Lock
} from 'lucide-react';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { ServiceSelector } from './ServiceSelector';
import { ProductSelector } from './ProductSelector';
import { PhotoManager } from '../workOrder/PhotoManager';
import { formatCurrency, calculateWorkOrderTotal } from '@/utils/calculations';
import { WorkOrderStatus, PLAN_LIMITS, SubscriptionPlan } from '@/types/database';
import type { Customer, Vehicle, WorkOrder, Appointment } from '@/types/database';
import toast from 'react-hot-toast';
import { formatDate, formatTime, toISOLocal } from '@/utils/datetime';

import WorkOrderWhatsAppModal from '@/components/whatsapp/WorkOrderWhatsAppModal';
import { workOrderService, CreateWorkOrderDTO } from '@/services/workOrderService';
import { customerService } from '@/services/customerService';
import { appointmentService, AppointmentWithDetails } from '@/services/appointmentService';

interface WorkOrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    workOrder?: WorkOrder | null;
    onSuccess: () => void;
}

interface ServiceItem {
    service_id: string;
    service_name: string;
    quantity: number;
    price: number;
    notes?: string;
}

interface ProductItem {
    product_id: string;
    product_name: string;
    quantity: number;
    available_stock: number;
    unit?: string;
}

interface WorkOrderFormData {
    appointment_id: string;
    customer_id: string;
    vehicle_id: string;
    status: WorkOrderStatus;
    entry_date: string;
    expected_completion_date: string;
    fuel_level: number;
    odometer: string;
    damage_notes: string;
    customer_belongings: string;
    internal_notes: string;
    customer_notes: string;
    discount: number;
    discount_type: 'percentage' | 'fixed';
    payment_method: string;
    payment_status: string;
}

export const WorkOrderModal: React.FC<WorkOrderModalProps> = ({
    isOpen,
    onClose,
    workOrder,
    onSuccess,
}) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [appointments, setAppointments] = useState<AppointmentWithDetails[]>([]);
    const [activeTab, setActiveTab] = useState<'basic' | 'services' | 'products' | 'photos' | 'financial'>(
        'basic'
    );
    const [creationMode, setCreationMode] = useState<'link' | 'create'>('link');

    const [formData, setFormData] = useState<WorkOrderFormData>({
        appointment_id: '',
        customer_id: '',
        vehicle_id: '',
        status: WorkOrderStatus.DRAFT,
        entry_date: new Date().toISOString().split('T')[0],
        expected_completion_date: '',
        fuel_level: 50,
        odometer: '',
        damage_notes: '',
        customer_belongings: '',
        internal_notes: '',
        customer_notes: '',
        discount: 0,
        discount_type: 'percentage',
        payment_method: 'cash',
        payment_status: 'pending',
    });

    const [selectedServices, setSelectedServices] = useState<ServiceItem[]>([]);
    const [selectedProducts, setSelectedProducts] = useState<ProductItem[]>([]);

    // WhatsApp Modal State
    const [showWhatsAppConfirmation, setShowWhatsAppConfirmation] = useState(false);
    const [completedWorkOrder, setCompletedWorkOrder] = useState<any>(null);

    useEffect(() => {
        if (isOpen && user?.company?.id) {
            loadAppointments();
            loadCustomers();
        }

        // Reset state when modal closes
        if (!isOpen) {
            setActiveTab('basic');
            setCreationMode('link');
            setFormData({
                appointment_id: '',
                customer_id: '',
                vehicle_id: '',
                status: WorkOrderStatus.DRAFT,
                entry_date: new Date().toISOString().split('T')[0],
                expected_completion_date: '',
                fuel_level: 50,
                odometer: '',
                damage_notes: '',
                customer_belongings: '',
                internal_notes: '',
                customer_notes: '',
                discount: 0,
                discount_type: 'percentage',
                payment_method: 'cash',
                payment_status: 'pending',
            });
            setSelectedServices([]);
            setSelectedProducts([]);
            setVehicles([]);
        }
    }, [isOpen, user]);

    // Reset form when mode changes
    useEffect(() => {
        if (workOrder) {
            setCreationMode('link');
            setFormData({
                appointment_id: workOrder.appointment_id || '',
                customer_id: workOrder.customer_id,
                vehicle_id: workOrder.vehicle_id,
                status: workOrder.status as any,
                entry_date: toISOLocal(workOrder.entry_date).split('T')[0],
                expected_completion_date: workOrder.expected_completion_date
                    ? toISOLocal(workOrder.expected_completion_date).split('T')[0]
                    : '',
                fuel_level: workOrder.fuel_level || 50,
                odometer: workOrder.odometer?.toString() || '',
                damage_notes: workOrder.damage_notes || '',
                customer_belongings: workOrder.customer_belongings || '',
                internal_notes: workOrder.internal_notes || '',
                customer_notes: workOrder.customer_notes || '',
                discount: workOrder.discount || 0,
                discount_type: (workOrder.discount_type as any) || 'percentage',
                payment_method: (workOrder.payment_method as any) || 'credit_card', // Default to avoid null
                payment_status: (workOrder.payment_status as any) || 'pending',
            });
            loadWorkOrderDetails(workOrder.id);
        } else if (creationMode === 'create') {
            setFormData((prev) => ({
                ...prev,
                appointment_id: '',
                customer_id: '',
                vehicle_id: '',
            }));
            setVehicles([]);
        } else {
            // Reset to defaults for new link mode
            setFormData({
                appointment_id: '',
                customer_id: '',
                vehicle_id: '',
                status: WorkOrderStatus.DRAFT,
                entry_date: new Date().toISOString().split('T')[0],
                expected_completion_date: '',
                fuel_level: 50,
                odometer: '',
                damage_notes: '',
                customer_belongings: '',
                internal_notes: '',
                customer_notes: '',
                discount: 0,
                discount_type: 'percentage',
                payment_method: 'cash',
                payment_status: 'pending',
            });
            setSelectedServices([]);
            setSelectedProducts([]);
        }
    }, [creationMode, workOrder]);

    const loadWorkOrderDetails = async (workOrderId: string) => {
        try {
            const data = await workOrderService.getById(workOrderId);
            if (data) {
                if (data.services) {
                    setSelectedServices(
                        data.services.map((s: any) => ({
                            service_id: s.service_id,
                            service_name: s.service_name,
                            quantity: s.quantity,
                            price: s.unit_price || 0,
                            notes: s.notes,
                        }))
                    );
                }
                if (data.products) {
                    setSelectedProducts(
                        data.products.map((p: any) => ({
                            product_id: p.product_id,
                            product_name: p.product_name,
                            quantity: p.quantity,
                            available_stock: 999, // Assumption
                            unit: p.product?.unit,
                        }))
                    );
                }

                // If editing, load vehicles for this customer
                if (data.customer_id) {
                    loadVehicles(data.customer_id);
                }
            }
        } catch (error) {
            console.error('Error loading details:', error);
            toast.error('Erro ao carregar detalhes da ordem de serviço');
        }
    };

    const loadAppointments = async () => {
        if (!user?.company?.id) return;
        try {
            const data = await appointmentService.listOpen(user.company.id);
            if (data) setAppointments(data);
        } catch (error) {
            console.error('Error loading appointments:', error);
        }
    };

    const loadCustomers = async () => {
        if (!user?.company?.id) return;
        try {
            const data = await customerService.list(user.company.id);
            if (data) setCustomers(data);
        } catch (error) {
            console.error('Error loading customers:', error);
        }
    };

    const loadVehicles = async (customerId: string) => {
        try {
            const data = await customerService.getVehicles(customerId);
            if (data) setVehicles(data);
        } catch (error) {
            console.error('Error loading vehicles:', error);
        }
    };

    const handleAppointmentChange = async (appointmentId: string) => {
        const appointment = appointments.find((a) => a.id === appointmentId);
        if (appointment) {
            setFormData({
                ...formData,
                appointment_id: appointmentId,
                customer_id: appointment.customer_id,
                vehicle_id: appointment.vehicle_id || '',
                entry_date: new Date(appointment.scheduled_at).toISOString().split('T')[0],
            });
            loadVehicles(appointment.customer_id);

            // Load appointment services
            try {
                // We use getById from appointmentService to get services
                const appData = await appointmentService.getById(appointmentId);
                if (appData && appData.services) {
                    const servicesToAdd: ServiceItem[] = appData.services.map((item: any) => ({
                        service_id: item.service_id,
                        service_name: item.service.name,
                        quantity: 1,
                        price: item.price,
                    }));
                    setSelectedServices(servicesToAdd);
                }
            } catch (error) {
                console.error('Error loading appointment services:', error);
            }
        } else {
            setFormData({
                ...formData,
                appointment_id: '',
                customer_id: '',
                vehicle_id: '',
            });
            setVehicles([]);
            setSelectedServices([]);
        }
    };

    const handleCustomerChange = (customerId: string) => {
        setFormData({ ...formData, customer_id: customerId, vehicle_id: '' });
        if (customerId) {
            loadVehicles(customerId);
        } else {
            setVehicles([]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.company?.id) return;

        // Validation
        if (creationMode === 'link' && !formData.appointment_id) {
            toast.error('Selecione um agendamento para vincular');
            return;
        }

        if (creationMode === 'create' && (!formData.customer_id || !formData.vehicle_id)) {
            toast.error('Selecione o cliente e o veículo');
            return;
        }

        if (selectedServices.length === 0 && selectedProducts.length === 0) {
            toast.error('Adicione pelo menos um serviço ou produto');
            return;
        }

        setLoading(true);

        try {
            let finalAppointmentId = formData.appointment_id;

            // If creating new appointment automatically
            if (creationMode === 'create') {
                const customer = customers.find(c => c.id === formData.customer_id);
                const vehicle = vehicles.find(v => v.id === formData.vehicle_id);
                const title = `O.S. - ${customer?.name} - ${vehicle?.model}`;

                const appointmentData = {
                    company_id: user.company.id,
                    customer_id: formData.customer_id,
                    vehicle_id: formData.vehicle_id,
                    title: title,
                    scheduled_at: toISOLocal(formData.entry_date),
                    status: 'in_progress',
                    duration_minutes: 60,
                    services: selectedServices.map(s => ({
                        service_id: s.service_id,
                        price: s.price,
                        duration_minutes: 60
                    }))
                };

                const newAppointment = await appointmentService.create(appointmentData);
                finalAppointmentId = newAppointment.id;
            }

            // Calculate totals
            const totals = calculateWorkOrderTotal(
                selectedServices,
                [],
                formData.discount,
                formData.discount_type === 'percentage'
            );

            // Prepare DTO
            const dto: CreateWorkOrderDTO = {
                company_id: user.company.id,
                appointment_id: finalAppointmentId,
                customer_id: formData.customer_id,
                vehicle_id: formData.vehicle_id,
                status: formData.status,
                entry_date: toISOLocal(formData.entry_date),
                expected_completion_date: formData.expected_completion_date
                    ? toISOLocal(formData.expected_completion_date)
                    : null,
                fuel_level: formData.fuel_level,
                odometer: formData.odometer ? parseInt(formData.odometer) : undefined,
                damage_notes: formData.damage_notes || undefined,
                customer_belongings: formData.customer_belongings || undefined,
                internal_notes: formData.internal_notes || undefined,
                customer_notes: formData.customer_notes || undefined,
                discount: formData.discount,
                discount_type: formData.discount_type,
                payment_method: formData.payment_method,
                payment_status: formData.payment_status,
                subtotal: totals.subtotal,
                total: totals.total,
                items: {
                    services: selectedServices.map(s => ({
                        service_id: s.service_id,
                        service_name: s.service_name,
                        quantity: s.quantity,
                        unit_price: s.price,
                        notes: s.notes
                    })),
                    products: selectedProducts.map(p => ({
                        product_id: p.product_id,
                        product_name: p.product_name,
                        quantity: p.quantity
                    }))
                }
            };

            let newWorkOrder;
            if (workOrder) {
                newWorkOrder = await workOrderService.update(workOrder.id, dto);
            } else {
                newWorkOrder = await workOrderService.create(dto);
            }

            toast.success(workOrder ? 'Ordem de Serviço atualizada!' : 'Ordem de Serviço criada com sucesso!');

            // Send WhatsApp notification if work order was completed
            if (formData.status === 'completed') {
                const plan = user?.company?.subscription_plan || 'basic';
                const canUseWhatsApp = PLAN_LIMITS[plan as SubscriptionPlan]?.features?.whatsapp_integration;

                if (canUseWhatsApp) {
                    const customer = customers.find(c => c.id === formData.customer_id);
                    const vehicle = vehicles.find(v => v.id === formData.vehicle_id);

                    if (customer) {
                        setCompletedWorkOrder({
                            ...newWorkOrder,
                            customer,
                            vehicle,
                            services: selectedServices.map(s => ({ name: s.service_name, quantity: s.quantity })),
                            company: user.company
                        });
                        setShowWhatsAppConfirmation(true);
                        setLoading(false);
                        return; // Don't close modal yet
                    }
                }
            }

            onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Error creating work order:', error);
            toast.error(error.message || 'Erro ao criar ordem de serviço');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    if (showWhatsAppConfirmation && completedWorkOrder) {
        return (
            <WorkOrderWhatsAppModal
                workOrder={completedWorkOrder}
                onClose={() => {
                    setShowWhatsAppConfirmation(false);
                    setCompletedWorkOrder(null);
                    onSuccess();
                    onClose();
                }}
                onSent={() => {
                    toast.success('✅ Notificação WhatsApp enviada!');
                }}
            />
        );
    }

    // Calculate totals (only services, products don't have price in WO context usually for calculation here, wait, logic says products price is 0? Yes confirmed in original code)
    const totals = calculateWorkOrderTotal(
        selectedServices,
        [],
        formData.discount,
        formData.discount_type === 'percentage'
    );

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-0 pt-0 pb-0 text-center sm:px-4 sm:pt-4 sm:pb-20 sm:p-0">
                <div className="fixed inset-0 transition-opacity bg-secondary-900 bg-opacity-75" onClick={onClose} />

                <div className="relative inline-block w-full h-full sm:h-auto max-w-5xl p-4 sm:p-6 my-0 sm:my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-none sm:rounded-card flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-semibold text-secondary-600">
                            {workOrder ? 'Editar Ordem de Serviço' : 'Nova Ordem de Serviço'}
                        </h3>
                        <div className="flex items-center gap-2">
                            {workOrder && (
                                <button
                                    onClick={() => {
                                        // Feature Gate Check
                                        const plan = user?.company?.subscription_plan || 'basic';
                                        const canUseWhatsApp = PLAN_LIMITS[plan as SubscriptionPlan]?.features?.whatsapp_integration;

                                        if (!canUseWhatsApp) {
                                            window.dispatchEvent(new Event('openUpgradeModal'));
                                            return;
                                        }

                                        const url = `${window.location.origin}/tracker/${workOrder.id}`;
                                        const customerName = customers.find(c => c.id === workOrder.customer_id)?.name || 'Cliente';
                                        const vehicleModel = vehicles.find(v => v.id === workOrder.vehicle_id)?.model || 'seu veículo';

                                        const message = `Olá ${customerName}! 🚗\n\nAcompanhe o serviço do ${vehicleModel} em tempo real pelo nosso link exclusivo:\n\n${url}\n\nQualquer dúvida, estamos à disposição!`;

                                        // Get customer phone if available
                                        const customer = customers.find(c => c.id === workOrder.customer_id);
                                        const phone = customer?.phone?.replace(/\D/g, '');

                                        const whatsappUrl = phone
                                            ? `https://wa.me/55${phone}?text=${encodeURIComponent(message)}`
                                            : `https://wa.me/?text=${encodeURIComponent(message)}`;

                                        window.open(whatsappUrl, '_blank');
                                    }}
                                    className="btn btn-secondary text-xs py-1 px-3 flex items-center gap-2"
                                    title={user?.company?.subscription_plan === 'basic' ? 'Disponível no plano Profissional' : 'Enviar Link por WhatsApp'}
                                >
                                    <LinkIcon className="w-3 h-3" />
                                    Enviar no WhatsApp
                                    {user?.company?.subscription_plan === 'basic' && <Lock className="w-3 h-3 text-amber-500 ml-1" />}
                                </button>
                            )}
                            <button
                                onClick={onClose}
                                className="text-neutral-400 hover:text-neutral-600 transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-2 mb-6 border-b border-neutral-200 overflow-x-auto pb-1 sm:pb-0">
                        <button
                            onClick={() => setActiveTab('basic')}
                            className={`px-4 py-2 font-medium transition-colors border-b-2 whitespace-nowrap ${activeTab === 'basic'
                                ? 'border-primary-300 text-primary-300'
                                : 'border-transparent text-neutral-500 hover:text-neutral-700'
                                }`}
                        >
                            Informações Básicas
                        </button>
                        <button
                            onClick={() => setActiveTab('services')}
                            className={`px-4 py-2 font-medium transition-colors border-b-2 whitespace-nowrap ${activeTab === 'services'
                                ? 'border-primary-300 text-primary-300'
                                : 'border-transparent text-neutral-500 hover:text-neutral-700'
                                }`}
                        >
                            Serviços ({selectedServices.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('products')}
                            className={`px-4 py-2 font-medium transition-colors border-b-2 whitespace-nowrap ${activeTab === 'products'
                                ? 'border-primary-300 text-primary-300'
                                : 'border-transparent text-neutral-500 hover:text-neutral-700'
                                }`}
                        >
                            Produtos ({selectedProducts.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('photos')}
                            className={`px-4 py-2 font-medium transition-colors border-b-2 whitespace-nowrap ${activeTab === 'photos'
                                ? 'border-primary-300 text-primary-300'
                                : 'border-transparent text-neutral-500 hover:text-neutral-700'
                                }`}
                        >
                            <Camera className="w-4 h-4 inline-block mr-1" />
                            Fotos
                        </button>
                        <button
                            onClick={() => setActiveTab('financial')}
                            className={`px-4 py-2 font-medium transition-colors border-b-2 whitespace-nowrap ${activeTab === 'financial'
                                ? 'border-primary-300 text-primary-300'
                                : 'border-transparent text-neutral-500 hover:text-neutral-700'
                                }`}
                        >
                            Financeiro
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Basic Information Tab */}
                        {activeTab === 'basic' && (
                            <div className="space-y-4 max-h-[500px] overflow-y-auto">
                                {/* Creation Mode Toggle */}
                                {!workOrder && (
                                    <div className="flex flex-col sm:flex-row gap-4 p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="creationMode"
                                                checked={creationMode === 'link'}
                                                onChange={() => setCreationMode('link')}
                                                className="text-primary-600 focus:ring-primary-500"
                                            />
                                            <span className="flex items-center gap-2 font-medium text-secondary-700">
                                                <LinkIcon className="w-4 h-4" />
                                                Vincular Agendamento
                                            </span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="creationMode"
                                                checked={creationMode === 'create'}
                                                onChange={() => setCreationMode('create')}
                                                className="text-primary-600 focus:ring-primary-500"
                                            />
                                            <span className="flex items-center gap-2 font-medium text-secondary-700">
                                                <PlusCircle className="w-4 h-4" />
                                                Novo Atendimento (Criar Agendamento)
                                            </span>
                                        </label>
                                    </div>
                                )}

                                {/* Appointment Selection (Link Mode) */}
                                {creationMode === 'link' && (
                                    <div>
                                        <SearchableSelect
                                            label="Agendamento"
                                            icon={<Calendar className="w-4 h-4" />}
                                            required
                                            value={formData.appointment_id}
                                            onChange={handleAppointmentChange}
                                            options={appointments.map(a => ({
                                                value: a.id,
                                                label: `${formatDate(a.scheduled_at)} - ${a.customer?.name || 'N/A'}`,
                                                subLabel: `${a.vehicle?.brand} ${a.vehicle?.model} (${a.vehicle?.license_plate || 'Sem placa'})`
                                            }))}
                                            placeholder="Selecione um agendamento"
                                            disabled={!!workOrder}
                                            notFoundText="Nenhum agendamento encontrado"
                                        />
                                    </div>
                                )}

                                {/* Customer and Vehicle */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <SearchableSelect
                                            label="Cliente"
                                            icon={<User className="w-4 h-4" />}
                                            required
                                            value={formData.customer_id}
                                            onChange={handleCustomerChange}
                                            options={customers.map(c => ({
                                                value: c.id,
                                                label: c.name,
                                                subLabel: c.phone ? c.phone : undefined
                                            }))}
                                            placeholder="Selecione um cliente"
                                            disabled={creationMode === 'link'}
                                            notFoundText="Nenhum cliente encontrado"
                                            className={creationMode === 'link' ? 'bg-neutral-100' : ''}
                                        />
                                    </div>
                                    <div>
                                        <SearchableSelect
                                            label="Veículo"
                                            icon={<CarIcon className="w-4 h-4" />}
                                            required
                                            value={formData.vehicle_id}
                                            onChange={(value) => setFormData({ ...formData, vehicle_id: value })}
                                            options={vehicles.map(v => ({
                                                value: v.id,
                                                label: `${v.brand} ${v.model}`,
                                                subLabel: v.license_plate
                                            }))}
                                            placeholder="Selecione um veículo"
                                            disabled={creationMode === 'link' || !formData.customer_id}
                                            notFoundText="Nenhum veículo encontrado"
                                            className={creationMode === 'link' ? 'bg-neutral-100' : ''}
                                        />
                                    </div>
                                </div>

                                {/* Dates and Status */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div>
                                        <label className="label">Data de Entrada *</label>
                                        <input
                                            type="date"
                                            required
                                            value={formData.entry_date}
                                            onChange={(e) =>
                                                setFormData({ ...formData, entry_date: e.target.value })
                                            }
                                            className="input"
                                        />
                                    </div>
                                    <div>
                                        <label className="label">Previsão de Conclusão</label>
                                        <input
                                            type="date"
                                            value={formData.expected_completion_date}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    expected_completion_date: e.target.value,
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
                                                setFormData({ ...formData, status: e.target.value as any })
                                            }
                                            className="input"
                                        >
                                            <option value="draft">Pendente</option>
                                            <option value="in_progress">Em Andamento</option>
                                            <option value="completed">Concluído</option>
                                            <option value="cancelled">Cancelado</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Vehicle Checklist */}
                                <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
                                    <h4 className="font-medium text-secondary-600 mb-4">
                                        Checklist do Veículo
                                    </h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="label">Nível de Combustível (%)</label>
                                            <input
                                                type="range"
                                                min="0"
                                                max="100"
                                                value={formData.fuel_level}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        fuel_level: parseInt(e.target.value),
                                                    })
                                                }
                                                className="w-full"
                                            />
                                            <div className="text-center text-sm text-neutral-600 mt-1">
                                                {formData.fuel_level}%
                                            </div>
                                        </div>
                                        <div>
                                            <label className="label">Odômetro (km)</label>
                                            <input
                                                type="number"
                                                value={formData.odometer}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, odometer: e.target.value })
                                                }
                                                className="input"
                                                placeholder="Ex: 50000"
                                            />
                                        </div>
                                    </div>
                                    <div className="mt-4">
                                        <label className="label">Danos/Avarias</label>
                                        <textarea
                                            rows={2}
                                            value={formData.damage_notes}
                                            onChange={(e) =>
                                                setFormData({ ...formData, damage_notes: e.target.value })
                                            }
                                            className="input"
                                            placeholder="Descreva danos ou avarias existentes..."
                                        />
                                    </div>
                                    <div className="mt-4">
                                        <label className="label">Pertences do Cliente</label>
                                        <textarea
                                            rows={2}
                                            value={formData.customer_belongings}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    customer_belongings: e.target.value,
                                                })
                                            }
                                            className="input"
                                            placeholder="Liste pertences deixados no veículo..."
                                        />
                                    </div>
                                </div>

                                {/* Notes */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="label">Observações Internas</label>
                                        <textarea
                                            rows={3}
                                            value={formData.internal_notes}
                                            onChange={(e) =>
                                                setFormData({ ...formData, internal_notes: e.target.value })
                                            }
                                            className="input"
                                        />
                                    </div>
                                    <div>
                                        <label className="label">Observações do Cliente</label>
                                        <textarea
                                            rows={3}
                                            value={formData.customer_notes}
                                            onChange={(e) =>
                                                setFormData({ ...formData, customer_notes: e.target.value })
                                            }
                                            className="input"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Services Tab */}
                        {activeTab === 'services' && (
                            <div className="max-h-[500px] overflow-y-auto">
                                <ServiceSelector
                                    selectedServices={selectedServices}
                                    onChange={setSelectedServices}
                                />
                            </div>
                        )}

                        {/* Products Tab */}
                        {activeTab === 'products' && (
                            <div className="max-h-[500px] overflow-y-auto">
                                <ProductSelector
                                    selectedProducts={selectedProducts}
                                    onProductsChange={setSelectedProducts}
                                />
                            </div>
                        )}
                        {/* Photos Tab */}
                        {activeTab === 'photos' && workOrder?.id && (
                            <div className="space-y-4 max-h-[500px] overflow-y-auto">
                                <PhotoManager
                                    workOrderId={workOrder.id}
                                    disabled={loading}
                                />
                            </div>
                        )}

                        {activeTab === 'photos' && !workOrder?.id && (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <Camera className="w-16 h-16 text-neutral-400 mb-4" />
                                <h4 className="text-lg font-medium text-secondary-700 mb-2">
                                    Salve a O.S. primeiro
                                </h4>
                                <p className="text-neutral-600 max-w-md">
                                    As fotos só podem ser adicionadas após a Ordem de Serviço ser criada.
                                </p>
                            </div>
                        )}

                        {/* Financial Tab */}
                        {activeTab === 'financial' && (
                            <div className="space-y-4 max-h-[500px] overflow-y-auto">
                                {/* Discount */}
                                <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
                                    <h4 className="font-medium text-secondary-600 mb-4">Desconto</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="label">Tipo de Desconto</label>
                                            <select
                                                value={formData.discount_type}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        discount_type: e.target.value as any,
                                                    })
                                                }
                                                className="input"
                                            >
                                                <option value="percentage">Percentual (%)</option>
                                                <option value="fixed">Valor Fixo (R$)</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="label">Valor do Desconto</label>
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={formData.discount}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        discount: parseFloat(e.target.value) || 0,
                                                    })
                                                }
                                                className="input"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Payment */}
                                <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
                                    <h4 className="font-medium text-secondary-600 mb-4">Pagamento</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="label">Método de Pagamento</label>
                                            <select
                                                value={formData.payment_method}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        payment_method: e.target.value as any,
                                                    })
                                                }
                                                className="input"
                                            >
                                                <option value="cash">Dinheiro</option>
                                                <option value="credit_card">Cartão de Crédito</option>
                                                <option value="debit_card">Cartão de Débito</option>
                                                <option value="pix">PIX</option>
                                                <option value="bank_transfer">Transferência Bancária</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="label">Status do Pagamento</label>
                                            <select
                                                value={formData.payment_status}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        payment_status: e.target.value as any,
                                                    })
                                                }
                                                className="input"
                                            >
                                                <option value="pending">Pendente</option>
                                                <option value="partial">Parcial</option>
                                                <option value="paid">Pago</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Summary */}
                                <div className="bg-primary-50 rounded-lg p-6 border border-primary-200">
                                    <h4 className="font-semibold text-secondary-600 mb-4">
                                        Resumo Financeiro
                                    </h4>
                                    <div className="space-y-3">
                                        <div className="flex justify-between text-neutral-600">
                                            <span>Subtotal de Serviços:</span>
                                            <span className="font-medium">
                                                {formatCurrency(totals.servicesSubtotal)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-neutral-600">
                                            <span>Subtotal de Produtos:</span>
                                            <span className="font-medium">
                                                {formatCurrency(totals.productsSubtotal)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-neutral-600 pt-2 border-t border-primary-200">
                                            <span>Subtotal:</span>
                                            <span className="font-medium">
                                                {formatCurrency(totals.subtotal)}
                                            </span>
                                        </div>
                                        {formData.discount > 0 && (
                                            <div className="flex justify-between text-warning-600">
                                                <span>
                                                    Desconto (
                                                    {formData.discount_type === 'percentage'
                                                        ? `${formData.discount}%`
                                                        : 'Fixo'}
                                                    ):
                                                </span>
                                                <span className="font-medium">
                                                    -{formatCurrency(totals.discountAmount)}
                                                </span>
                                            </div>
                                        )}
                                        <div className="flex justify-between text-xl font-bold text-primary-300 pt-3 border-t-2 border-primary-300">
                                            <span>Total:</span>
                                            <span>{formatCurrency(totals.total)}</span>
                                        </div>
                                    </div>
                                </div>

                                {formData.status === 'completed' && selectedProducts.length > 0 && (
                                    <div className="bg-warning-50 rounded-lg p-4 border border-warning-200 flex items-start gap-3">
                                        <AlertTriangle className="w-5 h-5 text-warning-600 flex-shrink-0 mt-0.5" />
                                        <div className="text-sm text-warning-700">
                                            <p className="font-medium">Atenção!</p>
                                            <p className="mt-1">
                                                Ao marcar esta O.S. como "Concluída", os produtos selecionados
                                                serão automaticamente deduzidos do estoque.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex justify-between items-center pt-4 border-t border-neutral-200">
                            <div className="text-sm text-neutral-500">
                                Total: <span className="font-bold text-primary-300 text-lg ml-2">
                                    {formatCurrency(totals.total)}
                                </span>
                            </div>
                            <div className="flex gap-3">
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
                                    <Save className="w-5 h-5 mr-2" />
                                    {loading ? 'Salvando...' : workOrder ? 'Atualizar O.S.' : 'Criar O.S.'}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div >
        </div >
    );
};
