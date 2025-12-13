# Visão Geral do Negócio - GestorAuto

## Descrição Principal

**GestorAuto** é uma plataforma SaaS multi-tenant completa e profissional, desenvolvida especificamente para empresas de estética automotiva. Combinando tecnologia de ponta com automação inteligente, a plataforma oferece um ecossistema integrado que gerencia todos os aspectos operacionais do negócio: do agendamento à conclusão do serviço, da gestão financeira ao relacionamento com o cliente, do controle de estoque à automação de marketing via WhatsApp.

Construída como Progressive Web App (PWA) com arquitetura mobile-first, a plataforma proporciona uma experiência nativa em qualquer dispositivo, funcionando offline e com atualizações automáticas a cada 5 minutos.

## Diferenciais Competitivos

### 🤖 **Automação Inteligente**
- **CRM Preditivo** com sistema de recorrência de serviços que agenda automaticamente lembretes baseados no histórico
- **Notificações de Aniversário** personalizadas com templates WhatsApp customizáveis
- **WhatsApp Anti-Ban** com fila inteligente, rotação de templates (3 variantes por mensagem) e rate limiting
- **Dedução automática de estoque** ao concluir ordens de serviço
- **Criação automática de transações financeiras** vinculadas a ordens
- **Health Monitor para WhatsApp** que previne bloqueios com score de risco em tempo real

### 👤 **Engajamento do Cliente**
- **Portal do Cliente (Elite)** com gamificação (badges VIP e Cliente Fiel), histórico visual de serviços e galerias antes/depois
- **Rastreador Público de Serviços** com timeline interativa e compartilhamento em redes sociais
- **Agendamento Online 24/7** com URL personalizada, calendário de disponibilidade e auto-aprovação configurável
- **Sistema de Fotos Profissional** com compressão WebP automática, slider antes/depois e galeria full-screen

### 📺 **Experiência no Estabelecimento**
- **TV Dashboard** para recepção com visualização em tempo real de agendamentos pendentes e agenda do dia
- **Notificações sonoras** para novos bookings online
- **Checklist digital de entrada** do veículo com documentação de combustível, km, avarias e itens pessoais

### 💰 **Gestão Financeira Completa**
- Dashboard financeiro com KPIs em tempo real (receitas, despesas, saldo, vencimentos)
- Gráficos de tendência de receita (6 meses)
- Alertas visuais para contas vencidas
- Categorização inteligente de transações
- Relatórios avançados por categoria

### 📦 **Controle de Estoque Avançado**
- Movimentações rastreadas (entrada, saída, ajuste) com auditoria completa
- Alertas automáticos de estoque baixo (debounced 1x/hora)
- Suporte a unidades decimais (ml, L, kg)
- Dedução automática ao concluir serviços
- Histórico completo de movimentações

### 💬 **Ecossistema WhatsApp**
8 tipos de mensagens automatizadas:
- Confirmação de agendamento
- Lembretes (24h e 2h antes)
- Conclusão de serviço (com link do tracker)
- Cancelamento
- Boas-vindas
- Aniversário
- Retorno para serviços recorrentes

Integração com Evolution API + workflows N8N para automação completa.

## Modelo de Negócio

### 📊 **Planos Escaláveis**

**Starter** (R$ 49,90/mês)
- 1 usuário, 50 clientes
- CRM completo + Agendamentos + Ordens de Serviço ilimitadas
- Ideal para profissionais autônomos

**Profissional** (R$ 89,90/mês)
- 3 usuários, 300 clientes
- Tudo do Starter + Financeiro + Recorrência de Serviços + WhatsApp (manual)
- Para pequenas empresas em crescimento

**Elite** (R$ 149,90/mês)
- Usuários e clientes ilimitados
- Tudo do Profissional + TV Dashboard + Portal do Cliente + Automação WhatsApp + Rastreador Público + Agendamento Online + Aniversários
- Para empresas estabelecidas que buscam excelência

**Trial**: 7 dias gratuitos em todos os planos

## Arquitetura e Tecnologia

### 🔒 **Segurança Enterprise**
- **Multi-tenancy** com isolamento completo de dados por empresa
- **Row Level Security (RLS)** em todas as 27+ tabelas PostgreSQL
- Políticas de acesso granulares
- Soft deletes para auditoria

