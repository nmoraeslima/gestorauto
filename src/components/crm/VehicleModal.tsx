import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { supabase } from '@/lib/supabase';
import { Customer, Vehicle, VehicleFormData } from '@/types/database';
import { useAuth } from '@/contexts/AuthContext';
import { maskLicensePlate, unmaskLicensePlate, validateLicensePlate } from '@/utils/masks';
import toast from 'react-hot-toast';

interface VehicleModalProps {
    isOpen: boolean;
    onClose: () => void;
    vehicle?: Vehicle | null;
    onSuccess: () => void;
}

export const VehicleModal: React.FC<VehicleModalProps> = ({
    isOpen,
    onClose,
    vehicle,
    onSuccess,
}) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const isEditing = !!vehicle;

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        watch,
        formState: { errors },
    } = useForm<VehicleFormData>({
        defaultValues: vehicle || {},
    });

    const licensePlate = watch('license_plate');

    // Apply license plate mask
    useEffect(() => {
        if (licensePlate) {
            setValue('license_plate', maskLicensePlate(licensePlate));
        }
    }, [licensePlate, setValue]);

    // Load customers
    useEffect(() => {
        if (isOpen && user?.company) {
            loadCustomers();
        }
    }, [isOpen, user]);

    // Reset form when vehicle changes
    useEffect(() => {
        if (vehicle) {
            reset(vehicle);
        } else {
            reset({});
        }
    }, [vehicle, reset]);

    const loadCustomers = async () => {
        try {
            const { data, error } = await supabase
                .from('customers')
                .select('*')
                .is('deleted_at', null)
                .order('name');

            if (error) throw error;
            setCustomers(data || []);
        } catch (error: any) {
            console.error('Error loading customers:', error);
            toast.error('Erro ao carregar clientes');
        }
    };

    const onSubmit = async (data: VehicleFormData) => {
        if (!user?.company) return;

        setLoading(true);

        try {
            // Validate license plate
            if (!validateLicensePlate(data.license_plate)) {
                toast.error('Placa inválida');
                setLoading(false);
                return;
            }

            const vehicleData = {
                ...data,
                company_id: user.company.id,
                license_plate: unmaskLicensePlate(data.license_plate),
            };

            if (isEditing && vehicle) {
                const { error } = await supabase
                    .from('vehicles')
                    .update(vehicleData)
                    .eq('id', vehicle.id);

                if (error) throw error;
                toast.success('Veículo atualizado com sucesso!');
            } else {
                const { error } = await supabase.from('vehicles').insert(vehicleData);

                if (error) throw error;
                toast.success('Veículo criado com sucesso!');
            }

            onSuccess();
            onClose();
            reset();
        } catch (error: any) {
            console.error('Error saving vehicle:', error);
            if (error.code === '23505') {
                toast.error('Placa já cadastrada');
            } else {
                toast.error('Erro ao salvar veículo: ' + error.message);
            }
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center p-4">
                {/* Backdrop */}
                <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={onClose} />

                {/* Modal */}
                <div className="relative w-full max-w-3xl rounded-lg bg-white shadow-xl">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                        <h2 className="text-xl font-semibold text-gray-900">
                            {isEditing ? 'Editar Veículo' : 'Novo Veículo'}
                        </h2>
                        <button
                            onClick={onClose}
                            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit(onSubmit)} className="p-6">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            {/* Cliente */}
                            <div className="md:col-span-2">
                                <label className="label">
                                    Cliente <span className="text-red-500">*</span>
                                </label>
                                <select
                                    {...register('customer_id', { required: 'Cliente é obrigatório' })}
                                    className="input"
                                >
                                    <option value="">Selecione um cliente</option>
                                    {customers.map((customer) => (
                                        <option key={customer.id} value={customer.id}>
                                            {customer.name}
                                        </option>
                                    ))}
                                </select>
                                {errors.customer_id && (
                                    <p className="mt-1 text-sm text-red-500">{errors.customer_id.message}</p>
                                )}
                            </div>

                            {/* Marca */}
                            <div>
                                <label className="label">
                                    Marca <span className="text-red-500">*</span>
                                </label>
                                <input
                                    {...register('brand', { required: 'Marca é obrigatória' })}
                                    className="input"
                                    placeholder="Ex: Toyota"
                                />
                                {errors.brand && (
                                    <p className="mt-1 text-sm text-red-500">{errors.brand.message}</p>
                                )}
                            </div>

                            {/* Modelo */}
                            <div>
                                <label className="label">
                                    Modelo <span className="text-red-500">*</span>
                                </label>
                                <input
                                    {...register('model', { required: 'Modelo é obrigatório' })}
                                    className="input"
                                    placeholder="Ex: Corolla"
                                />
                                {errors.model && (
                                    <p className="mt-1 text-sm text-red-500">{errors.model.message}</p>
                                )}
                            </div>

                            {/* Ano */}
                            <div>
                                <label className="label">Ano</label>
                                <input
                                    {...register('year', {
                                        valueAsNumber: true,
                                        min: { value: 1900, message: 'Ano inválido' },
                                        max: { value: new Date().getFullYear() + 1, message: 'Ano inválido' },
                                    })}
                                    type="number"
                                    className="input"
                                    placeholder="Ex: 2020"
                                />
                                {errors.year && (
                                    <p className="mt-1 text-sm text-red-500">{errors.year.message}</p>
                                )}
                            </div>

                            {/* Cor */}
                            <div>
                                <label className="label">Cor</label>
                                <input {...register('color')} className="input" placeholder="Ex: Prata" />
                            </div>

                            {/* Placa */}
                            <div className="md:col-span-2">
                                <label className="label">
                                    Placa <span className="text-red-500">*</span>
                                </label>
                                <input
                                    {...register('license_plate', { required: 'Placa é obrigatória' })}
                                    className="input"
                                    placeholder="ABC-1234 ou ABC1D23"
                                    maxLength={8}
                                />
                                {errors.license_plate && (
                                    <p className="mt-1 text-sm text-red-500">{errors.license_plate.message}</p>
                                )}
                            </div>

                            {/* Observações */}
                            <div className="md:col-span-2">
                                <label className="label">Observações</label>
                                <textarea
                                    {...register('notes')}
                                    className="input"
                                    rows={3}
                                    placeholder="Observações sobre o veículo"
                                />
                            </div>

                        </div>

                        {/* Footer */}
                        <div className="mt-6 flex justify-end gap-3">
                            <button type="button" onClick={onClose} className="btn-secondary" disabled={loading}>
                                Cancelar
                            </button>
                            <button type="submit" className="btn-primary" disabled={loading}>
                                {loading ? 'Salvando...' : isEditing ? 'Atualizar' : 'Criar Veículo'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
