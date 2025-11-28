import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Search, Edit2, Trash2, Tag } from 'lucide-react';
import { ServiceModal } from '@/components/catalog/ServiceModal';
import type { Service } from '@/types/database';
import { formatCurrency } from '@/utils/format';
import toast from 'react-hot-toast';

export const Services: React.FC = () => {
    const { user } = useAuth();
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedService, setSelectedService] = useState<Service | null>(null);

    const loadServices = async () => {
        if (!user?.company?.id) return;

        try {
            const { data, error } = await supabase
                .from('services')
                .select('*')
                .eq('company_id', user.company.id)
                .order('name');

            if (error) throw error;
            setServices(data || []);
        } catch (error: any) {
            console.error('Error loading services:', error);
            toast.error('Erro ao carregar serviços');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadServices();
    }, [user]);

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este serviço?')) return;

        try {
            const { error } = await supabase
                .from('services')
                .delete()
                .eq('id', id);

            if (error) throw error;
            toast.success('Serviço excluído com sucesso!');
            loadServices();
        } catch (error: any) {
            console.error('Error deleting service:', error);
            toast.error('Erro ao excluir serviço');
        }
    };

    const filteredServices = services.filter(service =>
        service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.category?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-secondary-900">Serviços</h1>
                    <p className="text-secondary-600">Gerencie o catálogo de serviços da sua estética</p>
                </div>
                <button
                    onClick={() => {
                        setSelectedService(null);
                        setIsModalOpen(true);
                    }}
                    className="btn btn-primary flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Novo Serviço
                </button>
            </div>

            <div className="bg-white rounded-card shadow-sm border border-secondary-200">
                <div className="p-4 border-b border-secondary-200">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Buscar serviços..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="input pl-10"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-secondary-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Nome</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Categoria</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Preço</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Duração</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-secondary-500 uppercase tracking-wider">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-secondary-200">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-4 text-center text-secondary-500">
                                        Carregando...
                                    </td>
                                </tr>
                            ) : filteredServices.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-4 text-center text-secondary-500">
                                        Nenhum serviço encontrado.
                                    </td>
                                </tr>
                            ) : (
                                filteredServices.map((service) => (
                                    <tr key={service.id} className="hover:bg-secondary-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-600">
                                                    <Tag className="w-5 h-5" />
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-secondary-900">{service.name}</div>
                                                    {service.description && (
                                                        <div className="text-sm text-secondary-500 truncate max-w-xs">{service.description}</div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-secondary-100 text-secondary-800">
                                                {service.category || 'Geral'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900">
                                            {formatCurrency(service.price)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">
                                            {service.duration_minutes} min
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => {
                                                    setSelectedService(service);
                                                    setIsModalOpen(true);
                                                }}
                                                className="text-primary-600 hover:text-primary-900 mr-4"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(service.id)}
                                                className="text-danger-600 hover:text-danger-900"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <ServiceModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                service={selectedService}
                onSuccess={loadServices}
            />
        </div>
    );
};
