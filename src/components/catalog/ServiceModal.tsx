import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { X, Tag, DollarSign, Clock, FileText, Info } from 'lucide-react';
import type { Service } from '@/types/database';
import { catalogService } from '@/services/catalogService';
import toast from 'react-hot-toast';

interface ServiceModalProps {
    isOpen: boolean;
    onClose: () => void;
    service?: Service | null;
    onSuccess: () => void;
}

export const ServiceModal: React.FC<ServiceModalProps> = ({
    isOpen,
    onClose,
    service,
    onSuccess,
}) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: 0,
        duration_minutes: 60,
        recurrence_interval: 0,
        category: '',
        is_active: true,
    });

    useEffect(() => {
        if (service) {
            setFormData({
                name: service.name,
                description: service.description || '',
                price: service.price,
                duration_minutes: service.duration_minutes,
                recurrence_interval: service.recurrence_interval || 0,
                category: service.category || '',
                is_active: service.is_active,
            });
        } else {
            setFormData({
                name: '',
                description: '',
                price: 0,
                duration_minutes: 60,
                recurrence_interval: 0,
                category: '',
                is_active: true,
            });
        }
    }, [service, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.company?.id) return;

        setLoading(true);

        try {
            const serviceData = {
                company_id: user.company.id,
                ...formData,
            };

            if (service) {
                await catalogService.update(service.id, serviceData);
                toast.success('Serviço atualizado com sucesso!');
            } else {
                await catalogService.create(serviceData);
                toast.success('Serviço criado com sucesso!');
            }

            onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Error saving service:', error);
            toast.error(error.message || 'Erro ao salvar serviço');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
                <div className="fixed inset-0 transition-opacity bg-secondary-900 bg-opacity-75" onClick={onClose} />

                <div className="relative inline-block w-full max-w-lg p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-card">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-semibold text-secondary-600">
                            {service ? 'Editar Serviço' : 'Novo Serviço'}
                        </h3>
                        <button
                            onClick={onClose}
                            className="text-neutral-400 hover:text-neutral-600 transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off">
                        <div>
                            <label className="label">
                                <Tag className="w-4 h-4 inline mr-2" />
                                Nome do Serviço *
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="input"
                                placeholder="Ex: Lavagem Completa"
                                autoComplete="off"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="label">
                                    <DollarSign className="w-4 h-4 inline mr-2" />
                                    Preço (R$) *
                                </label>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    step="0.01"
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                                    onWheel={(e) => e.currentTarget.blur()}
                                    className="input"
                                    placeholder="0.00"
                                    autoComplete="off"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="label">
                                    <Clock className="w-4 h-4 inline mr-2" />
                                    Duração (min) *
                                </label>
                                <input
                                    type="number"
                                    required
                                    min="5"
                                    step="5"
                                    value={formData.duration_minutes}
                                    onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 0 })}
                                    className="input"
                                />
                            </div>
                            <div>
                                <label className="label">
                                    <Clock className="w-4 h-4 inline mr-2" />
                                    Recorrência (dias)
                                    <div className="group relative ml-2 inline-block">
                                        <Info className="w-4 h-4 text-gray-400 cursor-help" />
                                        <div className="invisible group-hover:visible absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 p-2 bg-gray-800 text-white text-xs rounded shadow-lg z-50">
                                            Define quantos dias após a conclusão do serviço o sistema deve sugerir um retorno ao cliente.
                                            <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-800"></div>
                                        </div>
                                    </div>
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={formData.recurrence_interval}
                                    onChange={(e) => setFormData({ ...formData, recurrence_interval: parseInt(e.target.value) || 0 })}
                                    className="input"
                                    placeholder="Ex: 180 (6 meses)"
                                    title="Dias para sugerir retorno do cliente"
                                />
                                <p className="text-xs text-gray-400 mt-1">0 para desativar</p>
                            </div>
                        </div>

                        <div>
                            <label className="label">Categoria</label>
                            <select
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                className="input"
                            >
                                <option value="">Selecione uma categoria</option>
                                <option value="Lavagem">Lavagem</option>
                                <option value="Polimento">Polimento</option>
                                <option value="Higienização Interna">Higienização Interna</option>
                                <option value="Vitrificação">Vitrificação</option>
                                <option value="Enceramento">Enceramento</option>
                                <option value="Cristalização">Cristalização</option>
                                <option value="Película/Insulfilm">Película/Insulfilm</option>
                                <option value="Martelinho de Ouro">Martelinho de Ouro</option>
                                <option value="Pintura">Pintura</option>
                                <option value="Restauração de Faróis">Restauração de Faróis</option>
                                <option value="Outras">Outras</option>
                            </select>
                        </div>

                        <div>
                            <label className="label">
                                <FileText className="w-4 h-4 inline mr-2" />
                                Descrição
                            </label>
                            <textarea
                                rows={3}
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="input"
                                placeholder="Detalhes do serviço..."
                            />
                        </div>

                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="is_active"
                                checked={formData.is_active}
                                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                            />
                            <label htmlFor="is_active" className="ml-2 block text-sm text-secondary-900">
                                Serviço Ativo
                            </label>
                        </div>

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
                                {loading ? 'Salvando...' : service ? 'Atualizar' : 'Criar Serviço'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
