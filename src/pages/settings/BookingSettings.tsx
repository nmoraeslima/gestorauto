import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Save, Clock, Calendar, Settings as SettingsIcon, X, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

interface WorkingHours {
    enabled: boolean;
    start: string;
    end: string;
}

interface BookingSettings {
    enabled: boolean;
    auto_approve: boolean;
    min_advance_hours: number;
    max_advance_days: number;
    slot_duration: number;
    buffer_minutes: number;
    working_hours: {
        monday: WorkingHours;
        tuesday: WorkingHours;
        wednesday: WorkingHours;
        thursday: WorkingHours;
        friday: WorkingHours;
        saturday: WorkingHours;
        sunday: WorkingHours;
    };
    blocked_dates: string[];
    timezone?: string;
}

const DEFAULT_SETTINGS: BookingSettings = {
    enabled: true,
    auto_approve: false,
    min_advance_hours: 2,
    max_advance_days: 30,
    slot_duration: 30,
    buffer_minutes: 15,
    timezone: 'America/Sao_Paulo',
    working_hours: {
        monday: { enabled: true, start: '08:00', end: '18:00' },
        tuesday: { enabled: true, start: '08:00', end: '18:00' },
        wednesday: { enabled: true, start: '08:00', end: '18:00' },
        thursday: { enabled: true, start: '08:00', end: '18:00' },
        friday: { enabled: true, start: '08:00', end: '18:00' },
        saturday: { enabled: true, start: '08:00', end: '14:00' },
        sunday: { enabled: false, start: '00:00', end: '00:00' },
    },
    blocked_dates: [],
};

const TIMEZONES = [
    { value: 'America/Sao_Paulo', label: 'Horário de Brasília (Brasília, São Paulo, Rio)' },
    { value: 'America/Manaus', label: 'Horário do Amazonas (Manaus)' },
    { value: 'America/Rio_Branco', label: 'Horário do Acre (Rio Branco)' },
    { value: 'America/Campo_Grande', label: 'Horário do MS (Campo Grande)' },
    { value: 'America/Cuiaba', label: 'Horário do MT (Cuiabá)' },
    { value: 'America/Belem', label: 'Horário do Pará/Amapá (Belém)' },
    { value: 'America/Noronha', label: 'Horário de Fernando de Noronha' },
];

const DAYS_PT = {
    monday: 'Segunda-feira',
    tuesday: 'Terça-feira',
    wednesday: 'Quarta-feira',
    thursday: 'Quinta-feira',
    friday: 'Sexta-feira',
    saturday: 'Sábado',
    sunday: 'Domingo',
};

