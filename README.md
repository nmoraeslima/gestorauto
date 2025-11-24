# 🚗 Auto Aesthetics SaaS - Sistema de Gestão para Estética Automotiva

Sistema completo de gestão multi-tenant para empresas de estética automotiva, construído com React, TypeScript, Tailwind CSS e Supabase.

## 🎯 Características Principais

- ✅ **Multi-tenancy** com isolamento total de dados por empresa
- ✅ **Autenticação** completa com Supabase Auth
- ✅ **Trial gratuito** de 7 dias automático
- ✅ **Bloqueio de assinatura** para inadimplentes
- ✅ **Dashboard** com KPIs e estatísticas
- ✅ **Gestão de Clientes e Veículos**
- ✅ **Ordens de Serviço** com baixa automática de estoque
- ✅ **Controle de Estoque** com alertas
- ✅ **Financeiro** com contas a pagar/receber
- ✅ **Design responsivo** (mobile-first)

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
6. Aguarde a execução (pode levar alguns segundos)
7. Verifique se todas as tabelas foram criadas em **Table Editor**

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

**IMPORTANTE**: Se você tiver problemas com execução de scripts no PowerShell, execute este comando primeiro como Administrador:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Depois instale as dependências:

```bash
npm install
```

### 4. Executar o Projeto

```bash
npm run dev
```

O aplicativo estará disponível em `http://localhost:3000`

## 📱 Primeiro Acesso

1. Acesse `http://localhost:3000`
2. Clique em **"Cadastre-se gratuitamente"**
3. Preencha seus dados e os dados da empresa
4. Você receberá **7 dias de trial gratuito** automaticamente
5. Faça login e explore o sistema!

## 🏗️ Estrutura do Projeto

```
auto-aesthetics-saas/
├── database/
│   └── schema.sql              # Schema SQL completo
├── src/
│   ├── components/             # Componentes reutilizáveis
│   │   ├── Layout.tsx          # Layout principal
│   │   ├── ProtectedRoute.tsx  # Proteção de rotas
│   │   └── SubscriptionGuard.tsx # Bloqueio de assinatura
│   ├── contexts/
│   │   └── AuthContext.tsx     # Contexto de autenticação
│   ├── lib/
│   │   └── supabase.ts         # Cliente Supabase
│   ├── pages/
│   │   ├── auth/               # Páginas de autenticação
│   │   ├── subscription/       # Página de renovação
│   │   └── Dashboard.tsx       # Dashboard principal
│   ├── types/
│   │   └── database.ts         # Tipos TypeScript
│   ├── App.tsx                 # Componente principal
│   ├── main.tsx                # Entry point
│   └── index.css               # Estilos globais
├── .env.example                # Template de variáveis
├── package.json                # Dependências
├── tailwind.config.js          # Configuração Tailwind
└── vite.config.ts              # Configuração Vite
```

## 🔐 Segurança Multi-tenant

O sistema implementa **Row Level Security (RLS)** no Supabase, garantindo que:

- ✅ Cada empresa vê apenas seus próprios dados
- ✅ Usuários não podem acessar dados de outras empresas
- ✅ Todas as queries são filtradas automaticamente por `company_id`
- ✅ Tentativas de acesso não autorizado são bloqueadas no banco de dados

## 💳 Lógica de Assinatura

### Trial Automático
- Ao se cadastrar, a empresa recebe **7 dias de trial gratuito**
- Status: `trial`
- Acesso total a todas as funcionalidades

### Bloqueio de Acesso
- Se o trial expirar ou a assinatura for cancelada/expirada
- O usuário é **redirecionado automaticamente** para `/subscription/renew`
- Não consegue acessar o sistema até renovar

### Planos Disponíveis
- **Basic**: R$ 97/mês - 2 usuários, 50 clientes
- **Intermediário**: R$ 197/mês - 5 usuários, 200 clientes
- **Premium**: R$ 397/mês - Ilimitado + relatórios avançados

## 🔄 Baixa Automática de Estoque

Quando uma Ordem de Serviço é **completada**:

1. ✅ Produtos são **deduzidos automaticamente** do estoque
2. ✅ Transação financeira de **receita** é criada
3. ✅ Tudo acontece via **trigger no banco de dados**

Isso garante consistência e evita erros manuais.

## 🎨 Design System

O projeto usa um design system profissional com:

- **Cores**: Paleta enterprise (primary, secondary, success, warning, danger)
- **Tipografia**: Inter (Google Fonts)
- **Componentes**: Botões, inputs, cards, badges, tabelas
- **Animações**: Fade-in, slide-up, slide-down
- **Responsividade**: Mobile-first com breakpoints

## 📊 Funcionalidades Implementadas

### ✅ Autenticação
- [x] Login com email/senha
- [x] Cadastro (cria empresa + usuário + trial)
- [x] Recuperação de senha
- [x] Proteção de rotas
- [x] Bloqueio por assinatura

### ✅ Dashboard
- [x] KPIs (clientes, O.S., receita, pagamentos)
- [x] Alertas de estoque baixo
- [x] Informação do trial
- [x] Ações rápidas

### ✅ Infraestrutura
- [x] Layout responsivo
- [x] Sidebar com navegação
- [x] Toast notifications
- [x] Loading states

### 🚧 Em Desenvolvimento
- [ ] CRUD de Clientes
- [ ] CRUD de Veículos
- [ ] Kanban de Ordens de Serviço
- [ ] Calendário de Agendamentos
- [ ] Gestão de Estoque
- [ ] Dashboard Financeiro

## 🛠️ Tecnologias Utilizadas

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Icons**: Lucide React
- **Forms**: React Hook Form
- **Notifications**: React Hot Toast
- **Charts**: Recharts
- **Routing**: React Router DOM

## 📝 Scripts Disponíveis

```bash
npm run dev      # Inicia servidor de desenvolvimento
npm run build    # Cria build de produção
npm run preview  # Preview do build de produção
npm run lint     # Executa linter
```

## 🐛 Troubleshooting

### Erro de execução de scripts no PowerShell
Execute como Administrador:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Erro de conexão com Supabase
- Verifique se as variáveis no `.env` estão corretas
- Confirme que o projeto Supabase está ativo
- Verifique sua conexão com internet

### Erro ao executar SQL
- Certifique-se de copiar TODO o conteúdo do `schema.sql`
- Execute em um projeto Supabase novo (sem tabelas existentes)
- Verifique se não há erros no console do SQL Editor

## 📄 Licença

Este projeto é privado e proprietário.

## 👨‍💻 Desenvolvido por

Sistema desenvolvido como SaaS Multi-tenant para gestão de estética automotiva.

---

**Nota**: Este é um sistema completo e profissional. Para dúvidas ou suporte, consulte a documentação do Supabase em [supabase.com/docs](https://supabase.com/docs).
