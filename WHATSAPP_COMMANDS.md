# 🚀 Comandos Prontos - WhatsApp Integration

Este arquivo contém todos os comandos prontos para copiar e colar durante o setup.

---

## 📋 Variáveis de Ambiente

### Evolution API (Railway)

```env
AUTHENTICATION_API_KEY=SuaChaveSecretaAqui123
SERVER_URL=https://${{RAILWAY_PUBLIC_DOMAIN}}
DATABASE_ENABLED=false
CORS_ORIGIN=*
CORS_CREDENTIALS=true
```

### N8N (Railway)

```env
N8N_HOST=${{RAILWAY_PUBLIC_DOMAIN}}
WEBHOOK_URL=https://${{RAILWAY_PUBLIC_DOMAIN}}
N8N_PROTOCOL=https
NODE_ENV=production
N8N_BASIC_AUTH_ACTIVE=true
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=SuaSenhaForteAqui456
DB_TYPE=postgresdb
DB_POSTGRESDB_HOST=${{Postgres.RAILWAY_PRIVATE_DOMAIN}}
DB_POSTGRESDB_PORT=5432
DB_POSTGRESDB_DATABASE=${{Postgres.PGDATABASE}}
DB_POSTGRESDB_USER=${{Postgres.PGUSER}}
DB_POSTGRESDB_PASSWORD=${{Postgres.PGPASSWORD}}
GENERIC_TIMEZONE=America/Sao_Paulo
TZ=America/Sao_Paulo
EVOLUTION_API_URL=https://sua-evolution-url.railway.app
EVOLUTION_API_KEY=SuaChaveSecretaAqui123
```

---

## 🔌 Comandos Evolution API

### Criar Instância

```bash
curl -X POST https://sua-evolution-url.railway.app/instance/create \
  -H "apikey: SuaChaveSecretaAqui123" \
  -H "Content-Type: application/json" \
  -d '{
    "instanceName": "gestorauto-main",
    "qrcode": true
  }'
```

### Obter QR Code

```bash
curl -X GET https://sua-evolution-url.railway.app/instance/connect/gestorauto-main \
  -H "apikey: SuaChaveSecretaAqui123"
```

### Verificar Conexão

```bash
curl -X GET https://sua-evolution-url.railway.app/instance/connectionState/gestorauto-main \
  -H "apikey: SuaChaveSecretaAqui123"
```

### Enviar Mensagem de Teste

```bash
curl -X POST https://sua-evolution-url.railway.app/message/sendText/gestorauto-main \
  -H "apikey: SuaChaveSecretaAqui123" \
  -H "Content-Type: application/json" \
  -d '{
    "number": "5511999999999",
    "text": "Teste de mensagem do GestorAuto! 🚀"
  }'
```

---

## 🗄️ SQL - Supabase

### Criar Tabelas

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
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id)
);

-- Tabela de mensagens
CREATE TABLE whatsapp_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    instance_id UUID REFERENCES whatsapp_instances(id) ON DELETE CASCADE,
    direction TEXT NOT NULL CHECK (direction IN ('outbound', 'inbound')),
    to_number TEXT NOT NULL,
    from_number TEXT,
    message_type TEXT NOT NULL DEFAULT 'text',
    content TEXT NOT NULL,
    media_url TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,
    failed_at TIMESTAMPTZ,
    error_message TEXT,
    appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
    work_order_id UUID REFERENCES work_orders(id) ON DELETE SET NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    evolution_message_id TEXT,
    webhook_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_whatsapp_messages_company ON whatsapp_messages(company_id);
