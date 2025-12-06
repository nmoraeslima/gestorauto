import React, { useState } from 'react';
import { X, AlertTriangle, MessageCircle, Copy, Check } from 'lucide-react';
import { sendWhatsAppMessage, copyMessageToClipboard } from '@/utils/whatsapp';
import { generateCancellationMessage } from '@/utils/whatsapp-messages';
import { Appointment, Customer, Vehicle } from '@/types/database';

interface WhatsAppCancellationModalProps {
    appointment: Appointment & {
        customer: Customer;
        vehicle?: Vehicle;
    };
    onClose: () => void;
    onConfirm: (reason: string, customReason?: string) => Promise<void>;
}

const CANCELLATION_REASONS = [
    'Problema técnico na oficina',
    'Funcionário ausente',
    'Peça não chegou',
    'Cliente solicitou reagendamento',
    'Condições climáticas',
    'Outro (especificar)',
];

export default function WhatsAppCancellationModal({
    appointment,
    onClose,
    onConfirm,
}: WhatsAppCancellationModalProps) {
    const [reason, setReason] = useState('');
    const [customReason, setCustomReason] = useState('');
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    const message = reason
        ? generateCancellationMessage(
            {
                customer: appointment.customer,
                appointment,
                vehicle: appointment.vehicle,
            },
            reason,
            customReason
        )
        : '';

    const handleCancel = async () => {
        if (!reason || (reason === 'Outro (especificar)' && !customReason)) {
            return;
        }

        setLoading(true);
        try {
            await onConfirm(reason, customReason);
            sendWhatsAppMessage(appointment.customer.phone, message);
            onClose();
        } catch (error) {
            console.error('Error cancelling appointment:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = async () => {
        const success = await copyMessageToClipboard(message);
        if (success) {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const isValid = reason && (reason !== 'Outro (especificar)' || customReason);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-red-50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                            <AlertTriangle className="h-5 w-5 text-red-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-red-900">
                                Cancelar Agendamento
                            </h2>
                            <p className="text-sm text-red-700">
                                Esta ação não pode ser desfeita
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {/* Appointment Info */}
                    <div className="bg-gray-50 rounded-lg p-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-gray-600">Cliente</p>
                                <p className="font-medium text-gray-900">
                                    {appointment.customer.name}
                                </p>
                            </div>
                            <div>
                                <p className="text-gray-600">Telefone</p>
                                <p className="font-medium text-gray-900">
                                    {appointment.customer.phone}
                                </p>
                            </div>
                            <div>
                                <p className="text-gray-600">Data</p>
                                <p className="font-medium text-gray-900">
                                    {new Date(appointment.scheduled_date).toLocaleDateString('pt-BR')}
                                </p>
                            </div>
                            <div>
                                <p className="text-gray-600">Horário</p>
                                <p className="font-medium text-gray-900">
                                    {new Date(appointment.scheduled_date).toLocaleTimeString('pt-BR', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Reason Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Motivo do Cancelamento <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                            required
                        >
                            <option value="">Selecione o motivo...</option>
                            {CANCELLATION_REASONS.map((r) => (
                                <option key={r} value={r}>
                                    {r}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Custom Reason */}
                    {reason === 'Outro (especificar)' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Especifique o motivo <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                value={customReason}
                                onChange={(e) => setCustomReason(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                                rows={3}
                                placeholder="Digite o motivo do cancelamento..."
                                required
                            />
                        </div>
                    )}

                    {/* Message Preview */}
                    {message && (
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-sm font-medium text-gray-700">
                                    Preview da Mensagem
                                </label>
                                <button
                                    onClick={handleCopy}
                                    className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1 transition-colors"
                                >
                                    {copied ? (
                                        <>
                                            <Check className="h-4 w-4 text-green-600" />
                                            <span className="text-green-600">Copiado!</span>
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="h-4 w-4" />
                                            <span>Copiar</span>
                                        </>
                                    )}
                                </button>
                            </div>
                            <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-lg p-4 border border-red-200">
                                <pre className="text-sm text-gray-800 whitespace-pre-wrap font-sans">
                                    {message}
                                </pre>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                    >
                        Voltar
                    </button>
                    <button
                        onClick={handleCancel}
                        disabled={!isValid || loading}
                        className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Cancelando...
                            </>
                        ) : (
                            <>
                                <MessageCircle className="h-4 w-4" />
                                Cancelar e Notificar
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
