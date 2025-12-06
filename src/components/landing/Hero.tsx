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
                    <span className="badge">Tecnologia Profissional para Estética Automotiva</span>
                    <h1 className="hero-title">Eleve o Nível da Sua Estética Automotiva</h1>
                    <p className="hero-subtitle">
                        Profissionalismo que conquista clientes e tecnologia que libera seu tempo.
                        A plataforma completa para quem não aceita menos que a excelência em gestão,
                        finanças e atendimento.
                    </p>
                    <div className="hero-buttons">
                        <Link to="/signup" className="btn btn-primary btn-lg">
                            Começar Gratuitamente
                        </Link>
                        <a
                            href="#showcase"
                            className="btn btn-outline btn-lg"
                            onClick={(e) => scrollToSection(e, 'showcase')}
                        >
                            Conhecer a Plataforma
                        </a>
                    </div>
                </div>
            </div>
        </section>
    );
};
