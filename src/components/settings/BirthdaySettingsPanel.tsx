import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { birthdayService } from '@/services/birthdayService';
import { BirthdaySettings } from '@/types/database';
import { Cake, Save, MessageCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export const BirthdaySettingsPanel: React.FC = () => {
    const { user } = useAuth();
    const [settings, setSettings] = useState<BirthdaySettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (user?.company?.id) {
            loadSettings();
        }
    }, [user?.company?.id]);

    const loadSettings = async () => {
        try {
            if (!user?.company?.id) return;
            const data = await birthdayService.getSettings(user.company.id);
            setSettings(data as any); // Type assertion needed due to slight mismatch in generated vs manual types
        } catch (error) {
            console.error('Error loading birthday settings:', error);
            toast.error('Erro ao carregar configurações de aniversário');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!settings || !user?.company?.id) return;

        setSaving(true);
        try {
            await birthdayService.updateSettings({
                enabled: settings.enabled,
                lead_time_days: settings.lead_time_days,
                whatsapp_template: settings.whatsapp_template
            }, user.company.id);
            toast.success('Configurações salvas com sucesso!');
        } catch (error) {
            console.error('Error saving settings:', error);
            toast.error('Erro ao salvar configurações');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Carregando configurações...</div>;
    }

    if (!settings) return null;

    // Preview generation
    const previewMessage = settings.whatsapp_template
        .replace('{customer_name}', 'João Silva')
        .replace('{company_name}', user?.company?.name || 'Sua Empresa');

    return (
        <div className="bg-white rounded-lg border border-secondary-200">
            <div className="p-4 border-b border-secondary-100 flex justify-between items-center bg-gray-50/50">
                <h3 className="text-lg font-bold text-secondary-900 flex items-center gap-2">
                    <Cake className="h-5 w-5 text-primary-600" />
                    Notificações de Aniversário
                </h3>

                {/* Toggle Switch */}
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-600">
                        {settings.enabled ? 'Ativado' : 'Desativado'}
                    </span>
                    <button
                        onClick={() => setSettings({ ...settings, enabled: !settings.enabled })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${settings.enabled ? 'bg-primary-600' : 'bg-gray-200'
                            }`}
                    >
                        <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.enabled ? 'translate-x-6' : 'translate-x-1'
                                }`}
                        />
                    </button>
                </div>
            </div>

            <div className={`p-6 space-y-6 ${!settings.enabled ? 'opacity-50 pointer-events-none' : ''}`}>

                {/* Lead Time */}
                <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                        Quando notificar?
                    </label>
                    <select
                        value={settings.lead_time_days}
                        onChange={(e) => setSettings({ ...settings, lead_time_days: Number(e.target.value) })}
                        className="w-full md:w-64 px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                        <option value={0}>No dia do aniversário</option>
                        <option value={1}>1 dia antes</option>
                        <option value={2}>2 dias antes</option>
                        <option value={3}>3 dias antes</option>
                        <option value={5}>5 dias antes</option>
                        <option value={7}>1 semana antes</option>
                    </select>
                    <p className="mt-1 text-xs text-gray-500">
                        O sistema irá destacar os aniversariantes com essa antecedência no painel.
                    </p>
                </div>

                {/* Message Template */}
                <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                        Mensagem Padrão (WhatsApp)
                    </label>
                    <div className="relative">
                        <textarea
                            value={settings.whatsapp_template}
                            onChange={(e) => setSettings({ ...settings, whatsapp_template: e.target.value })}
                            rows={4}
                            className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                            placeholder="Digite sua mensagem..."
                        />
                        <div className="absolute top-2 right-2 text-gray-400">
                            <MessageCircle className="h-4 w-4" />
                        </div>
                    </div>

                    {/* Variables Help */}
                    <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
                        <span
                            className="inline-flex items-center px-2 py-1 rounded-md bg-gray-100 text-xs font-medium text-gray-600 cursor-pointer hover:bg-gray-200"
                            onClick={() => setSettings({ ...settings, whatsapp_template: settings.whatsapp_template + ' {customer_name}' })}
                        >
                            {'{customer_name}'}
                        </span>
                        <span
                            className="inline-flex items-center px-2 py-1 rounded-md bg-gray-100 text-xs font-medium text-gray-600 cursor-pointer hover:bg-gray-200"
                            onClick={() => setSettings({ ...settings, whatsapp_template: settings.whatsapp_template + ' {company_name}' })}
                        >
                            {'{company_name}'}
                        </span>
                    </div>

                    {/* Preview Box */}
                    <div className="mt-4 bg-green-50 border border-green-100 rounded-lg p-4">
                        <h4 className="text-xs font-bold text-green-800 uppercase tracking-wider mb-2 flex items-center gap-1">
                            <MessageCircle className="h-3 w-3" />
                            Preview da Mensagem
                        </h4>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap font-sans">
                            {previewMessage}
                        </p>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="p-4 bg-gray-50 rounded-b-lg flex justify-end border-t border-gray-100">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 transition-colors"
                >
                    {saving ? (
                        <>Salvano...</>
                    ) : (
                        <>
                            <Save className="h-4 w-4" />
                            Salvar Alterações
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};
