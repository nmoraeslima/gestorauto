import React from 'react';
import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';

export const CTAFooter: React.FC = () => {
    return (
        <section className="cta-footer">
            <div className="container text-center">
                <h2>Comece a Organizar Sua Estética Hoje</h2>
                <p>7 dias grátis. Sem cartão de crédito. Cancele quando quiser.</p>
                <Link to="/signup" className="btn btn-primary btn-lg">
                    Criar Minha Conta Grátis
                </Link>

                <div className="trust-features">
                    <span>
                        <span className="check">
                            <Check size={16} />
                        </span>{' '}
                        Configuração em 5 minutos
                    </span>
                    <span>
                        <span className="check">
                            <Check size={16} />
                        </span>{' '}
                        Sem cartão de crédito
                    </span>
                    <span>
                        <span className="check">
                            <Check size={16} />
                        </span>{' '}
                        Suporte em português
                    </span>
                </div>
            </div>
        </section>
    );
};
