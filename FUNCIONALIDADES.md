# GestorAuto - Lista Completa de Funcionalidades

## 🔐 AUTENTICAÇÃO & AUTORIZAÇÃO
- Cadastro de usuários com criação de empresa
- Login com email e senha
- Recuperação de senha (forgot password)
- Multi-tenancy (isolamento completo de dados por empresa)
- Row Level Security (RLS) no PostgreSQL
- Sistema de roles (Owner, Admin, Manager, User)
- Perfis de usuário (nome, email, telefone, avatar)
- Status ativo/inativo de usuários
- Múltiplos usuários por empresa (conforme plano)
- Controle de acesso baseado em funções (RBAC)

## 💎 ASSINATURAS & PLANOS
- Plano Starter (R$ 49,90/mês) - 1 usuário, 50 clientes
- Plano Profissional (R$ 89,90/mês) - 3 usuários, 300 clientes
- Plano Elite (R$ 149,90/mês) - Usuários e clientes ilimitados
- Trial gratuito de 7 dias
- Controle de status de assinatura (ativo, trial, expirado, cancelado)
- Restrição de features por plano (feature gating)
- Sistema de upgrade/downgrade de planos
- Sistema de renovação de assinatura
- Notificações de expiração de trial
- Componente FeatureGate com preview blur para features premium
- Página de comparação de planos
- Limite de usuários por plano
- Limite de clientes por plano

## 👥 CRM - GESTÃO DE CLIENTES
- Cadastro completo de clientes (nome, email, telefone, CPF)
- Data de nascimento (formato MM-DD)
- Endereço e notas
- Tipo de cliente (Pessoa Física/Jurídica)
- Status VIP
- Status ativo/inativo
- Soft delete de clientes
- Busca e filtros avançados
- Histórico completo de serviços por cliente
- View em cards com double-tap (mobile)
- Telefone click-to-call
- Botão WhatsApp rápido
- Ordenação alfabética
- Componentes searchable select
- Filtragem em tempo real
- Indicador visual de aniversário (🎂)
- Animação especial para aniversários de hoje
- Contador de dias até o aniversário
- Destaque na lista CRM para aniversariantes

## 🚗 GESTÃO DE VEÍCULOS
- Cadastro vinculado a clientes
- Marca, modelo, ano, cor
- Placa (única)
- Array de fotos do veículo
- Notas
- Histórico de serviços por veículo
- Galeria de fotos

## 🎂 NOTIFICAÇÕES DE ANIVERSÁRIO (Elite)
- Toggle ativar/desativar
- Lead time configurável (0-7 dias de antecedência)
- Template WhatsApp personalizável
- Variáveis dinâmicas ({customer_name}, {company_name})
- Preview em tempo real da mensagem
- Formato armazenado MM-DD (mês-dia)
- Wrap automático de ano (31/12 → 01/01)
- Verificação diária de aniversários próximos
- Cálculo automático de idade
- Tabela de controle de envios (birthday_notifications_sent)
- Prevenção de duplicatas por ano
- Rastreamento de canal (WhatsApp)
- Registro de data e timestamp de envio
- Botão WhatsApp com mensagem pré-preenchida

## 📅 SISTEMA DE AGENDAMENTOS
- Interface de calendário visual
- Título e descrição
- Data e hora agendada
- Duração configurável (minutos)
- Status: pending, scheduled, confirmed, in_progress, completed, cancelled
- Atribuição de técnico/usuário
- Vinculação com múltiplos serviços (many-to-many)
- Associação com cliente e veículo
- Rastreamento de cancelamentos (motivo, cancelado por, data)
- Date picker
- Time slots
- Detecção de conflitos de horário
- Badges coloridos por status
- Modal de confirmação
- Modal de cancelamento com campo de motivo
- Mensagens WhatsApp auto-geradas
- Botões click-to-send para WhatsApp
- Notificações 30 minutos antes do agendamento
- Verificação a cada 60 segundos (cache em memória)
- Real-time updates via Supabase Realtime

