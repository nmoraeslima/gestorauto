import React from 'react';
import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';

const plans = [
    {
        name: 'Básico',
        price: '49,90',
        features: [
            'Até 2 usuários',
            '100 agendamentos/mês',
            'Cadastro de clientes e veículos',
            'Ordens de serviço',
            'Controle financeiro básico',
        ],
        popular: false,
    },
    {
        name: 'Profissional',
        price: '99,90',
        features: [
            'Até 5 usuários',
            '500 agendamentos/mês',
            'Tudo do Básico +',
            'Controle de estoque',
            'Baixa automática',
            'Relatórios avançados',
            'Suporte prioritário',
        ],
        popular: true,
    },
    {
        name: 'Premium',
        price: '199,90',
        features: [
            'Usuários ilimitados',
            'Agendamentos ilimitados',
            'Tudo do Profissional +',
            'Suporte dedicado',
            'Treinamento para equipe',
        ],
        popular: false,
    },
];

export const Pricing: React.FC = () => {
    return (
        <section id="pricing" className="pricing">
            <div className="container">
                <div className="section-header text-center">
                    <h2>Planos Simples e Transparentes</h2>
                    <p>Todos os planos incluem 7 dias grátis. Cancele quando quiser.</p>
                </div>

                <div className="pricing-grid">
                    {plans.map((plan, index) => (
                        <div key={index} className={`pricing-card ${plan.popular ? 'popular' : ''}`}>
                            {plan.popular && <div className="popular-badge">Mais Popular</div>}

                            <div className="pricing-header">
                                <h3>{plan.name}</h3>
                                <div className="price">
                                    R$ {plan.price}
                                    <span>/mês</span>
                                </div>
                            </div>

                            <ul className="pricing-features">
                                {plan.features.map((feature, featureIndex) => (
                                    <li key={featureIndex}>
                                        <span className="check">
                                            <Check size={14} />
                                        </span>{' '}
                                        {feature.includes('Tudo do') ? <strong>{feature}</strong> : feature}
                                    </li>
                                ))}
                            </ul>

                            <Link
                                to="/signup"
                                className={`btn ${plan.popular ? 'btn-primary' : 'btn-outline'} full-width`}
                            >
                                Escolher {plan.name}
                            </Link>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};
