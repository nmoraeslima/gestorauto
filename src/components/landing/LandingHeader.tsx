import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export const LandingHeader: React.FC = () => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const toggleMobileMenu = () => {
        setMobileMenuOpen(!mobileMenuOpen);
    };

    const closeMobileMenu = () => {
        setMobileMenuOpen(false);
    };

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
        closeMobileMenu();
    };

    return (
        <>
            <header className={`header ${scrolled ? 'scrolled' : ''}`}>
                <div className="container header-container">
                    <Link to="/" className="logo">
                        <img
                            src="/assets/logo-horizontal-dark.png"
                            alt="GestorAuto"
                            style={{ height: '40px', width: 'auto' }}
                        />
                    </Link>

                    <nav className="nav-menu">
                        <ul className="nav-list">
                            <li>
                                <a href="#features" onClick={(e) => scrollToSection(e, 'features')}>
                                    Funcionalidades
                                </a>
                            </li>
                            <li>
                                <a href="#benefits" onClick={(e) => scrollToSection(e, 'benefits')}>
                                    Benefícios
                                </a>
                            </li>
                            <li>
                                <a href="#pricing" onClick={(e) => scrollToSection(e, 'pricing')}>
                                    Planos
                                </a>
                            </li>
                            <li>
                                <a href="#mobile" onClick={(e) => scrollToSection(e, 'mobile')}>
                                    App
                                </a>
                            </li>
                        </ul>
                    </nav>

                    <div className="header-actions">
                        <Link to="/signin" className="btn btn-text">
                            Entrar
                        </Link>
                        <Link to="/signup" className="btn btn-primary">
                            Teste Grátis
                        </Link>
                    </div>

                    <button
                        className={`mobile-menu-btn ${mobileMenuOpen ? 'active' : ''}`}
                        onClick={toggleMobileMenu}
                        aria-label="Abrir menu"
                    >
                        <span></span>
                        <span></span>
                        <span></span>
                    </button>
                </div>
            </header>

            {/* Mobile Menu Overlay */}
            <div className={`mobile-menu-overlay ${mobileMenuOpen ? 'active' : ''}`}>
                <nav className="mobile-nav">
                    <ul className="mobile-nav-list">
                        <li>
                            <a href="#features" onClick={(e) => scrollToSection(e, 'features')}>
                                Funcionalidades
                            </a>
                        </li>
                        <li>
                            <a href="#benefits" onClick={(e) => scrollToSection(e, 'benefits')}>
                                Benefícios
                            </a>
                        </li>
                        <li>
                            <a href="#pricing" onClick={(e) => scrollToSection(e, 'pricing')}>
                                Planos
                            </a>
                        </li>
                        <li>
                            <a href="#mobile" onClick={(e) => scrollToSection(e, 'mobile')}>
                                App
                            </a>
                        </li>
                        <li>
                            <Link to="/signin" onClick={closeMobileMenu}>
                                Entrar
                            </Link>
                        </li>
                        <li>
                            <Link to="/signup" className="btn btn-primary full-width" onClick={closeMobileMenu}>
                                Teste Grátis
                            </Link>
                        </li>
                    </ul>
                </nav>
            </div>
        </>
    );
};