## 🌐 AGENDAMENTO PÚBLICO ONLINE (Elite)
- Portal de agendamento público (/book/:company_slug)
- URL personalizada por empresa
- Fluxo multi-step (serviço → data/hora → dados → confirmação)
- Seleção de serviços disponíveis
- Date picker com disponibilidade
- Time picker com slots disponíveis
- Formulário de informações do cliente
- Confirmação de agendamento
- Toggle ativar/desativar sistema online
- Auto-aprovação ou revisão manual
- Antecedência mínima configurável (horas)
- Antecedência máxima configurável (dias)
- Duração do slot (15, 30, 60 min)
- Buffer entre agendamentos (minutos)
- Horário de trabalho por dia da semana
- Ativar/desativar cada dia da semana
- Horário de início e fim por dia
- Array de datas bloqueadas
- Configuração de timezone
- Função RPC get_available_slots()
- Criação automática de cliente (source=booking)
- Criação opcional de veículo
- Telefone obrigatório
- Email opcional
- Políticas RLS para acesso público
- Componentes: ServiceSelector, DateTimePicker, CustomerForm, BookingConfirmation

## 🔧 ORDENS DE SERVIÇO (OS)
- Numeração sequencial automática por empresa
- Status: draft, in_progress, completed, cancelled
- Vinculação com cliente e veículo
- Checklist digital de entrada (JSONB):
  - Nível de combustível
  - Quilometragem/odômetro
  - Documentação de arranhões
  - Inventário de itens pessoais
  - Notas de entrada
- Seleção múltipla de serviços
- Seleção múltipla de produtos
- Controle de quantidade
- Snapshot de preços (preserva preço no momento da ordem)
- Cálculo de subtotal
- Desconto (porcentagem ou fixo)
- Cálculo de total
- Método de pagamento
- Status de pagamento
- Atribuição de técnico/usuário
- Notas internas
- Notas para o cliente
- Data de entrada
- Data de previsão de conclusão
- Timestamp de início
- Timestamp de conclusão
- Timeline de status
- Ações automáticas ao concluir:
  - Dedução de estoque
  - Criação de transação financeira
  - Agendamento de lembrete de serviço (se recorrente)
- Opção de notificação WhatsApp ao concluir
- Histórico completo por ordem

## 📸 SISTEMA DE FOTOS
- 3 categorias: before, after, damage
- Upload múltiplo (drag & drop)
- Compressão automática para WebP
- Dimensões máximas: 1600x1600px
- Qualidade: 80%
- Mantém aspect ratio
- Geração de thumbnails (200px)
- Validação de tipos (JPEG, PNG, WebP, HEIC)
- Tamanho máximo: 10MB
- Suavização de imagem de alta qualidade
- Armazenamento no Supabase Storage
- Estrutura de pastas: {company_id}/{work_order_id}/{category}/{filename}
- Tabela de metadata (work_order_photos)
- Galeria em grid por categoria
- Visualizador full-screen
- Navegação por teclado (setas, ESC)
- Contador de fotos (ex: "3/10")
- Filtro por categoria
- Gerenciamento de ordem de exibição
- Click para ampliar
- Suporte a swipe (mobile)
- Função deletar
- Componente BeforeAfterSlider (comparação interativa)
- PhotoManager, PhotoGallery, PhotoViewer, PhotoUploadZone
- Limpeza automática após 5 meses (cleanup_old_work_order_photos)

## 📋 CATÁLOGO DE SERVIÇOS
- Nome, descrição, categoria
- Preço
- Duração flexível (minutos, horas ou dias)
- Intervalo de recorrência (dias)
- Status ativo/inativo
- Busca e filtros

## 🔄 SISTEMA DE RECORRÊNCIA DE SERVIÇOS (Profissional & Elite)
- Campo recurrence_interval configurável por serviço
- Suporta qualquer intervalo (30, 60, 90, 180 dias, etc.)
- Trigger automático ao concluir ordem de serviço
- Função DB: schedule_service_reminder()
- Cálculo: data_conclusão + intervalo_recorrência
- Tabela service_reminders
- Status: pending, sent, cancelled, completed
- Vínculo com cliente, veículo, serviço, ordem
- Data de vencimento calculada automaticamente
- Widget no dashboard (lembretes em 3 dias)
- Botão WhatsApp rápido
- Dispensar/cancelar lembrete
- Mensagens auto-geradas com info do cliente/veículo
- Preview desfocado para plano Starter

