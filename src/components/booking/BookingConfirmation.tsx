import React from 'react';
import { CheckCircle, Calendar, Clock, Car, User, MapPin, Share2 } from 'lucide-react';
import { formatCurrency } from '@/utils/calculations';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface BookingConfirmationProps {
    data: {
        serviceName: string;
        servicePrice: number;
        selectedDate: Date;
        selectedTime: string;
        customerName: string;
        customerPhone: string;
        vehicleModel: string;
        vehiclePlate: string;
    };
    companyName: string;
    onNewBooking: () => void;
}

export const BookingConfirmation: React.FC<BookingConfirmationProps> = ({
    data,
    companyName,
    onNewBooking,
}) => {
    const appointmentDate = new Date(data.selectedTime);
    const formattedDate = format(appointmentDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    const formattedTime = format(appointmentDate, 'HH:mm', { locale: ptBR });

    const handleShare = () => {
        const message = `✅ Agendamento Confirmado!\n\n📅 ${formattedDate}\n⏰ ${formattedTime}\n🚗 ${data.serviceName}\n💰 ${formatCurrency(data.servicePrice)}\n📍 ${companyName}\n\nNos vemos lá! 🚀`;

        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    };

    const handleAddToCalendar = () => {
        const startDate = appointmentDate.toISOString().replace(/-|:|\.\d+/g, '');
        const endDate = new Date(appointmentDate.getTime() + 60 * 60 * 1000)
            .toISOString()
            .replace(/-|:|\.\d+/g, '');

        const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
            data.serviceName + ' - ' + companyName
        )}&dates=${startDate}/${endDate}&details=${encodeURIComponent(
            `Serviço: ${data.serviceName}\nVeículo: ${data.vehicleModel} - ${data.vehiclePlate}\nValor: ${formatCurrency(
                data.servicePrice
            )}`
        )}`;

        window.open(calendarUrl, '_blank');
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* Success Header */}
            <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-success-100 rounded-full">
                    <CheckCircle className="w-12 h-12 text-success-600" />
                </div>
                <div>
                    <h2 className="text-3xl font-bold text-secondary-900">Agendamento Confirmado!</h2>
                    <p className="text-neutral-600 mt-2">
                        Você receberá uma confirmação no WhatsApp em instantes.
                    </p>
                </div>
            </div>

            {/* Appointment Details */}
            <div className="bg-white rounded-lg border-2 border-primary-200 p-6 space-y-4">
                <div className="flex items-start gap-4">
                    <Calendar className="w-6 h-6 text-primary-300 mt-1" />
                    <div>
                        <p className="text-sm text-neutral-600">Data</p>
                        <p className="text-lg font-semibold text-secondary-900">{formattedDate}</p>
                    </div>
                </div>

                <div className="flex items-start gap-4">
                    <Clock className="w-6 h-6 text-primary-300 mt-1" />
                    <div>
                        <p className="text-sm text-neutral-600">Horário</p>
                        <p className="text-lg font-semibold text-secondary-900">{formattedTime}</p>
                    </div>
                </div>

                <div className="flex items-start gap-4">
                    <Car className="w-6 h-6 text-primary-300 mt-1" />
                    <div>
                        <p className="text-sm text-neutral-600">Serviço</p>
                        <p className="text-lg font-semibold text-secondary-900">{data.serviceName}</p>
                        <p className="text-xl font-bold text-primary-300 mt-1">
                            {formatCurrency(data.servicePrice)}
                        </p>
                    </div>
                </div>

                <div className="flex items-start gap-4">
                    <User className="w-6 h-6 text-primary-300 mt-1" />
                    <div>
                        <p className="text-sm text-neutral-600">Cliente</p>
                        <p className="text-lg font-semibold text-secondary-900">{data.customerName}</p>
                        <p className="text-sm text-neutral-600">{data.customerPhone}</p>
                    </div>
                </div>

                <div className="flex items-start gap-4">
                    <MapPin className="w-6 h-6 text-primary-300 mt-1" />
                    <div>
                        <p className="text-sm text-neutral-600">Local</p>
                        <p className="text-lg font-semibold text-secondary-900">{companyName}</p>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                    onClick={handleAddToCalendar}
                    className="btn btn-outline flex items-center justify-center gap-2"
                >
                    <Calendar className="w-5 h-5" />
                    Adicionar ao Calendário
                </button>

                <button
                    onClick={handleShare}
                    className="btn btn-outline flex items-center justify-center gap-2"
                >
                    <Share2 className="w-5 h-5" />
                    Compartilhar
                </button>
            </div>

            {/* New Booking */}
            <div className="text-center pt-4">
                <button onClick={onNewBooking} className="btn btn-primary">
                    Fazer Novo Agendamento
                </button>
            </div>

            {/* Important Info */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
                    <strong>Importante:</strong> Chegue com 10 minutos de antecedência. Em caso de
                    imprevistos, entre em contato pelo WhatsApp.
                </p>
            </div>
        </div>
    );
};