### ⚡ **Performance e Escalabilidade**
- **Real-time** via Supabase Realtime (subscriptions em appointments, stock, notifications)
- Polling fallback para garantir consistência
- Cache em memória para verificações (custo zero DB)
- Debouncing estratégico (notificações, alertas)
- Compressão de imagens automática (WebP, 80% qualidade, max 1600px)

### 📱 **Progressive Web App (PWA)**
- Instalação nativa (Android, iOS, Desktop)
- Modo offline com Service Worker
- Auto-update a cada 5 minutos
- 62 releases rastreados com changelog
- Network-first strategy

### 🗄️ **Database-Driven Automation**
Triggers automáticos para:
- Criação de perfil ao signup
- Atualização de estoque em movimentações
- Agendamento de lembretes ao concluir OS
- Timestamps automáticos (created_at, updated_at)
- Criação de transações financeiras

### 🎨 **UX/UI de Excelência**
- **Mobile-first** responsivo
- Tailwind CSS + Lucide Icons
- Framer Motion (animações)
- Double-tap interactions (mobile)
- Keyboard navigation
- Skeleton screens
- Toast notifications (React Hot Toast)

## Fluxo de Valor

### Para o Negócio
1. **Redução de No-Shows**: Lembretes automáticos 24h e 2h antes via WhatsApp
2. **Aumento de Receita Recorrente**: Sistema preditivo agenda retornos automaticamente
3. **Profissionalização**: Rastreador público e Portal do Cliente elevam a percepção de valor
4. **Eficiência Operacional**: Automação reduz trabalho manual em até 70%
5. **Controle Financeiro**: Visibilidade total de receitas, despesas e fluxo de caixa
6. **Gestão de Estoque**: Elimina rupturas e desperdícios

### Para o Cliente Final
1. **Transparência Total**: Acompanha o serviço em tempo real via tracker
2. **Conveniência**: Agendamento online 24/7 sem ligações
3. **Experiência Premium**: Portal exclusivo com histórico e fotos
4. **Gamificação**: Badges e reconhecimento de fidelidade
5. **Comunicação Proativa**: Recebe lembretes e confirmações automáticas
6. **Surpresa e Encantamento**: Mensagens de aniversário personalizadas

## Métricas do Sistema

- **150+ funcionalidades** implementadas
- **24 categorias** de features
- **27+ tabelas** no banco de dados
- **8 tipos** de mensagens WhatsApp automatizadas
- **3 variações** de template por mensagem (anti-ban)
- **5 funções RPC** customizadas
- **4 canais** de notificação (in-app, push, WhatsApp, visual)
- **62 releases** versionados desde o início

## Roadmap de Crescimento

O GestorAuto é uma plataforma em constante evolução, com releases frequentes que adicionam valor continuamente. A versão atual (1.0.6 - "Portal do Cliente Elite") foi lançada em 12/12/2025 e introduziu o Portal do Cliente com gamificação completa.

## Casos de Uso Principais

### 1. **Estética Automotiva Tradicional**
Polimento, cristalização, vitrificação, higienização interna

### 2. **Detailing Premium**
Serviços de alto valor com foco em resultado visual

### 3. **Proteção Veicular**
PPF, vitrificação cerâmica, blindagem

### 4. **Higienização Especializada**
Ozônio, vapor, descontaminação

### 5. **Multi-Serviços**
Combinação de estética + pequenos reparos

## Público-Alvo

### Primário
- Proprietários de centros de estética automotiva (1-10 funcionários)
- Detailers autônomos buscando profissionalização
- Franquias de estética automotiva

### Secundário
- Lava-jatos premium que desejam expandir serviços
- Concessionárias com departamento de estética
- Oficinas que oferecem serviços de detailing

## Proposta de Valor

**"Transforme seu negócio de estética automotiva em uma operação profissional, automatizada e escalável - sem complicação, sem curva de aprendizado, sem custos ocultos."**

GestorAuto não é apenas um software de gestão, é um **sistema operacional completo** para negócios de estética automotiva que desejam:
- ✅ Automatizar tarefas repetitivas
- ✅ Encantar clientes com experiência premium
- ✅ Aumentar receita recorrente
- ✅ Profissionalizar a operação
- ✅ Escalar sem perder controle
- ✅ Tomar decisões baseadas em dados

---

**Versão do Documento:** 1.0
**Data:** 13 de Dezembro de 2025
**Versão da Plataforma:** 1.0.6 - "Portal do Cliente Elite"