## 📦 ESTOQUE & PRODUTOS
- Catálogo de produtos (nome, descrição, SKU, categoria)
- Controle de quantidade (suporta decimais)
- Unidade de medida (un, ml, L, kg, etc.)
- Estoque mínimo (threshold de alerta)
- Preço de custo
- Preço de venda
- Status ativo/inativo
- Busca e filtros
- Filtro por status (todos, baixo estoque, ok)

## 📊 MOVIMENTAÇÕES DE ESTOQUE
- 3 tipos: entry (entrada), exit (saída), adjustment (ajuste)
- Atualização automática via trigger do banco
- Campo motivo obrigatório
- Rastreamento do usuário criador
- Timestamp de todas operações
- Histórico completo de auditoria
- StockMovementModal (registrar movimentações)
- StockHistoryModal (ver histórico)
- Dedução automática ao concluir ordem de serviço
- Validação de disponibilidade
- Registro com referência à ordem

## ⚠️ ALERTAS DE ESTOQUE
- Notificação automática quando quantidade < mínimo
- Monitoramento real-time via Realtime subscription
- Debounced (máx 1x/hora por produto)
- Widget no dashboard com contagem
- Notificações in-app

## 💰 GESTÃO FINANCEIRA (Profissional & Elite)
- Dashboard financeiro com KPIs em tempo real
- Total de receitas (pagas)
- Total de despesas (pagas)
- Saldo atual (receitas - despesas)
- Receitas pendentes
- Despesas pendentes
- Contador de vencidas a receber
- Contador de vencidas a pagar
- Últimas 10 transações
- Banner vermelho para contas vencidas
- Indicadores visuais de vencimento

## 💵 CONTAS A RECEBER
- Descrição, valor, categoria
- Data de vencimento
- Status: pending, paid, cancelled
- Data de pagamento
- Vinculação com cliente
- Vinculação com ordem de serviço
- Filtro por status, data, cliente
- Marcar como pago/não pago
- Editar transações
- Excluir transações
- Destaque vermelho para vencidas
- Cálculo automático de totais

## 💸 CONTAS A PAGAR
- Descrição, valor, categoria
- Data de vencimento
- Status: pending, paid, cancelled
- Data de pagamento
- Rastreamento de fornecedores
- Categorização de despesas
- Filtro por status e data
- Marcar como pago/não pago
- Editar e excluir

## 📈 GRÁFICOS E RELATÓRIOS
- Gráfico de receita mensal (últimos 6 meses)
- Area chart com Recharts
- Comparação receita vs despesa
- Breakdown por categoria
- Crescimento mensal
- Restrição: Profissional/Elite

## 💬 INTEGRAÇÃO WHATSAPP (Profissional & Elite)

### Tipos de Mensagens (8 tipos)
- Confirmação de agendamento (3 variações)
- Lembrete 24h antes (3 variações)
- Lembrete 2h antes (3 variações)
- Serviço concluído (3 variações com link tracker)
- Cancelamento (com campo de motivo)
- Mensagem de boas-vindas
- Mensagem de aniversário (template personalizável)
- Lembrete de serviço recorrente

### Sistema Anti-Ban
- Fila de mensagens inteligente
- Limite diário configurável
- Horário comercial (8h-20h)
- Delays aleatórios entre mensagens
- Rotação de templates (3 variantes por tipo)
- Rate limiting por cliente
- Agendamento inteligente
- Proteção contra spam

### WhatsApp Health Monitor (Elite)
- Dashboard de monitoramento em tempo real
- Tamanho da fila
- Contagem diária de mensagens
- Taxa de sucesso/falha
- Cálculo de score de risco
- Sistema de alertas para problemas
- Histórico de 7 dias
- Estatísticas agregadas

### Log de Mensagens
- Tabela whatsapp_message_log
- Nome do cliente
- Telefone
- Tipo de mensagem
- Preview do conteúdo
- Timestamp
- Usuário que enviou
- View whatsapp_message_stats (estatísticas diárias)

### Workflows N8N (Elite)
- Workflow de confirmação de agendamento
- Workflow de lembretes de agendamento
- Workflow de ordem de serviço concluída

### Evolution API
- Gerenciamento de instância WhatsApp
- Conexão via QR Code
- Monitoramento de saúde da conexão
- Status da instância

