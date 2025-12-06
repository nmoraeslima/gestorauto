import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Mail } from 'lucide-react';

export const LandingFooter: React.FC = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="footer bg-slate-900 pt-20 pb-10 border-t border-slate-800">
            <div className="container mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
                    {/* 1. Brand & Description */}
                    <div className="space-y-6">
                        <Link to="/" className="block">
                            <img
                                src="/assets/logo-horizontal-light.png"
                                alt="GestorAuto"
                                style={{ height: '36px', width: 'auto' }}
                            />
                        </Link>
                        <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
                            A plataforma definitiva para estéticas automotivas.
                            Gerencie agendamentos, financeiro e clientes em um único lugar.
                        </p>
                        <div className="flex gap-4">
                            {/* Social Placeholders if needed */}
                        </div>
                    </div>

                    {/* 2. Produto */}
                    <div>
                        <h4 className="text-white font-semibold mb-6">Produto</h4>
                        <ul className="space-y-4">
                            <li>
                                <a href="#features" className="text-slate-400 hover:text-white transition-colors text-sm">
                                    Funcionalidades
                                </a>
                            </li>
                            <li>
                                <a href="#benefits" className="text-slate-400 hover:text-white transition-colors text-sm">
                                    Benefícios
                                </a>
                            </li>
                            <li>
                                <a href="#pricing" className="text-slate-400 hover:text-white transition-colors text-sm">
                                    Planos e Preços
                                </a>
                            </li>
                            <li>
                                <Link to="/signup" className="text-slate-400 hover:text-white transition-colors text-sm">
                                    Criar Conta Grátis
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* 3. Recursos & Legal */}
                    <div>
                        <h4 className="text-white font-semibold mb-6">Recursos</h4>
                        <ul className="space-y-4">
                            <li>
                                <a href="#" className="text-slate-400 hover:text-white transition-colors text-sm">
                                    Blog (Em breve)
                                </a>
                            </li>
                            <li>
                                <Link to="/privacy-policy" className="text-slate-400 hover:text-white transition-colors text-sm">
                                    Política de Privacidade
                                </Link>
                            </li>
                            <li>
                                <Link to="/terms-of-service" className="text-slate-400 hover:text-white transition-colors text-sm">
                                    Termos de Uso
                                </Link>
                            </li>
                            <li>
                                <Link to="/cookie-policy" className="text-slate-400 hover:text-white transition-colors text-sm">
                                    Política de Cookies
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* 4. Contato */}
                    <div>
                        <h4 className="text-white font-semibold mb-6">Contato</h4>
                        <ul className="space-y-4">
                            <li>
                                <a href="mailto:suporte@gestorauto.com.br" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm">
                                    <Mail className="w-4 h-4" />
                                    suporte@gestorauto.com.br
                                </a>
                            </li>
                            <li>
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                                    <Shield className="w-3 h-3 text-emerald-500" />
                                    <span className="text-xs font-medium text-emerald-500">
                                        Dados Protegidos (LGPD)
                                    </span>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-8 mt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-slate-500 text-sm">
                        © {currentYear} GestorAuto Tecnologia. Todos os direitos reservados.
                    </p>
                    <div className="flex items-center gap-1 text-sm text-slate-500">
                        <span>Feito com</span>
                        <span className="text-red-500">❤</span>
                        <span>no Brasil</span>
                    </div>
                </div>
            </div>
        </footer>
    );
};
