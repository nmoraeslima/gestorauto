import React from 'react';
import { Link } from 'react-router-dom';
import { Check, Zap, Star } from 'lucide-react';

const plans = [
    {
        name: 'Starter',
        price: '49,90',
        description: 'Ideal para quem está começando ou trabalha sozinho.',
        features: [
            '1 Usuário',
            'Até 50 Clientes',
            'Agendamentos Ilimitados',
            'Ordens de Serviço Ilimitadas',
            'Gestão de Clientes e Veículos',
            'Logo na O.S. (PDF)',
        ],
        highlight: false,
        cta: 'Começar Grátis',
        icon: Star,
        color: 'blue'
    },
    {
        name: 'Profissional',
        price: '89,90',
        description: 'Para estéticas que querem crescer, fidelizar e organizar.',
        features: [
            '3 Usuários',
            'Até 300 Clientes',
            'Tudo do Starter +',
            'Gestão Financeira Completa',
            'CRM: Lembretes de Retorno',
            'Envio de WhatsApp (Manual)',
            'Relatórios de Faturamento',
            'Controle de Estoque',
        ],
        highlight: true,
        popular: true,
        cta: 'Testar Grátis Agora',
        icon: Zap,
        color: 'primary'
    },
    {
        name: 'Elite',
        price: '139,90',
        description: 'A experiência completa de alto padrão para seu negócio.',
        features: [
            'Usuários Ilimitados',
            'Clientes Ilimitados',
            'Tudo do Profissional +',
            'Painel TV (Fila de Espera)',
            'Agendamento Online (Link Público)',
            'App do Cliente (Rastreio)',
            'Suporte Prioritário VIP',
            'Treinamento para Equipe',
        ],
        highlight: false,
        cta: 'Ser Elite',
        icon: Star,
        color: 'purple'
    },
];

export const Pricing: React.FC = () => {
    return (
        <section id="pricing" className="py-24 bg-gray-50 relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-5">
                <div className="absolute -top-[20%] -right-[10%] w-[50%] h-[50%] rounded-full bg-primary-600 blur-[120px]" />
                <div className="absolute top-[40%] -left-[10%] w-[40%] h-[40%] rounded-full bg-blue-600 blur-[100px]" />
            </div>

            <div className="container mx-auto px-4 relative z-10">
                <div className="text-center max-w-3xl mx-auto mb-24">
                    <h2 className="text-primary-600 font-semibold tracking-wide uppercase text-sm mb-2">Planos e Preços</h2>
                    <h3 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6 bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-700">
                        Investimento que se paga no <span className="text-primary-600">primeiro serviço</span>
                    </h3>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto text-center">
                        Comece com 7 dias grátis. Sem fidelidade, cancele quando quiser.
                        Escolha a ferramenta certa para escalar sua estética.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto items-center">
                    {plans.map((plan, index) => (
                        <div
                            key={index}
                            className={`relative bg-white rounded-2xl transition-all duration-300 ${plan.highlight
                                ? 'shadow-2xl md:-mt-8 md:mb-8 border-2 border-primary-500 z-10 scale-105'
                                : 'shadow-lg border border-gray-100 hover:shadow-xl hover:-translate-y-1'
                                }`}
                        >
                            {plan.popular && (
                                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-primary-600 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg uppercase tracking-wider flex items-center gap-1">
                                    <Star className="w-3 h-3 fill-current" />
                                    Mais Escolhido
                                </div>
                            )}

                            <div className="p-8">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className={`text-xl font-bold ${plan.highlight ? 'text-primary-600' : 'text-gray-900'}`}>
                                        {plan.name}
                                    </h4>
                                    {plan.icon && <plan.icon className={`w-6 h-6 ${plan.highlight ? 'text-primary-500 fill-primary-100' : 'text-gray-400'}`} />}
                                </div>

                                <p className="text-sm text-gray-500 min-h-[40px] mb-6">
                                    {plan.description}
                                </p>

                                <div className="flex items-baseline mb-8">
                                    <span className="text-lg text-gray-400 font-medium select-none">R$</span>
                                    <span className="text-5xl font-extrabold text-gray-900 tracking-tight mx-1">
                                        {plan.price}
                                    </span>
                                    <span className="text-gray-500 font-medium">/mês</span>
                                </div>

                                <Link
                                    to={`/signup?plan=${plan.name.toLowerCase()}`}
                                    className={`w-full flex items-center justify-center px-6 py-4 border text-base font-bold rounded-xl transition-all duration-200 transform active:scale-95 ${plan.highlight
                                        ? 'bg-primary-600 border-transparent text-white hover:bg-primary-700 shadow-lg hover:shadow-primary-500/30'
                                        : 'bg-white border-gray-200 text-gray-900 hover:bg-gray-50 hover:border-gray-300'
                                        }`}
                                >
                                    {plan.cta}
                                </Link>
                            </div>

                            <div className="px-8 pb-8 pt-2">
                                <p className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-4">
                                    O que está incluído:
                                </p>
                                <ul className="space-y-4">
                                    {plan.features.map((feature, idx) => (
                                        <li key={idx} className="flex items-start">
                                            <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5 mr-3 ${plan.highlight ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-500'
                                                }`}>
                                                <Check className="w-3 h-3" />
                                            </div>
                                            <span className="text-sm text-gray-600 leading-relaxed">
                                                {feature.includes('Tudo do') ? (
                                                    <span className="font-semibold text-gray-900">{feature}</span>
                                                ) : (
                                                    feature
                                                )}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-16 text-center">
                    <p className="text-gray-500 text-sm flex items-center justify-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                        Garantia de 7 dias. Não gostou? Devolvemos seu dinheiro.
                    </p>
                </div>
            </div>
        </section>
    );
};
