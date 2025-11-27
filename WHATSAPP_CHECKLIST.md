# ✅ Checklist de Deploy WhatsApp

Use este checklist para acompanhar seu progresso:

## 🏁 Preparação (5 min)
- [ ] Conta GitHub criada
- [ ] Cartão de crédito em mãos
- [ ] Credenciais Supabase anotadas
- [ ] Número WhatsApp para teste

## 🚂 Railway Setup (10 min)
- [ ] Conta Railway criada
- [ ] Login com GitHub feito
- [ ] Hobby Plan ativado ($5/mês)
- [ ] Projeto criado

## 📱 Evolution API (5 min)
- [ ] Service criado no Railway
- [ ] Variáveis configuradas
- [ ] Domínio público gerado
- [ ] Deploy concluído (verde)
- [ ] API testada (retorna `{"status":"ok"}`)
- [ ] URL anotada: `___________________________`
- [ ] API Key anotada: `___________________________`

## 🤖 N8N (10 min)
- [ ] PostgreSQL adicionado
- [ ] N8N service criado
- [ ] Variáveis configuradas
- [ ] Domínio público gerado
- [ ] Deploy concluído (verde)
- [ ] Login funcionando
- [ ] URL anotada: `___________________________`
- [ ] Senha anotada: `___________________________`

## 🔑 Credenciais N8N (3 min)
- [ ] Credencial "Supabase PostgreSQL" criada
- [ ] Conexão testada (sucesso)

## 📋 Workflows (5 min)
- [ ] Workflow 1 importado (Confirmação)
- [ ] Workflow 1 configurado
- [ ] Workflow 1 ativado
- [ ] Webhook URL 1 copiada: `___________________________`
- [ ] Workflow 2 importado (Lembretes)
- [ ] Workflow 2 configurado
- [ ] Workflow 2 ativado
- [ ] Workflow 3 importado (O.S. Pronta)
- [ ] Workflow 3 configurado
- [ ] Workflow 3 ativado
- [ ] Webhook URL 3 copiada: `___________________________`

## 💬 WhatsApp (5 min)
- [ ] Instância criada via API
- [ ] QR Code obtido
- [ ] QR Code escaneado no celular
- [ ] Conexão verificada (state: "open")

## 🗄️ Supabase (5 min)
- [ ] Tabelas criadas (whatsapp_instances, whatsapp_messages)
- [ ] RLS habilitado
- [ ] Policies criadas
- [ ] Instância inserida na tabela
- [ ] Triggers criados (appointments, work_orders)

## 🧪 Testes (5 min)
- [ ] Teste 1: Criar agendamento → Mensagem recebida
- [ ] Teste 2: Executar workflow lembretes manualmente
- [ ] Teste 3: Concluir O.S. → Notificação recebida
- [ ] Verificar execuções no N8N (todas verdes)
- [ ] Verificar histórico no Supabase

## 🎉 Finalização
- [ ] Tudo funcionando
- [ ] URLs documentadas
- [ ] Senhas guardadas em local seguro
- [ ] Custos verificados (deve ser $5/mês)

---

## 📊 Informações Importantes

**URLs**:
- Evolution API: `___________________________`
- N8N: `___________________________`
- Webhook Confirmação: `___________________________`
- Webhook O.S. Pronta: `___________________________`

**Credenciais**:
- Evolution API Key: `___________________________`
- N8N User: `admin`
- N8N Password: `___________________________`

**Custo Mensal**: $5 (primeiro mês grátis com crédito)

---

## ⏱️ Tempo Total Estimado

- **Mínimo**: 30 minutos (se tudo der certo)
- **Médio**: 45 minutos (com alguns ajustes)
- **Máximo**: 60 minutos (se precisar troubleshooting)

---

## 🆘 Em Caso de Problemas

1. Revise o passo que falhou
2. Consulte a seção Troubleshooting do guia completo
3. Verifique logs no Railway e N8N
4. Teste conexões individualmente

---

**Data de Conclusão**: ___/___/______

**Status**: 
- [ ] Em Progresso
- [ ] Concluído
- [ ] Bloqueado (motivo: ___________________)
