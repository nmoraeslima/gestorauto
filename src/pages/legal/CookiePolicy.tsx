import React from 'react';
import { Link } from 'react-router-dom';
import { Cookie } from 'lucide-react';

export default function CookiePolicy() {
    return (
        <div className="min-h-screen bg-neutral-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
                {/* Header */}
                <div className="border-b border-neutral-200 pb-6 mb-8">
                    <div className="flex items-center gap-3 mb-4">
                        <Cookie className="w-8 h-8 text-primary-600" />
                        <h1 className="text-3xl font-bold text-secondary-600">
                            Política de Cookies
                        </h1>
                    </div>
                    <p className="text-neutral-600">
                        Última atualização: 05 de dezembro de 2025
                    </p>
                </div>

                {/* Content */}
                <div className="prose prose-neutral max-w-none space-y-8">
                    {/* 1. O que são Cookies */}
                    <section>
                        <h2 className="text-2xl font-bold text-secondary-600 mb-4">
                            1. O que são Cookies?
                        </h2>
                        <p className="text-neutral-700 leading-relaxed">
                            Cookies são pequenos arquivos de texto armazenados no seu navegador quando você visita
                            um site. Eles permitem que o site reconheça seu dispositivo e lembre de informações
                            sobre sua visita, como preferências e configurações.
                        </p>
                    </section>

                    {/* 2. Como Usamos Cookies */}
                    <section>
                        <h2 className="text-2xl font-bold text-secondary-600 mb-4">
                            2. Como Usamos Cookies
                        </h2>
                        <p className="text-neutral-700 leading-relaxed mb-4">
                            O GestorAuto utiliza cookies para:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-neutral-700">
                            <li>Manter você conectado à plataforma</li>
                            <li>Lembrar suas preferências e configurações</li>
                            <li>Melhorar a segurança da plataforma</li>
                            <li>Analisar o uso e desempenho do site</li>
                            <li>Personalizar sua experiência</li>
                        </ul>
                    </section>

                    {/* 3. Tipos de Cookies */}
                    <section>
                        <h2 className="text-2xl font-bold text-secondary-600 mb-4">
                            3. Tipos de Cookies que Utilizamos
                        </h2>

                        <div className="space-y-6">
                            {/* Essenciais */}
                            <div className="bg-green-50 border-l-4 border-green-500 p-4">
                                <h3 className="text-lg font-semibold text-green-900 mb-2">
                                    🔒 Cookies Essenciais (Necessários)
                                </h3>
                                <p className="text-green-800 mb-3">
                                    Estes cookies são estritamente necessários para o funcionamento da plataforma.
                                    Sem eles, você não conseguirá usar os serviços.
                                </p>
                                <table className="min-w-full bg-white border border-green-200">
                                    <thead className="bg-green-100">
                                        <tr>
                                            <th className="border border-green-200 px-4 py-2 text-left">Cookie</th>
                                            <th className="border border-green-200 px-4 py-2 text-left">Finalidade</th>
                                            <th className="border border-green-200 px-4 py-2 text-left">Duração</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td className="border border-green-200 px-4 py-2">
                                                <code className="text-sm">sb-access-token</code>
                                            </td>
                                            <td className="border border-green-200 px-4 py-2">
                                                Autenticação do usuário
                                            </td>
                                            <td className="border border-green-200 px-4 py-2">
                                                Sessão
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="border border-green-200 px-4 py-2">
                                                <code className="text-sm">sb-refresh-token</code>
                                            </td>
                                            <td className="border border-green-200 px-4 py-2">
                                                Renovação de sessão
                                            </td>
                                            <td className="border border-green-200 px-4 py-2">
                                                30 dias
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            {/* Funcionais */}
                            <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
                                <h3 className="text-lg font-semibold text-blue-900 mb-2">
                                    ⚙️ Cookies Funcionais
                                </h3>
                                <p className="text-blue-800 mb-3">
                                    Permitem que o site lembre de escolhas que você faz e forneça recursos aprimorados.
                                </p>
                                <table className="min-w-full bg-white border border-blue-200">
                                    <thead className="bg-blue-100">
                                        <tr>
                                            <th className="border border-blue-200 px-4 py-2 text-left">Cookie</th>
                                            <th className="border border-blue-200 px-4 py-2 text-left">Finalidade</th>
                                            <th className="border border-blue-200 px-4 py-2 text-left">Duração</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td className="border border-blue-200 px-4 py-2">
                                                <code className="text-sm">user-preferences</code>
                                            </td>
                                            <td className="border border-blue-200 px-4 py-2">
                                                Armazena preferências do usuário (tema, idioma)
                                            </td>
                                            <td className="border border-blue-200 px-4 py-2">
                                                1 ano
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="border border-blue-200 px-4 py-2">
                                                <code className="text-sm">notification-consent</code>
                                            </td>
                                            <td className="border border-blue-200 px-4 py-2">
                                                Lembra se você aceitou notificações
                                            </td>
                                            <td className="border border-blue-200 px-4 py-2">
                                                1 ano
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            {/* Analíticos */}
                            <div className="bg-purple-50 border-l-4 border-purple-500 p-4">
                                <h3 className="text-lg font-semibold text-purple-900 mb-2">
                                    📊 Cookies Analíticos
                                </h3>
                                <p className="text-purple-800 mb-3">
                                    Nos ajudam a entender como os visitantes interagem com o site, coletando
                                    informações de forma anônima.
                                </p>
                                <table className="min-w-full bg-white border border-purple-200">
                                    <thead className="bg-purple-100">
                                        <tr>
                                            <th className="border border-purple-200 px-4 py-2 text-left">Cookie</th>
                                            <th className="border border-purple-200 px-4 py-2 text-left">Finalidade</th>
                                            <th className="border border-purple-200 px-4 py-2 text-left">Duração</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td className="border border-purple-200 px-4 py-2">
                                                <code className="text-sm">_ga</code>
                                            </td>
                                            <td className="border border-purple-200 px-4 py-2">
                                                Google Analytics - Distingue usuários
                                            </td>
                                            <td className="border border-purple-200 px-4 py-2">
                                                2 anos
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="border border-purple-200 px-4 py-2">
                                                <code className="text-sm">_gid</code>
                                            </td>
                                            <td className="border border-purple-200 px-4 py-2">
                                                Google Analytics - Distingue usuários
                                            </td>
                                            <td className="border border-purple-200 px-4 py-2">
                                                24 horas
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </section>

                    {/* 4. Cookies de Terceiros */}
                    <section>
                        <h2 className="text-2xl font-bold text-secondary-600 mb-4">
                            4. Cookies de Terceiros
                        </h2>
                        <p className="text-neutral-700 leading-relaxed mb-4">
                            Alguns cookies são colocados por serviços de terceiros que aparecem em nossas páginas:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-neutral-700">
                            <li>
                                <strong>Supabase:</strong> Para autenticação e armazenamento de dados
                            </li>
                            <li>
                                <strong>Google Analytics:</strong> Para análise de uso (se habilitado)
                            </li>
                        </ul>
                    </section>

                    {/* 5. Gerenciar Cookies */}
                    <section>
                        <h2 className="text-2xl font-bold text-secondary-600 mb-4">
                            5. Como Gerenciar Cookies
                        </h2>

                        <h3 className="text-xl font-semibold text-secondary-600 mb-3">
                            5.1 Configurações do Navegador
                        </h3>
                        <p className="text-neutral-700 leading-relaxed mb-4">
                            Você pode controlar e/ou excluir cookies através das configurações do seu navegador:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-neutral-700 mb-4">
                            <li>
                                <strong>Chrome:</strong>{' '}
                                <a
                                    href="https://support.google.com/chrome/answer/95647"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary-600 hover:underline"
                                >
                                    Instruções
                                </a>
                            </li>
                            <li>
                                <strong>Firefox:</strong>{' '}
                                <a
                                    href="https://support.mozilla.org/pt-BR/kb/cookies"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary-600 hover:underline"
                                >
                                    Instruções
                                </a>
                            </li>
                            <li>
                                <strong>Safari:</strong>{' '}
                                <a
                                    href="https://support.apple.com/pt-br/guide/safari/sfri11471/mac"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary-600 hover:underline"
                                >
                                    Instruções
                                </a>
                            </li>
                            <li>
                                <strong>Edge:</strong>{' '}
                                <a
                                    href="https://support.microsoft.com/pt-br/microsoft-edge"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary-600 hover:underline"
                                >
                                    Instruções
                                </a>
                            </li>
                        </ul>

                        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4">
                            <p className="text-yellow-800">
                                <strong>⚠️ Atenção:</strong> Bloquear cookies essenciais impedirá o funcionamento
                                correto da plataforma. Você não conseguirá fazer login ou usar os serviços.
                            </p>
                        </div>
                    </section>

                    {/* 6. Alterações */}
                    <section>
                        <h2 className="text-2xl font-bold text-secondary-600 mb-4">
                            6. Alterações nesta Política
                        </h2>
                        <p className="text-neutral-700 leading-relaxed">
                            Podemos atualizar esta Política de Cookies periodicamente. Recomendamos que você
                            revise esta página regularmente para se manter informado sobre como usamos cookies.
                        </p>
                    </section>

                    {/* 7. Contato */}
                    <section>
                        <h2 className="text-2xl font-bold text-secondary-600 mb-4">
                            7. Dúvidas sobre Cookies
                        </h2>
                        <p className="text-neutral-700 leading-relaxed mb-4">
                            Se você tiver dúvidas sobre nossa utilização de cookies, entre em contato:
                        </p>
                        <ul className="list-none space-y-2 text-neutral-700">
                            <li><strong>E-mail:</strong> dpo@gestorauto.com.br</li>
                            <li><strong>Telefone:</strong> +55 (XX) XXXX-XXXX</li>
                        </ul>
                    </section>
                </div>

                {/* Footer */}
                <div className="mt-12 pt-6 border-t border-neutral-200">
                    <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
                        <Link
                            to="/"
                            className="text-primary-600 hover:text-primary-700 font-medium"
                        >
                            ← Voltar para o início
                        </Link>
                        <div className="flex gap-4">
                            <Link
                                to="/privacy-policy"
                                className="text-neutral-600 hover:text-neutral-900"
                            >
                                Política de Privacidade
                            </Link>
                            <Link
                                to="/terms-of-service"
                                className="text-neutral-600 hover:text-neutral-900"
                            >
                                Termos de Uso
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
