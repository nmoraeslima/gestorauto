import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useBookingFlow } from '@/hooks/useBookingFlow';
import { ServiceSelector } from '@/components/booking/ServiceSelector';
import { DateTimePicker } from '@/components/booking/DateTimePicker';
import { CustomerForm } from '@/components/booking/CustomerForm';
import { BookingConfirmation } from '@/components/booking/BookingConfirmation';
import { ArrowLeft, ArrowRight, Loader2, Sparkles, CalendarDays, UserCircle2 } from 'lucide-react';
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
            console.log('Starting booking via RPC...');

            const rpcParams = {
                p_company_id: company.id,
                p_customer_data: {
                    name: data.customerName,
                    phone: data.customerPhone,
                    email: data.customerEmail
                },
                p_vehicle_data: {
                    brand: data.vehicleBrand,
                    model: data.vehicleModel,
                    license_plate: data.vehiclePlate,
                    year: new Date().getFullYear()
                },
                p_appointment_data: {
                    title: `${data.serviceName} - ${data.customerName}`,
                    scheduled_at: data.selectedTime,
                    duration_minutes: data.serviceDuration,
                    notes: data.notes
                },
                p_service_data: {
                    service_id: data.serviceId,
                    price: data.servicePrice,
                    duration_minutes: data.serviceDuration
                }
            };

            const { data: result, error } = await supabase.rpc('create_booking', rpcParams);

            if (error) {
                console.error('RPC Error:', error);
                throw error;
            }

            if (!result.success) {
                console.error('Booking Logic Error:', result.error);
                throw new Error(result.error || 'Erro desconhecido ao criar agendamento');
            }

            console.log('Booking success:', result);

            // Success!
            updateData({ appointmentId: result.appointment_id });
            goNext(); // Go to confirmation
            toast.success('Agendamento realizado com sucesso!');
        } catch (error: any) {
            console.error('Error creating booking:', error);
            toast.error(error.message || 'Erro ao criar agendamento. Tente novamente.');
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
        <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 py-8 px-4 font-sans text-secondary-900">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="text-center mb-10 animate-in slide-in-from-top-4 duration-500">
                    <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-secondary-900 to-secondary-700">
                        {company.name}
                    </h1>
                    <p className="text-lg text-secondary-600 mt-2 font-medium">Agende seu serviço online em poucos passos</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Progress Steps */}
                        {currentStep !== 'confirmation' && (
                            <div className="bg-white/60 backdrop-blur-md rounded-2xl p-4 shadow-sm border border-white/20">
                                <div className="flex items-center justify-between px-2 sm:px-8">
                                    {['Serviço', 'Data/Hora', 'Seus Dados'].map((label, index) => (
                                        <div key={label} className="flex flex-col items-center gap-2 relative z-10">
                                            <div
                                                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${index <= stepIndex
                                                    ? 'bg-secondary-900 text-white shadow-lg scale-110'
                                                    : 'bg-white text-neutral-400 border border-neutral-200'
                                                    }`}
                                            >
                                                {index + 1}
                                            </div>
                                            <span className={`text-xs font-semibold uppercase tracking-wider transition-colors duration-300 ${index <= stepIndex ? 'text-secondary-900' : 'text-neutral-400'
                                                }`}>
                                                {label}
                                            </span>
                                        </div>
                                    ))}
                                    {/* Connecting Line */}
                                    <div className="absolute top-9 left-0 w-full h-0.5 bg-neutral-200 -z-0 hidden sm:block px-12 box-border">
                                        <div
                                            className="h-full bg-secondary-900 transition-all duration-500 ease-out"
                                            style={{ width: `${(stepIndex / 2) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step Content */}
                        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 p-6 md:p-8 animate-in fade-in zoom-in-95 duration-300 min-h-[400px]">
                            {currentStep === 'service' && (
                                <div className="space-y-6">
                                    <h2 className="text-2xl font-bold text-secondary-900 flex items-center gap-3">
                                        <div className="bg-secondary-900/10 p-2 rounded-xl">
                                            <Sparkles className="w-6 h-6 text-secondary-900" />
                                        </div>
                                        Escolha uma Experiência
                                    </h2>
                                    <ServiceSelector
                                        services={services}
                                        selectedServiceId={data.serviceId}
                                        onSelect={handleServiceSelect}
                                    />
                                </div>
                            )}

                            {currentStep === 'datetime' && (
                                <div className="space-y-6">
                                    <h2 className="text-2xl font-bold text-secondary-900 flex items-center gap-3">
                                        <div className="bg-secondary-900/10 p-2 rounded-xl">
                                            <CalendarDays className="w-6 h-6 text-secondary-900" />
                                        </div>
                                        Escolha o Melhor Horário
                                    </h2>
                                    <DateTimePicker
                                        companyId={company.id}
                                        serviceDuration={data.serviceDuration}
                                        selectedDate={data.selectedDate}
                                        selectedTime={data.selectedTime}
                                        onDateSelect={(date) => handleFieldChange('selectedDate', date)}
                                        onTimeSelect={(time) => handleFieldChange('selectedTime', time)}
                                        maxAdvanceDays={(company.booking_settings as any)?.max_advance_days || 30}
                                    />
                                </div>
                            )}

                            {currentStep === 'customer' && (
                                <div className="space-y-6">
                                    <h2 className="text-2xl font-bold text-secondary-900 flex items-center gap-3">
                                        <div className="bg-secondary-900/10 p-2 rounded-xl">
                                            <UserCircle2 className="w-6 h-6 text-secondary-900" />
                                        </div>
                                        Seus Dados
                                    </h2>
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

                        {/* Navigation Buttons */}
                        {currentStep !== 'confirmation' && (
                            <div className="flex justify-between items-center pt-4">
                                <button
                                    onClick={goBack}
                                    disabled={stepIndex === 0}
                                    className={`
                                        flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-200
                                        ${stepIndex === 0
                                            ? 'text-neutral-300 cursor-not-allowed'
                                            : 'text-neutral-600 hover:text-secondary-900 hover:bg-white/50'
                                        }
                                    `}
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                    <span>Voltar</span>
                                </button>

                                <button
                                    onClick={handleNext}
                                    disabled={!canGoNext || submitting}
                                    className={`
                                        btn bg-secondary-900 text-white hover:bg-secondary-800 disabled:opacity-50 disabled:hover:bg-secondary-900
                                        px-8 py-3 rounded-xl font-semibold shadow-lg shadow-secondary-900/20 
                                        flex items-center gap-3 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]
                                    `}
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            <span>Processando...</span>
                                        </>
                                    ) : currentStep === 'customer' ? (
                                        <>
                                            <span>Confirmar Agendamento</span>
                                            <ArrowRight className="w-5 h-5" />
                                        </>
                                    ) : (
                                        <>
                                            <span>Continuar</span>
                                            <ArrowRight className="w-5 h-5" />
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Sticky Summary Sidebar */}
                    {currentStep !== 'confirmation' && (
                        <div className="hidden lg:block lg:col-span-1">
                            <div className="sticky top-8 space-y-6">
                                <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 p-6">
                                    <h3 className="text-lg font-bold text-secondary-900 mb-4 pb-4 border-b border-neutral-100">
                                        Resumo do Agendamento
                                    </h3>

                                    <div className="space-y-4">
                                        {/* Company */}
                                        <div className="flex items-start gap-3 text-neutral-600">
                                            <div className="bg-neutral-100 p-2 rounded-lg">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                                            </div>
                                            <div>
                                                <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Local</p>
                                                <p className="font-medium text-secondary-900">{company.name}</p>
                                            </div>
                                        </div>

                                        {/* Service */}
                                        <div className={`flex items-start gap-3 transition-all duration-300 ${data.serviceName ? 'text-secondary-900' : 'text-neutral-300'}`}>
                                            <div className={`p-2 rounded-lg ${data.serviceName ? 'bg-primary-50 text-secondary-900' : 'bg-neutral-50'}`}>
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                                            </div>
                                            <div>
                                                <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Serviço</p>
                                                <p className="font-medium">{data.serviceName || 'Selecione um serviço'}</p>
                                                {data.servicePrice > 0 && (
                                                    <p className="text-sm text-green-600 font-bold mt-0.5">
                                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.servicePrice)}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Date */}
                                        <div className={`flex items-start gap-3 transition-all duration-300 ${data.selectedDate ? 'text-secondary-900' : 'text-neutral-300'}`}>
                                            <div className={`p-2 rounded-lg ${data.selectedDate ? 'bg-primary-50 text-secondary-900' : 'bg-neutral-50'}`}>
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                            </div>
                                            <div>
                                                <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Data e Hora</p>
                                                <p className="font-medium">
                                                    {data.selectedDate ? (
                                                        <>
                                                            {new Date(data.selectedDate).toLocaleDateString('pt-BR')}
                                                            {data.selectedTime && ` às ${new Date(data.selectedTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`}
                                                        </>
                                                    ) : 'Selecione a data'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Helper Text */}
                                    <div className="mt-6 pt-4 border-t border-neutral-100 text-xs text-neutral-500 text-center">
                                        <p>Dúvidas? Entre em contato conosco.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
