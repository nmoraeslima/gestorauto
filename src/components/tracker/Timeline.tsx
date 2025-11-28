import React from 'react';
import { CheckCircle, Clock, Wrench, XCircle } from 'lucide-react';

type WorkOrderStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

interface TimelineProps {
    status: WorkOrderStatus;
    createdAt: string;
    updatedAt: string;
}

export const Timeline: React.FC<TimelineProps> = ({ status, createdAt, updatedAt }) => {
    const steps = [
        {
            id: 'pending',
            label: 'Recebido',
            description: 'Veículo recebido na estética',
            icon: Clock,
            date: createdAt,
        },
        {
            id: 'in_progress',
            label: 'Em Andamento',
            description: 'Serviços sendo executados',
            icon: Wrench,
            date: status === 'in_progress' || status === 'completed' ? updatedAt : undefined,
        },
        {
            id: 'completed',
            label: 'Finalizado',
            description: 'Pronto para retirada',
            icon: CheckCircle,
            date: status === 'completed' ? updatedAt : undefined,
        },
    ];

    if (status === 'cancelled') {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3 text-red-700">
                <XCircle className="w-6 h-6" />
                <div>
                    <p className="font-semibold">Serviço Cancelado</p>
                    <p className="text-sm">Entre em contato com a estética para mais informações.</p>
                </div>
            </div>
        );
    }

    const getCurrentStepIndex = () => {
        switch (status) {
            case 'pending': return 0;
            case 'in_progress': return 1;
            case 'completed': return 2;
            default: return 0;
        }
    };

    const currentStep = getCurrentStepIndex();

    return (
        <div className="relative">
            {/* Connecting Line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />

            <div className="space-y-8">
                {steps.map((step, index) => {
                    const Icon = step.icon;
                    const isCompleted = index <= currentStep;
                    const isCurrent = index === currentStep;

                    return (
                        <div key={step.id} className="relative flex items-start gap-4">
                            {/* Icon Bubble */}
                            <div
                                className={`relative z-10 flex items-center justify-center w-12 h-12 rounded-full border-4 transition-colors duration-300 ${isCompleted
                                    ? 'bg-primary-600 border-primary-100 text-white'
                                    : 'bg-white border-gray-100 text-gray-300'
                                    }`}
                            >
                                <Icon className="w-5 h-5" />
                            </div>

                            {/* Content */}
                            <div className={`flex-1 pt-1 ${isCompleted ? 'opacity-100' : 'opacity-50'}`}>
                                <h3 className={`font-semibold text-lg ${isCurrent ? 'text-primary-700' : 'text-gray-900'}`}>
                                    {step.label}
                                </h3>
                                <p className="text-gray-600 text-sm">{step.description}</p>
                                {step.date && isCompleted && (
                                    <p className="text-xs text-gray-400 mt-1">
                                        {new Date(step.date).toLocaleDateString('pt-BR', {
                                            day: '2-digit',
                                            month: '2-digit',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
