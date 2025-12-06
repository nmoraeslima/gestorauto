# 🚀 Guia de Setup - WhatsApp Integration

## 📋 Pré-requisitos

- [ ] Número WhatsApp **aquecido** (40+ dias de uso)
- [ ] Conta Railway (gratuita)
- [ ] Conta GitHub
- [ ] Node.js 18+ instalado

---

## 🔧 Passo 1: Configurar Banco de Dados

```bash
# Executar migrations
psql -U seu_usuario -d gestorauto -f database/whatsapp_tables.sql
```

Ou via Supabase SQL Editor:
1. Abrir Supabase Dashboard
2. SQL Editor → New Query
3. Colar conteúdo de `database/whatsapp_tables.sql`
4. Run

---

## 🚂 Passo 2: Deploy Evolution API no Railway

### 2.1 Criar Repositório

```bash
mkdir evolution-gestorauto
cd evolution-gestorauto
git init
```

### 2.2 Criar `Dockerfile`

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Instalar Evolution API
RUN npm install -g @evolution/api

# Timezone
ENV TZ=America/Sao_Paulo

EXPOSE 8080

CMD ["evolution-api"]
```

### 2.3 Criar `railway.json`

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE"
  },
  "deploy": {
    "startCommand": "npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### 2.4 Push para GitHub

```bash
git add .
git commit -m "Initial Evolution API setup"
git remote add origin https://github.com/seu-usuario/evolution-gestorauto.git
git push -u origin main
```

### 2.5 Deploy no Railway

1. Acessar https://railway.app
2. New Project → Deploy from GitHub
3. Selecionar repositório `evolution-gestorauto`
4. Adicionar variáveis de ambiente:
   - `SERVER_URL`: https://seu-app.railway.app
   - `AUTHENTICATION_API_KEY`: gerar chave segura
   - `DATABASE_ENABLED`: true
   - `WEBHOOK_GLOBAL_ENABLED`: true
   - `WEBHOOK_GLOBAL_URL`: https://gestorauto.com/api/webhooks/whatsapp

5. Deploy automático

---

## 📱 Passo 3: Conectar WhatsApp

### 3.1 Criar Instância

```bash
curl -X POST \
  'https://seu-app.railway.app/instance/create' \
  -H 'apikey: sua-chave-secreta' \
  -H 'Content-Type: application/json' \
  -d '{
    "instanceName": "gestorauto-main",
    "qrcode": true,
    "integration": "WHATSAPP-BAILEYS"
  }'
```

### 3.2 Obter QR Code

```bash
curl -X GET \
  'https://seu-app.railway.app/instance/qrcode/gestorauto-main' \
  -H 'apikey: sua-chave-secreta'
```

### 3.3 Escanear QR Code

1. Abrir WhatsApp no celular
2. Menu → Dispositivos Conectados
3. Conectar Dispositivo
4. Escanear QR Code retornado

---

## ⚙️ Passo 4: Configurar GestorAuto

### 4.1 Adicionar Variáveis de Ambiente

Copiar `.env.whatsapp.example` para `.env.local`:

```bash
cp .env.whatsapp.example .env.local
```

Editar `.env.local`:

```env
EVOLUTION_API_URL=https://seu-app.railway.app
EVOLUTION_API_KEY=sua-chave-secreta
EVOLUTION_INSTANCE_NAME=gestorauto-main
NEXT_PUBLIC_EVOLUTION_API_URL=https://seu-app.railway.app
```

### 4.2 Instalar Dependências

```bash
npm install axios
```

### 4.3 Testar Conexão

Criar arquivo de teste `test-whatsapp.ts`:

```typescript
import { getWhatsAppClient } from './src/services/whatsapp';

async function test() {
  const client = getWhatsAppClient();
  const stats = client.getStats();
  console.log('WhatsApp Stats:', stats);
}

test();
```

Executar:

```bash
npx ts-node test-whatsapp.ts
```

---

## 🔗 Passo 5: Integrar com Agendamentos

Editar `src/pages/api/appointments/create.ts`:

```typescript
import { sendAppointmentConfirmation } from '@/services/whatsapp';

// Após criar agendamento
const { data: appointment, error } = await supabase
  .from('appointments')
  .insert(appointmentData)
  .select()
  .single();

if (appointment) {
  // Enviar confirmação WhatsApp
  try {
    await sendAppointmentConfirmation(appointment.id);
  } catch (error) {
    console.error('Error sending WhatsApp confirmation:', error);
    // Não falhar a criação do agendamento se WhatsApp falhar
  }
}
```

---

## 📊 Passo 6: Acessar Dashboard

1. Adicionar rota no menu:

```typescript
// src/components/Layout.tsx
{
  name: 'WhatsApp Monitor',
  href: '/admin/whatsapp-health',
  icon: MessageCircle,
}
```

2. Acessar: http://localhost:3000/admin/whatsapp-health

---

## ✅ Checklist Final

- [ ] Evolution API rodando no Railway
- [ ] WhatsApp conectado (QR Code escaneado)
- [ ] Variáveis de ambiente configuradas
- [ ] Tabelas criadas no banco
- [ ] Teste de envio funcionando
- [ ] Dashboard acessível
- [ ] Integração com agendamentos ativa

---

## 🧪 Teste Manual

1. Criar um agendamento de teste
2. Verificar se mensagem foi adicionada à fila
3. Aguardar 30s-2min
4. Confirmar recebimento no WhatsApp
5. Verificar log no dashboard

---

## 🚨 Troubleshooting

### Erro: "WhatsApp Evolution API not configured"
- Verificar se variáveis de ambiente estão corretas
- Reiniciar servidor Next.js

### Erro: "Instance not found"
- Verificar se instância foi criada
- Verificar nome da instância nas variáveis

### Mensagens não sendo enviadas
- Verificar se está em horário comercial (8h-20h)
- Verificar limite diário (50 mensagens)
- Verificar logs no dashboard

### QR Code não aparece
- Verificar se Evolution API está rodando
- Verificar URL e API Key
- Tentar criar nova instância

---

## 📞 Suporte

- Documentação Evolution API: https://doc.evolution-api.com/
- GitHub Issues: https://github.com/EvolutionAPI/evolution-api
- Discord: https://discord.gg/evolutionapi

---

**Pronto! 🎉**

Seu sistema WhatsApp está configurado com proteção anti-ban!
