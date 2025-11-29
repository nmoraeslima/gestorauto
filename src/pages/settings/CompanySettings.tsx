import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Building2, CreditCard, Users as UsersIcon, Save, AlertCircle, CheckCircle, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

type TabType = 'company' | 'subscription' | 'users';

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
                    logo_url: formData.logo_url || null,
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
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-secondary-900">Configurações</h1>
                    <p className="text-secondary-600 mt-1">Gerencie as informações da sua empresa</p>
                </div>
                <a
                    href="/settings/booking"
                    className="btn btn-outline flex items-center gap-2"
                >
                    <Calendar className="w-5 h-5" />
                    Agendamento Online
                </a>
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
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-secondary-500">gestorauto.com/</span>
                                        <input
                                            type="text"
                                            value={formData.slug}
                                            onChange={(e) => handleSlugChange(e.target.value)}
                                            className="flex-1 px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
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

                                {/* Logo URL */}
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                                        URL do Logo
                                    </label>
                                    <input
                                        type="url"
                                        value={formData.logo_url}
                                        onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                                        className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                        placeholder="https://exemplo.com/logo.png"
                                    />
                                    {formData.logo_url && (
                                        <div className="mt-2">
                                            <img
                                                src={formData.logo_url}
                                                alt="Logo preview"
                                                className="h-16 object-contain"
                                                onError={(e) => {
                                                    e.currentTarget.style.display = 'none';
                                                }}
                                            />
                                        </div>
                                    )}
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

                {/* Subscription Tab */}
                {activeTab === 'subscription' && (
                    <div className="p-6 space-y-6">
                        <div>
                            <h2 className="text-lg font-semibold text-secondary-900 mb-4">Detalhes da Assinatura</h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Plan */}
                                <div className="bg-secondary-50 rounded-lg p-4 border border-secondary-200">
                                    <p className="text-sm text-secondary-600 mb-1">Plano Atual</p>
                                    <p className="text-2xl font-bold text-secondary-900 capitalize">
                                        {user?.company?.subscription_plan}
                                    </p>
                                </div>

                                {/* Status */}
                                <div className="bg-secondary-50 rounded-lg p-4 border border-secondary-200">
                                    <p className="text-sm text-secondary-600 mb-1">Status</p>
                                    <div className="flex items-center gap-2">
                                        {user?.company?.subscription_status === 'active' ? (
                                            <CheckCircle className="w-5 h-5 text-success-600" />
                                        ) : (
                                            <AlertCircle className="w-5 h-5 text-warning-600" />
                                        )}
                                        <p className="text-lg font-semibold text-secondary-900 capitalize">
                                            {user?.company?.subscription_status === 'active' ? 'Ativo' :
                                                user?.company?.subscription_status === 'trial' ? 'Trial' :
                                                    user?.company?.subscription_status === 'expired' ? 'Expirado' : 'Cancelado'}
                                        </p>
                                    </div>
                                </div>

                                {/* Limits */}
                                <div className="md:col-span-2 bg-secondary-50 rounded-lg p-4 border border-secondary-200">
                                    <p className="text-sm font-medium text-secondary-700 mb-3">Limites do Plano</p>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs text-secondary-600">Usuários</p>
                                            <p className="text-lg font-semibold text-secondary-900">
                                                {user?.company?.max_users === -1 ? 'Ilimitado' : user?.company?.max_users}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-secondary-600">Clientes</p>
                                            <p className="text-lg font-semibold text-secondary-900">
                                                {user?.company?.max_customers === -1 ? 'Ilimitado' : user?.company?.max_customers}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Trial/Expiration Date */}
                                {user?.company?.trial_ends_at && user?.company?.subscription_status === 'trial' && (
                                    <div className="md:col-span-2 bg-warning-50 rounded-lg p-4 border border-warning-200">
                                        <p className="text-sm text-warning-800">
                                            <strong>Trial termina em:</strong>{' '}
                                            {new Date(user.company.trial_ends_at).toLocaleDateString('pt-BR')}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Renew Link */}
                            {user?.company?.subscription_status !== 'active' && (
                                <div className="mt-6 pt-6 border-t border-secondary-200">
                                    <a
                                        href="/subscription/renew"
                                        className="inline-flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                                    >
                                        <CreditCard className="w-4 h-4" />
                                        Renovar Assinatura
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Users Tab */}
                {activeTab === 'users' && (
                    <div className="p-6">
                        <div className="mb-4">
                            <h2 className="text-lg font-semibold text-secondary-900">Usuários da Empresa</h2>
                            <p className="text-sm text-secondary-600 mt-1">
                                {users.length} usuário{users.length !== 1 ? 's' : ''} cadastrado{users.length !== 1 ? 's' : ''}
                            </p>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-secondary-50 border-y border-secondary-200">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-secondary-600 uppercase">Nome</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-secondary-600 uppercase">Email</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-secondary-600 uppercase">Cargo</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-secondary-600 uppercase">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-secondary-200">
                                    {users.map((userItem) => (
                                        <tr key={userItem.id} className="hover:bg-secondary-50">
                                            <td className="px-4 py-3 text-sm text-secondary-900">{userItem.full_name}</td>
                                            <td className="px-4 py-3 text-sm text-secondary-600">{userItem.email}</td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getRoleBadgeColor(userItem.role)}`}>
                                                    {getRoleLabel(userItem.role)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${userItem.is_active
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
        </div>
    );
};
