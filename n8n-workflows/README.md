# N8N Workflows - GestorAuto WhatsApp Integration

## 📦 Workflows Incluídos

Este diretório contém 3 workflows N8N prontos para uso:

1. **1-appointment-confirmation.json** - Confirmação imediata de agendamentos
2. **2-appointment-reminders.json** - Lembretes automáticos 24h antes
3. **3-work-order-completed.json** - Notificação de O.S. pronta + fotos

---

## 🚀 Setup Rápido

### 1. Pré-requisitos

- N8N instalado e rodando
- Evolution API configurada
- Supabase configurado

### 2. Variáveis de Ambiente

Configure estas variáveis no N8N:

```env
EVOLUTION_API_URL=https://sua-evolution-api.com
EVOLUTION_API_KEY=sua-api-key
EVOLUTION_INSTANCE_ID=sua-instancia-id
```

### 3. Credenciais N8N

#### Supabase PostgreSQL
- **Name**: `Supabase PostgreSQL`
- **Host**: `db.xxx.supabase.co`
- **Database**: `postgres`
- **User**: `postgres`
- **Password**: Sua senha do Supabase
- **Port**: `5432`
- **SSL**: Enabled

### 4. Importar Workflows

1. Abra N8N
2. Clique em **"Workflows" → "Import from File"**
3. Selecione cada arquivo `.json`
4. Ative cada workflow

---

## 📋 Detalhes dos Workflows

### 1️⃣ Confirmação de Agendamento

**Trigger**: Webhook POST  
**URL**: `https://seu-n8n.com/webhook/appointment-confirmation`

**Payload**:
```json
{
  "appointment_id": "uuid-do-agendamento"
}
```

**Fluxo**:
1. Recebe webhook
2. Busca dados do agendamento no Supabase
3. Verifica se cliente tem telefone
4. Formata mensagem
5. Envia via Evolution API
6. Salva histórico
7. Retorna resposta

**Mensagem Enviada**:
```
Olá {nome}! 👋

Seu agendamento foi confirmado! ✅

📅 Data: 26/11/2025
🕐 Horário: 14:00
🚗 Veículo: Honda Civic
🔧 Serviços: Polimento, Cristalização

Nos vemos em breve!

*Sua Empresa*
```

---

### 2️⃣ Lembretes 24h Antes

**Trigger**: Cron (Diário às 8h)  
**Automático**: Sim

**Fluxo**:
1. Executa diariamente às 8h
2. Busca agendamentos para amanhã
3. Para cada agendamento:
   - Verifica se já enviou lembrete
   - Formata mensagem
   - Envia WhatsApp
   - Aguarda 2s (rate limiting)
4. Salva histórico

**Mensagem Enviada**:
```
Olá {nome}! 👋

Lembrando que seu agendamento é amanhã! ⏰

📅 Data: 27/11/2025
🕐 Horário: 14:00
🚗 Veículo: Honda Civic
🔧 Serviços: Polimento, Cristalização

Até logo!

*Sua Empresa*
```

---

### 3️⃣ O.S. Pronta

**Trigger**: Webhook POST  
**URL**: `https://seu-n8n.com/webhook/work-order-completed`

**Payload**:
```json
{
  "work_order_id": "uuid-da-os"
}
```

**Fluxo**:
1. Recebe webhook
2. Busca dados da O.S.
3. Verifica telefone
4. Envia mensagem de texto
5. Busca fotos (se houver)
6. Envia fotos (max 4)
7. Salva histórico

**Mensagem Enviada**:
```
Olá {nome}! 👋

Seu veículo está pronto! ✅

🚗 Honda Civic
📋 O.S. #001234
🔧 Serviços realizados: Polimento, Cristalização
💰 Total: R$ 350,00

Aguardamos você para retirada!

*Sua Empresa*
```

---

## 🔗 Integração com GestorAuto

### Supabase Database Webhooks

Configure webhooks no Supabase para chamar os workflows N8N:

#### 1. Confirmação de Agendamento

```sql
CREATE OR REPLACE FUNCTION notify_appointment_created()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://seu-n8n.com/webhook/appointment-confirmation',
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
```

#### 2. O.S. Concluída

```sql
CREATE OR REPLACE FUNCTION notify_work_order_completed()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    PERFORM net.http_post(
      url := 'https://seu-n8n.com/webhook/work-order-completed',
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

## 🧪 Testando os Workflows

### Teste Manual

#### 1. Confirmação de Agendamento

```bash
curl -X POST https://seu-n8n.com/webhook/appointment-confirmation \
  -H "Content-Type: application/json" \
  -d '{"appointment_id": "uuid-real-do-agendamento"}'
```

#### 2. O.S. Pronta

```bash
curl -X POST https://seu-n8n.com/webhook/work-order-completed \
  -H "Content-Type: application/json" \
  -d '{"work_order_id": "uuid-real-da-os"}'
```

#### 3. Lembretes (Manual)

No N8N, clique em "Execute Workflow" no workflow de lembretes.

---

## 📊 Monitoramento

### Logs N8N

Acesse: `https://seu-n8n.com/workflow/{workflow-id}/executions`

### Histórico de Mensagens

Query no Supabase:

```sql
SELECT 
  wm.created_at,
  wm.direction,
  wm.to_number,
  wm.status,
  wm.content,
  c.name as customer_name
FROM whatsapp_messages wm
LEFT JOIN customers c ON wm.customer_id = c.id
ORDER BY wm.created_at DESC
LIMIT 50;
```

---

## 🔧 Customização

### Alterar Templates de Mensagem

Edite o node "Formatar Mensagem" em cada workflow:

1. Abra o workflow no N8N
2. Clique no node "Formatar Mensagem"
3. Edite o código JavaScript
4. Salve e ative

### Alterar Horário dos Lembretes

No workflow "2-appointment-reminders.json":

1. Clique no node "Cron - Diário 8h"
2. Altere a expressão cron
3. Exemplos:
   - `0 9 * * *` = 9h da manhã
   - `0 18 * * *` = 6h da tarde
   - `0 8,18 * * *` = 8h e 18h

### Adicionar Mais Fotos

No workflow "3-work-order-completed.json":

1. Node "Buscar Fotos"
2. Altere `LIMIT 4` para o número desejado
3. Cuidado: WhatsApp tem rate limit

---

## ⚠️ Troubleshooting

### Mensagens não enviadas

1. Verifique se Evolution API está online
2. Verifique se a instância está conectada
3. Verifique se o número tem WhatsApp
4. Veja os logs do N8N

### Webhooks não disparam

1. Verifique se as triggers estão criadas no Supabase
2. Teste manualmente com curl
3. Verifique URL do webhook

### Lembretes não funcionam

1. Verifique se o workflow está ativo
2. Verifique a expressão cron
3. Teste execução manual

---

## 📈 Próximos Passos

### Workflows Adicionais (Futuro)

- **Cobrança de Pagamento**: Lembrete de pagamento pendente
- **Pesquisa de Satisfação**: Após conclusão da O.S.
- **Promoções**: Envio de ofertas especiais
- **Aniversário**: Mensagem de aniversário do cliente

### Melhorias

- [ ] Retry automático em caso de falha
- [ ] Suporte a múltiplas instâncias (multi-tenant)
- [ ] Dashboard de métricas
- [ ] Templates personalizáveis por empresa

---

## 📞 Suporte

Para dúvidas ou problemas:

1. Verifique os logs do N8N
2. Consulte a documentação da Evolution API
3. Revise o código dos workflows

---

## 📄 Licença

Estes workflows são fornecidos como estão, sem garantias.
