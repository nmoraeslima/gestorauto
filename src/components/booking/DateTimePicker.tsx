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
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Calendar */}
            <div className="flex justify-center">
                <div className="p-4 bg-white rounded-2xl shadow-lg border border-neutral-100">
                    <Calendar
                        onChange={handleDateChange}
                        value={calendarDate}
                        minDate={new Date()}
                        maxDate={new Date(Date.now() + maxAdvanceDays * 24 * 60 * 60 * 1000)}
                        locale="pt-BR"
                        className="!border-none !font-sans custom-calendar"
                        tileClassName={({ date, view }) => {
                            if (view === 'month') {
                                const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();
                                const isToday = date.toDateString() === new Date().toDateString();

                                let classes = 'rounded-lg hover:bg-neutral-100 transition-colors font-medium text-sm p-2 ';

                                if (isSelected) {
                                    return classes + '!bg-secondary-900 !text-white shadow-md transform scale-105';
                                }
                                if (isToday) {
                                    return classes + 'text-secondary-900 font-bold border border-secondary-900/20';
                                }
                                return classes + 'text-neutral-600';
                            }
                            return '';
                        }}
                    />
                    <style>{`
                        .react-calendar { width: 350px; max-width: 100%; background: white; line-height: 1.125em; }
                        .react-calendar__navigation button { color: #1a1a1a; min-width: 44px; background: none; font-size: 16px; font-weight: 600; margin-top: 8px; }
                        .react-calendar__navigation button:enabled:hover, .react-calendar__navigation button:enabled:focus { background-color: #f5f5f5; border-radius: 8px; }
                        .react-calendar__month-view__weekdays { text-align: center; text-transform: uppercase; font-weight: bold; font-size: 0.75em; color: #9ca3af; margin-bottom: 0.5rem; }
                        .react-calendar__month-view__days__day--weekend { color: #ef4444; }
                        .react-calendar__tile:disabled { background-color: #fca5a5; color: #ef4444; opacity: 0.5; }
                        .react-calendar__tile { padding: 0.75em 0.5em; }
                    `}</style>
                </div>
            </div>

            {/* Time Slots */}
            {selectedDate && (
                <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 delay-100">
                    <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
                        <h3 className="text-lg font-bold text-secondary-900 flex items-center gap-2">
                            <Clock className="w-5 h-5 text-secondary-900" />
                            Horários para <span className="text-primary-600 ml-1 capitalize">{format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}</span>
                        </h3>
                        {loading && <Loader2 className="w-5 h-5 animate-spin text-primary-600" />}
                    </div>

                    {error && (
                        <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-medium flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                            {error}
                        </div>
                    )}

                    {!loading && !error && availableSlots.length === 0 && (
                        <div className="py-12 text-center bg-neutral-50 rounded-2xl border-2 border-dashed border-neutral-200">
                            <Clock className="w-12 h-12 mx-auto mb-3 text-neutral-300" />
                            <p className="text-secondary-900 font-medium">
                                Agenda lotada para este dia
                            </p>
                            <p className="text-sm text-neutral-500 mt-1">
                                Por favor, escolha outra data no calendário acima.
                            </p>
                        </div>
                    )}

                    {!loading && availableSlots.length > 0 && (
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                            {availableSlots.map((slot) => {
                                const timeStr = formatTimeSlot(slot.slot_time);
                                const isSelected = selectedTime === slot.slot_time;

                                return (
                                    <button
                                        key={slot.slot_time}
                                        onClick={() => onTimeSelect(slot.slot_time)}
                                        className={`
                                            py-3 px-2 rounded-xl text-sm font-semibold transition-all duration-200
                                            hover:scale-105 active:scale-95
                                            ${isSelected
                                                ? 'bg-secondary-900 text-white shadow-lg shadow-secondary-900/20 ring-2 ring-secondary-900 ring-offset-2'
                                                : 'bg-white text-secondary-900 border border-neutral-200 hover:border-secondary-900 hover:bg-neutral-50'
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
        </div>
    );
};
