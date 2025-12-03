import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarPlus, FileText, UserPlus, Plus } from 'lucide-react';

export const QuickActions: React.FC = () => {
    const navigate = useNavigate();

    const actions = [
        {
            label: 'Novo Agendamento',
            icon: CalendarPlus,
            color: 'bg-blue-50 text-blue-600 hover:bg-blue-100',
            onClick: () => navigate('/appointments?new=true')
        },
        {
            label: 'Nova O.S.',
            icon: FileText,
            color: 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100',
            onClick: () => navigate('/work-orders?new=true')
        },
        {
            label: 'Novo Cliente',
            icon: UserPlus,
            color: 'bg-purple-50 text-purple-600 hover:bg-purple-100',
            onClick: () => navigate('/customers?new=true')
        },
        {
            label: 'Novo Produto',
            icon: Plus,
            color: 'bg-orange-50 text-orange-600 hover:bg-orange-100',
            onClick: () => navigate('/products?new=true')
        }
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6 animate-in fade-in slide-in-from-top-8 duration-700">
            {actions.map((action, index) => {
                const Icon = action.icon;
                return (
                    <button
                        key={index}
                        onClick={action.onClick}
                        className={`flex flex-col items-center justify-center p-4 rounded-xl transition-all duration-200 border border-transparent hover:border-secondary-200 hover:shadow-sm ${action.color} h-full`}
                    >
                        <div className="mb-2 p-2 bg-white rounded-full shadow-sm">
                            <Icon className="w-6 h-6" />
                        </div>
                        <span className="text-sm font-semibold text-secondary-900">
                            {action.label}
                        </span>
                    </button>
                );
            })}
        </div>
    );
};
