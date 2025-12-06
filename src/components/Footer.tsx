import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, FileText, Cookie, Mail } from 'lucide-react';

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-secondary-900 text-neutral-300 mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Sobre */}
                    <div>
                        <h3 className="text-white font-bold text-lg mb-4">GestorAuto</h3>
                        <p className="text-sm text-neutral-400 leading-relaxed">
                            Plataforma completa de gestão para estéticas automotivas.
                            Simplifique seu negócio com tecnologia.
                        </p>
                    </div>

                    {/* Links Rápidos */}
                    <div>
                        <h3 className="text-white font-semibold mb-4">Links Rápidos</h3>
                        <ul className="space-y-2">
                            <li>
                                <Link
                                    to="/signin"
                                    className="text-sm hover:text-primary-400 transition-colors"
                                >
                                    Entrar
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/signup"
                                    className="text-sm hover:text-primary-400 transition-colors"
                                >
                                    Criar Conta
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/"
                                    className="text-sm hover:text-primary-400 transition-colors"
                                >
                                    Página Inicial
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Legal */}
                    <div>
                        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                            <Shield className="w-4 h-4" />
                            Legal e Privacidade
                        </h3>
                        <ul className="space-y-2">
                            <li>
                                <Link
                                    to="/privacy-policy"
                                    className="text-sm hover:text-primary-400 transition-colors flex items-center gap-2"
                                >
                                    <Shield className="w-3 h-3" />
                                    Política de Privacidade
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/terms-of-service"
                                    className="text-sm hover:text-primary-400 transition-colors flex items-center gap-2"
                                >
                                    <FileText className="w-3 h-3" />
                                    Termos de Uso
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/cookie-policy"
                                    className="text-sm hover:text-primary-400 transition-colors flex items-center gap-2"
                                >
                                    <Cookie className="w-3 h-3" />
                                    Política de Cookies
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Contato */}
                    <div>
                        <h3 className="text-white font-semibold mb-4">Contato</h3>
                        <ul className="space-y-2">
                            <li>
                                <a
                                    href="mailto:suporte@gestorauto.com.br"
                                    className="text-sm hover:text-primary-400 transition-colors flex items-center gap-2"
                                >
                                    <Mail className="w-3 h-3" />
                                    suporte@gestorauto.com.br
                                </a>
                            </li>
                            <li>
                                <a
                                    href="mailto:privacidade@gestorauto.com.br"
                                    className="text-sm hover:text-primary-400 transition-colors flex items-center gap-2"
                                >
                                    <Shield className="w-3 h-3" />
                                    privacidade@gestorauto.com.br
                                </a>
                            </li>
                        </ul>

                        {/* Badge LGPD */}
                        <div className="mt-4 inline-flex items-center gap-2 bg-green-900/30 border border-green-700 rounded-lg px-3 py-2">
                            <Shield className="w-4 h-4 text-green-400" />
                            <span className="text-xs font-medium text-green-400">
                                Conforme LGPD
                            </span>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="mt-8 pt-6 border-t border-neutral-700">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                        <p className="text-sm text-neutral-400">
                            © {currentYear} GestorAuto. Todos os direitos reservados.
                        </p>
                        <div className="flex gap-4 text-xs text-neutral-500">
                            <span>Versão 1.0.0</span>
                            <span>•</span>
                            <span>Feito com ❤️ no Brasil</span>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