CREATE INDEX idx_whatsapp_messages_appointment ON whatsapp_messages(appointment_id);
CREATE INDEX idx_whatsapp_messages_work_order ON whatsapp_messages(work_order_id);
CREATE INDEX idx_whatsapp_messages_status ON whatsapp_messages(status);
CREATE INDEX idx_whatsapp_messages_created ON whatsapp_messages(created_at DESC);
```

### Habilitar RLS

```sql
ALTER TABLE whatsapp_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;
```

### Criar Policies

```sql
-- Policies para whatsapp_instances
CREATE POLICY "Users can view own company instances"
    ON whatsapp_instances FOR SELECT
    USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can insert own company instances"
    ON whatsapp_instances FOR INSERT
    WITH CHECK (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can update own company instances"
    ON whatsapp_instances FOR UPDATE
    USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

-- Policies para whatsapp_messages
CREATE POLICY "Users can view own company messages"
    ON whatsapp_messages FOR SELECT
    USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can insert own company messages"
    ON whatsapp_messages FOR INSERT
    WITH CHECK (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));
```

### Inserir Instância (Exemplo)

```sql
-- Primeiro, pegue o ID da sua empresa
SELECT id, name FROM companies;

-- Depois, insira a instância (troque [ID-DA-EMPRESA] pelo ID real)
INSERT INTO whatsapp_instances (
    company_id,
    instance_name,
    instance_id,
    api_key,
    status,
    connected_at
)
VALUES (
    '[ID-DA-EMPRESA]',
    'gestorauto-main',
    'gestorauto-main',
    'SuaChaveSecretaAqui123',
    'connected',
    NOW()
);
```

### Criar Triggers

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

---

## 🧪 Testes

### Testar Webhook Manualmente

```bash
# Teste Confirmação de Agendamento
curl -X POST https://sua-n8n-url.railway.app/webhook/appointment-confirmation \
  -H "Content-Type: application/json" \
  -d '{"appointment_id": "uuid-real-do-agendamento"}'

# Teste O.S. Pronta
curl -X POST https://sua-n8n-url.railway.app/webhook/work-order-completed \
  -H "Content-Type: application/json" \
  -d '{"work_order_id": "uuid-real-da-os"}'
```

### Verificar Mensagens no Supabase

```sql
-- Ver últimas mensagens enviadas
SELECT 
    wm.created_at,
    wm.to_number,
    wm.status,
    wm.content,
    c.name as customer_name
FROM whatsapp_messages wm
LEFT JOIN customers c ON wm.customer_id = c.id
ORDER BY wm.created_at DESC
LIMIT 10;

-- Ver estatísticas
SELECT 
    status,
    COUNT(*) as total
FROM whatsapp_messages
GROUP BY status;
```

### Verificar Triggers

```sql
-- Listar triggers criados
SELECT 
    tgname as trigger_name,
    tgrelid::regclass as table_name,
    tgenabled as enabled
FROM pg_trigger
WHERE tgname LIKE '%webhook%';
```

---

## 🔧 Troubleshooting

### Resetar Instância Evolution

```bash
curl -X DELETE https://sua-evolution-url.railway.app/instance/logout/gestorauto-main \
  -H "apikey: SuaChaveSecretaAqui123"
```

### Deletar Instância

```bash
curl -X DELETE https://sua-evolution-url.railway.app/instance/delete/gestorauto-main \
  -H "apikey: SuaChaveSecretaAqui123"
```

### Limpar Mensagens de Teste

```sql
DELETE FROM whatsapp_messages 
WHERE content LIKE '%Teste%';
```

---

## 📝 Notas Importantes

**Lembre-se de trocar**:
- `SuaChaveSecretaAqui123` → Sua API key real
- `SuaSenhaForteAqui456` → Sua senha N8N real
- `sua-evolution-url.railway.app` → URL real da Evolution API
- `sua-n8n-url.railway.app` → URL real do N8N
- `[ID-DA-EMPRESA]` → UUID real da empresa
- `5511999999999` → Número real para teste

**Guarde em local seguro**:
- Evolution API URL
- Evolution API Key
- N8N URL
- N8N Password
- Webhook URLs

---

**Última atualização**: 26/11/2025
