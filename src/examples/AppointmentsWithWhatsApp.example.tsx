/**
 * EXEMPLO DE INTEGRAÇÃO - WhatsApp Multi-Device
 * 
 * Este arquivo mostra como integrar os componentes WhatsApp
 * em uma página de agendamentos existente.
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import WhatsAppConfirmationModal from '@/components/whatsapp/WhatsAppConfirmationModal';
import WhatsAppCancellationModal from '@/components/whatsapp/WhatsAppCancellationModal';
import QuickWhatsAppButton from '@/components/whatsapp/QuickWhatsAppButton';
import { logWhatsAppMessage } from '@/utils/whatsapp-logging';
import { Plus, Pencil, X } from 'lucide-react';

export default function AppointmentsPageExample() {
    const { user } = useAuth();
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);

    // WhatsApp modals state
    const [showWhatsAppConfirmation, setShowWhatsAppConfirmation] = useState(false);
    const [showWhatsAppCancellation, setShowWhatsAppCancellation] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState(null);

    // Load appointments
    useEffect(() => {
        loadAppointments();
    }, []);

    async function loadAppointments() {
        const { data } = await supabase
            .from('appointments')
            .select(`
        *,
        customer:customers(*),
        vehicle:vehicles(*),
        company:companies(*)
      `)
            .eq('company_id', user?.company_id)
            .order('scheduled_date', { ascending: true });

        setAppointments(data || []);
        setLoading(false);
    }

    // Create appointment
    async function handleCreateAppointment(appointmentData) {
        const { data: appointment, error } = await supabase
            .from('appointments')
            .insert({
                ...appointmentData,
                company_id: user.company_id,
                created_by: user.id,
            })
            .select(`
        *,
        customer:customers(*),
        vehicle:vehicles(*),
        company:companies(*)
      `)
            .single();

        if (error) {
            console.error('Error creating appointment:', error);
            return;
        }

        // Reload list
        loadAppointments();

        // Show WhatsApp confirmation modal
        setSelectedAppointment(appointment);
        setShowWhatsAppConfirmation(true);
    }

    // Cancel appointment
    function handleCancelClick(appointment) {
        setSelectedAppointment(appointment);
        setShowWhatsAppCancellation(true);
    }

    async function handleCancelConfirm(reason, customReason) {
        await supabase
            .from('appointments')
            .update({
                status: 'cancelled',
                cancellation_reason: reason === 'Outro (especificar)' ? customReason : reason,
                cancelled_by: user.id,
                cancelled_at: new Date().toISOString(),
            })
            .eq('id', selectedAppointment.id);

        // Log WhatsApp message (analytics)
        await logWhatsAppMessage({
            appointmentId: selectedAppointment.id,
            customerName: selectedAppointment.customer.name,
            phone: selectedAppointment.customer.phone,
            messageType: 'cancellation',
            messagePreview: `Cancelamento: ${reason}`,
            companyId: user.company_id,
            userId: user.id,
        });

        // Reload list
        loadAppointments();
    }

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold">Agendamentos</h1>
                <button
                    onClick={() => {/* Open create modal */ }}
                    className="btn-primary"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Agendamento
                </button>
            </div>

            {/* Appointments Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Cliente
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Data/Hora
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Status
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                Ações
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {appointments.map((appointment) => (
                            <tr key={appointment.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">
                                        {appointment.customer.name}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                        {appointment.customer.phone}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">
                                        {new Date(appointment.scheduled_date).toLocaleDateString('pt-BR')}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                        {new Date(appointment.scheduled_date).toLocaleTimeString('pt-BR', {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`
                    px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full
                    ${appointment.status === 'confirmed' ? 'bg-green-100 text-green-800' : ''}
                    ${appointment.status === 'cancelled' ? 'bg-red-100 text-red-800' : ''}
                    ${appointment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''}
                  `}>
                                        {appointment.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <div className="flex items-center justify-end gap-2">
                                        {/* Edit button */}
                                        <button
                                            className="text-gray-600 hover:text-gray-900"
                                            title="Editar"
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </button>

                                        {/* WhatsApp quick button */}
                                        {appointment.status !== 'cancelled' && (
                                            <QuickWhatsAppButton
                                                appointment={appointment}
                                                type="confirmation"
                                                size="sm"
                                            />
                                        )}

                                        {/* Cancel button */}
                                        {appointment.status !== 'cancelled' && (
                                            <button
                                                onClick={() => handleCancelClick(appointment)}
                                                className="text-red-600 hover:text-red-900"
                                                title="Cancelar"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* WhatsApp Confirmation Modal */}
            {showWhatsAppConfirmation && selectedAppointment && (
                <WhatsAppConfirmationModal
                    appointment={selectedAppointment}
                    onClose={() => {
                        setShowWhatsAppConfirmation(false);
                        setSelectedAppointment(null);
                    }}
                    onSent={async () => {
                        // Log message (analytics)
                        await logWhatsAppMessage({
                            appointmentId: selectedAppointment.id,
                            customerName: selectedAppointment.customer.name,
                            phone: selectedAppointment.customer.phone,
                            messageType: 'confirmation',
                            messagePreview: 'Agendamento confirmado',
                            companyId: user.company_id,
                            userId: user.id,
                        });
                    }}
                />
            )}

            {/* WhatsApp Cancellation Modal */}
            {showWhatsAppCancellation && selectedAppointment && (
                <WhatsAppCancellationModal
                    appointment={selectedAppointment}
                    onClose={() => {
                        setShowWhatsAppCancellation(false);
                        setSelectedAppointment(null);
                    }}
                    onConfirm={handleCancelConfirm}
                />
            )}
        </div>
    );
}
