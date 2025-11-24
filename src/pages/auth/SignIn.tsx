import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Mail, Lock, Loader2 } from 'lucide-react';

export const SignIn: React.FC = () => {
    const { signIn } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error } = await signIn(formData);

            if (error) {
                setLoading(false);
                return;
            }

            // Wait a bit for auth state to update
            setTimeout(() => {
                navigate('/dashboard');
            }, 500);
        } catch (error) {
            console.error('Login error:', error);
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-neutral-50 to-primary-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                {/* Logo e Título */}
                <div className="text-center">
                    <div className="flex justify-center mb-6">
                        <img
                            src="/assets/logo-horizontal-dark.png"
                            alt="GestorAuto"
                            className="h-20 w-auto"
                        />
                    </div>
                    <p className="mt-2 text-sm text-secondary-500">
                        Sistema de Gestão para Estética Automotiva
                    </p>
                </div>

                {/* Card de Login */}
                <div className="bg-white rounded-card shadow-soft p-8 border border-neutral-200">
                    <div className="mb-6">
                        <h3 className="text-xl font-semibold text-secondary-600">
                            Entrar na sua conta
                        </h3>
                        <p className="text-sm text-secondary-500 mt-1">
                            Bem-vindo de volta! Por favor, entre com suas credenciais.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Email */}
                        <div>
                            <label htmlFor="email" className="label">
                                Email
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-neutral-400" />
                                </div>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
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

                        {/* Senha */}
                        <div>
                            <label htmlFor="password" className="label">
                                Senha
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-neutral-400" />
                                </div>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    className="input pl-10"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={(e) =>
                                        setFormData({ ...formData, password: e.target.value })
                                    }
                                />
                            </div>
                        </div>

                        {/* Esqueci a senha */}
                        <div className="flex items-center justify-end">
                            <Link
                                to="/forgot-password"
                                className="text-sm font-medium text-primary-300 hover:text-primary-400 transition-colors"
                            >
                                Esqueceu sua senha?
                            </Link>
                        </div>

                        {/* Botão de Login */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full btn btn-primary py-3 text-base font-semibold justify-center"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center">
                                    <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5" />
                                    Entrando...
                                </span>
                            ) : (
                                'Entrar'
                            )}
                        </button>
                    </form>

                    {/* Link para Cadastro */}
                    <div className="mt-6 text-center">
                        <p className="text-sm text-secondary-500">
                            Não tem uma conta?{' '}
                            <Link
                                to="/signup"
                                className="font-medium text-primary-300 hover:text-primary-400 transition-colors"
                            >
                                Cadastre-se gratuitamente
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-xs text-secondary-400">
                    © 2024 GestorAuto. Todos os direitos reservados.
                </p>
            </div>
        </div>
    );
};
