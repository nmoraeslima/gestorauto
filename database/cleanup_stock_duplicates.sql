-- ============================================================================
-- LIMPEZA: Remover Duplicações de Baixa de Estoque
-- ============================================================================
-- ATENÇÃO: Execute com cuidado! Este script remove movimentações duplicadas
-- ============================================================================

-- VERIFICAR SE A TABELA EXISTE
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'stock_movements'
    ) THEN
        RAISE NOTICE 'AVISO: Tabela stock_movements não existe!';
        RAISE NOTICE 'Execute primeiro: database/create_stock_movements.sql';
        RAISE EXCEPTION 'Tabela stock_movements não encontrada';
    END IF;
END $$;

-- 1. IDENTIFICAR DUPLICAÇÕES
SELECT 
    sm.reason,
    sm.product_id,
    p.name as product_name,
    COUNT(*) as duplicate_count,
    SUM(sm.quantity) as total_quantity_deducted,
    MIN(sm.created_at) as first_movement,
    MAX(sm.created_at) as last_movement
FROM stock_movements sm
JOIN products p ON p.id = sm.product_id
WHERE sm.type = 'exit'
AND sm.reason LIKE 'Uso na O.S. #%'
GROUP BY sm.reason, sm.product_id, p.name
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- 2. REVERTER ESTOQUE DAS DUPLICAÇÕES
-- Este bloco calcula quanto foi baixado a mais e devolve ao estoque
DO $$
DECLARE
    duplicate_record RECORD;
    v_excess_quantity DECIMAL(10, 3);
    v_corrected_count INTEGER := 0;
BEGIN
    FOR duplicate_record IN 
        SELECT 
            sm.product_id,
            sm.reason,
            COUNT(*) - 1 as excess_movements,
            SUM(sm.quantity) - MIN(sm.quantity) as excess_quantity
        FROM stock_movements sm
        WHERE sm.type = 'exit'
        AND sm.reason LIKE 'Uso na O.S. #%'
        GROUP BY sm.product_id, sm.reason
        HAVING COUNT(*) > 1
    LOOP
        -- Devolver ao estoque a quantidade baixada a mais
        UPDATE products
        SET quantity = quantity + duplicate_record.excess_quantity
        WHERE id = duplicate_record.product_id;
        
        v_corrected_count := v_corrected_count + 1;
        
        RAISE NOTICE 'Produto % - Devolvido %.3f unidades ao estoque', 
            duplicate_record.product_id, 
            duplicate_record.excess_quantity;
    END LOOP;
    
    IF v_corrected_count = 0 THEN
        RAISE NOTICE 'Nenhuma duplicação encontrada para corrigir';
    ELSE
        RAISE NOTICE 'Total de produtos corrigidos: %', v_corrected_count;
    END IF;
END $$;

-- 3. REMOVER MOVIMENTAÇÕES DUPLICADAS
-- Mantém apenas a primeira movimentação de cada O.S.
WITH duplicates AS (
    SELECT 
        id,
        reason,
        product_id,
        ROW_NUMBER() OVER (
            PARTITION BY reason, product_id 
            ORDER BY created_at ASC
        ) as rn
    FROM stock_movements
    WHERE type = 'exit'
    AND reason LIKE 'Uso na O.S. #%'
)
DELETE FROM stock_movements
WHERE id IN (
    SELECT id FROM duplicates WHERE rn > 1
);

-- 4. VERIFICAÇÃO FINAL
SELECT 
    'Movimentações duplicadas restantes' as check_type,
    COUNT(*) as count
FROM (
    SELECT reason, product_id
    FROM stock_movements
    WHERE type = 'exit'
    AND reason LIKE 'Uso na O.S. #%'
    GROUP BY reason, product_id
    HAVING COUNT(*) > 1
) duplicates;

-- Deve retornar 0 se tudo foi corrigido
