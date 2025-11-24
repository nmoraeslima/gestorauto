import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { supabase } from '@/lib/supabase';
import { Customer, CustomerFormData, CustomerType } from '@/types/database';
import { useAuth } from '@/contexts/AuthContext';
import { maskCPF, maskPhone, unmask, validateCPF } from '@/utils/masks';
import toast from 'react-hot-toast';

interface CustomerModalProps {
    isOpen: boolean;
    onClose: () => void;
    customer?: Customer | null;
    onSuccess: () => void;
}

export const CustomerModal: React.FC<CustomerModalProps> = ({
    isOpen,
    onClose,
    customer,
    onSuccess,
}) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
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
    }, [customer, reset]);

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

            if (isEditing) {
                const { error } = await supabase
                    .from('customers')
                    .update(customerData)
                    .eq('id', customer.id);

                if (error) throw error;
                toast.success('Cliente atualizado com sucesso!');
            } else {
                const { error } = await supabase.from('customers').insert(customerData);

                if (error) throw error;
                toast.success('Cliente criado com sucesso!');
            }

            onSuccess();
            onClose();
            reset();
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
