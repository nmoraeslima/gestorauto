# 🚗 GestorAuto - Sistema de Gestão para Estética Automotiva

Sistema completo de gestão multi-tenant para empresas de estética automotiva, construído com React, TypeScript, Tailwind CSS e Supabase.

## 🎯 Características Principais

- ✅ **Multi-tenancy** com isolamento total de dados por empresa
- ✅ **Autenticação** completa com Supabase Auth
- ✅ **Trial gratuito** de 7 dias automático
- ✅ **PWA (Progressive Web App)** instalável em Android e iOS
- ✅ **Dashboard** com KPIs, gráficos financeiros e agendamentos
- ✅ **Gestão Completa** (CRM, Veículos, Estoque, Financeiro, O.S.)
- ✅ **Design responsivo** (mobile-first) com interface premium

## 📋 Pré-requisitos

- Node.js 18+ instalado
- Conta no Supabase (gratuita)
- Git (opcional)

## 🚀 Instalação

### 1. Configurar o Banco de Dados no Supabase

1. Acesse [supabase.com](https://supabase.com) e crie uma conta
2. Crie um novo projeto
3. Vá em **SQL Editor** no menu lateral
4. Copie todo o conteúdo do arquivo `database/schema.sql`
5. Cole no editor e clique em **Run**

### 2. Configurar Variáveis de Ambiente

1. Copie o arquivo `.env.example` para `.env`:
   ```bash
   copy .env.example .env
   ```

2. No Supabase, vá em **Settings** > **API**
3. Copie a **Project URL** e a **anon/public key**
4. Cole no arquivo `.env`:
   ```env
   VITE_SUPABASE_URL=https://seu-projeto.supabase.co
   VITE_SUPABASE_ANON_KEY=sua-chave-aqui
   ```

### 3. Instalar Dependências

```bash
npm install
```

### 4. Executar o Projeto

```bash
npm run dev
```

O aplicativo estará disponível em `http://localhost:3000`

## 📱 Funcionalidades Implementadas

### 📊 Dashboard
- **KPIs em Tempo Real**: Total de clientes, O.S. em andamento, receita mensal, pagamentos pendentes.
- **Gráficos Financeiros**: Visualização de receita dos últimos 6 meses.
- **Próximos Agendamentos**: Lista rápida dos compromissos mais próximos.
- **Alertas Inteligentes**: Notificações de estoque baixo e expiração de trial.

### 👥 CRM & Veículos
- **Gestão de Clientes**: Cadastro completo com histórico e contatos.
- **Gestão de Veículos**: Associação de veículos a clientes.
- **Otimização Mobile**: Lista de clientes otimizada para telas pequenas.

### 🛠️ Operacional
- **Ordens de Serviço (O.S.)**: Criação e acompanhamento de serviços.
- **Agendamentos**: Calendário e lista de compromissos.
- **Catálogo**: Gestão de Produtos (com controle de estoque) e Serviços.
- **Baixa Automática**: Produtos são deduzidos do estoque ao completar uma O.S.

### 💰 Financeiro
- **Dashboard Financeiro**: Visão geral de receitas, despesas e saldo.
- **Contas a Receber**: Gestão de receitas pendentes e pagas.
- **Contas a Pagar**: Controle de despesas e vencimentos.
- **Transações**: Criação, edição e baixa de transações financeiras.

### 🔔 Notificações & PWA
- **Central de Notificações**: Avisos sobre estoque, financeiro e sistema.
- **Instalação PWA**:
  - **Android/Desktop**: Banner de instalação nativo.
  - **iOS**: Instruções personalizadas para adicionar à tela de início.
- **Persistência**: Notificações salvas no banco de dados.

## 🏗️ Estrutura do Projeto

```
gestorauto/
├── database/           # Schema SQL e migrações
├── src/
│   ├── components/     # Componentes UI reutilizáveis
│   ├── contexts/       # Contextos React (Auth, Notification)
│   ├── lib/            # Configurações (Supabase, Utils)
│   ├── pages/          # Páginas da aplicação
│   │   ├── auth/       # Login, Cadastro
│   │   ├── catalog/    # Produtos, Serviços
│   │   ├── crm/        # Clientes, Veículos
│   │   ├── financial/  # Dashboard Financeiro, Receitas, Despesas
│   │   └── ...
│   ├── services/       # Lógica de negócios (NotificationService)
│   └── types/          # Definições de tipos TypeScript
└── public/             # Assets estáticos e Manifest PWA
```

## 🔐 Segurança e Multi-tenancy

O sistema utiliza **Row Level Security (RLS)** do PostgreSQL para garantir isolamento total dos dados. Cada requisição é automaticamente filtrada pelo `company_id` do usuário autenticado, impedindo acesso a dados de outras empresas.

## 🛠️ Tecnologias

- **Frontend**: React 18, TypeScript, Vite
- **Estilização**: Tailwind CSS, Lucide React (Ícones)
- **Backend**: Supabase (Auth, Database, Realtime)
- **Utilitários**: Date-fns, Recharts, React Hot Toast

## 📝 Scripts

```bash
npm run dev      # Ambiente de desenvolvimento
npm run build    # Build para produção
npm run preview  # Visualizar build localmente
npm run lint     # Verificação de código
```

---

**Desenvolvido com foco em performance e experiência do usuário.**
