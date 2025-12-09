import React, { useEffect, useState } from 'react';
import { Search, Plus, Edit2, Trash2 } from 'lucide-react';
import { Vehicle } from '@/types/database';
import { useAuth } from '@/contexts/AuthContext';
import { VehicleModal } from '@/components/crm/VehicleModal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { maskLicensePlate } from '@/utils/masks';
import { vehicleService } from '@/services/vehicleService';
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
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [vehicleToDelete, setVehicleToDelete] = useState<Vehicle | null>(null);

    useEffect(() => {
        if (user?.company) {
            loadVehicles();
        }
    }, [user]);

    useEffect(() => {
        filterVehiclesList();
    }, [vehicles, searchTerm]);

    const loadVehicles = async () => {
        if (!user?.company?.id) return;

        try {
            setLoading(true);
            const data = await vehicleService.list(user.company.id);
            setVehicles(data);
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

    const handleDeleteClick = (vehicle: Vehicle) => {
        setVehicleToDelete(vehicle);
        setShowConfirmDialog(true);
    };

    const handleDeleteConfirm = async () => {
        if (!vehicleToDelete) return;

        try {
            await vehicleService.delete(vehicleToDelete.id);
            toast.success('Veículo excluído com sucesso');
            setShowConfirmDialog(false);
            setVehicleToDelete(null);
            loadVehicles();
        } catch (error: any) {
            console.error('Error deleting vehicle:', error);
            toast.error('Erro ao excluir veículo');
        }
    };

    const handleDeleteCancel = () => {
        setShowConfirmDialog(false);
        setVehicleToDelete(null);
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

            {/* Table */}
            <div className="rounded-lg bg-white shadow-sm">
                {loading ? (
                    <div className="flex h-64 items-center justify-center">
                        <div className="loading-spinner" />
                    </div>
                ) : filteredVehicles.length === 0 ? (
                    <div className="flex h-64 flex-col items-center justify-center text-gray-500">
                        <p className="text-lg font-medium">Nenhum veículo encontrado</p>
                        <p className="mt-1 text-sm">
                            {searchTerm ? 'Tente ajustar a busca' : 'Comece criando seu primeiro veículo'}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Veículo</th>
                                    <th>Placa</th>
                                    <th className="hidden md:table-cell">Cliente</th>
                                    <th className="hidden md:table-cell">Detalhes</th>
                                    <th className="text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredVehicles.map((vehicle) => (
                                    <tr
                                        key={vehicle.id}
                                        onDoubleClick={() => handleEdit(vehicle)}
                                        className="hover:bg-gray-50 transition-colors"
                                    >
                                        <td>
                                            <div className="font-medium text-gray-900">
                                                {vehicle.brand} {vehicle.model}
                                            </div>
                                            <div className="md:hidden text-sm text-gray-500">
                                                {vehicle.customer?.name}
                                            </div>
                                        </td>
                                        <td>
                                            <span className="rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800">
                                                {maskLicensePlate(vehicle.license_plate)}
                                            </span>
                                        </td>
                                        <td className="hidden md:table-cell">
                                            <div className="text-gray-900">{vehicle.customer?.name}</div>
                                        </td>
                                        <td className="hidden md:table-cell">
                                            <div className="text-sm text-gray-500">
                                                {vehicle.year && <span>{vehicle.year}</span>}
                                                {vehicle.year && vehicle.color && <span> • </span>}
                                                {vehicle.color && <span>{vehicle.color}</span>}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleEdit(vehicle)}
                                                    className="rounded-lg p-2 text-gray-600 hover:bg-gray-100"
                                                    title="Editar"
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteClick(vehicle)}
                                                    className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                                                    title="Excluir"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

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

            {/* Confirm Delete Dialog */}
            <ConfirmDialog
                isOpen={showConfirmDialog}
                title="Confirmar Exclusão"
                message={vehicleToDelete ? `Tem certeza que deseja excluir o veículo "${vehicleToDelete.brand} ${vehicleToDelete.model}"?` : ''}
                confirmText="Excluir"
                cancelText="Cancelar"
                onConfirm={handleDeleteConfirm}
                onCancel={handleDeleteCancel}
                danger
            />
        </div>
    );
};