### Recursos WhatsApp
- Templates com variáveis dinâmicas
- Click-to-send (manual no Profissional)
- Automação completa (Elite)
- Botões rápidos de WhatsApp
- Mensagens pré-preenchidas
- Integração com todos os módulos

## 🔔 SISTEMA DE NOTIFICAÇÕES

### Notificações In-App
- Central de notificações com badge de não lidas
- 4 tipos: info, warning, success, error
- Real-time via Supabase Realtime
- Marcar como lida
- Marcar todas como lidas
- Links de navegação (click to go)
- Limite de 50 notificações recentes
- Sistema anti-spam (deduplica em 24h)
- Armazenamento persistente (tabela app_notifications)
- Timestamp
- Notificações contextuais

### Notificações Push do Navegador
- Service Worker integrado
- Solicitação de permissão
- Vibração (padrão: 200ms, 100ms, 200ms)
- Ícone e badge personalizados
- Fallback para API padrão

### Gatilhos Automáticos
- Alertas de estoque baixo (debounced 1h)
- Lembretes de agendamento (30 min antes)
- Avisos de expiração de trial (3 dias antes)
- Notificação de novo agendamento online
- Notificações de contas vencidas
- Alertas de sistema

### Notificações WhatsApp
- Todas as 8 tipos de mensagens
- Sistema de fila
- Anti-ban protection
- Rastreamento de envios

## 📺 TV DASHBOARD (Elite)
- Modo tela cheia para recepção
- Relógio em tempo real (atualiza a cada segundo)
- Painel de agendamentos pendentes
- Agenda do dia (cronológica)
- Status e badges coloridos
- Nome e telefone do cliente
- Info do veículo
- Serviços solicitados
- Ordenação
- Real-time updates via Supabase
- Polling fallback (30 segundos)
- Auto-refresh em mudanças
- Notificação sonora em novos agendamentos (opcional)
- Tema escuro otimizado para TV
- Fontes grandes para legibilidade
- Auto-scroll para listas longas
- Toggle de som
- Rota: /tv-dashboard

## 🔍 RASTREADOR PÚBLICO DE SERVIÇOS (Elite)
- URL pública: /tracker/:work_order_id
- Função RPC: get_public_work_order()
- Restrito ao plano Elite
- Mensagem de acesso negado para outros planos
- Logo e branding da empresa
- Nome do cliente
- Detalhes do veículo (marca, modelo, placa)
- Número da ordem
- Timeline de status (criado, em progresso, concluído)
- Lista de serviços realizados
- Valor total
- Datas de entrada e conclusão
- Galeria de fotos antes/depois
- Slider de comparação interativo
- Visualizador full-screen
- Navegação swipe/setas
- Filtro de fotos (exclui damage)
- Componente Timeline visual
- Botão de compartilhamento (Web Share API)
- Fallback copiar link
- View otimizada para impressão
- Meta tags Open Graph
- Otimizado para mobile

## 👤 PORTAL DO CLIENTE (Elite)
- URL: /portal/login e /portal/dashboard
- Sistema de código temporário (15 min)
- Sessão de 2 horas
- Função RPC: generate_portal_code()
- Função RPC: validate_portal_code()
- Login baseado em telefone
- Geração de código seguro

### Dashboard do Portal
- Logo e branding da empresa
- Cores personalizadas
- Histórico completo de serviços
- Todas as ordens concluídas
- Detalhes dos serviços
- Datas de realização
- Galerias de fotos antes/depois

### Galeria do Portal
- Visualizador full-screen
- Navegação por teclado
- Suporte a swipe
- Contador de fotos
- Exclui categoria damage

### Gamificação
- Badge "Cliente VIP"
- Badge "Cliente Fiel" (3+ serviços)
- Sistema de conquistas
- Estatísticas de serviços
- Total gasto (opcional)

### CTAs do Portal
- Botão "Agendar Novo Serviço"
- Botão flutuante WhatsApp
- Alertas de re-engajamento "Hora de Renovar!"
- Foco na transformação visual
- Oculta preços (marketing focus)
- Design profissional

## 📱 PWA (PROGRESSIVE WEB APP)

### Instalação
- Prompt de instalação para navegadores suportados
- Instruções customizadas para iOS Safari
- Install no Android Chrome
- PWA Desktop support
- Add to Home Screen
- Banner de instalação nativo