export const BookingSettings: React.FC = () => {
    const { user } = useAuth();
    const [settings, setSettings] = useState<BookingSettings>(DEFAULT_SETTINGS);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [newBlockedDate, setNewBlockedDate] = useState('');
    const [bookingLink, setBookingLink] = useState('');

    useEffect(() => {
        loadSettings();
        generateBookingLink();
    }, [user]);

    const loadSettings = async () => {
        if (!user?.company?.id) return;

        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('companies')
                .select('booking_settings, slug')
                .eq('id', user.company.id)
                .single();

            if (error) throw error;

            if (data?.booking_settings) {
                setSettings(data.booking_settings as BookingSettings);
            }
        } catch (error: any) {
            console.error('Error loading booking settings:', error);
            toast.error('Erro ao carregar configurações');
        } finally {
            setLoading(false);
        }
    };

    const generateBookingLink = async () => {
        if (!user?.company?.id) return;

        const { data } = await supabase
            .from('companies')
            .select('slug')
            .eq('id', user.company.id)
            .single();

        if (data?.slug) {
            const baseUrl = window.location.origin;
            setBookingLink(`${baseUrl}/book/${data.slug}`);
        }
    };

    const handleSave = async () => {
        if (!user?.company?.id) return;

        setSaving(true);
        try {
            const { error } = await supabase
                .from('companies')
                .update({ booking_settings: settings })
                .eq('id', user.company.id);

            if (error) throw error;

            toast.success('Configurações salvas com sucesso!');
        } catch (error: any) {
            console.error('Error saving booking settings:', error);
            toast.error('Erro ao salvar configurações');
        } finally {
            setSaving(false);
        }
    };

    const updateWorkingHours = (day: keyof typeof settings.working_hours, field: keyof WorkingHours, value: any) => {
        setSettings({
            ...settings,
            working_hours: {
                ...settings.working_hours,
                [day]: {
                    ...settings.working_hours[day],
                    [field]: value,
                },
            },
        });
    };

    const addBlockedDate = () => {
        if (!newBlockedDate) return;
        if (settings.blocked_dates.includes(newBlockedDate)) {
            toast.error('Data já bloqueada');
            return;
        }

        setSettings({
            ...settings,
            blocked_dates: [...settings.blocked_dates, newBlockedDate].sort(),
        });
        setNewBlockedDate('');
    };

    const removeBlockedDate = (date: string) => {
        setSettings({
            ...settings,
            blocked_dates: settings.blocked_dates.filter((d) => d !== date),
        });
    };

    const copyBookingLink = () => {
        navigator.clipboard.writeText(bookingLink);
        toast.success('Link copiado!');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-secondary-900">Agendamento Online</h1>
                    <p className="text-neutral-600 mt-1">Configure o sistema de agendamento para clientes</p>
                </div>
                <button onClick={handleSave} disabled={saving} className="btn btn-primary flex items-center gap-2 justify-center w-full sm:w-auto">
                    <Save className="w-5 h-5" />
                    {saving ? 'Salvando...' : 'Salvar Configurações'}
                </button>
            </div>

            {/* Booking Link */}
            {bookingLink && (
                <div className="card p-4 sm:p-6 bg-primary-50 border-primary-200">
                    <h3 className="font-semibold text-secondary-900 mb-2 flex items-center gap-2">
                        <SettingsIcon className="w-5 h-5" />
                        Link de Agendamento
                    </h3>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <input type="text" value={bookingLink} readOnly className="input flex-1 bg-white text-sm" />
                        <button onClick={copyBookingLink} className="btn btn-outline whitespace-nowrap">
                            Copiar
                        </button>
                    </div>
                    <p className="text-sm text-neutral-600 mt-2">
                        Compartilhe este link com seus clientes para que possam agendar serviços online.
                    </p>
                </div>
            )}

            {/* General Settings */}
            <div className="card p-6">
                <h3 className="font-semibold text-secondary-900 mb-4 flex items-center gap-2">
                    <SettingsIcon className="w-5 h-5" />
                    Configurações Gerais
                </h3>

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <label className="font-medium text-secondary-900">Agendamento Online Ativo</label>
                            <p className="text-sm text-neutral-600">Permitir que clientes agendem online</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={settings.enabled}
                                onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-300"></div>
                        </label>
                    </div>

                    <div>
                        <label className="label">Fuso Horário</label>
                        <select
                            value={settings.timezone || 'America/Sao_Paulo'}
                            onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                            className="input"
                        >
                            {TIMEZONES.map((tz) => (
                                <option key={tz.value} value={tz.value}>
                                    {tz.label}
                                </option>
                            ))}
                        </select>
                        <p className="text-xs text-neutral-500 mt-1">Selecione o fuso horário da sua região para garantir que os agendamentos apareçam corretamente.</p>
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <label className="font-medium text-secondary-900">Aprovação Automática</label>
                            <p className="text-sm text-neutral-600">Aprovar agendamentos automaticamente</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={settings.auto_approve}
                                onChange={(e) => setSettings({ ...settings, auto_approve: e.target.checked })}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-300"></div>
                        </label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="label">Antecedência Mínima (horas)</label>
                            <input
                                type="number"
                                min="0"
                                value={settings.min_advance_hours}
                                onChange={(e) => setSettings({ ...settings, min_advance_hours: parseInt(e.target.value) || 0 })}
                                className="input"
                            />
                            <p className="text-xs text-neutral-500 mt-1">Tempo mínimo antes do agendamento</p>
                        </div>

                        <div>
                            <label className="label">Antecedência Máxima (dias)</label>
                            <input
                                type="number"
                                min="1"
                                value={settings.max_advance_days}
                                onChange={(e) => setSettings({ ...settings, max_advance_days: parseInt(e.target.value) || 1 })}
                                className="input"
                            />
                            <p className="text-xs text-neutral-500 mt-1">Até quantos dias no futuro</p>
                        </div>

                        <div>
                            <label className="label">Duração do Slot (minutos)</label>
                            <select
                                value={settings.slot_duration}
                                onChange={(e) => setSettings({ ...settings, slot_duration: parseInt(e.target.value) })}
                                className="input"
                            >
                                <option value="15">15 minutos</option>
                                <option value="30">30 minutos</option>
                                <option value="60">60 minutos</option>
                            </select>
                            <p className="text-xs text-neutral-500 mt-1">Intervalo entre horários</p>
                        </div>

                        <div>
                            <label className="label">Intervalo entre Serviços (minutos)</label>
                            <input
                                type="number"
                                min="0"
                                step="5"
                                value={settings.buffer_minutes}
                                onChange={(e) => setSettings({ ...settings, buffer_minutes: parseInt(e.target.value) || 0 })}
                                className="input"
                            />
                            <p className="text-xs text-neutral-500 mt-1">Tempo de folga entre agendamentos</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Working Hours */}
            <div className="card p-6">
                <h3 className="font-semibold text-secondary-900 mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Horário de Funcionamento
                </h3>

                <div className="space-y-3">
                    {Object.entries(settings.working_hours).map(([day, hours]) => (
                        <div key={day} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-3 bg-neutral-50 rounded-lg">
                            <div className="min-w-[140px]">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={hours.enabled}
                                        onChange={(e) => updateWorkingHours(day as any, 'enabled', e.target.checked)}
                                        className="rounded border-neutral-300 text-primary-300 focus:ring-primary-300"
                                    />
                                    <span className="font-medium text-secondary-900">
                                        {DAYS_PT[day as keyof typeof DAYS_PT]}
                                    </span>
                                </label>
                            </div>

                            {hours.enabled && (
                                <div className="flex items-center gap-2 flex-1">
                                    <input
                                        type="time"
                                        value={hours.start}
                                        onChange={(e) => updateWorkingHours(day as any, 'start', e.target.value)}
                                        className="input py-1 px-2 text-sm flex-1 min-w-0"
                                    />
                                    <span className="text-neutral-500 text-sm whitespace-nowrap">até</span>
                                    <input
                                        type="time"
                                        value={hours.end}
                                        onChange={(e) => updateWorkingHours(day as any, 'end', e.target.value)}
                                        className="input py-1 px-2 text-sm flex-1 min-w-0"
                                    />
                                </div>
                            )}

                            {!hours.enabled && (
                                <span className="text-neutral-500 text-sm">Fechado</span>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Blocked Dates */}
            <div className="card p-6">
                <h3 className="font-semibold text-secondary-900 mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Datas Bloqueadas
                </h3>

                <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-2">
                        <input
                            type="date"
                            value={newBlockedDate}
                            onChange={(e) => setNewBlockedDate(e.target.value)}
                            className="input flex-1"
                            min={new Date().toISOString().split('T')[0]}
                        />
                        <button onClick={addBlockedDate} className="btn btn-outline flex items-center gap-2 justify-center">
                            <Plus className="w-5 h-5" />
                            Adicionar
                        </button>
                    </div>

                    {settings.blocked_dates.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                            {settings.blocked_dates.map((date) => (
                                <div
                                    key={date}
                                    className="flex items-center justify-between p-2 bg-red-50 border border-red-200 rounded-lg"
                                >
                                    <span className="text-sm text-secondary-900">
                                        {new Date(date + 'T00:00:00').toLocaleDateString('pt-BR')}
                                    </span>
                                    <button
                                        onClick={() => removeBlockedDate(date)}
                                        className="text-red-500 hover:text-red-700 p-1"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-neutral-500 text-sm text-center py-4">
                            Nenhuma data bloqueada
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};
