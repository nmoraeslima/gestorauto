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
            { icon: Users, title: 'Clientes e Veículos', desc: 'Conheça seu cliente pelo nome e tenha todo o histórico do veículo em mãos.' },
            { icon: Wrench, title: 'Ordens de Serviço', desc: 'Profissionalize seus orçamentos e transmita confiança com checklists digitais.' },
            { icon: Calendar, title: 'Agendamento Inteligente', desc: 'Otimize seu tempo e elimine conflitos de horários com uma agenda visual.' },
            { icon: Package, title: 'Controle de Estoque', desc: 'Nunca mais perca produtos. Baixa automática integrada às Ordens de Serviço.' },
        ]
    },
    {
        title: "Financeiro e Estratégia",
        features: [
            { icon: DollarSign, title: 'Fluxo de Caixa', desc: 'Clareza total sobre lucros e despesas. Tome decisões baseadas em números reais.' },
            { icon: BarChart3, title: 'Relatórios Gerenciais', desc: 'Entenda o desempenho do seu negócio e descubra onde crescer.' },
            { icon: ShieldCheck, title: 'Gestão de Equipe', desc: 'Controle de acesso granular e segurança para seus dados.' },
        ]
    },
    {
        title: "CRM e Fidelização",
        features: [
            { icon: Bell, title: 'Lembretes Automáticos', desc: 'O sistema avisa o cliente quando é hora de voltar. Fidelização no piloto automático.' },
            { icon: MessageCircle, title: 'Integração WhatsApp', desc: 'Envie orçamentos, agendamentos e lembretes com um clique. Sem salvar contato.' },
            { icon: Share2, title: 'Agendamento Online', desc: 'Seu negócio aberto 24h. Deixe seu cliente agendar pelo link exclusivo.' },
        ]
    },
    {
        title: "Diferenciais Exclusivos",
        features: [
            { icon: Monitor, title: 'Painel TV (Recepção)', desc: 'Impressione quem chega. Mostre a fila de serviços e status na TV da sua loja.' },
            { icon: Smartphone, title: 'App do Cliente', desc: 'Transparência total. Seu cliente acompanha o serviço na palma da mão.' },
        ]
    }
];

export const Features: React.FC = () => {
    return (
        <section id="features" className="py-20 bg-white">
            <div className="container mx-auto px-4">
                <div className="section-header text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold text-secondary-900 mb-4">
                        Um Ecossistema de Performance. <br />
                        <span className="text-primary-600">Projetado para sua Evolução.</span>
                    </h2>
                    <p className="text-lg text-secondary-600 max-w-2xl mx-auto">
                        Mais que um sistema, uma suíte completa de ferramentas para transformar sua operação e encantar seus clientes.
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