### Recursos PWA
- Service Worker com caching
- Página offline fallback
- Cache de assets
- Modo standalone
- Splash screen customizado
- Ícone do app
- Theme color
- Display mode otimizado
- Estratégia Network-First

### Sistema de Auto-Atualização
- Verificação a cada 5 minutos
- Notificação visual na central
- Atualização com um clique
- Reload automático após update
- Toast de sucesso
- Rastreamento de versão
- Contexto PWAContext
- Hooks: usePWA, usePWAInstall

### Gerenciamento de Versões
- Arquivo version.json
- 62 releases rastreados
- Sistema de release notes
- Visualizador de changelog (/settings/releases)
- Semantic versioning
- Botão de update no header
- Modal de atualização
- "O que há de novo"

## 📊 DASHBOARD & ANALYTICS

### KPIs Principais
- Total de clientes
- Ordens de serviço em progresso
- Receita mensal (últimos 30 dias)
- Pagamentos pendentes
- Produtos em estoque baixo
- Atualização em tempo real

### Widgets do Dashboard
- Gráfico de tendência de receita (6 meses)
- Próximos 5 agendamentos
- Widget de lembretes de serviço
- Ações rápidas
- Alertas inteligentes
- Status da loja
- Transações recentes

### Alertas do Dashboard
- Alertas de estoque
- Avisos de trial
- Pagamentos vencidos
- Notificações contextuais

## ⚙️ CONFIGURAÇÕES DA EMPRESA
- Nome da empresa (com auto-slug)
- Email, telefone, endereço
- Upload de logo
- Gerenciamento de slug (URL-friendly)
- Configurações de notificações de aniversário
- Configurações de agendamento público
- Todas as configurações de booking
- Histórico de releases
- Notas de lançamento
- Notificações de atualização

## 🗄️ ARQUITETURA DO BANCO DE DADOS

### Multi-Tenancy
- Isolamento completo por empresa
- Row Level Security (RLS) em todas as tabelas
- Políticas de acesso por empresa
- Soft deletes (deleted_at)

### Triggers Automáticos
- Criação de perfil ao signup
- Atualização de estoque em movimentações
- Criação de lembretes ao concluir ordem
- Herança de serviços em agendamentos
- Timestamps automáticos (updated_at)
- Criação de transação financeira ao concluir OS

### Tabelas (27+)
- companies
- profiles
- customers
- vehicles
- services
- products
- appointments
- appointment_services
- work_orders
- work_order_services
- work_order_products
- work_order_photos
- financial_transactions
- app_notifications
- stock_movements
- service_reminders
- whatsapp_message_log
- whatsapp_message_stats (view)
- birthday_notification_settings
- birthday_notifications_sent

### Funções RPC
- get_available_slots(company_id, date, service_duration)
- get_public_work_order(work_order_id)
- generate_portal_code(phone)
- validate_portal_code(phone, code)
- cleanup_old_work_order_photos()

### Recursos do Banco
- Índices otimizados
- Cascading deletes
- Referential integrity
- Trilhas de auditoria
- Timestamps (created_at, updated_at)
- Políticas de acesso público (para booking e tracker)

## 🎨 UI/UX & COMPONENTES

### Design System
- Tailwind CSS (utility-first)
- Lucide Icons
- Framer Motion (animações)
- React Hot Toast (notificações)
- Skeleton screens (loading states)

### Componentes Customizados
- Modais
- Dropdowns
- Date pickers
- File uploads (drag & drop)
- Searchable selects
- Confirm dialogs
- PhotoGallery
- PhotoViewer
- BeforeAfterSlider
- PhotoUploadZone
- Timeline
- FeatureGate

### Experiência do Usuário
- Busca e filtros em toda aplicação
- Ações rápidas contextuais
- Navegação por teclado
- Otimização mobile (touch-friendly)
- Double-tap mobile UI
- Swipe support
- Click-to-call
- Click-to-send WhatsApp
- Responsive design (mobile-first)
- Loading states
- Error handling
- Success feedback

## 🛠️ UTILITÁRIOS

### Formatação e Cálculos
- datetime.ts (formatação de datas)
- duration.ts (cálculos de duração)
- format.ts (formatação de moeda, datas)
- calculations.ts (cálculos financeiros)

