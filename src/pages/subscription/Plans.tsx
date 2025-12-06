import React from 'react';
import { Check, X, Star, Zap, Shield } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { SubscriptionPlan } from '@/types/database';
import { AlertCircle } from 'lucide-react';

export const Plans: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const reason = searchParams.get('reason');
    const currentPlan = user?.company?.subscription_plan;

    const handleSelectPlan = (plan: string) => {
        // Here we will later integrate with Stripe/Asaas
        // For now, we can redirect to a contact form or just show a modal
        console.log('Selected plan:', plan);
        // navigate('/subscription/checkout/' + plan);
        window.open('https://wa.me/55NUMERODOWHATSAPP?text=' + encodeURIComponent(`Olá, gostaria de assinar o plano ${plan} do GestorAuto.`), '_blank');
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            {reason && (
                <div className="max-w-3xl mx-auto mb-8 animate-in fade-in slide-in-from-top-4">
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg shadow-sm flex items-start">
                        <div className="flex-shrink-0">
                            <AlertCircle className="h-6 w-6 text-red-500" />
                        </div>
                        <div className="ml-3">
                            <h3 className="text-lg font-medium text-red-800">
                                {reason === 'trial_ended' ? 'Seu período de teste acabou' : 'Sua assinatura expirou'}
                            </h3>
                            <div className="mt-2 text-sm text-red-700">
                                <p>
                                    {reason === 'trial_ended'
                                        ? 'Esperamos que tenha gostado! Para continuar usando o GestorAuto e não perder seus dados, escolha um dos planos abaixo.'
                                        : 'Renove sua assinatura para restaurar o acesso imediato a todas as funcionalidades.'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="text-center max-w-3xl mx-auto mb-16">
                <h2 className="text-base font-semibold text-primary-600 tracking-wide uppercase">Planos e Preços</h2>
                <h1 className="mt-2 text-4xl font-extrabold text-gray-900 sm:text-5xl">
                    Escolha o plano ideal para sua Estética
                </h1>
                <p className="mt-4 text-xl text-gray-500">
                    Comece pequeno ou escale sua operação. Mude de plano quando quiser.
                </p>
            </div>

            <div className="max-w-7xl mx-auto grid gap-8 lg:grid-cols-3 lg:gap-8">
                {/* Starter Plan */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col relative overflow-hidden">
                    <div className="p-8 flex-1">
                        <h3 className="text-xl font-semibold text-gray-900">Starter</h3>
                        <p className="mt-4 flex items-baseline text-gray-900">
                            <span className="text-5xl font-extrabold tracking-tight">R$ 49,90</span>
                            <span className="ml-1 text-xl font-semibold text-gray-500">/mês</span>
                        </p>
                        <p className="mt-6 text-gray-500">Para quem está começando ou trabalha sozinho.</p>

                        <ul className="mt-6 space-y-4">
                            <Feature text="Agendamentos Ilimitados" isHighlight />
                            <Feature text="Ordens de Serviço Ilimitadas" isHighlight />
                            <Feature text="1 Usuário" />
                            <Feature text="Até 50 Clientes" />
                            <Feature text="Logo na O.S. (PDF)" />
                            <NegativeFeature text="Sem Gestão Financeira" />
                            <NegativeFeature text="Sem Lembretes de Retorno" />
                            <NegativeFeature text="Sem Painel de TV / Links" />
                        </ul>
                    </div>
                    <div className="p-8 bg-gray-50 border-t border-gray-200">
                        <button
                            onClick={() => handleSelectPlan('Starter')}
                            className="w-full btn bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                        >
                            {currentPlan === SubscriptionPlan.BASIC ? 'Plano Atual' : 'Começar Agora'}
                        </button>
                    </div>
                </div>

                {/* Pro Plan (Best Value) */}
                <div className="bg-white rounded-2xl shadow-xl border-2 border-primary-500 flex flex-col relative overflow-hidden transform scale-105 z-10">
                    <div className="absolute top-0 right-0 bg-primary-500 text-white text-xs font-bold px-3 py-1 uppercase tracking-wide rounded-bl-lg">
                        Mais Popular
                    </div>
                    <div className="p-8 flex-1">
                        <div className="flex items-center gap-2">
                            <h3 className="text-xl font-semibold text-primary-600">Profissional</h3>
                            <Zap className="w-5 h-5 text-yellow-500 fill-current" />
                        </div>
                        <p className="mt-4 flex items-baseline text-gray-900">
                            <span className="text-5xl font-extrabold tracking-tight">R$ 89,90</span>
                            <span className="ml-1 text-xl font-semibold text-gray-500">/mês</span>
                        </p>
                        <p className="mt-6 text-gray-500">Para estéticas que querem crescer e fidelizar.</p>

                        <ul className="mt-6 space-y-4">
                            <Feature text="Até 300 Clientes" isHighlight />
                            <Feature text="Agendamentos Ilimitados" isHighlight />
                            <Feature text="CRM: Lembretes de Retorno" isHighlight />
                            <Feature text="3 Acessos de Usuário" />
                            <Feature text="Ordens de Serviço Ilimitadas" />
                            <Feature text="Gestão Financeira (Contas a Pagar/Receber)" />
                            <Feature text="Envio de Mensagens WhatsApp" />
                            <Feature text="Relatórios de Faturamento" />
                            <NegativeFeature text="Sem Painel de TV" />
                            <NegativeFeature text="Sem App do Cliente (Tracker)" />
                        </ul>
                    </div>
                    <div className="p-8 bg-primary-50 border-t border-primary-100">
                        <button
                            onClick={() => handleSelectPlan('Pro')}
                            disabled={currentPlan === SubscriptionPlan.INTERMEDIATE}
                            className="w-full btn btn-primary shadow-lg"
                        >
                            {currentPlan === SubscriptionPlan.INTERMEDIATE ? 'Plano Atual' : 'Quero Vender Mais'}
                        </button>
                    </div>
                </div>

                {/* Elite Plan */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col relative overflow-hidden">
                    <div className="p-8 flex-1">
                        <div className="flex items-center gap-2">
                            <h3 className="text-xl font-semibold text-gray-900">Elite</h3>
                            <div className="bg-gray-900 text-white text-xs px-2 py-0.5 rounded">VIP</div>
                        </div>
                        <p className="mt-4 flex items-baseline text-gray-900">
                            <span className="text-5xl font-extrabold tracking-tight">R$ 139,90</span>
                            <span className="ml-1 text-xl font-semibold text-gray-500">/mês</span>
                        </p>
                        <p className="mt-6 text-gray-500">A experiência completa de alto padrão.</p>

                        <ul className="mt-6 space-y-4">
                            <Feature text="Clientes ILIMITADOS" isHighlight />
                            <Feature text="Usuários ILIMITADOS" isHighlight />
                            <Feature text="Painel TV (Fila de Espera)" isHighlight />
                            <Feature text="App do Cliente (Rastreio Online)" isHighlight />
                            <Feature text="Auto-Agendamento Online" isHighlight />
                            <Feature text="Agendamentos Ilimitados" />
                            <Feature text="Ordens de Serviço Ilimitadas" />
                            <Feature text="Gestão Financeira Completa" />
                            <Feature text="CRM: Lembretes de Retorno" />
                            <Feature text="Envio de Mensagens WhatsApp" />
                            <Feature text="Relatórios Avançados de Performance" />
                            <Feature text="Suporte Prioritário VIP" />
                        </ul>
                    </div>
                    <div className="p-8 bg-gray-50 border-t border-gray-200">
                        <button
                            onClick={() => handleSelectPlan('Elite')}
                            disabled={currentPlan === SubscriptionPlan.PREMIUM}
                            className="w-full btn bg-gray-900 text-white hover:bg-gray-800"
                        >
                            {currentPlan === SubscriptionPlan.PREMIUM ? 'Plano Atual' : 'Quero Ser Elite'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const Feature: React.FC<{ text: string; isHighlight?: boolean }> = ({ text, isHighlight }) => (
    <li className="flex items-start">
        <div className="flex-shrink-0">
            <Check className="h-5 w-5 text-green-500" />
        </div>
        <p className={`ml-3 text-base ${isHighlight ? 'font-bold text-gray-900' : 'text-gray-600'}`}>
            {text}
        </p>
    </li>
);

const NegativeFeature: React.FC<{ text: string }> = ({ text }) => (
    <li className="flex items-start opacity-60">
        <div className="flex-shrink-0">
            <X className="h-5 w-5 text-gray-400" />
        </div>
        <p className="ml-3 text-base text-gray-400 decoration-slate-400">{text}</p>
    </li>
);
