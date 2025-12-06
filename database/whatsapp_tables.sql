-- WhatsApp message tracking (simplified for click-to-send)
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_whatsapp_log_company ON whatsapp_message_log(company_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_log_appointment ON whatsapp_message_log(appointment_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_log_created ON whatsapp_message_log(created_at DESC);

-- Add cancellation tracking to appointments
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS cancellation_reason VARCHAR(255),
ADD COLUMN IF NOT EXISTS cancelled_by UUID REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE;

-- View for message statistics
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

-- Comments
COMMENT ON TABLE whatsapp_message_log IS 'Log de mensagens WhatsApp enviadas (click-to-send)';
COMMENT ON VIEW whatsapp_message_stats IS 'Estatísticas diárias de mensagens WhatsApp';
