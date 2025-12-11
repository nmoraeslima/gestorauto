import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Building2, CreditCard, Users as UsersIcon, Save, AlertCircle, CheckCircle, Calendar, Star, Clock, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { PLAN_LIMITS, SubscriptionPlan } from '@/types/database';
import { storageService } from '@/services/storageService';
import { FileUpload } from '@/components/common/FileUpload';

import { BirthdaySettingsPanel } from '@/components/settings/BirthdaySettingsPanel';

type TabType = 'company' | 'subscription' | 'users' | 'notifications';

interface CompanyFormData {
    name: string;
    slug: string;
    email: string;
    phone: string;
    address: string;
    logo_url: string;
}

interface UserProfile {
    id: string;
    full_name: string;
    email: string;
    role: string;
    is_active: boolean;
}

export const CompanySettings: React.FC = () => {
    const { user, refreshUserData } = useAuth();
    const [activeTab, setActiveTab] = useState<TabType>('company');
    const [loading, setLoading] = useState(false);
    const [users, setUsers] = useState<UserProfile[]>([]);

    const [formData, setFormData] = useState<CompanyFormData>({
        name: '',
        slug: '',
        email: '',
        phone: '',
        address: '',
        logo_url: '',
    });

    const plan = (user?.company?.subscription_plan as SubscriptionPlan) || 'basic';
    const isPublicLinksAllowed = PLAN_LIMITS[plan]?.features?.public_links;

    // Load company data
    useEffect(() => {
        if (user?.company) {
            setFormData({
                name: user.company.name || '',
                slug: user.company.slug || '',
                email: user.company.email || '',
                phone: user.company.phone || '',
                address: user.company.address || '',
                logo_url: user.company.logo_url || '',
            });
        }
    }, [user]);

    // Load users when users tab is active
    useEffect(() => {
        if (activeTab === 'users' && user?.company?.id) {
            loadUsers();
        }
    }, [activeTab, user?.company?.id]);

    const loadUsers = async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('id, full_name, email, role, is_active')
                .eq('company_id', user?.company?.id);

            if (error) throw error;
            setUsers(data || []);
        } catch (error) {
            console.error('Error loading users:', error);
            toast.error('Erro ao carregar usuários');
        }
    };

    const generateSlug = (name: string) => {
        return name
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Remove accents
            .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
            .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
    };

    const handleNameChange = (name: string) => {
        setFormData(prev => ({
            ...prev,
            name,
            slug: generateSlug(name),
        }));
    };

    const handleSlugChange = (slug: string) => {
        // Only allow lowercase letters, numbers, and hyphens
        const sanitized = slug.toLowerCase().replace(/[^a-z0-9-]/g, '');
        setFormData(prev => ({ ...prev, slug: sanitized }));
    };

    const handleLogoUpload = async (file: File): Promise<string> => {
        if (!user?.company?.id) throw new Error('Empresa não encontrada');

        const result = await storageService.uploadCompanyLogo(user.company.id, file);

        // Update database with new logo URL
        const { error } = await supabase
            .from('companies')
            .update({ logo_url: result.url })
            .eq('id', user.company.id);

        if (error) throw error;

        // Refresh user data to update logo in sidebar
        await refreshUserData();

        return result.url;
    };

    const handleLogoDelete = async () => {
        if (!user?.company?.id) throw new Error('Empresa não encontrada');

        await storageService.deleteCompanyLogo(user.company.id);

        // Update database to remove logo URL
        const { error } = await supabase
            .from('companies')
            .update({ logo_url: null })
            .eq('id', user.company.id);

        if (error) throw error;

        // Refresh user data
        await refreshUserData();
    };

    const handleSaveCompany = async () => {
        if (!user?.company?.id) return;

        // Validation
        if (!formData.name.trim()) {
            toast.error('Nome da empresa é obrigatório');
            return;
        }
        if (!formData.slug.trim()) {
            toast.error('URL da empresa é obrigatória');
            return;
        }
        if (!formData.email.trim()) {
            toast.error('Email é obrigatório');
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase
                .from('companies')
                .update({
                    name: formData.name,
                    slug: formData.slug,
                    email: formData.email,
                    phone: formData.phone || null,
                    address: formData.address || null,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', user.company.id);

            if (error) {
                if (error.code === '23505') { // Unique constraint violation
                    toast.error('Esta URL já está em uso por outra empresa');
                } else {
                    throw error;
                }
                return;
            }

            toast.success('Dados da empresa atualizados com sucesso!');
            await refreshUserData(); // Refresh to update sidebar
        } catch (error: any) {
            console.error('Error updating company:', error);
            toast.error('Erro ao atualizar dados: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const tabs = [
        { id: 'company' as TabType, label: 'Empresa', icon: Building2 },
        { id: 'subscription' as TabType, label: 'Assinatura', icon: CreditCard },
        { id: 'notifications' as TabType, label: 'Notificações', icon: AlertCircle },
        { id: 'users' as TabType, label: 'Usuários', icon: UsersIcon },
    ];

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case 'owner': return 'bg-purple-100 text-purple-700';
            case 'admin': return 'bg-blue-100 text-blue-700';
            case 'manager': return 'bg-green-100 text-green-700';
            default: return 'bg-secondary-100 text-secondary-700';
        }
    };

    const getRoleLabel = (role: string) => {
        const labels: Record<string, string> = {
            owner: 'Proprietário',
            admin: 'Administrador',
            manager: 'Gerente',
            user: 'Usuário',
        };
        return labels[role] || role;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-secondary-900">Configurações</h1>
                        <p className="text-secondary-600 mt-1">Gerencie as informações da sua empresa</p>
                    </div>
                </div>



                {/* Online Booking CTA Card */}
                <div className="mt-6 bg-gradient-to-r from-primary-50 to-primary-100 border-2 border-primary-300 rounded-lg p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-12 h-12 bg-primary-300 rounded-lg flex items-center justify-center">
                                <Calendar className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-secondary-900">Agendamento Online</h3>
                                <p className="text-sm text-secondary-600 mt-1">
                                    Configure seu sistema de agendamento online e compartilhe o link com seus clientes
                                </p>
                            </div>
                        </div>
                        {isPublicLinksAllowed ? (
                            <a
                                href="/settings/booking"
                                className="btn btn-primary whitespace-nowrap w-full sm:w-auto justify-center"
                            >
                                Configurar Agora
                            </a>
                        ) : (
                            <button
                                onClick={() => window.dispatchEvent(new CustomEvent('openUpgradeModal'))}
                                className="btn btn-primary opacity-75 whitespace-nowrap w-full sm:w-auto justify-center flex items-center gap-2 cursor-pointer"
                                title="Recurso exclusivo do plano Elite"
                            >
                                <Lock className="w-4 h-4" />
                                Configurar Agora
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-secondary-200">
                <nav className="-mb-px flex space-x-8 overflow-x-auto">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${activeTab === tab.id
                                    ? 'border-primary-600 text-primary-600'
                                    : 'border-transparent text-secondary-600 hover:text-secondary-900 hover:border-secondary-300'
                                    }`}
                            >
                                <Icon className="w-5 h-5" />
                                {tab.label}
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* Tab Content */}
            <div className="bg-white rounded-lg shadow-sm border border-secondary-200">
                {/* Company Info Tab */}
                {activeTab === 'company' && (
                    <div className="p-6 space-y-6">
                        <div>
                            <h2 className="text-lg font-semibold text-secondary-900 mb-4">Informações da Empresa</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Company Name */}
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                                        Nome da Empresa *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => handleNameChange(e.target.value)}
                                        className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                        placeholder="Ex: Auto Estética Premium"
                                    />
                                </div>

                                {/* Slug */}
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                                        URL da Empresa *
                                    </label>
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                        <span className="text-sm text-secondary-500 whitespace-nowrap">gestorauto.com/</span>
                                        <input
                                            type="text"
                                            value={formData.slug}
                                            onChange={(e) => handleSlugChange(e.target.value)}
                                            className="flex-1 min-w-0 px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                            placeholder="auto-estetica-premium"
                                        />
                                    </div>
                                    <p className="text-xs text-secondary-500 mt-1">
                                        Apenas letras minúsculas, números e hífens. Esta URL deve ser única.
                                    </p>
                                </div>

                                {/* Email */}
                                <div>
                                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                                        Email *
                                    </label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                        placeholder="contato@empresa.com"
                                    />
                                </div>

                                {/* Phone */}
                                <div>
                                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                                        Telefone
                                    </label>
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                        placeholder="(11) 98765-4321"
                                    />
                                </div>

                                {/* Address */}
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                                        Endereço
                                    </label>
                                    <textarea
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        rows={3}
                                        className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                        placeholder="Rua, número, bairro, cidade - UF"
                                    />
                                </div>

                                {/* Logo Upload */}
                                <div className="md:col-span-2">
                                    <FileUpload
                                        currentUrl={user?.company?.logo_url}
                                        onUpload={handleLogoUpload}
                                        onDelete={handleLogoDelete}
                                        accept="image/*"
                                        maxSize={2 * 1024 * 1024}
                                        label="Logo da Empresa"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Save Button */}
                        <div className="flex justify-end pt-4 border-t border-secondary-200">
                            <button
                                onClick={handleSaveCompany}
                                disabled={loading}
                                className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <Save className="w-4 h-4" />
                                {loading ? 'Salvando...' : 'Salvar Alterações'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Notifications Tab */}
                {activeTab === 'notifications' && (
                    <div className="p-6">
                        <BirthdaySettingsPanel />
                    </div>
                )}

                {/* Subscription Tab */}
                {activeTab === 'subscription' && (
                    <div className="p-6 space-y-8">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <CreditCard className="w-6 h-6 text-primary-600" />
                                Gestão da Assinatura
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Plan Card */}
                                <div className="bg-white rounded-xl border-2 border-primary-100 shadow-sm overflow-hidden relative">
                                    <div className="absolute top-0 right-0 bg-primary-100 text-primary-700 text-xs font-bold px-3 py-1 rounded-bl-lg">
                                        PLANO ATUAL
                                    </div>
                                    <div className="p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <div>
                                                <p className="text-sm text-gray-500 font-medium uppercase tracking-wider">Seu Plano</p>
                                                <h3 className="text-3xl font-extrabold text-blue-900 mt-1 capitalize">
                                                    {user?.company?.subscription_plan === 'basic' ? 'Starter' :
                                                        user?.company?.subscription_plan === 'intermediate' ? 'Profissional' :
                                                            user?.company?.subscription_plan === 'premium' ? 'Elite' :
                                                                user?.company?.subscription_plan}
                                                </h3>
                                            </div>
                                            {user?.company?.subscription_plan === 'premium' && (
                                                <div className="bg-black text-white p-2 rounded-lg">
                                                    <Star className="w-6 h-6 fill-current" />
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center text-sm border-b border-gray-100 pb-2">
                                                <span className="text-gray-600">Usuários Ativos</span>
                                                <span className="font-semibold text-gray-900">
                                                    {users.length} / {user?.company?.max_users === -1 ? '∞' : user?.company?.max_users}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center text-sm border-b border-gray-100 pb-2">
                                                <span className="text-gray-600">Clientes Cadastrados</span>
                                                <span className="font-semibold text-gray-900">
                                                    {/* We would need the real count here, but for now we show limit */}
                                                    Limite: {user?.company?.max_customers === -1 ? '∞' : user?.company?.max_customers}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="mt-6">
                                            <a
                                                href="/subscription/plans"
                                                className="block w-full text-center px-4 py-2 bg-white border-2 border-primary-600 text-primary-700 rounded-lg hover:bg-primary-50 font-semibold transition-colors"
                                            >
                                                Mudar de Plano
                                            </a>
                                        </div>
                                    </div>
                                </div>

                                {/* Status Card */}
                                <div className="bg-gray-50 rounded-xl border border-gray-200 p-6 flex flex-col justify-between">
                                    <div>
                                        <p className="text-sm text-gray-500 font-medium uppercase tracking-wider mb-2">Status da Conta</p>
                                        <div className="flex items-center gap-3 mb-6">
                                            {user?.company?.subscription_status === 'active' ? (
                                                <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full font-bold text-sm">
                                                    <CheckCircle className="w-4 h-4" /> ATIVO
                                                </div>
                                            ) : user?.company?.subscription_status === 'trial' ? (
                                                <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full font-bold text-sm">
                                                    <Clock className="w-4 h-4" /> PERÍODO DE TESTE
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 px-3 py-1 bg-red-100 text-red-700 rounded-full font-bold text-sm">
                                                    <AlertCircle className="w-4 h-4" /> INATIVO
                                                </div>
                                            )}
                                        </div>

                                        {user?.company?.trial_ends_at && user?.company?.subscription_status === 'trial' && (
                                            <div className="bg-blue-100 border-l-4 border-blue-500 p-4 rounded-r mb-4">
                                                <div className="flex items-start">
                                                    <div className="flex-shrink-0">
                                                        <Clock className="h-5 w-5 text-blue-500" />
                                                    </div>
                                                    <div className="ml-3">
                                                        <p className="text-sm text-blue-700">
                                                            Seu período de teste termina em: <br />
                                                            <span className="font-bold text-lg">
                                                                {new Date(user.company.trial_ends_at).toLocaleDateString()}
                                                            </span>
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {user?.company?.subscription_status !== 'active' && (
                                        <a
                                            href="/subscription/plans"
                                            className="block w-full text-center px-4 py-3 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-lg hover:from-green-700 hover:to-green-600 font-bold shadow-lg transform transition hover:scale-[1.02]"
                                        >
                                            Assinar Agora
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Users Tab */}
                {activeTab === 'users' && (
                    <div className="p-6">
                        <div className="mb-4 flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-semibold text-secondary-900">Usuários da Empresa</h2>
                                <p className="text-sm text-secondary-600 mt-1">
                                    {users.length} usuário{users.length !== 1 ? 's' : ''} cadastrado{users.length !== 1 ? 's' : ''}
                                </p>
                            </div>

                            <button
                                onClick={() => {
                                    // Check limits
                                    const maxUsers = user?.company?.max_users || 1;
                                    if (maxUsers !== -1 && users.length >= maxUsers) {
                                        toast.error(`Seu plano permite apenas ${maxUsers} usuário(s). Faça upgrade para adicionar mais.`);
                                        window.dispatchEvent(new CustomEvent('openUpgradeModal'));
                                        return;
                                    }
                                    // TODO: Open User Modal (Not implemented in this file yet, just alert for now or placeholder)
                                    toast('Funcionalidade de criar usuário em desenvolvimento', { icon: '🚧' });
                                }}
                                className="btn btn-primary flex items-center gap-2"
                            >
                                <UsersIcon className="w-4 h-4" />
                                Novo Usuário
                            </button>
                        </div>

                        <div className="overflow-x-auto -mx-6 sm:mx-0">
                            <table className="w-full min-w-full">
                                <thead className="bg-secondary-50 border-y border-secondary-200">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-secondary-600 uppercase whitespace-nowrap">Nome</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-secondary-600 uppercase whitespace-nowrap hidden sm:table-cell">Email</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-secondary-600 uppercase whitespace-nowrap">Cargo</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-secondary-600 uppercase whitespace-nowrap">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-secondary-200">
                                    {users.map((userItem) => (
                                        <tr key={userItem.id} className="hover:bg-secondary-50">
                                            <td className="px-4 py-3 text-sm text-secondary-900">
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{userItem.full_name}</span>
                                                    <span className="text-xs text-secondary-500 sm:hidden">{userItem.email}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-secondary-600 hidden sm:table-cell">{userItem.email}</td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${getRoleBadgeColor(userItem.role)}`}>
                                                    {getRoleLabel(userItem.role)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${userItem.is_active
                                                    ? 'bg-success-100 text-success-700'
                                                    : 'bg-secondary-100 text-secondary-700'
                                                    }`}>
                                                    {userItem.is_active ? 'Ativo' : 'Inativo'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div >
    );
};
