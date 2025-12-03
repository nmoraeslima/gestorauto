import React, { useEffect, useState } from 'react';
import { X, Car, Plus, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { supabase } from '@/lib/supabase';
import { Customer, CustomerFormData, CustomerType, VehicleFormData } from '@/types/database';
import { useAuth } from '@/contexts/AuthContext';
import { maskCPF, maskPhone, unmask, validateCPF } from '@/utils/masks';
import toast from 'react-hot-toast';

interface CustomerModalProps {
    isOpen: boolean;
    onClose: () => void;
    customer?: Customer | null;
    onSuccess: () => void;
}

// Partial vehicle data for the form
interface PendingVehicle {
    brand: string;
    model: string;
    license_plate: string;
    color?: string;
    year?: number;
}

export const CustomerModal: React.FC<CustomerModalProps> = ({
    isOpen,
    onClose,
    customer,
    onSuccess,
}) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [pendingVehicles, setPendingVehicles] = useState<PendingVehicle[]>([]);
    const [newVehicle, setNewVehicle] = useState<PendingVehicle>({
        brand: '',
        model: '',
        license_plate: '',
        color: '',
    });
    const isEditing = !!customer;

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        watch,
        formState: { errors },
    } = useForm<CustomerFormData>({
        defaultValues: customer || {
            customer_type: CustomerType.INDIVIDUAL,
            vip: false,
        },
    });

    const phone = watch('phone');
    const cpf = watch('cpf');

    // Apply masks
    useEffect(() => {
        if (phone) {
            setValue('phone', maskPhone(phone));
        }
    }, [phone, setValue]);

    useEffect(() => {
        if (cpf) {
            setValue('cpf', maskCPF(cpf));
        }
    }, [cpf, setValue]);

    // Reset form when customer changes
    useEffect(() => {
        if (customer) {
            reset(customer);
        } else {
            reset({
                customer_type: CustomerType.INDIVIDUAL,
                vip: false,
            });
        }
        setPendingVehicles([]);
        setNewVehicle({ brand: '', model: '', license_plate: '', color: '' });
    }, [customer, reset, isOpen]);

    const handleAddVehicle = () => {
        if (!newVehicle.brand || !newVehicle.model || !newVehicle.license_plate) {
            toast.error('Preencha marca, modelo e placa do veículo');
            return;
        }
        setPendingVehicles([...pendingVehicles, newVehicle]);
        setNewVehicle({ brand: '', model: '', license_plate: '', color: '' });
    };

    const handleRemoveVehicle = (index: number) => {
        setPendingVehicles(pendingVehicles.filter((_, i) => i !== index));
    };

    const onSubmit = async (data: CustomerFormData) => {
        if (!user?.company) return;

        setLoading(true);

        try {
            // Validate CPF if provided
            if (data.cpf && !validateCPF(data.cpf)) {
                toast.error('CPF inválido');
                setLoading(false);
                return;
            }

            const customerData = {
                ...data,
                company_id: user?.company?.id!,
                phone: unmask(data.phone),
                cpf: data.cpf ? unmask(data.cpf) : null,
            };

            let customerId = customer?.id;

            if (isEditing) {
                const { error } = await supabase
                    .from('customers')
                    .update(customerData)
                    .eq('id', customer.id);

                if (error) throw error;
                toast.success('Cliente atualizado com sucesso!');
            } else {
                const { data: newCustomer, error } = await supabase
                    .from('customers')
                    .insert(customerData)
                    .select()
                    .single();

                if (error) throw error;
                customerId = newCustomer.id;
                toast.success('Cliente criado com sucesso!');
            }

            // Save pending vehicles
            if (customerId && pendingVehicles.length > 0) {
                const vehiclesToInsert = pendingVehicles.map(v => ({
                    company_id: user.company!.id,
                    customer_id: customerId!,
                    brand: v.brand,
                    model: v.model,
                    license_plate: v.license_plate.toUpperCase(),
                    color: v.color,
                    year: v.year,
                    photos: [] // Initialize with empty photos
                }));

                const { error: vehiclesError } = await supabase
                    .from('vehicles')
                    .insert(vehiclesToInsert);

                if (vehiclesError) {
                    console.error('Error saving vehicles:', vehiclesError);
                    toast.error('Cliente salvo, mas erro ao salvar veículos');
                } else {
                    toast.success(`${pendingVehicles.length} veículo(s) adicionado(s)!`);
                }
            }

            onSuccess();
            onClose();
            reset();
            setPendingVehicles([]);
        } catch (error: any) {
            console.error('Error saving customer:', error);
            if (error.code === '23505') {
                toast.error('CPF já cadastrado');
            } else {
                toast.error('Erro ao salvar cliente: ' + error.message);
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
                <div className="relative w-full max-w-2xl rounded-lg bg-white shadow-xl">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                        <h2 className="text-xl font-semibold text-gray-900">
                            {isEditing ? 'Editar Cliente' : 'Novo Cliente'}
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
                            {/* Nome */}
                            <div className="md:col-span-2">
                                <label className="label">
                                    Nome <span className="text-red-500">*</span>
                                </label>
                                <input
                                    {...register('name', {
                                        required: 'Nome é obrigatório',
                                        minLength: { value: 3, message: 'Mínimo 3 caracteres' },
                                    })}
                                    className="input"
                                    placeholder="Nome completo"
                                />
                                {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>}
                            </div>

                            {/* Email */}
                            <div>
                                <label className="label">Email</label>
                                <input
                                    {...register('email', {
                                        pattern: {
                                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                            message: 'Email inválido',
                                        },
                                    })}
                                    type="email"
                                    className="input"
                                    placeholder="email@exemplo.com"
                                />
                                {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>}
                            </div>

                            {/* Telefone */}
                            <div>
                                <label className="label">
                                    Telefone <span className="text-red-500">*</span>
                                </label>
                                <input
                                    {...register('phone', { required: 'Telefone é obrigatório' })}
                                    className="input"
                                    placeholder="(00) 00000-0000"
                                    maxLength={15}
                                />
                                {errors.phone && <p className="mt-1 text-sm text-red-500">{errors.phone.message}</p>}
                            </div>

                            {/* CPF */}
                            <div>
                                <label className="label">CPF</label>
                                <input
                                    {...register('cpf')}
                                    className="input"
                                    placeholder="000.000.000-00"
                                    maxLength={14}
                                />
                                {errors.cpf && <p className="mt-1 text-sm text-red-500">{errors.cpf.message}</p>}
                            </div>

                            {/* Data de Nascimento */}
                            <div>
                                <label className="label">Data de Nascimento</label>
                                <input {...register('birth_date')} type="date" className="input" />
                            </div>

                            {/* Tipo */}
                            <div>
                                <label className="label">Tipo</label>
                                <select {...register('customer_type')} className="input">
                                    <option value={CustomerType.INDIVIDUAL}>Individual</option>
                                    <option value={CustomerType.CORPORATE}>Corporativo</option>
                                </select>
                            </div>

                            {/* VIP */}
                            <div className="flex items-center">
                                <input {...register('vip')} type="checkbox" className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" id="vip" />
                                <label htmlFor="vip" className="ml-2 text-sm font-medium text-gray-700">
                                    Cliente VIP
                                </label>
                            </div>

                            {/* Endereço */}
                            <div className="md:col-span-2">
                                <label className="label">Endereço</label>
                                <textarea {...register('address')} className="input" rows={2} placeholder="Endereço completo" />
                            </div>

                            {/* Observações */}
                            <div className="md:col-span-2">
                                <label className="label">Observações</label>
                                <textarea {...register('notes')} className="input" rows={3} placeholder="Observações sobre o cliente" />
                            </div>

                            {/* Seção de Veículos */}
                            <div className="md:col-span-2 border-t border-gray-200 pt-4 mt-2">
                                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                                    <Car className="w-5 h-5 text-primary-600" />
                                    Veículos
                                </h3>

                                {/* Lista de veículos adicionados */}
                                {pendingVehicles.length > 0 && (
                                    <div className="mb-4 space-y-2">
                                        {pendingVehicles.map((v, index) => (
                                            <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-200">
                                                <div>
                                                    <p className="font-medium text-gray-900">{v.brand} {v.model}</p>
                                                    <p className="text-sm text-gray-500">Placa: {v.license_plate} {v.color && `• Cor: ${v.color}`}</p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveVehicle(index)}
                                                    className="text-red-500 hover:text-red-700 p-1"
                                                    title="Remover veículo"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Formulário de adição de veículo */}
                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                    <p className="text-sm font-medium text-gray-700 mb-3">Adicionar Veículo</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <input
                                            placeholder="Marca (ex: Toyota)"
                                            className="input text-sm"
                                            value={newVehicle.brand}
                                            onChange={(e) => setNewVehicle({ ...newVehicle, brand: e.target.value })}
                                        />
                                        <input
                                            placeholder="Modelo (ex: Corolla)"
                                            className="input text-sm"
                                            value={newVehicle.model}
                                            onChange={(e) => setNewVehicle({ ...newVehicle, model: e.target.value })}
                                        />
                                        <input
                                            placeholder="Placa (ex: ABC-1234)"
                                            className="input text-sm uppercase"
                                            value={newVehicle.license_plate}
                                            onChange={(e) => setNewVehicle({ ...newVehicle, license_plate: e.target.value.toUpperCase() })}
                                            maxLength={8}
                                        />
                                        <input
                                            placeholder="Cor (ex: Prata)"
                                            className="input text-sm"
                                            value={newVehicle.color}
                                            onChange={(e) => setNewVehicle({ ...newVehicle, color: e.target.value })}
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleAddVehicle}
                                        className="mt-3 w-full btn-secondary text-sm flex items-center justify-center gap-2"
                                        disabled={!newVehicle.brand || !newVehicle.model || !newVehicle.license_plate}
                                    >
                                        <Plus className="w-4 h-4" />
                                        Adicionar à lista
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="mt-6 flex justify-end gap-3">
                            <button type="button" onClick={onClose} className="btn-secondary" disabled={loading}>
                                Cancelar
                            </button>
                            <button type="submit" className="btn-primary" disabled={loading}>
                                {loading ? 'Salvando...' : isEditing ? 'Atualizar' : 'Criar Cliente'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
