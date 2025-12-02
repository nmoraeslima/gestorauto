-- ============================================================================
-- TESTE AUTOMATIZADO: Fluxo de Datas - Agendamento → O.S. → Financeiro
-- ============================================================================
-- Este script executa automaticamente sem necessidade de substituir IDs
-- ============================================================================

-- CENÁRIO 1: O.S. Criada a Partir de Agendamento
-- ============================================================================

DO $$
DECLARE
    v_company_id UUID;
    v_customer_id UUID;
    v_vehicle_id UUID;
    v_appointment_id UUID;
    v_work_order_id UUID;
    v_scheduled_at TIMESTAMP WITH TIME ZONE := '2024-01-15 10:00:00+00';
    v_completed_at TIMESTAMP WITH TIME ZONE := '2024-01-15 14:30:00+00';
    v_started_at TIMESTAMP WITH TIME ZONE;
    v_transaction_due_date DATE;
    v_transaction_paid_at TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Buscar IDs necessários
    SELECT id INTO v_company_id FROM companies LIMIT 1;
    SELECT id INTO v_customer_id FROM customers LIMIT 1;
    SELECT id INTO v_vehicle_id FROM vehicles LIMIT 1;
    
    IF v_company_id IS NULL OR v_customer_id IS NULL OR v_vehicle_id IS NULL THEN
        RAISE EXCEPTION 'Dados básicos não encontrados. Certifique-se de ter empresa, cliente e veículo cadastrados.';
    END IF;
    
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'TESTE 1: O.S. COM AGENDAMENTO';
    RAISE NOTICE '==============================================';
    
    -- 1.1 Criar agendamento de teste
    INSERT INTO appointments (
        company_id,
        customer_id,
        vehicle_id,
        title,
        scheduled_at,
        status
    ) VALUES (
        v_company_id,
        v_customer_id,
        v_vehicle_id,
        'TESTE - Lavagem Completa',
        v_scheduled_at,
        'confirmed'
    ) RETURNING id INTO v_appointment_id;
    
    RAISE NOTICE 'Agendamento criado: % para %', v_appointment_id, v_scheduled_at;
    
    -- 1.2 Criar O.S. vinculada ao agendamento
    INSERT INTO work_orders (
        company_id,
        customer_id,
        vehicle_id,
        appointment_id,
        order_number,
        status,
        total
    ) VALUES (
        v_company_id,
        v_customer_id,
        v_vehicle_id,
        v_appointment_id,
        'TEST-AUTO-001',
        'draft',
        150.00
    ) RETURNING id, started_at INTO v_work_order_id, v_started_at;
    
    RAISE NOTICE 'O.S. criada: %', v_work_order_id;
    RAISE NOTICE 'Started_at herdado: %', v_started_at;
    
    -- Verificar se herdou corretamente
    IF v_started_at::DATE = v_scheduled_at::DATE THEN
        RAISE NOTICE '✅ PASSOU: Data herdada corretamente do agendamento';
    ELSE
        RAISE WARNING '❌ FALHOU: Data não foi herdada. Esperado: %, Obtido: %', v_scheduled_at, v_started_at;
    END IF;
    
    -- 1.3 Concluir a O.S.
    UPDATE work_orders
    SET 
        status = 'completed',
        completed_at = v_completed_at
    WHERE id = v_work_order_id;
    
    RAISE NOTICE 'O.S. concluída em: %', v_completed_at;
    
    -- Aguardar trigger processar
    PERFORM pg_sleep(0.5);
    
    -- 1.4 Verificar transação financeira
    SELECT due_date, paid_at 
    INTO v_transaction_due_date, v_transaction_paid_at
    FROM financial_transactions
    WHERE work_order_id = v_work_order_id
    AND type = 'income'
    LIMIT 1;
    
    IF v_transaction_due_date IS NOT NULL THEN
        RAISE NOTICE 'Transação criada - Due date: %, Paid at: %', v_transaction_due_date, v_transaction_paid_at;
        
        IF v_transaction_due_date = v_completed_at::DATE THEN
            RAISE NOTICE '✅ PASSOU: Transação usa data de conclusão da O.S.';
        ELSE
            RAISE WARNING '❌ FALHOU: Transação com data errada. Esperado: %, Obtido: %', v_completed_at::DATE, v_transaction_due_date;
        END IF;
    ELSE
        RAISE WARNING '❌ FALHOU: Transação financeira não foi criada';
    END IF;
    
    -- Limpar dados de teste
    DELETE FROM financial_transactions WHERE work_order_id = v_work_order_id;
    DELETE FROM work_orders WHERE id = v_work_order_id;
    DELETE FROM appointments WHERE id = v_appointment_id;
    
    RAISE NOTICE 'Dados de teste removidos';
    RAISE NOTICE '==============================================';
