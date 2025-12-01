import React, { useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { useAvailability } from '@/hooks/useAvailability';
import { Clock, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DateTimePickerProps {
    companyId: string;
    serviceDuration: number;
    selectedDate: Date | null;
    selectedTime: string | null;
    onDateSelect: (date: Date) => void;
    onTimeSelect: (time: string) => void;
    maxAdvanceDays?: number;
}

export const DateTimePicker: React.FC<DateTimePickerProps> = ({
    companyId,
    serviceDuration,
    selectedDate,
    selectedTime,
    onDateSelect,
    onTimeSelect,
    maxAdvanceDays = 30,
}) => {
    const [calendarDate, setCalendarDate] = useState<Date>(new Date());

    const { slots, loading, error } = useAvailability({
        companyId,
        date: selectedDate,
        serviceDuration,
        enabled: !!selectedDate,
    });

    const handleDateChange = (value: any) => {
        if (value && !Array.isArray(value) && value instanceof Date) {
            setCalendarDate(value);
            onDateSelect(value);
            onTimeSelect(''); // Reset time selection
        }
    };

    const formatTimeSlot = (slotTime: string) => {
        const date = new Date(slotTime);
        return format(date, 'HH:mm', { locale: ptBR });
    };

    const availableSlots = slots.filter((slot) => slot.is_available);

    return (
        <div className="space-y-6">
            {/* Calendar */}
            <div className="flex justify-center">
                <div className="calendar-container">
                    <Calendar
                        onChange={handleDateChange}
                        value={calendarDate}
                        minDate={new Date()}
                        maxDate={new Date(Date.now() + maxAdvanceDays * 24 * 60 * 60 * 1000)}
                        locale="pt-BR"
                        className="rounded-lg border border-neutral-200 shadow-sm"
                    />
                </div>
            </div>

            {/* Time Slots */}
            {selectedDate && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-secondary-900">
                            Horários disponíveis para {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
                        </h3>
                        {loading && <Loader2 className="w-5 h-5 animate-spin text-primary-300" />}
                    </div>

                    {error && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
                            {error}
                        </div>
                    )}

                    {!loading && !error && availableSlots.length === 0 && (
                        <div className="p-8 text-center bg-neutral-50 rounded-lg border border-dashed border-neutral-300">
                            <Clock className="w-12 h-12 mx-auto mb-3 text-neutral-400" />
                            <p className="text-neutral-600">
                                Nenhum horário disponível para esta data.
                            </p>
                            <p className="text-sm text-neutral-500 mt-1">
                                Tente selecionar outra data.
                            </p>
                        </div>
                    )}

                    {!loading && availableSlots.length > 0 && (
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                            {availableSlots.map((slot) => {
                                const timeStr = formatTimeSlot(slot.slot_time);
                                const isSelected = selectedTime === slot.slot_time;

                                return (
                                    <button
                                        key={slot.slot_time}
                                        onClick={() => onTimeSelect(slot.slot_time)}
                                        className={`
                      py-3 px-4 rounded-lg border-2 font-medium transition-all
                      hover:scale-105 hover:shadow-md
                      ${isSelected
                                                ? 'border-primary-300 bg-primary-300 text-white shadow-md'
                                                : 'border-neutral-200 bg-white text-secondary-900 hover:border-primary-200'
                                            }
                    `}
                                    >
                                        {timeStr}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* Legend */}
            {selectedDate && !loading && availableSlots.length > 0 && (
                <div className="flex items-center gap-4 text-sm text-neutral-600">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded border-2 border-primary-300 bg-primary-300"></div>
                        <span>Selecionado</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded border-2 border-neutral-200 bg-white"></div>
                        <span>Disponível</span>
                    </div>
                </div>
            )}
        </div>
    );
};
