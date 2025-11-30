import React from 'react';
import { Shield, Check } from 'lucide-react';

export const Security: React.FC = () => {
    return (
        <section className="security">
            <div className="container security-container">
                <div className="security-icon">
                    <Shield size={48} />
                </div>
                <div className="security-content">
                    <h2>Seus dados protegidos</h2>
                    <ul className="security-list">
                        <li>
                            <span className="check">
                                <Check size={16} />
                            </span>{' '}
                            Cada empresa tem dados completamente separados
                        </li>
                        <li>
                            <span className="check">
                                <Check size={16} />
                            </span>{' '}
                            Somente você e sua equipe acessam suas informações
                        </li>
                        <li>
                            <span className="check">
                                <Check size={16} />
                            </span>{' '}
                            Login obrigatório para qualquer acesso
                        </li>
                    </ul>
                </div>
            </div>
        </section>
    );
};
