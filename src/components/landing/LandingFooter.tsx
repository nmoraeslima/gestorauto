import React from 'react';
import { Link } from 'react-router-dom';

export const LandingFooter: React.FC = () => {
    return (
        <footer className="footer">
            <div className="container footer-container">
                <div className="footer-logo">GestorAuto</div>
                <div className="footer-links">
                    <Link to="/terms">Termos de Uso</Link>
                    <Link to="/privacy">Privacidade</Link>
                    <Link to="/contact">Contato</Link>
                </div>
                <div className="footer-copy">&copy; 2024 GestorAuto. Todos os direitos reservados.</div>
            </div>
        </footer>
    );
};