END $$;

-- ============================================================================
-- CENÁRIO 2: O.S. Criada SEM Agendamento (Walk-in)
-- ============================================================================

DO $$
DECLARE
    v_company_id UUID;
    v_customer_id UUID;
    v_vehicle_id UUID;
    v_work_order_id UUID;
    v_started_at TIMESTAMP WITH TIME ZONE;
    v_completed_at TIMESTAMP WITH TIME ZONE;
    v_now TIMESTAMP WITH TIME ZONE := NOW();
    v_transaction_due_date DATE;
BEGIN
    -- Buscar IDs necessários
    SELECT id INTO v_company_id FROM companies LIMIT 1;
    SELECT id INTO v_customer_id FROM customers LIMIT 1;
    SELECT id INTO v_vehicle_id FROM vehicles LIMIT 1;
    
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'TESTE 2: O.S. SEM AGENDAMENTO (WALK-IN)';
    RAISE NOTICE '==============================================';
    
    -- 2.1 Criar O.S. sem appointment_id
    INSERT INTO work_orders (
        company_id,
        customer_id,
        vehicle_id,
        appointment_id,
        order_number,
        status,
        total
    ) VALUES (
        v_company_id,
        v_customer_id,
        v_vehicle_id,
        NULL,  -- Sem agendamento
        'TEST-AUTO-002',
        'draft',
        200.00
    ) RETURNING id, started_at INTO v_work_order_id, v_started_at;
    
    RAISE NOTICE 'O.S. criada: %', v_work_order_id;
    RAISE NOTICE 'Started_at: %', v_started_at;
    
    -- Verificar se usou NOW()
    IF v_started_at IS NOT NULL THEN
        RAISE NOTICE '✅ PASSOU: Started_at foi preenchido automaticamente';
    ELSE
        RAISE WARNING '❌ FALHOU: Started_at não foi preenchido';
    END IF;
    
    -- 2.2 Concluir a O.S.
    v_completed_at := NOW();
    UPDATE work_orders
    SET 
        status = 'completed',
        completed_at = v_completed_at
    WHERE id = v_work_order_id;
    
    RAISE NOTICE 'O.S. concluída em: %', v_completed_at;
    
    -- Aguardar trigger processar
    PERFORM pg_sleep(0.5);
    
    -- 2.3 Verificar transação financeira
    SELECT due_date INTO v_transaction_due_date
    FROM financial_transactions
    WHERE work_order_id = v_work_order_id
    AND type = 'income'
    LIMIT 1;
    
    IF v_transaction_due_date IS NOT NULL THEN
        RAISE NOTICE 'Transação criada - Due date: %', v_transaction_due_date;
        
        IF v_transaction_due_date = v_completed_at::DATE THEN
            RAISE NOTICE '✅ PASSOU: Transação usa data de conclusão';
        ELSE
            RAISE WARNING '❌ FALHOU: Data incorreta';
        END IF;
    ELSE
        RAISE WARNING '❌ FALHOU: Transação não criada';
    END IF;
    
    -- Limpar dados de teste
    DELETE FROM financial_transactions WHERE work_order_id = v_work_order_id;
    DELETE FROM work_orders WHERE id = v_work_order_id;
    
    RAISE NOTICE 'Dados de teste removidos';
    RAISE NOTICE '==============================================';
END $$;

-- ============================================================================
-- RESUMO FINAL
-- ============================================================================

RAISE NOTICE '';
RAISE NOTICE '==============================================';
RAISE NOTICE 'TESTES CONCLUÍDOS';
RAISE NOTICE '==============================================';
RAISE NOTICE 'Verifique os resultados acima.';
RAISE NOTICE 'Todos os testes devem mostrar ✅ PASSOU';
RAISE NOTICE '==============================================';
