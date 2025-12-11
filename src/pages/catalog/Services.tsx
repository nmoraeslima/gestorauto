import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Search, Edit2, Trash2, Tag, Clock, DollarSign } from 'lucide-react';
import { ServiceModal } from '@/components/catalog/ServiceModal';
import { Service } from '@/types/database';
import { formatCurrency } from '@/utils/format';
import { catalogService } from '@/services/catalogService';
import toast from 'react-hot-toast';

export const Services: React.FC = () => {
    const { user } = useAuth();
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedService, setSelectedService] = useState<Service | null>(null);
    const [lastTap, setLastTap] = useState(0);

    const loadServices = async () => {
        if (!user?.company?.id) return;

        try {
            // Using service layer with memory search for filtered list
            const data = await catalogService.list(user.company.id, {
                activeOnly: false // Show all service to admin
            });
            setServices(data);
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
            await catalogService.delete(id);
            toast.success('Serviço excluído com sucesso!');
            loadServices();
        } catch (error: any) {
            console.error('Error deleting service:', error);
            toast.error('Erro ao excluir serviço');
        }
    };

    const handleEdit = (service: Service) => {
        setSelectedService(service);
        setIsModalOpen(true);
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

            {/* Search */}
            <div className="bg-white rounded-lg shadow-sm border border-secondary-200 p-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Buscar serviços..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="input pl-10 w-full"
                    />
                </div>
            </div>

            {/* Content */}
            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
                {loading ? (
                    <div className="text-center text-secondary-500 py-4">Carregando...</div>
                ) : filteredServices.length === 0 ? (
                    <div className="text-center text-secondary-500 py-4">Nenhum serviço encontrado.</div>
                ) : (
                    filteredServices.map((service) => (
                        <div
                            key={service.id}
                            className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 space-y-3 cursor-pointer select-none ring-offset-2 focus:ring-2 focus:ring-primary-500 transition-all active:scale-[0.99]"
                            onClick={() => {
                                const now = Date.now();
                                if (now - lastTap < 300) {
                                    handleEdit(service);
                                    setLastTap(0);
                                } else {
                                    setLastTap(now);
                                }
                            }}
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                    <div className="flex-shrink-0 h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-600">
                                        <Tag className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-secondary-900">{service.name}</h3>
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-secondary-100 text-secondary-800 mt-1">
                                            {service.category || 'Geral'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-sm text-secondary-600">
                                <div className="flex items-center gap-2">
                                    <DollarSign className="w-4 h-4 text-secondary-400" />
                                    <span className="font-medium text-secondary-900">{formatCurrency(service.price)}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-secondary-400" />
                                    <span>{service.duration_minutes} min</span>
                                </div>
                            </div>

                            {service.description && (
                                <p className="text-sm text-secondary-500 line-clamp-2">
                                    {service.description}
                                </p>
                            )}

                            <div className="pt-3 border-t border-secondary-100 flex items-center justify-end gap-2">
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleEdit(service); }}
                                    className="p-2 text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
                                >
                                    <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleDelete(service.id); }}
                                    className="p-2 text-danger-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block bg-white rounded-lg shadow-sm border border-secondary-200 overflow-hidden">
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
                                    <tr
                                        key={service.id}
                                        className="hover:bg-secondary-50 transition-colors cursor-default"
                                        onDoubleClick={() => handleEdit(service)}
                                    >
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
                                                onClick={() => handleEdit(service)}
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
        </div >
    );
};
