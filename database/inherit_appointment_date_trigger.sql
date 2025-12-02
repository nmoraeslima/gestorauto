-- ============================================================================
-- TRIGGER: Herdar Data do Agendamento ao Criar O.S.
-- ============================================================================
-- Quando uma O.S. é criada a partir de um agendamento, herda automaticamente
-- a data agendada como data de início
-- ============================================================================

CREATE OR REPLACE FUNCTION inherit_appointment_date()
RETURNS TRIGGER AS $$
DECLARE
    v_scheduled_at TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Se tem appointment_id vinculado
    IF NEW.appointment_id IS NOT NULL THEN
        -- Buscar data do agendamento
        SELECT scheduled_at INTO v_scheduled_at
        FROM appointments
        WHERE id = NEW.appointment_id;
        
        -- Se encontrou o agendamento e started_at não foi definido
        IF v_scheduled_at IS NOT NULL AND NEW.started_at IS NULL THEN
            NEW.started_at := v_scheduled_at;
            RAISE NOTICE 'O.S. % herdou data do agendamento: %', NEW.order_number, v_scheduled_at;
        END IF;
    ELSE
        -- Se não tem agendamento e started_at não foi definido, usar NOW()
        IF NEW.started_at IS NULL THEN
            NEW.started_at := NOW();
            RAISE NOTICE 'O.S. % criada sem agendamento, usando data atual', NEW.order_number;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Remover trigger antigo se existir
DROP TRIGGER IF EXISTS inherit_appointment_date_trigger ON work_orders;

-- Criar trigger BEFORE INSERT para modificar NEW antes de salvar
CREATE TRIGGER inherit_appointment_date_trigger
    BEFORE INSERT ON work_orders
    FOR EACH ROW
    EXECUTE FUNCTION inherit_appointment_date();

-- ============================================================================
-- VERIFICAÇÃO
-- ============================================================================

-- Listar triggers da tabela work_orders
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'work_orders'
ORDER BY trigger_name;
