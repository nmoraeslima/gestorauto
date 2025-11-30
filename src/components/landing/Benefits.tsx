import React from 'react';

const benefits = [
    {
        title: 'Organização',
        description: 'Tudo em um só lugar: clientes, veículos, serviços e finanças',
    },
    {
        title: 'Controle financeiro',
        description: 'Saiba exatamente quanto está entrando e saindo',
    },
    {
        title: 'Economia de tempo',
        description: 'Baixa automática de estoque, alertas inteligentes',
    },
    {
        title: 'Mobilidade',
        description: 'Acesse de qualquer lugar pelo celular',
    },
    {
        title: 'Segurança',
        description: 'Seus dados protegidos e separados de outras empresas',
    },
    {
        title: 'Teste grátis',
        description: '7 dias para experimentar todas as funcionalidades',
    },
];

export const Benefits: React.FC = () => {
    return (
        <section id="benefits" className="benefits">
            <div className="container">
                <div className="section-header text-center">
                    <h2>Por que usar o GestorAuto?</h2>
                </div>

                <div className="benefits-table-wrapper">
                    <table className="benefits-table">
                        <thead>
                            <tr>
                                <th>O que você ganha</th>
                                <th>Como funciona</th>
                            </tr>
                        </thead>
                        <tbody>
                            {benefits.map((benefit, index) => (
                                <tr key={index}>
                                    <td>
                                        <strong>{benefit.title}</strong>
                                    </td>
                                    <td>{benefit.description}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
    );
};
