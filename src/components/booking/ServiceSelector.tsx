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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map((service) => {
                const isSelected = service.id === selectedServiceId;

                return (
                    <button
                        key={service.id}
                        onClick={() => onSelect(service)}
                        className={`
              relative p-6 rounded-lg border-2 transition-all text-left
              hover:shadow-lg hover:scale-[1.02]
              ${isSelected
                                ? 'border-primary-300 bg-primary-50 shadow-md'
                                : 'border-neutral-200 bg-white hover:border-primary-200'
                            }
            `}
                    >
                        {isSelected && (
                            <div className="absolute top-3 right-3">
                                <CheckCircle className="w-6 h-6 text-primary-300" />
                            </div>
                        )}

                        <div className="space-y-3">
                            <h3 className="text-lg font-semibold text-secondary-900 pr-8">
                                {service.name}
                            </h3>

                            {service.description && (
                                <p className="text-sm text-neutral-600 line-clamp-2">
                                    {service.description}
                                </p>
                            )}

                            <div className="flex items-center gap-4 pt-2">
                                <div className="flex items-center gap-1 text-neutral-600">
                                    <Clock className="w-4 h-4" />
                                    <span className="text-sm">{service.duration_minutes}min</span>
                                </div>

                                <div className="text-xl font-bold text-primary-300">
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
