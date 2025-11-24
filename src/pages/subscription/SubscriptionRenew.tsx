import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { SubscriptionStatus, SubscriptionPlan } from '@/types/database';
import { CreditCard, Check, AlertCircle, Sparkles } from 'lucide-react';

export const SubscriptionRenew: React.FC = () => {
    const { user } = useAuth();

    if (!user || !user.company) {
        return null;
    }

    const { subscription_status, subscription_plan, trial_ends_at } = user.company;

    const isTrialExpired =
        subscription_status === SubscriptionStatus.TRIAL &&
        trial_ends_at &&
        new Date(trial_ends_at) < new Date();

    const plans = [
        {
            name: 'Basic',
            value: SubscriptionPlan.BASIC,
            price: 'R$ 97',
            period: '/mês',
            features: [
                'Até 2 usuários',
                'Até 50 clientes',
                'Gestão de O.S.',
                'Controle de estoque',
                'Agendamentos',
                'Relatórios básicos',
            ],
            highlighted: false,
        },
        {
            name: 'Intermediário',
            value: SubscriptionPlan.INTERMEDIATE,
            price: 'R$ 197',
            period: '/mês',
            features: [
                'Até 5 usuários',
                'Até 200 clientes',
                'Gestão de O.S.',
                'Controle de estoque',
                'Agendamentos',
                'Relatórios avançados',
                'Suporte prioritário',
            ],
            highlighted: true,
        },
        {
            name: 'Premium',
            value: SubscriptionPlan.PREMIUM,
            price: 'R$ 397',
            period: '/mês',
            features: [
                'Usuários ilimitados',
                'Clientes ilimitados',
                'Gestão de O.S.',
                'Controle de estoque',
                'Agendamentos',
                'Relatórios avançados',
                'Dashboard executivo',
                'Suporte VIP 24/7',
                'Treinamento incluído',
            ],
            highlighted: false,
        },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 via-secondary-50 to-primary-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    {isTrialExpired ? (
                        <>
                            <div className="flex justify-center mb-4">
                                <div className="bg-warning-100 p-4 rounded-full">
                                    <AlertCircle className="w-12 h-12 text-warning-600" />
                                </div>
                            </div>
                            <h1 className="text-4xl font-bold text-secondary-900 mb-4">
                                Seu trial expirou
                            </h1>
                            <p className="text-lg text-secondary-600 max-w-2xl mx-auto">
                                Esperamos que tenha gostado do GestorAuto! Escolha um plano
                                abaixo para continuar usando todas as funcionalidades.
                            </p>
                        </>
                    ) : (
                        <>
                            <div className="flex justify-center mb-4">
                                <div className="bg-danger-100 p-4 rounded-full">
                                    <CreditCard className="w-12 h-12 text-danger-600" />
                                </div>
                            </div>
                            <h1 className="text-4xl font-bold text-secondary-900 mb-4">
                                Assinatura {subscription_status === SubscriptionStatus.EXPIRED ? 'expirada' : 'cancelada'}
                            </h1>
                            <p className="text-lg text-secondary-600 max-w-2xl mx-auto">
                                Para continuar usando o GestorAuto, renove sua assinatura
                                escolhendo um dos planos abaixo.
                            </p>
                        </>
                    )}
                </div>

                {/* Planos */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                    {plans.map((plan) => (
                        <div
                            key={plan.value}
                            className={`bg-white rounded-2xl shadow-soft p-8 border-2 transition-all duration-200 hover:shadow-lg ${plan.highlighted
                                    ? 'border-primary-500 transform scale-105'
                                    : 'border-secondary-100'
                                }`}
                        >
                            {plan.highlighted && (
                                <div className="flex items-center justify-center gap-2 bg-primary-100 text-primary-700 text-sm font-semibold px-3 py-1 rounded-full mb-4 w-fit mx-auto">
                                    <Sparkles className="w-4 h-4" />
                                    Mais Popular
                                </div>
                            )}

                            <div className="text-center mb-6">
                                <h3 className="text-2xl font-bold text-secondary-900 mb-2">
                                    {plan.name}
                                </h3>
                                <div className="flex items-baseline justify-center gap-1">
                                    <span className="text-4xl font-bold text-primary-600">
                                        {plan.price}
                                    </span>
                                    <span className="text-secondary-600">{plan.period}</span>
                                </div>
                            </div>

                            <ul className="space-y-3 mb-8">
                                {plan.features.map((feature, index) => (
                                    <li key={index} className="flex items-start gap-3">
                                        <Check className="w-5 h-5 text-success-600 flex-shrink-0 mt-0.5" />
                                        <span className="text-secondary-700">{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <button
                                className={`w-full py-3 rounded-lg font-semibold transition-all duration-200 ${plan.highlighted
                                        ? 'btn btn-primary shadow-lg hover:shadow-xl'
                                        : 'btn btn-secondary'
                                    }`}
                            >
                                Escolher {plan.name}
                            </button>
                        </div>
                    ))}
                </div>

                {/* Informações Adicionais */}
                <div className="bg-white rounded-2xl shadow-soft p-8 border border-secondary-100 max-w-3xl mx-auto">
                    <h3 className="text-xl font-semibold text-secondary-900 mb-4 text-center">
                        Perguntas Frequentes
                    </h3>
                    <div className="space-y-4 text-secondary-700">
                        <div>
                            <h4 className="font-semibold mb-1">Posso cancelar a qualquer momento?</h4>
                            <p className="text-sm">
                                Sim! Você pode cancelar sua assinatura a qualquer momento sem
                                multas ou taxas adicionais.
                            </p>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-1">Como funciona o pagamento?</h4>
                            <p className="text-sm">
                                O pagamento é mensal e renovado automaticamente. Aceitamos cartão
                                de crédito e PIX.
                            </p>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-1">Posso mudar de plano depois?</h4>
                            <p className="text-sm">
                                Sim! Você pode fazer upgrade ou downgrade do seu plano a qualquer
                                momento.
                            </p>
                        </div>
                    </div>

                    <div className="mt-6 pt-6 border-t border-secondary-200 text-center">
                        <p className="text-sm text-secondary-600">
                            Precisa de ajuda?{' '}
                            <a
                                href="mailto:suporte@gestorauto.com"
                                className="text-primary-600 hover:underline font-medium"
                            >
                                Entre em contato com nosso suporte
                            </a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
