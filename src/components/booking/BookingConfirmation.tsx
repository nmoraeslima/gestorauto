import React from 'react';
import { CheckCircle, Calendar, Clock, Car, User, MapPin, Share2, Download } from 'lucide-react';
import { formatCurrency } from '@/utils/calculations';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface BookingConfirmationProps {
    data: {
        serviceName: string;
        servicePrice: number;
        selectedDate: Date | null;
        selectedTime: string | null;
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
    if (!data.selectedDate || !data.selectedTime) return null;

    const appointmentDate = new Date(data.selectedTime);
    const formattedDate = format(appointmentDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    const formattedTime = format(appointmentDate, 'HH:mm', { locale: ptBR });

    const handleShare = () => {
        const message = `✅ Agendamento Confirmado!\n\n📅 ${formattedDate}\n⏰ ${formattedTime}\n🚗 ${data.serviceName}\n💰 ${formatCurrency(data.servicePrice)}\n📍 ${companyName}\n\nNos vemos lá! 🚀`;
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    };

    const handleAddToGoogleCalendar = () => {
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

    const handleDownloadICS = () => {
        const startDate = format(appointmentDate, "yyyyMMdd'T'HHmmss");
        const endDate = format(new Date(appointmentDate.getTime() + 60 * 60 * 1000), "yyyyMMdd'T'HHmmss");

        const icsContent = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'BEGIN:VEVENT',
            `DTSTART:${startDate}`,
            `DTEND:${endDate}`,
            `SUMMARY:${data.serviceName} - ${companyName}`,
            `DESCRIPTION:Serviço: ${data.serviceName}\\nVeículo: ${data.vehicleModel} - ${data.vehiclePlate}\\nValor: ${formatCurrency(data.servicePrice)}`,
            `LOCATION:${companyName}`,
            'END:VEVENT',
            'END:VCALENDAR'
        ].join('\n');

        const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.setAttribute('download', 'agendamento.ics');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Success Header */}
            <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-24 h-24 bg-green-100 rounded-full shadow-lg shadow-green-100/50 mb-2 ring-8 ring-green-50 animate-bounce-slow">
                    <CheckCircle className="w-12 h-12 text-green-600" />
                </div>
                <div>
                    <h2 className="text-3xl font-extrabold text-secondary-900 tracking-tight">Agendamento Confirmado!</h2>
                    <p className="text-neutral-600 mt-2 max-w-md mx-auto">
                        Tudo certo, <strong>{data.customerName.split(' ')[0]}</strong>! Enviamos os detalhes para o seu WhatsApp.
                    </p>
                </div>
            </div>

            {/* Appointment Details Card */}
            <div className="bg-white rounded-2xl shadow-card border border-neutral-100 overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-success-400 to-primary-500" />

                <div className="p-6 md:p-8 grid gap-6">
                    {/* Time & Date */}
                    <div className="flex items-center gap-4 pb-6 border-b border-neutral-100">
                        <div className="bg-primary-50 p-3 rounded-xl">
                            <Calendar className="w-8 h-8 text-primary-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-neutral-500 uppercase tracking-wider">Data e Horário</p>
                            <p className="text-xl font-bold text-secondary-900 capitalize">{formattedDate}</p>
                            <p className="text-lg text-secondary-600 font-medium">às {formattedTime}</p>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 text-neutral-500 mb-1">
                                <Car className="w-4 h-4" />
                                <span className="text-xs font-bold uppercase tracking-wider">Serviço</span>
                            </div>
                            <p className="font-semibold text-secondary-900">{data.serviceName}</p>
                            <p className="text-primary-600 font-bold">{formatCurrency(data.servicePrice)}</p>
                        </div>

                        <div className="space-y-1">
                            <div className="flex items-center gap-2 text-neutral-500 mb-1">
                                <MapPin className="w-4 h-4" />
                                <span className="text-xs font-bold uppercase tracking-wider">Local</span>
                            </div>
                            <p className="font-semibold text-secondary-900">{companyName}</p>
                            <p className="text-sm text-neutral-500 truncate">Ver no mapa</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-3">
                    <button
                        onClick={handleAddToGoogleCalendar}
                        className="btn w-full bg-white border border-neutral-200 text-secondary-700 hover:bg-neutral-50 hover:border-neutral-300 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all shadow-sm"
                    >
                        <Calendar className="w-5 h-5 text-blue-500" />
                        Google Calendar
                    </button>
                    <button
                        onClick={handleDownloadICS}
                        className="btn w-full bg-white border border-neutral-200 text-secondary-700 hover:bg-neutral-50 hover:border-neutral-300 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all shadow-sm"
                    >
                        <Download className="w-5 h-5 text-secondary-900" />
                        Apple/Outlook (.ics)
                    </button>
                </div>

                <div className="space-y-3">
                    <button
                        onClick={handleShare}
                        className="btn w-full bg-[#25D366] hover:bg-[#128C7E] text-white border-none flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all shadow-lg shadow-green-500/20"
                    >
                        <Share2 className="w-5 h-5" />
                        Enviar confirmação
                    </button>
                    <button
                        onClick={onNewBooking}
                        className="btn w-full btn-ghost text-primary-600 hover:bg-primary-50 hover:text-primary-700 flex items-center justify-center gap-2 py-3 rounded-xl font-medium"
                    >
                        Novo Agendamento
                    </button>
                </div>
            </div>

            {/* Important Info */}
            <div className="bg-blue-50/50 rounded-xl p-4 text-center">
                <p className="text-sm text-blue-700">
                    ℹ️ <strong>Dica:</strong> Chegue com 10 minutos de antecedência para garantir o melhor atendimento.
                </p>
            </div>
        </div>
    );
};
