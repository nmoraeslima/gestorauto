import React from 'react';
import { Link } from 'react-router-dom';

export const MobileApp: React.FC = () => {
    return (
        <section id="mobile" className="mobile-app">
            <div className="container mobile-app-container">
                <div className="mobile-app-content">
                    <h2>Use no celular como um aplicativo</h2>
                    <p>
                        Consulte clientes, crie ordens de serviço e acompanhe pagamentos de qualquer lugar.
                    </p>
                    <ul className="app-features">
                        <li>Instale direto do navegador, sem loja de apps</li>
                        <li>Funciona no Android e iPhone</li>
                        <li>Sincronizado com o computador</li>
                    </ul>
                    <Link to="/signup" className="btn btn-primary">
                        Começar Agora
                    </Link>
                </div>
                <div className="mobile-app-image">
                    <div className="phone-mockup">
                        <div className="phone-screen">
                            <div className="app-header">GestorAuto</div>
                            <div className="app-content">
                                <div className="app-card"></div>
                                <div className="app-card"></div>
                                <div className="app-card"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
