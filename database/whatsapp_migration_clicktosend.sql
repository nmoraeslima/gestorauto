-- Migration: WhatsApp Click-to-Send (mantém compatibilidade com automação)
-- Execute este SQL para atualizar o schema existente

-- 1. Adicionar campos de cancelamento em appointments (se não existirem)
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS cancellation_reason VARCHAR(255),
ADD COLUMN IF NOT EXISTS cancelled_by UUID REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE;

-- 2. Criar tabela de log simplificada (coexiste com whatsapp_messages)
CREATE TABLE IF NOT EXISTS whatsapp_message_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
    
    -- Message details
    customer_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    message_type VARCHAR(50) NOT NULL, -- 'confirmation', 'cancellation', 'reminder'
    message_preview TEXT,
    
    -- Tracking
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Indexes para performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_log_company ON whatsapp_message_log(company_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_log_appointment ON whatsapp_message_log(appointment_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_log_created ON whatsapp_message_log(created_at DESC);

-- 4. View de estatísticas (compatível com ambos sistemas)
CREATE OR REPLACE VIEW whatsapp_message_stats AS
SELECT 
    DATE(created_at) as date,
    company_id,
    message_type,
    COUNT(*) as total_messages,
    COUNT(DISTINCT appointment_id) as unique_appointments
FROM whatsapp_message_log
GROUP BY DATE(created_at), company_id, message_type
ORDER BY date DESC;

-- 5. Comentários
COMMENT ON TABLE whatsapp_message_log IS 'Log de mensagens WhatsApp (click-to-send) - coexiste com whatsapp_messages para automação futura';
COMMENT ON VIEW whatsapp_message_stats IS 'Estatísticas de mensagens (click-to-send)';

-- 6. Verificar estrutura existente
DO $$
BEGIN
    -- Verificar se tabela de automação existe
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'whatsapp_messages') THEN
        RAISE NOTICE 'Tabela whatsapp_messages (automação) detectada - mantida para uso futuro';
    END IF;
    
    -- Verificar se system_alerts existe
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'system_alerts') THEN
        RAISE NOTICE 'Tabela system_alerts (automação) detectada - mantida para uso futuro';
    END IF;
END $$;

-- Resultado: Sistema híbrido pronto
-- - whatsapp_messages: Para automação futura (Evolution API)
-- - whatsapp_message_log: Para click-to-send atual
-- - Ambos coexistem sem conflito
