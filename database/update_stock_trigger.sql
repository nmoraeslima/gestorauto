-- ============================================================================
-- CORREÇÃO CRÍTICA: Baixa de Estoque e Transações Financeiras
-- ============================================================================
-- Problema: Ao editar O.S. completa, estoque é baixado novamente
-- Solução: Verificar se já houve baixa de estoque antes de executar
-- ============================================================================

DROP TRIGGER IF EXISTS deduct_stock_on_work_order_completion ON work_orders;

CREATE OR REPLACE FUNCTION deduct_stock_on_work_order_completion()
RETURNS TRIGGER AS $$
DECLARE
    product_record RECORD;
    v_transaction_exists BOOLEAN;
    v_stock_movement_exists BOOLEAN;
BEGIN
    -- Só executa se o status mudou para 'completed'
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
        
        -- VERIFICAR SE JÁ EXISTE TRANSAÇÃO FINANCEIRA
        SELECT EXISTS (
            SELECT 1 
            FROM financial_transactions 
            WHERE work_order_id = NEW.id
            AND type = 'income'
        ) INTO v_transaction_exists;
        
        -- VERIFICAR SE JÁ HOUVE BAIXA DE ESTOQUE
        SELECT EXISTS (
            SELECT 1 
            FROM stock_movements 
            WHERE reason LIKE 'Uso na O.S. #' || NEW.order_number || '%'
            AND type = 'exit'
        ) INTO v_stock_movement_exists;
        
        -- BAIXAR ESTOQUE APENAS SE NÃO FOI FEITO ANTES
        IF NOT v_stock_movement_exists THEN
            -- Iterar sobre os produtos da O.S.
            FOR product_record IN 
                SELECT * FROM work_order_products 
                WHERE work_order_id = NEW.id 
                AND company_id = NEW.company_id
            LOOP
                -- 1. Baixar Estoque
                UPDATE products 
                SET quantity = quantity - product_record.quantity
                WHERE id = product_record.product_id;

                -- 2. Registrar Movimentação
                INSERT INTO stock_movements (
                    company_id,
                    product_id,
                    type,
                    quantity,
                    reason,
                    created_by,
                    created_at
                ) VALUES (
                    NEW.company_id,
                    product_record.product_id,
                    'exit',
                    product_record.quantity,
                    'Uso na O.S. #' || NEW.order_number,
                    NEW.assigned_to,
                    NOW()
                );
            END LOOP;
            
            RAISE NOTICE 'Estoque baixado para O.S. %', NEW.order_number;
        ELSE
            RAISE NOTICE 'Estoque já foi baixado para O.S. %, pulando baixa', NEW.order_number;
        END IF;
        
        -- REGISTRAR TRANSAÇÃO FINANCEIRA APENAS SE NÃO EXISTIR
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

CREATE TRIGGER deduct_stock_on_work_order_completion
    AFTER UPDATE ON work_orders
    FOR EACH ROW
    EXECUTE FUNCTION deduct_stock_on_work_order_completion();

-- ============================================================================
-- VERIFICAÇÃO: Detectar duplicações de baixa de estoque
-- ============================================================================

-- Verificar se há movimentações duplicadas
SELECT 
    reason,
    COUNT(*) as movement_count,
    SUM(quantity) as total_quantity
FROM stock_movements
WHERE type = 'exit'
AND reason LIKE 'Uso na O.S. #%'
GROUP BY reason
HAVING COUNT(*) > 1
ORDER BY movement_count DESC;

-- Se retornar linhas, há duplicações!
