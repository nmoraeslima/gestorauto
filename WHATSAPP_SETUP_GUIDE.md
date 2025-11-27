# 🚀 Guia Completo: Deploy WhatsApp Integration (Railway + N8N + Evolution API)

## 📋 Índice

1. [Pré-requisitos](#pré-requisitos)
2. [Parte 1: Criar Conta Railway](#parte-1-criar-conta-railway)
3. [Parte 2: Deploy Evolution API](#parte-2-deploy-evolution-api)
4. [Parte 3: Deploy N8N](#parte-3-deploy-n8n)
5. [Parte 4: Configurar N8N](#parte-4-configurar-n8n)
6. [Parte 5: Importar Workflows](#parte-5-importar-workflows)
7. [Parte 6: Conectar WhatsApp](#parte-6-conectar-whatsapp)
8. [Parte 7: Configurar Supabase](#parte-7-configurar-supabase)
9. [Parte 8: Testar Tudo](#parte-8-testar-tudo)
10. [Troubleshooting](#troubleshooting)

---

## Pré-requisitos

Antes de começar, você precisa:

- [ ] Conta GitHub (gratuita)
- [ ] Cartão de crédito (para Railway - $5/mês)
- [ ] Acesso ao Supabase do projeto
- [ ] Número de WhatsApp para teste

**Tempo estimado**: 30-40 minutos

---

## Parte 1: Criar Conta Railway

### Passo 1.1: Acessar Railway

1. Abra o navegador
2. Acesse: https://railway.app
3. Clique em **"Login"** (canto superior direito)

### Passo 1.2: Login com GitHub

1. Clique em **"Login with GitHub"**
2. Autorize o Railway a acessar sua conta GitHub
3. Você será redirecionado para o dashboard

### Passo 1.3: Ativar Hobby Plan

1. No dashboard, clique em **"Upgrade to Hobby"**
2. Adicione seu cartão de crédito
3. Confirme o plano de **$5/mês**
4. ✅ Você ganha **$5 de crédito grátis** no primeiro mês!

**Custo real no primeiro mês**: **$0** (crédito grátis)

---

## Parte 2: Deploy Evolution API

### Passo 2.1: Criar Novo Projeto

1. No dashboard Railway, clique em **"New Project"**
2. Selecione **"Deploy from a Template"**
3. Na busca, digite: **"evolution api"**
4. Selecione o template oficial da Evolution API

**OU** (se não encontrar template):

1. Clique em **"New Project"**
2. Selecione **"Empty Project"**
3. Clique em **"+ New"** → **"Docker Image"**

### Passo 2.2: Configurar Evolution API

Se escolheu "Docker Image", configure:

**Image**: `atendai/evolution-api:latest`

**Variáveis de Ambiente** (clique em "Variables"):

```env
AUTHENTICATION_API_KEY=SuaChaveSecretaAqui123
SERVER_URL=https://${{RAILWAY_PUBLIC_DOMAIN}}
DATABASE_ENABLED=false
CORS_ORIGIN=*
CORS_CREDENTIALS=true
```

**IMPORTANTE**: 
- Troque `SuaChaveSecretaAqui123` por uma senha forte
- Guarde essa senha, você vai precisar depois!

### Passo 2.3: Gerar Domínio Público

1. Clique no serviço Evolution API
2. Vá em **"Settings"** → **"Networking"**
3. Clique em **"Generate Domain"**
4. Copie a URL gerada (ex: `evolution-production-xxxx.up.railway.app`)
5. ✅ Guarde essa URL!

### Passo 2.4: Aguardar Deploy

1. Vá em **"Deployments"**
2. Aguarde o status ficar **"Success"** (verde)
3. Tempo: ~2-3 minutos

### Passo 2.5: Testar Evolution API

Abra o navegador e acesse:

```
https://sua-evolution-url.railway.app
```

Você deve ver:

```json
{
  "status": "ok",
  "version": "x.x.x"
}
```

✅ **Evolution API funcionando!**

---

## Parte 3: Deploy N8N

### Passo 3.1: Adicionar PostgreSQL

No mesmo projeto Railway:

1. Clique em **"+ New"**
2. Selecione **"Database"** → **"Add PostgreSQL"**
3. Aguarde provisionar (~30 segundos)
4. ✅ PostgreSQL criado!

### Passo 3.2: Adicionar N8N

1. Clique em **"+ New"**
2. Selecione **"Docker Image"**
3. **Image**: `n8nio/n8n:latest`

### Passo 3.3: Configurar Variáveis N8N

Clique em **"Variables"** e adicione:

```env
# Básico
N8N_HOST=${{RAILWAY_PUBLIC_DOMAIN}}
WEBHOOK_URL=https://${{RAILWAY_PUBLIC_DOMAIN}}
N8N_PROTOCOL=https
NODE_ENV=production

# Autenticação
N8N_BASIC_AUTH_ACTIVE=true
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=SuaSenhaForteAqui456

# Database (conectar ao PostgreSQL)
DB_TYPE=postgresdb
DB_POSTGRESDB_HOST=${{Postgres.RAILWAY_PRIVATE_DOMAIN}}
DB_POSTGRESDB_PORT=5432
DB_POSTGRESDB_DATABASE=${{Postgres.PGDATABASE}}
DB_POSTGRESDB_USER=${{Postgres.PGUSER}}
DB_POSTGRESDB_PASSWORD=${{Postgres.PGPASSWORD}}

# Timezone
GENERIC_TIMEZONE=America/Sao_Paulo
TZ=America/Sao_Paulo

# Evolution API (usar a URL que você guardou)
EVOLUTION_API_URL=https://sua-evolution-url.railway.app
EVOLUTION_API_KEY=SuaChaveSecretaAqui123
```

**IMPORTANTE**:
- Troque `SuaSenhaForteAqui456` por uma senha forte
- Use a mesma `EVOLUTION_API_KEY` do Passo 2.2
- Use a `EVOLUTION_API_URL` do Passo 2.3

### Passo 3.4: Gerar Domínio N8N

1. Clique no serviço N8N
2. Vá em **"Settings"** → **"Networking"**
3. Clique em **"Generate Domain"**
4. Copie a URL (ex: `n8n-production-xxxx.up.railway.app`)
5. ✅ Guarde essa URL!

### Passo 3.5: Aguardar Deploy

1. Vá em **"Deployments"**
2. Aguarde status **"Success"**
3. Tempo: ~2-3 minutos

### Passo 3.6: Acessar N8N

1. Abra: `https://sua-n8n-url.railway.app`
2. Faça login:
   - **User**: `admin`
   - **Password**: `SuaSenhaForteAqui456`
3. ✅ **N8N funcionando!**

---

## Parte 4: Configurar N8N

### Passo 4.1: Criar Credencial Supabase

1. No N8N, clique em **"Credentials"** (menu lateral)
2. Clique em **"+ Add Credential"**
3. Busque: **"Postgres"**
4. Preencha:

```
Name: Supabase PostgreSQL
Host: db.xxxxxx.supabase.co
Database: postgres
User: postgres
Password: [sua senha do Supabase]
Port: 5432
SSL: Enabled
```

**Como pegar as credenciais Supabase**:
1. Acesse seu projeto no Supabase
2. Vá em **"Settings"** → **"Database"**
3. Copie **"Host"**, **"Database"**, **"User"**, **"Password"**

5. Clique em **"Save"**
6. ✅ Credencial criada!

### Passo 4.2: Testar Conexão

1. Clique em **"Test"**
2. Deve aparecer: ✅ **"Connection successful"**
3. Se der erro, revise as credenciais

---

## Parte 5: Importar Workflows

### Passo 5.1: Importar Workflow 1 (Confirmação)

1. No N8N, clique em **"Workflows"** (menu lateral)
2. Clique em **"+ Add Workflow"**
3. Clique nos **3 pontinhos** (canto superior direito)
4. Selecione **"Import from File"**
5. Selecione: `n8n-workflows/1-appointment-confirmation.json`
6. Clique em **"Import"**

### Passo 5.2: Configurar Workflow 1

1. Clique no node **"Buscar Dados do Agendamento"**
2. Em **"Credential to connect with"**, selecione **"Supabase PostgreSQL"**
3. Clique em **"Save"**

4. Clique no node **"Salvar Histórico"**
5. Selecione a mesma credencial
6. Clique em **"Save"**

7. Clique em **"Save"** (canto superior direito) para salvar o workflow

8. **ATIVE** o workflow (toggle no canto superior direito)

### Passo 5.3: Copiar URL do Webhook

1. Clique no node **"Webhook - Novo Agendamento"**
2. Copie a **"Production URL"**
3. Exemplo: `https://n8n-xxx.railway.app/webhook/appointment-confirmation`
4. ✅ Guarde essa URL!

### Passo 5.4: Repetir para Workflows 2 e 3

Repita os passos 5.1 a 5.3 para:

- `2-appointment-reminders.json`
- `3-work-order-completed.json`

**URLs para guardar**:
- Confirmação: `https://n8n-xxx.railway.app/webhook/appointment-confirmation`
- O.S. Pronta: `https://n8n-xxx.railway.app/webhook/work-order-completed`

---

## Parte 6: Conectar WhatsApp

### Passo 6.1: Criar Instância Evolution

Abra o Postman (ou Insomnia) e faça:

**Request**: `POST`  
**URL**: `https://sua-evolution-url.railway.app/instance/create`  
**Headers**:
```
apikey: SuaChaveSecretaAqui123
Content-Type: application/json
```
**Body**:
```json
{
  "instanceName": "gestorauto-main",
  "qrcode": true
}
```

**Response** (exemplo):
```json
{
  "instance": {
    "instanceName": "gestorauto-main",
    "status": "created"
  }
}
```

✅ **Instância criada!**

### Passo 6.2: Obter QR Code

**Request**: `GET`  
**URL**: `https://sua-evolution-url.railway.app/instance/connect/gestorauto-main`  
**Headers**:
```
apikey: SuaChaveSecretaAqui123
```

**Response**:
```json
{
  "code": "base64-do-qr-code...",
  "pairingCode": "XXXX-XXXX"
}
```

### Passo 6.3: Escanear QR Code

1. Copie o `code` (base64)
2. Cole em: https://base64.guru/converter/decode/image
3. Baixe a imagem do QR Code
4. No WhatsApp:
   - Abra WhatsApp no celular
   - Vá em **"Aparelhos conectados"**
   - Clique em **"Conectar um aparelho"**
   - Escaneie o QR Code

✅ **WhatsApp conectado!**

### Passo 6.4: Verificar Conexão

**Request**: `GET`  
**URL**: `https://sua-evolution-url.railway.app/instance/connectionState/gestorauto-main`  
**Headers**:
```
apikey: SuaChaveSecretaAqui123
```

**Response**:
```json
{
  "state": "open"
}
```

✅ **Conectado e pronto!**

---

## Parte 7: Configurar Supabase

### Passo 7.1: Criar Tabelas

No Supabase SQL Editor, execute:

```sql
-- Tabela de instâncias WhatsApp
CREATE TABLE whatsapp_instances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    instance_name TEXT NOT NULL,
    instance_id TEXT UNIQUE NOT NULL,
    api_key TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'disconnected',
    phone_number TEXT,
    connected_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id)
);

-- Tabela de mensagens
CREATE TABLE whatsapp_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    instance_id UUID REFERENCES whatsapp_instances(id) ON DELETE CASCADE,
    direction TEXT NOT NULL CHECK (direction IN ('outbound', 'inbound')),
    to_number TEXT NOT NULL,
    message_type TEXT NOT NULL DEFAULT 'text',
    content TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    sent_at TIMESTAMPTZ,
    appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
    work_order_id UUID REFERENCES work_orders(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE whatsapp_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own company instances"
    ON whatsapp_instances FOR SELECT
    USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can view own company messages"
    ON whatsapp_messages FOR SELECT
    USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));
```

✅ **Tabelas criadas!**

### Passo 7.2: Inserir Instância

```sql
INSERT INTO whatsapp_instances (
    company_id,
    instance_name,
    instance_id,
    api_key,
    status,
    connected_at
)
VALUES (
    '[ID-DA-SUA-EMPRESA]',
    'gestorauto-main',
    'gestorauto-main',
    'SuaChaveSecretaAqui123',
    'connected',
    NOW()
);
```

**Como pegar o ID da empresa**:
```sql
SELECT id, name FROM companies;
```

✅ **Instância registrada!**

### Passo 7.3: Criar Database Triggers

```sql
-- Trigger: Confirmação de Agendamento
CREATE OR REPLACE FUNCTION notify_appointment_created()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://sua-n8n-url.railway.app/webhook/appointment-confirmation',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := json_build_object('appointment_id', NEW.id)::text
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER appointment_created_webhook
AFTER INSERT ON appointments
FOR EACH ROW
EXECUTE FUNCTION notify_appointment_created();

-- Trigger: O.S. Concluída
CREATE OR REPLACE FUNCTION notify_work_order_completed()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    PERFORM net.http_post(
      url := 'https://sua-n8n-url.railway.app/webhook/work-order-completed',
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := json_build_object('work_order_id', NEW.id)::text
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER work_order_completed_webhook
AFTER UPDATE ON work_orders
FOR EACH ROW
EXECUTE FUNCTION notify_work_order_completed();
```

**IMPORTANTE**: Troque `sua-n8n-url.railway.app` pela URL real do N8N!

✅ **Triggers criados!**

---

## Parte 8: Testar Tudo

### Teste 1: Confirmação de Agendamento

1. No GestorAuto, crie um novo agendamento
2. Use um cliente com telefone cadastrado
3. Aguarde ~5 segundos
4. ✅ Cliente deve receber mensagem no WhatsApp!

**Verificar no N8N**:
1. Vá em **"Executions"**
2. Deve aparecer execução bem-sucedida (verde)

### Teste 2: Lembrete 24h

1. No N8N, abra workflow **"2. Lembretes 24h Antes"**
2. Clique em **"Execute Workflow"** (botão play)
3. ✅ Deve enviar lembretes para agendamentos de amanhã

**Agendar execução automática**:
- O workflow já está configurado para rodar diariamente às 8h
- Basta deixar **ATIVO**

### Teste 3: O.S. Pronta

1. No GestorAuto, edite uma O.S.
2. Mude status para **"Concluído"**
3. Aguarde ~5 segundos
4. ✅ Cliente deve receber notificação!

**Se tiver fotos**:
- Cliente recebe mensagem de texto
- Depois recebe até 4 fotos

---

## Troubleshooting

### ❌ WhatsApp não envia mensagens

**Verificar**:
1. Evolution API está rodando?
   - Acesse: `https://sua-evolution-url.railway.app`
2. Instância está conectada?
   - Faça GET em `/instance/connectionState/gestorauto-main`
3. Número tem WhatsApp?
   - Teste com seu próprio número primeiro

### ❌ N8N não executa workflows

**Verificar**:
1. Workflow está **ATIVO**? (toggle verde)
2. Credencial Supabase está correta?
   - Teste a conexão
3. Veja os logs:
   - **"Executions"** → Clique na execução com erro
   - Veja qual node falhou

### ❌ Triggers não disparam

**Verificar**:
1. Triggers foram criados no Supabase?
   ```sql
   SELECT * FROM pg_trigger WHERE tgname LIKE '%webhook%';
   ```
2. URL do webhook está correta?
   - Copie do N8N e cole no trigger
3. Teste manual:
   ```bash
   curl -X POST https://sua-n8n-url.railway.app/webhook/appointment-confirmation \
     -H "Content-Type: application/json" \
     -d '{"appointment_id": "uuid-real"}'
   ```

### ❌ Railway cobra mais de $5

**Verificar**:
1. Quantos serviços estão rodando?
   - Deve ter: Evolution API + N8N + PostgreSQL
2. Recursos alocados:
   - Evolution: 1.5GB RAM
   - N8N: 512MB RAM
   - Total: ~2GB (dentro do plano)

---

## 🎉 Pronto!

Você agora tem:

✅ Evolution API rodando  
✅ N8N configurado  
✅ WhatsApp conectado  
✅ Workflows ativos  
✅ Triggers funcionando  

**Custo**: $5/mês (ou $0 no primeiro mês com crédito)

---

## 📞 Próximos Passos

1. **Monitorar**: Acompanhe execuções no N8N
2. **Customizar**: Edite templates de mensagens
3. **Escalar**: Adicione mais instâncias para outras empresas
4. **Melhorar**: Crie novos workflows (cobrança, pesquisa, etc.)

---

## 📚 Links Úteis

- Railway Dashboard: https://railway.app/dashboard
- N8N Docs: https://docs.n8n.io
- Evolution API Docs: https://doc.evolution-api.com
- Supabase Dashboard: https://app.supabase.com

---

**Dúvidas?** Revise o troubleshooting ou me pergunte! 🚀
