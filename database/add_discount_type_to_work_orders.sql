-- ============================================================================
-- MIGRAÇÃO: Adicionar Campo discount_type em Work Orders
-- ============================================================================
-- Adiciona campo para diferenciar desconto percentual de desconto fixo
-- ============================================================================

-- 1. ADICIONAR COLUNA discount_type
ALTER TABLE work_orders 
ADD COLUMN IF NOT EXISTS discount_type VARCHAR(20) DEFAULT 'fixed' 
CHECK (discount_type IN ('percentage', 'fixed'));

-- 2. ATUALIZAR REGISTROS EXISTENTES
-- Define como 'fixed' para todos os registros existentes
UPDATE work_orders
SET discount_type = 'fixed'
WHERE discount_type IS NULL;

-- 3. CRIAR ÍNDICE (opcional, para queries)
CREATE INDEX IF NOT EXISTS idx_work_orders_discount_type ON work_orders(discount_type);

-- 4. COMENTÁRIO EXPLICATIVO
COMMENT ON COLUMN work_orders.discount_type IS 'Tipo de desconto: percentage (%) ou fixed (valor absoluto)';

-- 5. VERIFICAÇÃO
SELECT 
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'work_orders'
AND column_name = 'discount_type';

-- Deve retornar: discount_type | character varying | 'fixed' | YES
