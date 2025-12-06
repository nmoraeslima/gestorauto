import React from 'react';
import {
    Users, Wrench, Calendar, Package, DollarSign, Bell,
    Monitor, Smartphone, MessageCircle, BarChart3,
    Share2, ShieldCheck
} from 'lucide-react';

const featureCategories = [
    {
        title: "Gestão Completa",
        features: [
            { icon: Users, title: 'Clientes e Veículos', desc: 'Cadastro detalhado com histórico completo.' },
            { icon: Wrench, title: 'Ordens de Serviço', desc: 'Controle de status, checklists e aprovações.' },
            { icon: Calendar, title: 'Agendamento Inteligente', desc: 'Evite conflitos e organize sua agenda.' },
            { icon: Package, title: 'Estoque Automático', desc: 'Baixa automática de produtos ao usar na O.S.' },
        ]
    },
    {
        title: "Financeiro e Estratégia",
        features: [
            { icon: DollarSign, title: 'Fluxo de Caixa', desc: 'Contas a pagar, receber e lucro real.' },
            { icon: BarChart3, title: 'Relatórios Avançados', desc: 'Análise de faturamento e desempenho.' },
            { icon: ShieldCheck, title: 'Múltiplos Usuários', desc: 'Controle de acesso e permissões por cargo.' },
        ]
    },
    {
        title: "CRM e Vendas",
        features: [
            { icon: Bell, title: 'Lembretes de Retorno', desc: 'Avise o cliente quando vencer a proteção.' },
            { icon: MessageCircle, title: 'Integração WhatsApp', desc: 'Envie orçamentos e avisos com um clique.' },
            { icon: Share2, title: 'Agendamento Online', desc: 'Link para o cliente agendar sozinho.' },
        ]
    },
    {
        title: "Exclusivos GestorAuto",
        features: [
            { icon: Monitor, title: 'Painel TV', desc: 'Mostre a fila de carros na TV da sala de espera.' },
            { icon: Smartphone, title: 'App do Cliente', desc: 'Seu cliente acompanha o serviço pelo celular.' },
        ]
    }
];

export const Features: React.FC = () => {
    return (
        <section id="features" className="py-20 bg-white">
            <div className="container mx-auto px-4">
                <div className="section-header text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold text-secondary-900 mb-4">
                        Uma plataforma completa. <br />
                        <span className="text-primary-600">Sem limites para crescer.</span>
                    </h2>
                    <p className="text-lg text-secondary-600 max-w-2xl mx-auto">
                        Do agendamento ao pós-venda, cuidamos de tudo para você focar na qualidade do serviço.
                    </p>
                </div>

                <div className="space-y-16">
                    {featureCategories.map((category, catIndex) => (
                        <div key={catIndex}>
                            <div className="flex items-center gap-4 mb-8">
                                <h3 className="text-xl font-bold text-secondary-900 flex-shrink-0">
                                    {category.title}
                                </h3>
                                <div className="h-px bg-secondary-200 w-full"></div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                                {category.features.map((feature, index) => {
                                    const Icon = feature.icon;
                                    return (
                                        <div key={index} className="flex flex-col p-6 rounded-xl bg-gray-50 hover:bg-white hover:shadow-lg transition-all duration-300 border border-transparent hover:border-gray-100">
                                            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4 text-primary-600">
                                                <Icon size={24} />
                                            </div>
                                            <h4 className="font-bold text-secondary-900 mb-2">{feature.title}</h4>
                                            <p className="text-sm text-secondary-600 leading-relaxed">{feature.desc}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};
