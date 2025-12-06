import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Mail } from 'lucide-react';

export const LandingFooter: React.FC = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="footer">
            <div className="container footer-container">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                    {/* Logo e Descrição */}
                    <div>
                        <div className="footer-logo mb-4">GestorAuto</div>
                        <p className="text-sm text-neutral-400">
                            Gestão completa para estéticas automotivas
                        </p>
                    </div>

                    {/* Links Rápidos */}
                    <div>
                        <h4 className="text-white font-semibold mb-3">Links Rápidos</h4>
                        <div className="flex flex-col gap-2">
                            <Link to="/signin" className="text-sm text-neutral-400 hover:text-primary-400 transition-colors">
                                Entrar
                            </Link>
                            <Link to="/signup" className="text-sm text-neutral-400 hover:text-primary-400 transition-colors">
                                Criar Conta
                            </Link>
                        </div>
                    </div>

                    {/* Legal */}
                    <div>
                        <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                            <Shield className="w-4 h-4" />
                            Legal
                        </h4>
                        <div className="flex flex-col gap-2">
                            <Link to="/privacy-policy" className="text-sm text-neutral-400 hover:text-primary-400 transition-colors">
                                Política de Privacidade
                            </Link>
                            <Link to="/terms-of-service" className="text-sm text-neutral-400 hover:text-primary-400 transition-colors">
                                Termos de Uso
                            </Link>
                            <Link to="/cookie-policy" className="text-sm text-neutral-400 hover:text-primary-400 transition-colors">
                                Política de Cookies
                            </Link>
                        </div>
                    </div>

                    {/* Contato */}
                    <div>
                        <h4 className="text-white font-semibold mb-3">Contato</h4>
                        <div className="flex flex-col gap-2">
                            <a
                                href="mailto:suporte@gestorauto.com.br"
                                className="text-sm text-neutral-400 hover:text-primary-400 transition-colors flex items-center gap-2"
                            >
                                <Mail className="w-3 h-3" />
                                Suporte
                            </a>
                            <a
                                href="mailto:privacidade@gestorauto.com.br"
                                className="text-sm text-neutral-400 hover:text-primary-400 transition-colors flex items-center gap-2"
                            >
                                <Shield className="w-3 h-3" />
                                Privacidade
                            </a>
                        </div>

                        {/* Badge LGPD */}
                        <div className="mt-4 inline-flex items-center gap-2 bg-green-900/30 border border-green-700 rounded-lg px-3 py-2">
                            <Shield className="w-4 h-4 text-green-400" />
                            <span className="text-xs font-medium text-green-400">
                                Conforme LGPD
                            </span>
                        </div>
                    </div>
                </div>

                <div className="footer-copy border-t border-neutral-700 pt-6">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                        <span>© {currentYear} GestorAuto. Todos os direitos reservados.</span>
                        <span className="text-xs text-neutral-500">Feito com ❤️ no Brasil</span>
                    </div>
                </div>
            </div>
        </footer>
    );
};
