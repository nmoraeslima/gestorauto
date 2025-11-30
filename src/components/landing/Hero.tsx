import React from 'react';
import { Link } from 'react-router-dom';

export const Hero: React.FC = () => {
    const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
        e.preventDefault();
        const element = document.getElementById(id);
        if (element) {
            const headerHeight = 80;
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerHeight;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth',
            });
        }
    };

    return (
        <section className="hero">
            <div className="container hero-container">
                <div className="hero-content">
                    <span className="badge">Funciona no celular como um app</span>
                    <h1 className="hero-title">Organize sua Estética Automotiva em Um Só Lugar</h1>
                    <p className="hero-subtitle">
                        Clientes, veículos, agendamentos, ordens de serviço, estoque e financeiro — tudo no
                        computador ou celular. Simples de usar, feito para quem não tem tempo a perder.
                    </p>
                    <div className="hero-buttons">
                        <Link to="/signup" className="btn btn-primary btn-lg">
                            Teste Grátis por 7 Dias
                        </Link>
                        <a
                            href="#how-it-works"
                            className="btn btn-outline btn-lg"
                            onClick={(e) => scrollToSection(e, 'how-it-works')}
                        >
                            Ver Como Funciona
                        </a>
                    </div>
                </div>
            </div>
        </section>
    );
};
