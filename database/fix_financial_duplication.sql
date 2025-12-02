-- ============================================================================
-- CORREÇÃO CRÍTICA: Duplicação de Transações Financeiras
-- ============================================================================
-- Problema: Ao editar uma O.S. completa, o trigger cria transações duplicadas
-- Solução: Verificar se já existe transação antes de criar nova
-- ============================================================================

-- 1. REMOVER TRIGGER ANTIGO
DROP TRIGGER IF EXISTS deduct_stock_on_work_order_completion ON work_orders;

-- 2. CRIAR FUNÇÃO CORRIGIDA
CREATE OR REPLACE FUNCTION deduct_stock_on_work_order_completion()
RETURNS TRIGGER AS $$
DECLARE
    v_transaction_exists BOOLEAN;
BEGIN
    -- Só executa se o status mudou para 'completed'
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
        
        -- VERIFICAR SE JÁ EXISTE TRANSAÇÃO FINANCEIRA PARA ESTA O.S.
        SELECT EXISTS (
            SELECT 1 
            FROM financial_transactions 
            WHERE work_order_id = NEW.id
            AND type = 'income'
        ) INTO v_transaction_exists;
        
        -- Deduzir produtos do estoque
        UPDATE products p
        SET quantity = p.quantity - wop.quantity
        FROM work_order_products wop
        WHERE wop.work_order_id = NEW.id
          AND wop.product_id = p.id
          AND wop.company_id = NEW.company_id;
        
        -- Registrar transação financeira APENAS SE NÃO EXISTIR
        IF NOT v_transaction_exists THEN
            INSERT INTO financial_transactions (
                company_id,
                type,
                category,
                description,
                amount,
                status,
                due_date,
                paid_at,
                work_order_id,
                customer_id
            )
            VALUES (
                NEW.company_id,
                'income',
                'Serviço',
                'O.S. #' || NEW.order_number,
                NEW.total,
                'paid',
                CURRENT_DATE,
                NOW(),
                NEW.id,
                NEW.customer_id
            );
            
            RAISE NOTICE 'Transação financeira criada para O.S. %', NEW.order_number;
        ELSE
            RAISE NOTICE 'Transação financeira já existe para O.S. %, pulando criação', NEW.order_number;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. RECRIAR TRIGGER
CREATE TRIGGER deduct_stock_on_work_order_completion
    AFTER UPDATE ON work_orders
    FOR EACH ROW
    EXECUTE FUNCTION deduct_stock_on_work_order_completion();

-- 4. LIMPAR TRANSAÇÕES DUPLICADAS (OPCIONAL - CUIDADO!)
-- Execute este bloco APENAS se quiser remover duplicatas existentes
-- Descomente as linhas abaixo com cuidado

/*
DO $$
DECLARE
    v_deleted_count INTEGER;
BEGIN
    -- Deletar transações duplicadas, mantendo apenas a mais antiga
    WITH duplicates AS (
        SELECT 
            id,
            work_order_id,
            ROW_NUMBER() OVER (
                PARTITION BY work_order_id 
                ORDER BY created_at ASC
            ) as rn
        FROM financial_transactions
        WHERE work_order_id IS NOT NULL
        AND type = 'income'
    )
    DELETE FROM financial_transactions
    WHERE id IN (
        SELECT id FROM duplicates WHERE rn > 1
    );
    
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RAISE NOTICE 'Removidas % transações duplicadas', v_deleted_count;
END $$;
*/

-- 5. VERIFICAÇÃO FINAL
SELECT 
    wo.order_number,
    wo.status,
    COUNT(ft.id) as transaction_count,
    SUM(ft.amount) as total_amount
FROM work_orders wo
LEFT JOIN financial_transactions ft ON ft.work_order_id = wo.id AND ft.type = 'income'
WHERE wo.status = 'completed'
GROUP BY wo.id, wo.order_number, wo.status
HAVING COUNT(ft.id) > 1
ORDER BY transaction_count DESC;

-- Se retornar linhas, significa que ainda há duplicatas
