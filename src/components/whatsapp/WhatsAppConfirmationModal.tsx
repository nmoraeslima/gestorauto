import React, { useState } from 'react';
import { X, MessageCircle, Copy, Check } from 'lucide-react';
import { sendWhatsAppMessage, copyMessageToClipboard } from '@/utils/whatsapp';
import { generateConfirmationMessage } from '@/utils/whatsapp-messages';
import { Appointment, Customer, Vehicle, Company } from '@/types/database';

interface WhatsAppConfirmationModalProps {
    appointment: Appointment & {
        customer: Customer;
        vehicle?: Vehicle;
        company?: Company;
    };
    onClose: () => void;
    onSent?: () => void;
}

export default function WhatsAppConfirmationModal({
    appointment,
    onClose,
    onSent,
}: WhatsAppConfirmationModalProps) {
    const [copied, setCopied] = useState(false);

    const message = generateConfirmationMessage({
        customer: appointment.customer,
        appointment,
        vehicle: appointment.vehicle,
        company: appointment.company,
    });

    const handleSendWhatsApp = () => {
        sendWhatsAppMessage(appointment.customer.phone, message);
        onSent?.();
        onClose();
    };

    const handleCopy = async () => {
        const success = await copyMessageToClipboard(message);
        if (success) {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                            <MessageCircle className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">
                                Agendamento Confirmado!
                            </h2>
                            <p className="text-sm text-gray-600">
                                Enviar confirmação via WhatsApp
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
                    {/* Customer Info */}
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
                                    {new Date(appointment.scheduled_at).toLocaleDateString('pt-BR')}
                                </p>
                            </div>
                            <div>
                                <p className="text-gray-600">Horário</p>
                                <p className="font-medium text-gray-900">
                                    {new Date(appointment.scheduled_at).toLocaleTimeString('pt-BR', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Message Preview */}
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
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
                            <pre className="text-sm text-gray-800 whitespace-pre-wrap font-sans">
                                {message}
                            </pre>
                        </div>
                    </div>

                    {/* Info */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm text-blue-800">
                            <strong>💡 Como funciona:</strong> Ao clicar em "Enviar WhatsApp",
                            o WhatsApp Web será aberto em uma nova aba com a mensagem já digitada.
                            Você só precisa clicar em "Enviar".
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                        Pular
                    </button>
                    <button
                        onClick={handleSendWhatsApp}
                        className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm"
                    >
                        <MessageCircle className="h-4 w-4" />
                        Enviar WhatsApp
                    </button>
                </div>
            </div>
        </div>
    );
}
