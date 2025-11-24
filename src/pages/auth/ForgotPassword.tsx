import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Mail, ArrowLeft, Loader2, Car } from 'lucide-react';

export const ForgotPassword: React.FC = () => {
    const { resetPassword } = useAuth();
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [sent, setSent] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const { error } = await resetPassword(email);

        if (!error) {
            setSent(true);
        }

        setLoading(false);
    };

    if (sent) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-secondary-50 to-primary-100 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md w-full space-y-8">
                    <div className="text-center">
                        <div className="flex justify-center mb-4">
                            <div className="bg-success-600 p-4 rounded-2xl shadow-lg">
                                <Mail className="w-12 h-12 text-white" />
                            </div>
                        </div>
                        <h2 className="text-3xl font-bold text-secondary-900">
                            Email enviado!
                        </h2>
                        <p className="mt-4 text-secondary-600">
                            Enviamos um link de recuperação para <strong>{email}</strong>.
                            Verifique sua caixa de entrada e spam.
                        </p>
                        <Link
                            to="/signin"
                            className="mt-6 inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Voltar para login
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-secondary-50 to-primary-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                {/* Logo e Título */}
                <div className="text-center">
                    <div className="flex justify-center mb-4">
                        <div className="bg-primary-600 p-4 rounded-2xl shadow-lg">
                            <Car className="w-12 h-12 text-white" />
                        </div>
                    </div>
                    <h2 className="text-3xl font-bold text-secondary-900">
                        Recuperar senha
                    </h2>
                    <p className="mt-2 text-sm text-secondary-600">
                        Digite seu email para receber um link de recuperação
                    </p>
                </div>

                {/* Card */}
                <div className="bg-white rounded-2xl shadow-soft p-8 border border-secondary-100">
                    <form onSubmit={handleSubmit} className="space-y-6">
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
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    className="input pl-10"
                                    placeholder="seu@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Botão de Enviar */}
                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full btn-primary ${loading ? 'btn-loading' : ''}`}
                        >
                            {loading ? 'Enviando...' : 'Enviar link de recuperação'}
                        </button>
                    </form>

                    {/* Link para Login */}
                    <div className="mt-6 text-center">
                        <Link
                            to="/signin"
                            className="inline-flex items-center gap-2 text-sm text-secondary-600 hover:text-secondary-900 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Voltar para login
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};
