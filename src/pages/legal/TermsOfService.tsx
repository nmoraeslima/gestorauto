import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, AlertTriangle } from 'lucide-react';

export default function TermsOfService() {
    return (
        <div className="min-h-screen bg-neutral-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
                {/* Header */}
                <div className="border-b border-neutral-200 pb-6 mb-8">
                    <div className="flex items-center gap-3 mb-4">
                        <FileText className="w-8 h-8 text-primary-600" />
                        <h1 className="text-3xl font-bold text-secondary-600">
                            Termos de Uso
                        </h1>
                    </div>
                    <p className="text-neutral-600">
                        Última atualização: 05 de dezembro de 2025
                    </p>
                </div>

                {/* Content */}
                <div className="prose prose-neutral max-w-none space-y-8">
                    {/* 1. Aceitação */}
                    <section>
                        <h2 className="text-2xl font-bold text-secondary-600 mb-4">
                            1. Aceitação dos Termos
                        </h2>
                        <p className="text-neutral-700 leading-relaxed">
                            Bem-vindo ao <strong>GestorAuto</strong>! Estes Termos de Uso ("Termos") regem o acesso
                            e uso da plataforma GestorAuto, um software como serviço (SaaS) para gestão de estéticas
                            automotivas.
                        </p>
                        <p className="text-neutral-700 leading-relaxed mt-4">
                            Ao criar uma conta ou utilizar nossa plataforma, você concorda em cumprir estes Termos.
                            Se você não concorda com alguma parte destes Termos, não deve utilizar nossos serviços.
                        </p>
                    </section>

                    {/* 2. Definições */}
                    <section>
                        <h2 className="text-2xl font-bold text-secondary-600 mb-4">
                            2. Definições
                        </h2>
                        <ul className="list-disc pl-6 space-y-2 text-neutral-700">
                            <li><strong>"Plataforma":</strong> O software GestorAuto e todos os seus recursos.</li>
                            <li><strong>"Usuário":</strong> Pessoa física que acessa a plataforma em nome de uma empresa.</li>
                            <li><strong>"Empresa":</strong> Pessoa jurídica que contrata os serviços.</li>
                            <li><strong>"Cliente Final":</strong> Cliente da empresa que utiliza nossos serviços.</li>
                            <li><strong>"Conteúdo":</strong> Dados, informações e materiais inseridos na plataforma.</li>
                        </ul>
                    </section>

                    {/* 3. Serviços */}
                    <section>
                        <h2 className="text-2xl font-bold text-secondary-600 mb-4">
                            3. Descrição dos Serviços
                        </h2>
                        <p className="text-neutral-700 leading-relaxed mb-4">
                            O GestorAuto oferece uma plataforma de gestão para estéticas automotivas, incluindo:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-neutral-700">
                            <li>Gestão de clientes e veículos (CRM)</li>
                            <li>Agendamento de serviços</li>
                            <li>Ordens de serviço</li>
                            <li>Controle de estoque</li>
                            <li>Gestão financeira (recebíveis e pagáveis)</li>
                            <li>Notificações via WhatsApp</li>
                            <li>Relatórios e dashboards</li>
                        </ul>
                    </section>

                    {/* 4. Cadastro e Conta */}
                    <section>
                        <h2 className="text-2xl font-bold text-secondary-600 mb-4">
                            4. Cadastro e Conta de Usuário
                        </h2>

                        <h3 className="text-xl font-semibold text-secondary-600 mb-3">
                            4.1 Elegibilidade
                        </h3>
                        <p className="text-neutral-700 leading-relaxed mb-4">
                            Para utilizar a plataforma, você deve:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-neutral-700 mb-4">
                            <li>Ter pelo menos 18 anos de idade</li>
                            <li>Representar uma empresa legalmente constituída</li>
                            <li>Fornecer informações verdadeiras e atualizadas</li>
                        </ul>

                        <h3 className="text-xl font-semibold text-secondary-600 mb-3">
                            4.2 Responsabilidade pela Conta
                        </h3>
                        <p className="text-neutral-700 leading-relaxed mb-4">
                            Você é responsável por:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-neutral-700">
                            <li>Manter a confidencialidade de suas credenciais de acesso</li>
                            <li>Todas as atividades realizadas em sua conta</li>
                            <li>Notificar-nos imediatamente sobre qualquer uso não autorizado</li>
                        </ul>
                    </section>

                    {/* 5. Planos e Pagamento */}
                    <section>
                        <h2 className="text-2xl font-bold text-secondary-600 mb-4">
                            5. Planos e Pagamento
                        </h2>

                        <h3 className="text-xl font-semibold text-secondary-600 mb-3">
                            5.1 Período de Trial
                        </h3>
                        <p className="text-neutral-700 leading-relaxed mb-4">
                            Oferecemos um período de teste gratuito de <strong>7 dias</strong>. Durante este período,
                            você tem acesso completo à plataforma sem custos.
                        </p>

                        <h3 className="text-xl font-semibold text-secondary-600 mb-3">
                            5.2 Planos Pagos
                        </h3>
                        <p className="text-neutral-700 leading-relaxed mb-4">
                            Após o período de trial, você deve escolher um plano pago para continuar usando a plataforma:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-neutral-700 mb-4">
                            <li><strong>Básico:</strong> Recursos essenciais para pequenas operações</li>
                            <li><strong>Intermediário:</strong> Recursos avançados para empresas em crescimento</li>
                            <li><strong>Premium:</strong> Todos os recursos e suporte prioritário</li>
                        </ul>

                        <h3 className="text-xl font-semibold text-secondary-600 mb-3">
                            5.3 Faturamento
                        </h3>
                        <ul className="list-disc pl-6 space-y-2 text-neutral-700 mb-4">
                            <li>Cobrança mensal ou anual, conforme plano escolhido</li>
                            <li>Pagamento via cartão de crédito ou boleto bancário</li>
                            <li>Renovação automática, salvo cancelamento prévio</li>
                            <li>Sem reembolso proporcional em caso de cancelamento</li>
                        </ul>

                        <h3 className="text-xl font-semibold text-secondary-600 mb-3">
                            5.4 Atraso no Pagamento
                        </h3>
                        <p className="text-neutral-700 leading-relaxed">
                            Em caso de atraso no pagamento, sua conta será suspensa até a regularização.
                            Após 30 dias de suspensão, reservamo-nos o direito de excluir permanentemente seus dados.
                        </p>
                    </section>

                    {/* 6. Uso Aceitável */}
                    <section>
                        <h2 className="text-2xl font-bold text-secondary-600 mb-4">
                            6. Uso Aceitável
                        </h2>

                        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="w-5 h-5 text-red-600 mt-1" />
                                <div>
                                    <h4 className="font-semibold text-red-900 mb-2">Você NÃO PODE:</h4>
                                    <ul className="list-disc pl-6 space-y-1 text-red-800">
                                        <li>Utilizar a plataforma para atividades ilegais</li>
                                        <li>Violar direitos de propriedade intelectual</li>
                                        <li>Tentar acessar dados de outras empresas</li>
                                        <li>Realizar engenharia reversa do software</li>
                                        <li>Sobrecarregar ou interferir com a plataforma</li>
                                        <li>Revender ou sublicenciar o acesso</li>
                                        <li>Enviar spam ou conteúdo malicioso</li>
                                        <li>Usar bots ou automações não autorizadas</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* 7. Propriedade Intelectual */}
                    <section>
                        <h2 className="text-2xl font-bold text-secondary-600 mb-4">
                            7. Propriedade Intelectual
                        </h2>

                        <h3 className="text-xl font-semibold text-secondary-600 mb-3">
                            7.1 Propriedade da Plataforma
                        </h3>
                        <p className="text-neutral-700 leading-relaxed mb-4">
                            Todos os direitos de propriedade intelectual sobre a plataforma GestorAuto, incluindo
                            código-fonte, design, marca e conteúdo, pertencem exclusivamente a nós ou nossos
                            licenciadores.
                        </p>

                        <h3 className="text-xl font-semibold text-secondary-600 mb-3">
                            7.2 Licença de Uso
                        </h3>
                        <p className="text-neutral-700 leading-relaxed mb-4">
                            Concedemos a você uma licença limitada, não exclusiva, intransferível e revogável para
                            usar a plataforma conforme estes Termos.
                        </p>

                        <h3 className="text-xl font-semibold text-secondary-600 mb-3">
                            7.3 Seus Dados
                        </h3>
                        <p className="text-neutral-700 leading-relaxed">
                            Você mantém todos os direitos sobre os dados que insere na plataforma. Concede-nos apenas
                            uma licença para processar esses dados conforme necessário para fornecer os serviços.
                        </p>
                    </section>

                    {/* 8. Privacidade */}
                    <section>
                        <h2 className="text-2xl font-bold text-secondary-600 mb-4">
                            8. Privacidade e Proteção de Dados
                        </h2>
                        <p className="text-neutral-700 leading-relaxed">
                            O tratamento de dados pessoais é regido por nossa{' '}
                            <Link to="/privacy-policy" className="text-primary-600 hover:underline">
                                Política de Privacidade
                            </Link>, que faz parte integrante destes Termos.
                        </p>
                    </section>

                    {/* 9. Disponibilidade */}
                    <section>
                        <h2 className="text-2xl font-bold text-secondary-600 mb-4">
                            9. Disponibilidade e Manutenção
                        </h2>
                        <p className="text-neutral-700 leading-relaxed mb-4">
                            Nos esforçamos para manter a plataforma disponível 24/7, mas não garantimos disponibilidade
                            ininterrupta. Podemos realizar manutenções programadas, que serão comunicadas com antecedência.
                        </p>
                        <p className="text-neutral-700 leading-relaxed">
                            <strong>SLA (Service Level Agreement):</strong> Meta de 99% de uptime mensal, excluindo
                            manutenções programadas.
                        </p>
                    </section>

                    {/* 10. Limitação de Responsabilidade */}
                    <section>
                        <h2 className="text-2xl font-bold text-secondary-600 mb-4">
                            10. Limitação de Responsabilidade
                        </h2>
                        <p className="text-neutral-700 leading-relaxed mb-4">
                            A plataforma é fornecida "como está" e "conforme disponível". Não garantimos que:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-neutral-700 mb-4">
                            <li>A plataforma será livre de erros ou interrupções</li>
                            <li>Defeitos serão corrigidos imediatamente</li>
                            <li>A plataforma atenderá todas as suas necessidades específicas</li>
                        </ul>
                        <p className="text-neutral-700 leading-relaxed">
                            <strong>Não seremos responsáveis por:</strong> Danos indiretos, lucros cessantes, perda
                            de dados ou oportunidades de negócio, exceto nos casos de dolo ou culpa grave.
                        </p>
                    </section>

                    {/* 11. Indenização */}
                    <section>
                        <h2 className="text-2xl font-bold text-secondary-600 mb-4">
                            11. Indenização
                        </h2>
                        <p className="text-neutral-700 leading-relaxed">
                            Você concorda em indenizar e isentar o GestorAuto de quaisquer reclamações, perdas ou
                            danos decorrentes de:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-neutral-700">
                            <li>Violação destes Termos</li>
                            <li>Uso indevido da plataforma</li>
                            <li>Violação de direitos de terceiros</li>
                            <li>Conteúdo que você inserir na plataforma</li>
                        </ul>
                    </section>

                    {/* 12. Cancelamento */}
                    <section>
                        <h2 className="text-2xl font-bold text-secondary-600 mb-4">
                            12. Cancelamento e Rescisão
                        </h2>

                        <h3 className="text-xl font-semibold text-secondary-600 mb-3">
                            12.1 Cancelamento pelo Usuário
                        </h3>
                        <p className="text-neutral-700 leading-relaxed mb-4">
                            Você pode cancelar sua assinatura a qualquer momento através das configurações da conta.
                            O cancelamento terá efeito ao final do período de faturamento atual.
                        </p>

                        <h3 className="text-xl font-semibold text-secondary-600 mb-3">
                            12.2 Rescisão por Nossa Parte
                        </h3>
                        <p className="text-neutral-700 leading-relaxed mb-4">
                            Podemos suspender ou encerrar sua conta imediatamente em caso de:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-neutral-700 mb-4">
                            <li>Violação destes Termos</li>
                            <li>Atividades fraudulentas ou ilegais</li>
                            <li>Inadimplência por mais de 30 dias</li>
                        </ul>

                        <h3 className="text-xl font-semibold text-secondary-600 mb-3">
                            12.3 Efeitos do Cancelamento
                        </h3>
                        <p className="text-neutral-700 leading-relaxed">
                            Após o cancelamento, você terá 30 dias para exportar seus dados. Após esse prazo,
                            seus dados poderão ser permanentemente excluídos.
                        </p>
                    </section>

                    {/* 13. Modificações */}
                    <section>
                        <h2 className="text-2xl font-bold text-secondary-600 mb-4">
                            13. Modificações nos Termos
                        </h2>
                        <p className="text-neutral-700 leading-relaxed">
                            Reservamo-nos o direito de modificar estes Termos a qualquer momento. Mudanças
                            significativas serão notificadas com 30 dias de antecedência. O uso continuado da
                            plataforma após as mudanças constitui aceitação dos novos termos.
                        </p>
                    </section>

                    {/* 14. Lei Aplicável */}
                    <section>
                        <h2 className="text-2xl font-bold text-secondary-600 mb-4">
                            14. Lei Aplicável e Foro
                        </h2>
                        <p className="text-neutral-700 leading-relaxed">
                            Estes Termos são regidos pelas leis brasileiras. Quaisquer disputas serão resolvidas
                            no foro da comarca de [Cidade/Estado], com renúncia expressa a qualquer outro, por
                            mais privilegiado que seja.
                        </p>
                    </section>

                    {/* 15. Contato */}
                    <section>
                        <h2 className="text-2xl font-bold text-secondary-600 mb-4">
                            15. Contato
                        </h2>
                        <p className="text-neutral-700 leading-relaxed mb-4">
                            Para dúvidas sobre estes Termos, entre em contato:
                        </p>
                        <ul className="list-none space-y-2 text-neutral-700">
                            <li><strong>E-mail:</strong> suporte@gestorauto.com.br</li>
                            <li><strong>Telefone:</strong> +55 (XX) XXXX-XXXX</li>
                            <li><strong>Endereço:</strong> [Endereço da Empresa]</li>
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
