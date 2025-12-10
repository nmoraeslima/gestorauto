import React from 'react';
import { Service } from '@/types/database';
import { formatCurrency } from '@/utils/calculations';
import { Clock, CheckCircle } from 'lucide-react';

interface ServiceSelectorProps {
    services: Service[];
    selectedServiceId: string;
    onSelect: (service: Service) => void;
    loading?: boolean;
}

export const ServiceSelector: React.FC<ServiceSelectorProps> = ({
    services,
    selectedServiceId,
    onSelect,
    loading = false,
}) => {
    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                        <div className="h-40 bg-neutral-200 rounded-lg"></div>
                    </div>
                ))}
            </div>
        );
    }

    if (services.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-neutral-500">Nenhum serviço disponível no momento.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => {
                const isSelected = service.id === selectedServiceId;

                return (
                    <button
                        key={service.id}
                        onClick={() => onSelect(service)}
                        className={`
                            relative p-6 rounded-2xl border-2 transition-all duration-300 text-left group
                            hover:shadow-lg hover:-translate-y-1
                            ${isSelected
                                ? 'border-secondary-900 bg-secondary-900/5 shadow-xl'
                                : 'border-neutral-100 bg-white hover:border-secondary-900/30'
                            }
                        `}
                    >
                        {isSelected && (
                            <div className="absolute top-4 right-4">
                                <CheckCircle className="w-6 h-6 text-secondary-900 fill-white" />
                            </div>
                        )}

                        <div className="space-y-4">
                            <div>
                                <h3 className={`text-lg font-bold pr-8 transition-colors ${isSelected ? 'text-secondary-900' : 'text-secondary-700'}`}>
                                    {service.name}
                                </h3>

                                {service.description && (
                                    <p className="text-sm text-neutral-500 mt-2 line-clamp-2 leading-relaxed">
                                        {service.description}
                                    </p>
                                )}
                            </div>

                            <div className="pt-4 border-t border-neutral-100 flex items-center justify-between group-hover:border-neutral-200 transition-colors">
                                <div className="flex items-center gap-1.5 text-neutral-500 bg-neutral-50 px-3 py-1.5 rounded-lg">
                                    <Clock className="w-4 h-4" />
                                    <span className="text-sm font-medium">{service.duration_minutes} min</span>
                                </div>

                                <div className={`text-xl font-bold ${isSelected ? 'text-secondary-900' : 'text-primary-600'}`}>
                                    {formatCurrency(service.price)}
                                </div>
                            </div>
                        </div>
                    </button>
                );
            })}
        </div>
    );
};
