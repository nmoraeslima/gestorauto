import React, { useEffect, useState } from 'react';
import { Search, Plus, Edit2, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Vehicle } from '@/types/database';
import { useAuth } from '@/contexts/AuthContext';
import { VehicleModal } from '@/components/crm/VehicleModal';
import { maskLicensePlate } from '@/utils/masks';
import toast from 'react-hot-toast';

interface VehicleWithCustomer extends Vehicle {
    customer?: {
        name: string;
    };
}

export const Vehicles: React.FC = () => {
    const { user } = useAuth();
    const [vehicles, setVehicles] = useState<VehicleWithCustomer[]>([]);
    const [filteredVehicles, setFilteredVehicles] = useState<VehicleWithCustomer[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

    useEffect(() => {
        if (user?.company) {
            loadVehicles();
        }
    }, [user]);

    useEffect(() => {
        filterVehiclesList();
    }, [vehicles, searchTerm]);

    const loadVehicles = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('vehicles')
                .select(`
          *,
          customer:customers(name)
        `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setVehicles(data || []);
        } catch (error: any) {
            console.error('Error loading vehicles:', error);
            toast.error('Erro ao carregar veículos');
        } finally {
            setLoading(false);
        }
    };

    const filterVehiclesList = () => {
        if (!searchTerm) {
            setFilteredVehicles(vehicles);
            return;
        }

        const term = searchTerm.toLowerCase();
        const filtered = vehicles.filter(
            (v) =>
                v.brand.toLowerCase().includes(term) ||
                v.model.toLowerCase().includes(term) ||
                v.license_plate.toLowerCase().includes(term) ||
                v.customer?.name.toLowerCase().includes(term)
        );
        setFilteredVehicles(filtered);
    };

    const handleEdit = (vehicle: Vehicle) => {
        setSelectedVehicle(vehicle);
        setIsModalOpen(true);
    };

    const handleDelete = async (vehicle: Vehicle) => {
        if (!confirm(`Tem certeza que deseja excluir o veículo "${vehicle.brand} ${vehicle.model}"?`)) {
            return;
        }

        try {
            const { error } = await supabase.from('vehicles').delete().eq('id', vehicle.id);

            if (error) throw error;
            toast.success('Veículo excluído com sucesso');
            loadVehicles();
        } catch (error: any) {
            console.error('Error deleting vehicle:', error);
            toast.error('Erro ao excluir veículo');
        }
    };

    const handleNewVehicle = () => {
        setSelectedVehicle(null);
        setIsModalOpen(true);
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setSelectedVehicle(null);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Veículos</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Gerencie os veículos dos seus clientes
                    </p>
                </div>
                <button onClick={handleNewVehicle} className="btn-primary">
                    <Plus className="h-5 w-5" />
                    <span className="hidden sm:inline">Novo Veículo</span>
                    <span className="sm:hidden">Novo</span>
                </button>
            </div>

            {/* Search */}
            <div className="rounded-lg bg-white p-4 shadow-sm">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar por placa, marca, modelo ou cliente..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="input pl-10"
                    />
                </div>
            </div>

            {/* Grid */}
            {loading ? (
                <div className="flex h-64 items-center justify-center">
                    <div className="loading-spinner" />
                </div>
            ) : filteredVehicles.length === 0 ? (
                <div className="flex h-64 flex-col items-center justify-center rounded-lg bg-white text-gray-500 shadow-sm">
                    <p className="text-lg font-medium">Nenhum veículo encontrado</p>
                    <p className="mt-1 text-sm">
                        {searchTerm ? 'Tente ajustar a busca' : 'Comece criando seu primeiro veículo'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {filteredVehicles.map((vehicle) => (
                        <div key={vehicle.id} className="overflow-hidden rounded-lg bg-white shadow-sm transition-shadow hover:shadow-md">
                            {/* Content */}
                            <div className="p-4">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900">
                                            {vehicle.brand} {vehicle.model}
                                        </h3>
                                        <p className="mt-1 text-sm text-gray-500">{vehicle.customer?.name}</p>
                                    </div>
                                    <div className="rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                                        {maskLicensePlate(vehicle.license_plate)}
                                    </div>
                                </div>

                                <div className="mt-4 space-y-2 text-sm border-t border-gray-100 pt-3">
                                    {vehicle.year && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Ano:</span>
                                            <span className="font-medium text-gray-900">{vehicle.year}</span>
                                        </div>
                                    )}
                                    {vehicle.color && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Cor:</span>
                                            <span className="font-medium text-gray-900">{vehicle.color}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="mt-4 flex gap-2">
                                    <button
                                        onClick={() => handleEdit(vehicle)}
                                        className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                    >
                                        <Edit2 className="mx-auto h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(vehicle)}
                                        className="flex-1 rounded-lg border border-red-300 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
                                    >
                                        <Trash2 className="mx-auto h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-1 gap-4">
                <div className="rounded-lg bg-white p-4 shadow-sm">
                    <p className="text-sm font-medium text-gray-500">Total de Veículos</p>
                    <p className="mt-1 text-2xl font-bold text-gray-900">{vehicles.length}</p>
                </div>
            </div>

            {/* Modal */}
            <VehicleModal
                isOpen={isModalOpen}
                onClose={handleModalClose}
                vehicle={selectedVehicle}
                onSuccess={loadVehicles}
            />
        </div>
    );
};
