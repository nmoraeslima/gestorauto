import React from 'react';
import { Link } from 'react-router-dom';

export const MobileApp: React.FC = () => {
    return (
        <section id="mobile" className="mobile-app">
            <div className="container mobile-app-container">
                <div className="mobile-app-content">
                    <span className="text-primary-600 font-semibold tracking-wide uppercase text-sm mb-2 block">Mobilidade Total</span>
                    <h2>Sua Empresa no Seu Bolso</h2>
                    <p>
                        A liberdade de consultar clientes, aprovar orçamentos e acompanhar o financeiro de onde você estiver.
                        Tecnologia PWA de última geração: leve, rápido e sem ocupar a memória do seu celular.
                    </p>
                    <ul className="app-features">
                        <li>Instalação instantânea pelo navegador (Sem Loja de Apps)</li>
                        <li>Compatibilidade total com Android e iPhone (iOS)</li>
                        <li>Sincronização em tempo real com o computador</li>
                    </ul>
                    <Link to="/signup" className="btn btn-primary">
                        Usar no Celular Agora
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
