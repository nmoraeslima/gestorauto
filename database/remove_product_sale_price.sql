-- ============================================================================
-- MIGRAÇÃO: Remover Campo sale_price de Produtos
-- ============================================================================
-- Remove o campo de preço de venda pois não faz sentido para o negócio
-- ============================================================================

-- 1. REMOVER COLUNA sale_price
ALTER TABLE products 
DROP COLUMN IF EXISTS sale_price;

-- 2. VERIFICAÇÃO
SELECT 
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'products'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Deve listar as colunas sem sale_price

-- 3. COMENTÁRIO EXPLICATIVO
COMMENT ON TABLE products IS 'Produtos para controle de estoque. Preço é definido apenas como custo (cost_price) para controle interno.';
