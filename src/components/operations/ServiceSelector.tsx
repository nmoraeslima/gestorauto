import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Search, Trash2 } from 'lucide-react';
import { formatCurrency } from '@/utils/calculations';
import type { Service } from '@/types/database';

interface ServiceItem {
    service_id: string;
    service_name: string;
    quantity: number;
    price: number;
    notes?: string;
}

interface ServiceSelectorProps {
    selectedServices: ServiceItem[];
    onChange: (services: ServiceItem[]) => void;
}

export const ServiceSelector: React.FC<ServiceSelectorProps> = ({
    selectedServices,
    onChange,
}) => {
    const { user } = useAuth();
    const [services, setServices] = useState<Service[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);

    // Load services
    useEffect(() => {
        loadServices();
    }, [user]);

    const loadServices = async () => {
        if (!user?.company?.id) return;

        setLoading(true);
        const { data, error } = await supabase
            .from('services')
            .select('*')
            .eq('company_id', user.company.id)
            .eq('is_active', true)
            .order('name');

        if (!error && data) {
            setServices(data);
        }
        setLoading(false);
    };

    // Filter services based on search
    const filteredServices = services.filter(
        (service) =>
            service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            service.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Add service to selection
    const addService = (service: Service) => {
        const exists = selectedServices.find((s) => s.service_id === service.id);
        if (exists) {
            // Increment quantity
            onChange(
                selectedServices.map((s) =>
                    s.service_id === service.id
                        ? { ...s, quantity: s.quantity + 1 }
                        : s
                )
            );
        } else {
            // Add new
            onChange([
                ...selectedServices,
                {
                    service_id: service.id,
                    service_name: service.name,
                    quantity: 1,
                    price: service.price,
                },
            ]);
        }
        setSearchTerm('');
        setShowDropdown(false);
    };

    // Update service quantity
    const updateQuantity = (serviceId: string, quantity: number) => {
        if (quantity <= 0) {
            removeService(serviceId);
            return;
        }
        onChange(
            selectedServices.map((s) =>
                s.service_id === serviceId ? { ...s, quantity } : s
            )
        );
    };

    // Update service price
    const updatePrice = (serviceId: string, price: number) => {
        onChange(
            selectedServices.map((s) =>
                s.service_id === serviceId ? { ...s, price } : s
            )
        );
    };

    // Remove service
    const removeService = (serviceId: string) => {
        onChange(selectedServices.filter((s) => s.service_id !== serviceId));
    };

    // Calculate subtotal
    const subtotal = selectedServices.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
    );

    const [showDropdown, setShowDropdown] = useState(false);

    return (
        <div className="space-y-4">
            {/* Search and Add */}
            <div className="relative">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
                    <input
                        type="text"
                        className="input pl-10"
                        placeholder="Buscar serviço para adicionar..."
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setShowDropdown(true);
                        }}
                        onFocus={() => setShowDropdown(true)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                if (filteredServices.length > 0) {
                                    addService(filteredServices[0]);
                                }
                            }
                        }}
                    />
                </div>

                {/* Search Results Dropdown */}
                {showDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-secondary-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {loading ? (
                            <div className="p-4 text-center text-neutral-500">
                                Carregando...
                            </div>
                        ) : filteredServices.length > 0 ? (
                            filteredServices.map((service) => (
                                <button
                                    key={service.id}
                                    type="button"
                                    onMouseDown={(e) => {
                                        e.preventDefault(); // Prevent blur
                                        addService(service);
                                    }}
                                    className="w-full px-4 py-3 text-left hover:bg-secondary-50 border-b border-secondary-100 last:border-0 transition-colors flex justify-between items-center"
                                >
                                    <div>
                                        <p className="font-medium text-secondary-900">
                                            {service.name}
                                        </p>
                                        {service.description && (
                                            <p className="text-xs text-neutral-500 mt-0.5">
                                                {service.description}
                                            </p>
                                        )}
                                    </div>
                                    <span className="text-primary-600 font-medium ml-4">
                                        {formatCurrency(service.price)}
                                    </span>
                                </button>
                            ))
                        ) : (
                            <div className="p-4 text-center text-neutral-500">
                                Nenhum serviço encontrado
                            </div>
                        )}
                    </div>
                )}

                {showDropdown && (
                    <div
                        className="fixed inset-0 z-0"
                        onClick={() => setShowDropdown(false)}
                    />
                )}
            </div>

            {/* Selected Services */}
            {selectedServices.length > 0 && (
                <div className="space-y-3">
                    <h4 className="font-medium text-secondary-600">
                        Serviços Selecionados
                    </h4>
                    <div className="space-y-2">
                        {selectedServices.map((item) => (
                            <div
                                key={item.service_id}
                                className="bg-white rounded-lg p-4 border border-secondary-200 shadow-sm"
                            >
                                <div className="flex items-start gap-3">
                                    <div className="flex-1">
                                        <p className="font-medium text-secondary-900">
                                            {item.service_name}
                                        </p>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                                            {/* Quantity */}
                                            <div>
                                                <label className="text-xs text-neutral-500 mb-1 block">
                                                    Quantidade
                                                </label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={item.quantity}
                                                    onChange={(e) =>
                                                        updateQuantity(
                                                            item.service_id,
                                                            parseInt(e.target.value) || 1
                                                        )
                                                    }
                                                    className="input py-1 px-2 text-sm"
                                                />
                                            </div>

                                            {/* Price */}
                                            <div>
                                                <label className="text-xs text-neutral-500 mb-1 block">
                                                    Preço Unitário (R$)
                                                </label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={item.price}
                                                    onChange={(e) =>
                                                        updatePrice(
                                                            item.service_id,
                                                            parseFloat(e.target.value) || 0
                                                        )
                                                    }
                                                    className="input py-1 px-2 text-sm"
                                                />
                                            </div>

                                            {/* Subtotal */}
                                            <div>
                                                <label className="text-xs text-neutral-500 mb-1 block">
                                                    Subtotal
                                                </label>
                                                <div className="input py-1 px-2 text-sm bg-neutral-50 font-medium text-primary-600 border-neutral-200">
                                                    {formatCurrency(item.price * item.quantity)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Remove Button */}
                                    <button
                                        onClick={() => removeService(item.service_id)}
                                        className="text-neutral-400 hover:text-red-500 p-2 transition-colors mt-1"
                                        title="Remover serviço"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Total */}
                    <div className="bg-primary-50 rounded-lg p-4 border border-primary-200">
                        <div className="flex justify-between items-center">
                            <span className="font-semibold text-secondary-600">
                                Subtotal de Serviços:
                            </span>
                            <span className="text-xl font-bold text-primary-300">
                                {formatCurrency(subtotal)}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {selectedServices.length === 0 && (
                <div className="text-center py-8 bg-neutral-50 rounded-lg border border-dashed border-neutral-300">
                    <Search className="w-8 h-8 mx-auto text-neutral-400 mb-2" />
                    <p className="text-neutral-500">Nenhum serviço selecionado</p>
                    <p className="text-sm mt-1 text-neutral-400">
                        Busque e adicione serviços acima
                    </p>
                </div>
            )}
        </div>
    );
};
