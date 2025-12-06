import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Mail, Lock, User, Building2, Phone, Loader2, Sparkles } from 'lucide-react';

export const SignUp: React.FC = () => {
    const { signUp } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        password: '',
        confirmPassword: '',
        company_name: '',
        company_slug: '',
        phone: '',
    });
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validações
        if (formData.password !== formData.confirmPassword) {
            alert('As senhas não coincidem!');
            return;
        }

        if (formData.password.length < 6) {
            alert('A senha deve ter no mínimo 6 caracteres!');
            return;
        }

        if (!acceptedTerms || !acceptedPrivacy) {
            alert('Você deve aceitar os Termos de Uso e a Política de Privacidade para continuar.');
            return;
        }

        setLoading(true);

        const { error } = await signUp({
            email: formData.email,
            password: formData.password,
            full_name: formData.full_name,
            company_name: formData.company_name,
            company_slug: formData.company_slug,
            phone: formData.phone,
        });

        if (!error) {
            navigate('/dashboard');
        }

        setLoading(false);
    };

    // Gerar slug automaticamente a partir do nome da empresa
    const handleCompanyNameChange = (name: string) => {
        setFormData({
            ...formData,
            company_name: name,
            company_slug: name
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, ''),
        });
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-neutral-50 to-primary-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl w-full space-y-8">
                {/* Logo e Título */}
                <div className="text-center">
                    <div className="flex justify-center mb-6">
                        <img
                            src="/assets/logo-horizontal-dark.png"
                            alt="GestorAuto"
                            className="h-16 w-auto"
                        />
                    </div>
                    <h2 className="text-2xl font-bold text-secondary-600">
                        Crie sua conta
                    </h2>
                    <p className="mt-2 text-sm text-secondary-500 flex items-center justify-center gap-2">
                        <Sparkles className="w-4 h-4 text-warning-500" />
                        7 dias de trial gratuito • Sem cartão de crédito
                    </p>
                </div>

                {/* Card de Cadastro */}
                <div className="bg-white rounded-card shadow-soft p-8 border border-neutral-200">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Dados Pessoais */}
                        <div>
                            <h3 className="text-lg font-semibold text-secondary-900 mb-4">
                                Seus dados
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Nome Completo */}
                                <div className="md:col-span-2">
                                    <label htmlFor="full_name" className="label">
                                        Nome Completo
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <User className="h-5 w-5 text-secondary-400" />
                                        </div>
                                        <input
                                            id="full_name"
                                            type="text"
                                            required
                                            className="input pl-10"
                                            placeholder="João Silva"
                                            value={formData.full_name}
                                            onChange={(e) =>
                                                setFormData({ ...formData, full_name: e.target.value })
                                            }
                                        />
                                    </div>
                                </div>

                                {/* Email */}
                                <div>
                                    <label htmlFor="email" className="label">
                                        Email
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Mail className="h-5 w-5 text-secondary-400" />
                                        </div>
                                        <input
                                            id="email"
                                            type="email"
                                            required
                                            className="input pl-10"
                                            placeholder="seu@email.com"
                                            value={formData.email}
                                            onChange={(e) =>
                                                setFormData({ ...formData, email: e.target.value })
                                            }
                                        />
                                    </div>
                                </div>

                                {/* Telefone */}
                                <div>
                                    <label htmlFor="phone" className="label">
                                        Telefone (opcional)
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Phone className="h-5 w-5 text-secondary-400" />
                                        </div>
                                        <input
                                            id="phone"
                                            type="tel"
                                            className="input pl-10"
                                            placeholder="(11) 99999-9999"
                                            value={formData.phone}
                                            onChange={(e) =>
                                                setFormData({ ...formData, phone: e.target.value })
                                            }
                                        />
                                    </div>
                                </div>

                                {/* Senha */}
                                <div>
                                    <label htmlFor="password" className="label">
                                        Senha
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Lock className="h-5 w-5 text-secondary-400" />
                                        </div>
                                        <input
                                            id="password"
                                            type="password"
                                            required
                                            className="input pl-10"
                                            placeholder="Mínimo 6 caracteres"
                                            value={formData.password}
                                            onChange={(e) =>
                                                setFormData({ ...formData, password: e.target.value })
                                            }
                                        />
                                    </div>
                                </div>

                                {/* Confirmar Senha */}
                                <div>
                                    <label htmlFor="confirmPassword" className="label">
                                        Confirmar Senha
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Lock className="h-5 w-5 text-secondary-400" />
                                        </div>
                                        <input
                                            id="confirmPassword"
                                            type="password"
                                            required
                                            className="input pl-10"
                                            placeholder="Digite a senha novamente"
                                            value={formData.confirmPassword}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    confirmPassword: e.target.value,
                                                })
                                            }
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Dados da Empresa */}
                        <div className="pt-6 border-t border-secondary-200">
                            <h3 className="text-lg font-semibold text-secondary-900 mb-4">
                                Dados da empresa
                            </h3>
                            <div className="space-y-4">
                                {/* Nome da Empresa */}
                                <div>
                                    <label htmlFor="company_name" className="label">
                                        Nome da Empresa
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Building2 className="h-5 w-5 text-secondary-400" />
                                        </div>
                                        <input
                                            id="company_name"
                                            type="text"
                                            required
                                            className="input pl-10"
                                            placeholder="Minha Estética Automotiva"
                                            value={formData.company_name}
                                            onChange={(e) => handleCompanyNameChange(e.target.value)}
                                        />
                                    </div>
                                </div>

                                {/* Slug (gerado automaticamente) */}
                                <div>
                                    <label htmlFor="company_slug" className="label">
                                        URL da Empresa (gerado automaticamente)
                                    </label>
                                    <input
                                        id="company_slug"
                                        type="text"
                                        required
                                        className="input bg-secondary-50"
                                        value={formData.company_slug}
                                        readOnly
                                    />
                                    <p className="mt-1 text-xs text-secondary-500">
                                        Seu endereço será: app.gestorauto.com/
                                        {formData.company_slug || 'sua-empresa'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* LGPD Consent Checkboxes */}
                        <div className="space-y-3 pt-4 border-t border-neutral-200">
                            <div className="flex items-start gap-3">
                                <input
                                    id="accept-terms"
                                    type="checkbox"
                                    checked={acceptedTerms}
                                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                                    className="mt-1 h-4 w-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
                                />
                                <label htmlFor="accept-terms" className="text-sm text-neutral-700">
                                    Li e aceito os{' '}
                                    <Link
                                        to="/terms-of-service"
                                        target="_blank"
                                        className="text-primary-600 hover:text-primary-700 underline font-medium"
                                    >
                                        Termos de Uso
                                    </Link>
                                    {' '}*
                                </label>
                            </div>

                            <div className="flex items-start gap-3">
                                <input
                                    id="accept-privacy"
                                    type="checkbox"
                                    checked={acceptedPrivacy}
                                    onChange={(e) => setAcceptedPrivacy(e.target.checked)}
                                    className="mt-1 h-4 w-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
                                />
                                <label htmlFor="accept-privacy" className="text-sm text-neutral-700">
                                    Li e aceito a{' '}
                                    <Link
                                        to="/privacy-policy"
                                        target="_blank"
                                        className="text-primary-600 hover:text-primary-700 underline font-medium"
                                    >
                                        Política de Privacidade
                                    </Link>
                                    {' '}e autorizo o tratamento dos meus dados pessoais conforme descrito *
                                </label>
                            </div>

                            <p className="text-xs text-neutral-500 italic">
                                * Campos obrigatórios para criar sua conta
                            </p>
                        </div>

                        {/* Botão de Cadastro */}
                        <button
                            type="submit"
                            disabled={loading || !acceptedTerms || !acceptedPrivacy}
                            className={`w-full btn-primary ${loading || !acceptedTerms || !acceptedPrivacy ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {loading ? 'Criando conta...' : 'Criar conta e começar trial gratuito'}
                        </button>

                        {/* Informação sobre Cookies */}
                        <p className="text-xs text-center text-neutral-500">
                            Ao usar nossa plataforma, você concorda com o uso de cookies conforme nossa{' '}
                            <Link
                                to="/cookie-policy"
                                target="_blank"
                                className="text-primary-600 hover:underline"
                            >
                                Política de Cookies
                            </Link>
                            .
                        </p>
                    </form>

                    {/* Link para Login */}
                    <div className="mt-6 text-center pt-6 border-t border-secondary-200">
                        <p className="text-sm text-secondary-600">
                            Já tem uma conta?{' '}
                            <Link
                                to="/signin"
                                className="font-medium text-primary-600 hover:text-primary-700 transition-colors"
                            >
                                Faça login
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