### Máscaras de Input
- Telefone
- CPF
- CEP
- Placa de veículo
- Moeda
- Data

### Processamento
- imageProcessing.ts (compressão, redimensionamento, WebP)
- Validação de arquivos
- Geração de thumbnails

### Componentes Utilitários
- FileUpload (drag & drop, multi-file, progress)
- SearchableSelect (dropdowns com busca)
- ConfirmDialog (confirmações)
- ShopStatusWidget (status overview)
- QuickActions (atalhos rápidos)

## 🌟 LANDING PAGE & MARKETING
- Hero section com proposta de valor
- Showcase de funcionalidades com ícones
- Seção de benefícios
- Tabela de preços comparativa (3 planos)
- Depoimentos (social proof)
- Preview de dispositivos
- Showcase responsivo
- Screenshots do dashboard
- Seção de segurança
- Mensagem mobile-first
- CTA footer
- Footer profissional
- SEO otimizado
- Robots.txt
- Sitemap.xml
- Landing header
- Landing footer

## ⚖️ PÁGINAS LEGAIS
- Política de Privacidade (/privacy-policy)
- Termos de Serviço (/terms-of-service)
- Política de Cookies (/cookie-policy)

## 🔧 RECURSOS TÉCNICOS

### Integração Supabase
- Supabase Auth (autenticação)
- Supabase Database (PostgreSQL)
- Supabase Storage (arquivos)
- Supabase Realtime (subscriptions)

### Integração Externa
- Evolution API (WhatsApp)
- N8N (workflows e automação)

### Real-time Features
- Subscriptions em appointments
- Subscriptions em products (estoque)
- Subscriptions em notifications
- Polling fallback
- Cache em memória

### Storage & Files
- Bucket work-order-photos
- Bucket company-logos
- URLs públicas seguras
- Políticas de bucket
- Cleanup automático

### Performance
- Debouncing (estoque, notificações)
- Lazy loading
- Image compression
- Thumbnail generation
- Caching estratégico
- Network-first strategy

## 📋 RECURSOS DE BUSCA E FILTRO
- Busca de clientes
- Busca de veículos
- Busca de serviços
- Busca de produtos
- Filtro por status
- Filtro por data
- Filtro por categoria
- Filtro por cliente
- Ordenação alfabética
- Ordenação por data
- Paginação

## 🎯 AÇÕES RÁPIDAS E ATALHOS
- Quick actions no dashboard
- Botões contextuais
- Keyboard shortcuts
- Navegação por teclado em galerias
- Atalhos de navegação
- Double-tap (mobile)

## 📱 RECURSOS MOBILE
- Design mobile-first
- Touch-friendly UI
- Swipe gestures
- Double-tap interactions
- Responsive breakpoints
- Mobile navigation
- Bottom sheets
- Pull to refresh (em alguns contextos)

## 🔒 SEGURANÇA
- Row Level Security (RLS)
- Multi-tenancy isolation
- Secure RPC functions
- Input validation
- SQL injection protection
- XSS protection
- CSRF protection
- Secure file upload
- Auth token management
- Session management
- Password recovery
- Temporary codes (portal)
- Code expiration (15 min)
- Session expiration (2h)

## 📊 MÉTRICAS E RASTREAMENTO
- 62 releases rastreados
- Version tracking
- Release notes
- Changelog
- Message logging (WhatsApp)
- Stock movement history
- Birthday notification tracking
- Service reminder tracking
- Financial transaction history
- Appointment history
- Work order timeline

---

## 📈 RESUMO QUANTITATIVO

- **150+ funcionalidades** específicas
- **24+ categorias** de features
- **27+ tabelas** no banco de dados
- **62 releases** versionados
- **8 tipos** de mensagens WhatsApp
- **3 planos** de assinatura
- **4 roles** de usuários
- **6 status** de agendamento
- **4 status** de ordem de serviço
- **3 categorias** de fotos
- **5 funções RPC** customizadas
- **4 canais** de notificação
- **3 variações** de template por mensagem (anti-ban)

---

**Versão Atual:** 1.0.6 - "Portal do Cliente Elite"
**Última Atualização:** 12 de Dezembro de 2025
**Total de Features:** 150+
