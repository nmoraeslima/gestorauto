import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useBookingFlow } from '@/hooks/useBookingFlow';
import { ServiceSelector } from '@/components/booking/ServiceSelector';
import { DateTimePicker } from '@/components/booking/DateTimePicker';
import { CustomerForm } from '@/components/booking/CustomerForm';
import { BookingConfirmation } from '@/components/booking/BookingConfirmation';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import type { Service, Company } from '@/types/database';
import toast from 'react-hot-toast';

export default function PublicBooking() {
    const { company_slug } = useParams<{ company_slug: string }>();
    const navigate = useNavigate();

    const [company, setCompany] = useState<Company | null>(null);
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const {
        currentStep,
        data,
        updateData,
        goNext,
        goBack,
        reset,
        canGoNext,
        stepIndex,
        totalSteps,
    } = useBookingFlow(company?.id || '');

    // Load company and services
    useEffect(() => {
        loadCompanyData();
    }, [company_slug]);

    const loadCompanyData = async () => {
        if (!company_slug) {
            toast.error('Link inválido');
            return;
        }

        setLoading(true);

        try {
            // Load company
            const { data: companyData, error: companyError } = await supabase
                .from('companies')
                .select('*')
                .eq('slug', company_slug)
                .single();

            if (companyError) throw companyError;
            if (!companyData) throw new Error('Empresa não encontrada');

            // Check if booking is enabled
            const bookingSettings = companyData.booking_settings as any;
            if (!bookingSettings?.enabled) {
                toast.error('Agendamento online não disponível no momento');
                return;
            }

            setCompany(companyData);

            // Load active services
            const { data: servicesData, error: servicesError } = await supabase
                .from('services')
                .select('*')
                .eq('company_id', companyData.id)
                .eq('is_active', true)
                .order('name');

            if (servicesError) throw servicesError;
            setServices(servicesData || []);
        } catch (error: any) {
            console.error('Error loading booking data:', error);
            toast.error('Erro ao carregar dados de agendamento');
        } finally {
            setLoading(false);
        }
    };

    const handleServiceSelect = (service: Service) => {
        updateData({
            serviceId: service.id,
            serviceName: service.name,
            servicePrice: service.price,
            serviceDuration: service.duration_minutes,
        });
    };

    const handleFieldChange = (field: string, value: any) => {
        updateData({ [field]: value });
        // Clear error for this field
        if (errors[field]) {
            setErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const validateCustomerStep = () => {
        const newErrors: Record<string, string> = {};

        if (!data.customerName.trim()) {
            newErrors.customerName = 'Nome é obrigatório';
        }
        if (!data.customerPhone.trim()) {
            newErrors.customerPhone = 'WhatsApp é obrigatório';
        } else if (data.customerPhone.replace(/\D/g, '').length < 11) {
            newErrors.customerPhone = 'WhatsApp inválido';
        }
        if (!data.vehicleModel.trim()) {
            newErrors.vehicleModel = 'Modelo do veículo é obrigatório';
        }
        if (!data.vehiclePlate.trim()) {
            newErrors.vehiclePlate = 'Placa é obrigatória';
        } else if (data.vehiclePlate.length !== 7) {
            newErrors.vehiclePlate = 'Placa inválida';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = async () => {
        if (currentStep === 'customer') {
            if (!validateCustomerStep()) {
                return;
            }
            // Submit booking
            await handleSubmit();
        } else {
            goNext();
        }
    };

    const handleSubmit = async () => {
        if (!company) return;

        setSubmitting(true);

        try {
            // 1. Create or find customer
            let customerId: string;
            const { data: existingCustomer } = await supabase
                .from('customers')
                .select('id')
                .eq('company_id', company.id)
                .eq('phone', data.customerPhone.replace(/\D/g, ''))
                .single();

            if (existingCustomer) {
                customerId = existingCustomer.id;
            } else {
                const { data: newCustomer, error: customerError } = await supabase
                    .from('customers')
                    .insert({
                        company_id: company.id,
                        name: data.customerName,
                        phone: data.customerPhone.replace(/\D/g, ''),
                        email: data.customerEmail || null,
                        source: 'booking',
                    })
                    .select()
                    .single();

                if (customerError) throw customerError;
                customerId = newCustomer.id;
            }

            // 2. Create or find vehicle
            let vehicleId: string;
            const { data: existingVehicle } = await supabase
                .from('vehicles')
                .select('id')
                .eq('company_id', company.id)
                .eq('license_plate', data.vehiclePlate)
                .single();

            if (existingVehicle) {
                vehicleId = existingVehicle.id;
            } else {
                const { data: newVehicle, error: vehicleError } = await supabase
                    .from('vehicles')
                    .insert({
                        company_id: company.id,
                        customer_id: customerId,
                        brand: data.vehicleBrand || 'Não informado',
                        model: data.vehicleModel,
                        license_plate: data.vehiclePlate,
                        year: new Date().getFullYear(),
                    })
                    .select()
                    .single();

                if (vehicleError) throw vehicleError;
                vehicleId = newVehicle.id;
            }

            // 3. Create appointment
            const { data: appointment, error: appointmentError } = await supabase
                .from('appointments')
                .insert({
                    company_id: company.id,
                    customer_id: customerId,
                    vehicle_id: vehicleId,
                    title: `${data.serviceName} - ${data.customerName}`,
                    scheduled_at: data.selectedTime,
                    status: 'scheduled',
                    duration_minutes: data.serviceDuration,
                    notes: data.notes || null,
                })
                .select()
                .single();

            if (appointmentError) throw appointmentError;

            // 4. Link service to appointment
            const { error: serviceError } = await supabase.from('appointment_services').insert({
                appointment_id: appointment.id,
                service_id: data.serviceId,
                price: data.servicePrice,
                duration_minutes: data.serviceDuration,
            });

            if (serviceError) throw serviceError;

            // Success!
            updateData({ appointmentId: appointment.id });
            goNext(); // Go to confirmation
            toast.success('Agendamento realizado com sucesso!');
        } catch (error: any) {
            console.error('Error creating booking:', error);
            toast.error('Erro ao criar agendamento. Tente novamente.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-neutral-50">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-primary-300 mx-auto mb-4" />
                    <p className="text-neutral-600">Carregando...</p>
                </div>
            </div>
        );
    }

    if (!company) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-neutral-50">
                <div className="text-center">
                    <p className="text-xl text-neutral-600">Empresa não encontrada</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral-50 py-8 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-secondary-900">{company.name}</h1>
                    <p className="text-neutral-600 mt-2">Agende seu serviço online</p>
                </div>

                {/* Progress Steps */}
                {currentStep !== 'confirmation' && (
                    <div className="mb-8">
                        <div className="flex items-center justify-center gap-2">
                            {['Serviço', 'Data/Hora', 'Seus Dados'].map((label, index) => (
                                <React.Fragment key={label}>
                                    <div
                                        className={`flex items-center gap-2 ${index <= stepIndex ? 'text-primary-300' : 'text-neutral-400'
                                            }`}
                                    >
                                        <div
                                            className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${index <= stepIndex
                                                    ? 'bg-primary-300 text-white'
                                                    : 'bg-neutral-200 text-neutral-600'
                                                }`}
                                        >
                                            {index + 1}
                                        </div>
                                        <span className="text-sm font-medium hidden sm:inline">{label}</span>
                                    </div>
                                    {index < 2 && (
                                        <div
                                            className={`w-12 h-1 ${index < stepIndex ? 'bg-primary-300' : 'bg-neutral-200'
                                                }`}
                                        />
                                    )}
                                </React.Fragment>
                            ))}
                        </div>
                    </div>
                )}

                {/* Content */}
                <div className="bg-white rounded-lg shadow-lg p-6 md:p-8">
                    {currentStep === 'service' && (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold text-secondary-900">Escolha o Serviço</h2>
                            <ServiceSelector
                                services={services}
                                selectedServiceId={data.serviceId}
                                onSelect={handleServiceSelect}
                            />
                        </div>
                    )}

                    {currentStep === 'datetime' && (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold text-secondary-900">Escolha Data e Horário</h2>
                            <DateTimePicker
                                companyId={company.id}
                                serviceDuration={data.serviceDuration}
                                selectedDate={data.selectedDate}
                                selectedTime={data.selectedTime}
                                onDateSelect={(date) => handleFieldChange('selectedDate', date)}
                                onTimeSelect={(time) => handleFieldChange('selectedTime', time)}
                            />
                        </div>
                    )}

                    {currentStep === 'customer' && (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold text-secondary-900">Seus Dados</h2>
                            <CustomerForm
                                data={data}
                                onChange={handleFieldChange}
                                errors={errors}
                            />
                        </div>
                    )}

                    {currentStep === 'confirmation' && (
                        <BookingConfirmation
                            data={{
                                serviceName: data.serviceName,
                                servicePrice: data.servicePrice,
                                selectedDate: data.selectedDate!,
                                selectedTime: data.selectedTime!,
                                customerName: data.customerName,
                                customerPhone: data.customerPhone,
                                vehicleModel: data.vehicleModel,
                                vehiclePlate: data.vehiclePlate,
                            }}
                            companyName={company.name}
                            onNewBooking={reset}
                        />
                    )}
                </div>

                {/* Navigation */}
                {currentStep !== 'confirmation' && (
                    <div className="flex justify-between mt-6">
                        <button
                            onClick={goBack}
                            disabled={stepIndex === 0}
                            className="btn btn-outline flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            Voltar
                        </button>

                        <button
                            onClick={handleNext}
                            disabled={!canGoNext || submitting}
                            className="btn btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Processando...
                                </>
                            ) : currentStep === 'customer' ? (
                                <>
                                    Confirmar Agendamento
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            ) : (
                                <>
                                    Continuar
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
