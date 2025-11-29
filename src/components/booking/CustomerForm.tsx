import React from 'react';
import { User, Phone, Mail, Car } from 'lucide-react';

interface CustomerFormProps {
    data: {
        customerName: string;
        customerPhone: string;
        customerEmail: string;
        vehicleBrand: string;
        vehicleModel: string;
        vehiclePlate: string;
        notes: string;
    };
    onChange: (field: string, value: string) => void;
    errors?: Record<string, string>;
}

export const CustomerForm: React.FC<CustomerFormProps> = ({ data, onChange, errors = {} }) => {
    const formatPhone = (value: string) => {
        const numbers = value.replace(/\D/g, '');
        if (numbers.length <= 11) {
            return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
        }
        return value;
    };

    const formatPlate = (value: string) => {
        return value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7);
    };

    return (
        <div className="space-y-6">
            {/* Customer Info */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-secondary-900 flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Seus Dados
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="label">
                            Nome Completo <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={data.customerName}
                            onChange={(e) => onChange('customerName', e.target.value)}
                            className={`input ${errors.customerName ? 'border-red-500' : ''}`}
                            placeholder="João da Silva"
                            required
                        />
                        {errors.customerName && (
                            <p className="text-sm text-red-500 mt-1">{errors.customerName}</p>
                        )}
                    </div>

                    <div>
                        <label className="label">
                            WhatsApp <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
                            <input
                                type="tel"
                                value={data.customerPhone}
                                onChange={(e) => onChange('customerPhone', formatPhone(e.target.value))}
                                className={`input pl-10 ${errors.customerPhone ? 'border-red-500' : ''}`}
                                placeholder="(11) 99999-9999"
                                required
                            />
                        </div>
                        {errors.customerPhone && (
                            <p className="text-sm text-red-500 mt-1">{errors.customerPhone}</p>
                        )}
                    </div>

                    <div className="md:col-span-2">
                        <label className="label">E-mail (opcional)</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
                            <input
                                type="email"
                                value={data.customerEmail}
                                onChange={(e) => onChange('customerEmail', e.target.value)}
                                className="input pl-10"
                                placeholder="joao@exemplo.com"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Vehicle Info */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-secondary-900 flex items-center gap-2">
                    <Car className="w-5 h-5" />
                    Dados do Veículo
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="label">Marca (opcional)</label>
                        <input
                            type="text"
                            value={data.vehicleBrand}
                            onChange={(e) => onChange('vehicleBrand', e.target.value)}
                            className="input"
                            placeholder="Honda"
                        />
                    </div>

                    <div>
                        <label className="label">
                            Modelo <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={data.vehicleModel}
                            onChange={(e) => onChange('vehicleModel', e.target.value)}
                            className={`input ${errors.vehicleModel ? 'border-red-500' : ''}`}
                            placeholder="Civic"
                            required
                        />
                        {errors.vehicleModel && (
                            <p className="text-sm text-red-500 mt-1">{errors.vehicleModel}</p>
                        )}
                    </div>

                    <div className="md:col-span-2">
                        <label className="label">
                            Placa <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={data.vehiclePlate}
                            onChange={(e) => onChange('vehiclePlate', formatPlate(e.target.value))}
                            className={`input ${errors.vehiclePlate ? 'border-red-500' : ''}`}
                            placeholder="ABC1234"
                            maxLength={7}
                            required
                        />
                        {errors.vehiclePlate && (
                            <p className="text-sm text-red-500 mt-1">{errors.vehiclePlate}</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Notes */}
            <div>
                <label className="label">Observações (opcional)</label>
                <textarea
                    rows={3}
                    value={data.notes}
                    onChange={(e) => onChange('notes', e.target.value)}
                    className="input"
                    placeholder="Alguma solicitação especial ou observação..."
                />
            </div>

            {/* Privacy Notice */}
            <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                <p className="text-sm text-neutral-600">
                    ℹ️ Seus dados serão utilizados apenas para gerenciar seu agendamento e enviar
                    lembretes. Não compartilharemos suas informações com terceiros.
                </p>
            </div>
        </div>
    );
};
