import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Mail, Phone, MapPin } from 'lucide-react';

export default function PrivacyPolicy() {
    return (
        <div className="min-h-screen bg-neutral-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
                {/* Header */}
                <div className="border-b border-neutral-200 pb-6 mb-8">
                    <div className="flex items-center gap-3 mb-4">
                        <Shield className="w-8 h-8 text-primary-600" />
                        <h1 className="text-3xl font-bold text-secondary-600">
                            Política de Privacidade
                        </h1>
                    </div>
                    <p className="text-neutral-600">
                        Última atualização: 05 de dezembro de 2025
                    </p>
                </div>

                {/* Content */}
                <div className="prose prose-neutral max-w-none space-y-8">
                    {/* 1. Introdução */}
                    <section>
                        <h2 className="text-2xl font-bold text-secondary-600 mb-4">
                            1. Introdução
                        </h2>
                        <p className="text-neutral-700 leading-relaxed">
                            A <strong>GestorAuto</strong> ("nós", "nosso" ou "nossa") está comprometida com a proteção
                            da privacidade e dos dados pessoais de nossos usuários e clientes. Esta Política de
                            Privacidade descreve como coletamos, usamos, armazenamos e protegemos suas informações
                            pessoais em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei 13.709/2018).
                        </p>
                        <p className="text-neutral-700 leading-relaxed mt-4">
                            Ao utilizar nossa plataforma, você concorda com as práticas descritas nesta política.
                        </p>
                    </section>

                    {/* 2. Definições */}
                    <section>
                        <h2 className="text-2xl font-bold text-secondary-600 mb-4">
                            2. Definições Importantes
                        </h2>
                        <ul className="list-disc pl-6 space-y-2 text-neutral-700">
                            <li><strong>Dados Pessoais:</strong> Informação relacionada a pessoa natural identificada ou identificável.</li>
                            <li><strong>Titular:</strong> Pessoa natural a quem se referem os dados pessoais.</li>
                            <li><strong>Controlador:</strong> GestorAuto, responsável pelas decisões sobre o tratamento de dados.</li>
                            <li><strong>Operador:</strong> Quem realiza o tratamento de dados em nome do controlador.</li>
                            <li><strong>Tratamento:</strong> Toda operação realizada com dados pessoais (coleta, armazenamento, uso, etc.).</li>
                        </ul>
                    </section>

                    {/* 3. Dados Coletados */}
                    <section>
                        <h2 className="text-2xl font-bold text-secondary-600 mb-4">
                            3. Dados Pessoais Coletados
                        </h2>

                        <h3 className="text-xl font-semibold text-secondary-600 mb-3">
                            3.1 Dados de Cadastro (Empresas)
                        </h3>
                        <ul className="list-disc pl-6 space-y-2 text-neutral-700 mb-4">
                            <li>Nome completo</li>
                            <li>E-mail</li>
                            <li>Telefone</li>
                            <li>Nome da empresa</li>
                            <li>Endereço da empresa</li>
                        </ul>

                        <h3 className="text-xl font-semibold text-secondary-600 mb-3">
                            3.2 Dados de Clientes Finais
                        </h3>
                        <ul className="list-disc pl-6 space-y-2 text-neutral-700 mb-4">
                            <li>Nome completo</li>
                            <li>E-mail (opcional)</li>
                            <li>Telefone</li>
                            <li>CPF (opcional)</li>
                            <li>Data de nascimento (opcional)</li>
                            <li>Endereço (opcional)</li>
                            <li>Informações de veículos (marca, modelo, placa, ano, cor)</li>
                        </ul>

                        <h3 className="text-xl font-semibold text-secondary-600 mb-3">
                            3.3 Dados de Uso
                        </h3>
                        <ul className="list-disc pl-6 space-y-2 text-neutral-700 mb-4">
                            <li>Endereço IP</li>
                            <li>Tipo de navegador</li>
                            <li>Páginas visitadas</li>
                            <li>Data e hora de acesso</li>
                            <li>Cookies e tecnologias similares</li>
                        </ul>

                        <h3 className="text-xl font-semibold text-secondary-600 mb-3">
                            3.4 Dados de Comunicação
                        </h3>
                        <ul className="list-disc pl-6 space-y-2 text-neutral-700">
                            <li>Histórico de mensagens WhatsApp (apenas registro de envio, não conteúdo)</li>
                            <li>Preferências de comunicação</li>
                            <li>Consentimentos fornecidos</li>
                        </ul>
                    </section>

                    {/* 4. Finalidades */}
                    <section>
                        <h2 className="text-2xl font-bold text-secondary-600 mb-4">
                            4. Finalidades do Tratamento
                        </h2>
                        <p className="text-neutral-700 leading-relaxed mb-4">
                            Utilizamos seus dados pessoais para as seguintes finalidades:
                        </p>

                        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
                            <h4 className="font-semibold text-blue-900 mb-2">Execução de Contrato</h4>
                            <ul className="list-disc pl-6 space-y-1 text-blue-800">
                                <li>Fornecer acesso à plataforma GestorAuto</li>
                                <li>Gerenciar agendamentos e ordens de serviço</li>
                                <li>Processar pagamentos e emitir cobranças</li>
                                <li>Manter histórico de serviços prestados</li>
                            </ul>
                        </div>

                        <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-4">
                            <h4 className="font-semibold text-green-900 mb-2">Consentimento</h4>
                            <ul className="list-disc pl-6 space-y-1 text-green-800">
                                <li>Enviar notificações via WhatsApp sobre agendamentos</li>
                                <li>Enviar lembretes de serviços</li>
                                <li>Comunicações de marketing (quando autorizado)</li>
                            </ul>
                        </div>

                        <div className="bg-purple-50 border-l-4 border-purple-500 p-4 mb-4">
                            <h4 className="font-semibold text-purple-900 mb-2">Legítimo Interesse</h4>
                            <ul className="list-disc pl-6 space-y-1 text-purple-800">
                                <li>Melhorar a experiência do usuário</li>
                                <li>Prevenir fraudes e garantir segurança</li>
                                <li>Realizar análises estatísticas</li>
                            </ul>
                        </div>

                        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4">
                            <h4 className="font-semibold text-yellow-900 mb-2">Obrigação Legal</h4>
                            <ul className="list-disc pl-6 space-y-1 text-yellow-800">
                                <li>Cumprir obrigações fiscais e contábeis</li>
                                <li>Atender requisições de autoridades</li>
                                <li>Manter registros por prazo legal</li>
                            </ul>
                        </div>
                    </section>

                    {/* 5. Compartilhamento */}
                    <section>
                        <h2 className="text-2xl font-bold text-secondary-600 mb-4">
                            5. Compartilhamento de Dados
                        </h2>
                        <p className="text-neutral-700 leading-relaxed mb-4">
                            Seus dados podem ser compartilhados com:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-neutral-700">
                            <li>
                                <strong>Provedores de Infraestrutura em Nuvem:</strong> Utilizamos serviços de hospedagem
                                e banco de dados em nuvem para armazenamento e processamento de dados. Os servidores
                                podem estar localizados fora do Brasil, com garantias contratuais de proteção de dados.
                            </li>
                            <li>
                                <strong>WhatsApp (Meta):</strong> Apenas para envio de mensagens quando você autorizar.
                                Não compartilhamos dados além do necessário para o envio.
                            </li>
                            <li>
                                <strong>Processadores de Pagamento:</strong> Para processar transações financeiras.
                            </li>
                            <li>
                                <strong>Autoridades Legais:</strong> Quando exigido por lei ou ordem judicial.
                            </li>
                        </ul>
                        <p className="text-neutral-700 leading-relaxed mt-4">
                            <strong>Importante:</strong> Não vendemos, alugamos ou comercializamos seus dados pessoais
                            com terceiros para fins de marketing.
                        </p>
                    </section>

                    {/* 6. Segurança */}
                    <section>
                        <h2 className="text-2xl font-bold text-secondary-600 mb-4">
                            6. Segurança dos Dados
                        </h2>
                        <p className="text-neutral-700 leading-relaxed mb-4">
                            Implementamos medidas técnicas e organizacionais para proteger seus dados:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-neutral-700">
                            <li><strong>Criptografia:</strong> Dados em trânsito protegidos por HTTPS/TLS</li>
                            <li><strong>Controle de Acesso:</strong> Row Level Security (RLS) no banco de dados</li>
                            <li><strong>Autenticação:</strong> Senhas criptografadas e autenticação segura</li>
                            <li><strong>Isolamento:</strong> Dados de cada empresa completamente isolados</li>
                            <li><strong>Backups:</strong> Backups regulares e seguros</li>
                            <li><strong>Monitoramento:</strong> Logs de auditoria e detecção de anomalias</li>
                        </ul>
                    </section>

                    {/* 7. Retenção */}
                    <section>
                        <h2 className="text-2xl font-bold text-secondary-600 mb-4">
                            7. Prazo de Retenção
                        </h2>
                        <table className="min-w-full border border-neutral-300">
                            <thead className="bg-neutral-100">
                                <tr>
                                    <th className="border border-neutral-300 px-4 py-2 text-left">Tipo de Dado</th>
                                    <th className="border border-neutral-300 px-4 py-2 text-left">Prazo</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td className="border border-neutral-300 px-4 py-2">Dados cadastrais</td>
                                    <td className="border border-neutral-300 px-4 py-2">Enquanto cliente ativo</td>
                                </tr>
                                <tr>
                                    <td className="border border-neutral-300 px-4 py-2">Histórico de serviços</td>
                                    <td className="border border-neutral-300 px-4 py-2">5 anos</td>
                                </tr>
                                <tr>
                                    <td className="border border-neutral-300 px-4 py-2">Dados financeiros</td>
                                    <td className="border border-neutral-300 px-4 py-2">5 anos (obrigação fiscal)</td>
                                </tr>
                                <tr>
                                    <td className="border border-neutral-300 px-4 py-2">Logs de sistema</td>
                                    <td className="border border-neutral-300 px-4 py-2">1 ano</td>
                                </tr>
                                <tr>
                                    <td className="border border-neutral-300 px-4 py-2">Logs WhatsApp</td>
                                    <td className="border border-neutral-300 px-4 py-2">6 meses</td>
                                </tr>
                            </tbody>
                        </table>
                        <p className="text-neutral-700 leading-relaxed mt-4">
                            Após o término do prazo de retenção, os dados serão excluídos ou anonimizados,
                            salvo se houver obrigação legal de manutenção.
                        </p>
                    </section>

                    {/* 8. Direitos do Titular */}
                    <section>
                        <h2 className="text-2xl font-bold text-secondary-600 mb-4">
                            8. Seus Direitos (Art. 18 LGPD)
                        </h2>
                        <p className="text-neutral-700 leading-relaxed mb-4">
                            Você tem os seguintes direitos em relação aos seus dados pessoais:
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-neutral-50 p-4 rounded-lg">
                                <h4 className="font-semibold text-secondary-600 mb-2">✓ Confirmação e Acesso</h4>
                                <p className="text-sm text-neutral-600">
                                    Confirmar se tratamos seus dados e acessá-los
                                </p>
                            </div>
                            <div className="bg-neutral-50 p-4 rounded-lg">
                                <h4 className="font-semibold text-secondary-600 mb-2">✓ Correção</h4>
                                <p className="text-sm text-neutral-600">
                                    Corrigir dados incompletos, inexatos ou desatualizados
                                </p>
                            </div>
                            <div className="bg-neutral-50 p-4 rounded-lg">
                                <h4 className="font-semibold text-secondary-600 mb-2">✓ Anonimização ou Bloqueio</h4>
                                <p className="text-sm text-neutral-600">
                                    Solicitar anonimização ou bloqueio de dados desnecessários
                                </p>
                            </div>
                            <div className="bg-neutral-50 p-4 rounded-lg">
                                <h4 className="font-semibold text-secondary-600 mb-2">✓ Eliminação</h4>
                                <p className="text-sm text-neutral-600">
                                    Excluir dados tratados com seu consentimento
                                </p>
                            </div>
                            <div className="bg-neutral-50 p-4 rounded-lg">
                                <h4 className="font-semibold text-secondary-600 mb-2">✓ Portabilidade</h4>
                                <p className="text-sm text-neutral-600">
                                    Receber seus dados em formato estruturado
                                </p>
                            </div>
                            <div className="bg-neutral-50 p-4 rounded-lg">
                                <h4 className="font-semibold text-secondary-600 mb-2">✓ Revogação</h4>
                                <p className="text-sm text-neutral-600">
                                    Revogar consentimento a qualquer momento
                                </p>
                            </div>
                        </div>
                        <p className="text-neutral-700 leading-relaxed mt-4">
                            Para exercer seus direitos, entre em contato através dos canais
                            indicados na seção 10.
                        </p>
                    </section>

                    {/* 9. Cookies */}
                    <section>
                        <h2 className="text-2xl font-bold text-secondary-600 mb-4">
                            9. Cookies e Tecnologias Similares
                        </h2>
                        <p className="text-neutral-700 leading-relaxed mb-4">
                            Utilizamos cookies para melhorar sua experiência. Para mais informações, consulte
                            nossa <Link to="/cookie-policy" className="text-primary-600 hover:underline">
                                Política de Cookies
                            </Link>.
                        </p>
                    </section>

                    {/* 10. Contato para Privacidade */}
                    <section>
                        <h2 className="text-2xl font-bold text-secondary-600 mb-4">
                            10. Canal de Comunicação - Privacidade
                        </h2>
                        <div className="bg-primary-50 border-l-4 border-primary-600 p-6 rounded-r-lg">
                            <p className="text-neutral-700 mb-4">
                                Para questões relacionadas à privacidade e proteção de dados pessoais,
                                entre em contato através do nosso canal oficial:
                            </p>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <Mail className="w-5 h-5 text-primary-600" />
                                    <a href="mailto:privacidade@gestorauto.com.br" className="text-primary-600 hover:underline">
                                        privacidade@gestorauto.com.br
                                    </a>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Mail className="w-5 h-5 text-primary-600" />
                                    <span className="text-neutral-700">Ou através do e-mail de suporte:</span>
                                    <a href="mailto:suporte@gestorauto.com.br" className="text-primary-600 hover:underline">
                                        suporte@gestorauto.com.br
                                    </a>
                                </div>
                            </div>
                            <p className="text-sm text-neutral-600 mt-4">
                                <strong>Prazo de resposta:</strong> Até 15 dias úteis conforme Art. 18, §3º da LGPD
                            </p>
                        </div>
                    </section>

                    {/* 11. Alterações */}
                    <section>
                        <h2 className="text-2xl font-bold text-secondary-600 mb-4">
                            11. Alterações nesta Política
                        </h2>
                        <p className="text-neutral-700 leading-relaxed">
                            Podemos atualizar esta Política de Privacidade periodicamente. Notificaremos sobre
                            mudanças significativas através de e-mail ou aviso na plataforma. A data da última
                            atualização estará sempre indicada no topo deste documento.
                        </p>
                    </section>

                    {/* 12. Lei Aplicável */}
                    <section>
                        <h2 className="text-2xl font-bold text-secondary-600 mb-4">
                            12. Lei Aplicável e Foro
                        </h2>
                        <p className="text-neutral-700 leading-relaxed">
                            Esta Política de Privacidade é regida pelas leis brasileiras, especialmente pela
                            Lei Geral de Proteção de Dados (Lei 13.709/2018). Quaisquer disputas serão resolvidas
                            no foro da comarca de [Cidade/Estado].
                        </p>
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
                                to="/terms-of-service"
                                className="text-neutral-600 hover:text-neutral-900"
                            >
                                Termos de Uso
                            </Link>
                            <Link
                                to="/cookie-policy"
                                className="text-neutral-600 hover:text-neutral-900"
                            >
                                Política de Cookies
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
