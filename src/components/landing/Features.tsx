import React from 'react';
import { Users, Wrench, Calendar, Package, DollarSign, Bell } from 'lucide-react';

const features = [
    {
        icon: Users,
        title: 'Gestão de Clientes e Veículos',
        description:
            'Cadastro completo com histórico de serviços. Consulte placa, modelo e cor rapidamente pelo celular.',
    },
    {
        icon: Wrench,
        title: 'Ordens de Serviço (O.S.)',
        description:
            'Crie O.S. para cada serviço, acompanhe status (aguardando, em andamento, finalizado) e registre produtos.',
    },
    {
        icon: Calendar,
        title: 'Agendamentos',
        description:
            'Calendário visual organizado por data e horário. Evite conflitos e não perca compromissos.',
    },
    {
        icon: Package,
        title: 'Catálogo e Estoque',
        description: 'Cadastre serviços e produtos. Baixa automática de estoque ao finalizar uma O.S.',
    },
    {
        icon: DollarSign,
        title: 'Controle Financeiro',
        description:
            'Visão clara de receitas, despesas, contas a pagar e receber. Saiba o lucro real do seu negócio.',
    },
    {
        icon: Bell,
        title: 'Notificações Automáticas',
        description:
            'Alertas de estoque baixo, lembretes de pagamentos e avisos importantes para você não esquecer nada.',
    },
];

export const Features: React.FC = () => {
    return (
        <section id="features" className="features">
            <div className="container">
                <div className="section-header text-center">
                    <h2>Tudo o que você precisa</h2>
                    <p>Ferramentas essenciais para o dia a dia da sua estética.</p>
                </div>

                <div className="features-grid">
                    {features.map((feature, index) => {
                        const Icon = feature.icon;
                        return (
                            <div key={index} className="feature-card">
                                <div className="feature-icon">
                                    <Icon size={24} />
                                </div>
                                <h3>{feature.title}</h3>
                                <p>{feature.description}</p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};
