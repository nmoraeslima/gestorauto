import React from 'react';
import { Target, TrendingUp, Clock, Smartphone, Lock, Award } from 'lucide-react';

const benefits = [
    {
        icon: Target,
        title: 'Organização Absoluta',
        description: 'Abandone as planilhas e o papel. Centralize cada aspecto do seu negócio em um ambiente digital, limpo e à prova de falhas.',
    },
    {
        icon: TrendingUp,
        title: 'Controle Financeiro Real',
        description: 'Chega de "achar" que teve lucro. Tenha clareza total sobre seu fluxo de caixa e tome decisões com segurança.',
    },
    {
        icon: Clock,
        title: 'Mais Tempo Livre',
        description: 'A automação trabalha por você. Baixa de estoque, lembretes e agendamentos acontecem enquanto você foca no serviço.',
    },
    {
        icon: Smartphone,
        title: 'Liberdade Geográfica',
        description: 'Sua empresa no seu bolso. Monitore sua operação, aprove orçamentos e verifique o faturamento de onde estiver.',
    },
    {
        icon: Lock,
        title: 'Segurança de Dados',
        description: 'Tecnologia de ponta protegendo suas informações. Backups automáticos e acesso restrito garantem sua tranquilidade.',
    },
    {
        icon: Award,
        title: 'Imagem Profissional',
        description: 'Surpreenda seus clientes com orçamentos digitais, agendamento online e comunicações padronizadas. Valorize sua marca.',
    }
];

export const Benefits: React.FC = () => {
    return (
        <section id="benefits" className="py-24 bg-secondary-900 text-white relative overflow-hidden">
            {/* Background Gradient */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
                <div className="absolute top-[20%] right-[10%] w-[40%] h-[40%] rounded-full bg-primary-600 blur-[120px]" />
                <div className="absolute bottom-[20%] left-[10%] w-[30%] h-[30%] rounded-full bg-secondary-600 blur-[100px]" />
            </div>

            <div className="container mx-auto px-4 relative z-10">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="!text-primary-300 font-semibold tracking-wide uppercase text-sm mb-2">Por que GestorAuto?</h2>
                    <h3 className="text-3xl md:text-4xl font-bold mb-6 !text-white">
                        A Ferramenta que <span className="!text-primary-300">Profissionaliza</span> o seu Negócio
                    </h3>
                    <p className="text-lg !text-secondary-200">
                        Não é apenas software, é o parceiro estratégico que coloca sua estética automotiva em outro patamar de eficiência.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {benefits.map((benefit, index) => {
                        const Icon = benefit.icon;
                        return (
                            <div key={index} className="bg-secondary-800/50 backdrop-blur-sm p-8 rounded-2xl border border-secondary-700 hover:border-primary-500/50 hover:bg-secondary-800 transition-all duration-300 group">
                                <div className="w-12 h-12 bg-secondary-700 rounded-xl flex items-center justify-center mb-6 group-hover:bg-primary-900/50 group-hover:!text-primary-300 transition-colors">
                                    <Icon size={24} className="!text-secondary-300 group-hover:!text-primary-300" />
                                </div>
                                <h4 className="text-xl font-bold mb-3 !text-white">{benefit.title}</h4>
                                <p className="!text-secondary-300 leading-relaxed">
                                    {benefit.description}
                                </p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};
