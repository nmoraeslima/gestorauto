-- ============================================================================
-- CORREÇÃO DEFINITIVA: Remover TODAS as políticas de INSERT e criar uma nova
-- ============================================================================

-- 1. Listar e remover TODAS as políticas de INSERT existentes
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'companies' 
        AND cmd = 'INSERT'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON companies', pol.policyname);
    END LOOP;
END $$;

-- 2. Criar UMA ÚNICA política de INSERT sem restrições
CREATE POLICY "companies_insert_policy"
    ON companies 
    FOR INSERT 
    WITH CHECK (true);

-- 3. Verificar se a política foi criada
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'companies' 
AND cmd = 'INSERT';

-- ============================================================================
-- Se ainda não funcionar, execute este comando adicional:
-- ============================================================================
-- ALTER TABLE companies FORCE ROW LEVEL SECURITY;
-- GRANT INSERT ON companies TO anon, authenticated;
-- ============================================================================
