# Lista de Funcionalidades - GestorAuto

## Autenticação & Segurança
- Cadastro de usuários
- Login com email e senha
- Recuperação de senha
- Multi-tenancy (isolamento por empresa)
- Row Level Security (RLS)
- Controle de acesso por função (Owner, Admin, Manager, User)
- Perfis de usuário
- Gerenciamento de usuários ativos/inativos

## Assinaturas & Planos
- Plano Starter (R$ 49,90/mês)
- Plano Profissional (R$ 89,90/mês)
- Plano Elite (R$ 149,90/mês)
- Trial gratuito de 7 dias
- Restrição de features por plano
- Upgrade/downgrade de planos
- Notificações de expiração

## CRM - Clientes
- Cadastro de clientes
- Gestão de dados (nome, email, telefone, CPF, endereço)
- Data de nascimento
- Tipo (Pessoa Física/Jurídica)
- Status VIP
- Busca e filtros
- Histórico de serviços
- Soft delete
- Indicador de aniversário

## Veículos
- Cadastro vinculado a clientes
- Marca, modelo, ano, cor, placa
- Galeria de fotos
- Notas
- Histórico de serviços

## Agendamentos
- Calendário visual
- Criar/editar/cancelar agendamentos
- Status (pending, scheduled, confirmed, in_progress, completed, cancelled)
- Atribuição de técnico
- Vinculação com serviços
- Detecção de conflitos
- Notificações 30 min antes
- Real-time updates

## Agendamento Online (Elite)
- Portal público (/book/:company_slug)
- URL personalizada
- Seleção de serviços
- Escolha de data e hora
- Calendário de disponibilidade
- Formulário de informações
- Auto-aprovação configurável
- Configuração de horários de trabalho
- Datas bloqueadas
- Buffer entre agendamentos

## Ordens de Serviço
- Numeração automática sequencial
- Status (draft, in_progress, completed, cancelled)
- Checklist de entrada do veículo
- Seleção múltipla de serviços
- Seleção múltipla de produtos
- Cálculo de subtotal e desconto
- Método de pagamento
- Atribuição de técnico
- Notas internas e para cliente
- Timeline de status
- Dedução automática de estoque
- Criação automática de transação financeira

## Sistema de Fotos
- Upload múltiplo (drag & drop)
- Categorias (antes, depois, avarias)
- Compressão automática WebP
- Galeria interativa
- Visualizador full-screen
- Slider antes/depois
- Navegação por teclado
- Armazenamento ilimitado

## Catálogo de Serviços
- Cadastro de serviços
- Preço e duração
- Categoria
- Intervalo de recorrência
- Status ativo/inativo

## Sistema de Recorrência (Profissional & Elite)
- Criação automática de lembretes
- Baseado no histórico de serviços
- Cálculo de data de retorno
- Status de lembretes
- Widget no dashboard
- Envio via WhatsApp

## Produtos & Estoque
- Cadastro de produtos
- SKU, categoria, unidade
- Preço de custo e venda
- Estoque mínimo
- Movimentações (entrada, saída, ajuste)
- Alertas de estoque baixo
- Histórico de movimentações
- Auditoria completa

## Gestão Financeira (Profissional & Elite)
- Dashboard financeiro
- KPIs em tempo real
- Contas a receber
- Contas a pagar
- Categorização de transações
- Gráfico de receita (6 meses)
- Alertas de vencimento
- Relatórios por período

## Integração WhatsApp (Profissional & Elite)
- Click-to-send integrado
- 8 tipos de mensagens
- Templates personalizáveis
- Rotação de mensagens (anti-spam)
- Confirmação de agendamento
- Lembretes (24h e 2h antes)
- Conclusão de serviço
- Cancelamento
- Boas-vindas
- Aniversário
- Retorno para serviços recorrentes
- Health Monitor (Elite)

## Notificações de Aniversário (Elite)
- Configuração de antecedência (0-7 dias)
- Templates WhatsApp personalizáveis
- Verificação diária automática
- Controle de envios
- Indicador visual nos clientes

## Notificações
- Central de notificações in-app
- Notificações push do navegador
- Alertas de estoque baixo
- Lembretes de agendamento
- Avisos de trial
- Novos agendamentos online
- Contas vencidas
- Real-time via Supabase

## TV Dashboard (Elite)
- Modo tela cheia
- Relógio em tempo real
- Agendamentos pendentes
- Agenda do dia
- Notificações sonoras
- Auto-refresh
- Real-time updates

## Rastreador Público (Elite)
- URL pública por ordem de serviço
- Timeline de status
- Lista de serviços realizados
- Galeria antes/depois
- Compartilhamento em redes sociais
- Branding da empresa
- Otimizado para impressão

## Portal do Cliente (Elite)
- Login com código temporário
- Histórico de serviços
- Galerias de fotos
- Badges de gamificação (VIP, Cliente Fiel)
- Botão WhatsApp
- CTA para agendamento
- Branding personalizado

## PWA (Progressive Web App)
- Instalação em Android, iOS, Desktop
- Modo offline
- Auto-update a cada 5 minutos
- Service Worker
- Notificações push
- Ícone e splash screen
- Atualizações transparentes

## Dashboard & Analytics
- KPIs principais
- Total de clientes
- Ordens em progresso
- Receita mensal
- Pagamentos pendentes
- Produtos em estoque baixo
- Gráfico de receita
- Próximos agendamentos
- Lembretes de serviço
- Ações rápidas
- Alertas inteligentes

## Configurações da Empresa
- Dados da empresa
- Upload de logo
- Slug personalizado
- Configurações de notificações
- Configurações de agendamento online
- Horários de trabalho
- Datas bloqueadas

## Páginas Legais
- Política de Privacidade
- Termos de Serviço
- Política de Cookies

## Landing Page
- Hero section
- Showcase de funcionalidades
- Tabela de preços
- Depoimentos
- Preview do dashboard
- Footer profissional
- SEO otimizado

## Recursos Técnicos
- Multi-tenancy
- Row Level Security (RLS)
- Real-time updates (Supabase)
- Responsivo (mobile-first)
- TypeScript completo
- Soft deletes
- Auditoria de dados
- Triggers automáticos
- Cache inteligente
- Compressão de imagens

## Utilitários
- Máscaras de input (telefone, CPF, placa)
- Formatação de moeda
- Formatação de datas
- Busca e filtros
- Componentes reutilizáveis
- Confirmações de ações
- Toasts de feedback
- Loading states
- Navegação por teclado

## Integrações
- Supabase (Auth, Database, Storage, Realtime)
- WhatsApp (Evolution API)
- Notificações Push (Service Worker)

---

**Total:** 150+ funcionalidades
**Versão:** 1.0.6 - "Portal do Cliente Elite"
**Data:** 13 de Dezembro de 2025
