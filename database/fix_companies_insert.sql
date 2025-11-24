-- ============================================================================
-- SOLUÇÃO COMPLETA: RLS + Permissões para tabela companies
-- ============================================================================

-- PASSO 1: Remover TODAS as políticas de INSERT
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
        RAISE NOTICE 'Dropped policy: %', pol.policyname;
    END LOOP;
END $$;

-- PASSO 2: Garantir que RLS está habilitado
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- PASSO 3: Conceder permissões explícitas
GRANT INSERT ON companies TO anon;
GRANT INSERT ON companies TO authenticated;
GRANT SELECT ON companies TO anon;
GRANT SELECT ON companies TO authenticated;

-- PASSO 4: Criar política de INSERT sem restrições
CREATE POLICY "companies_allow_insert"
    ON companies 
    FOR INSERT 
    TO anon, authenticated
    WITH CHECK (true);

-- PASSO 5: Verificar as políticas criadas
SELECT 
    tablename,
    policyname,
    cmd,
    roles,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'companies'
ORDER BY cmd, policyname;

-- ============================================================================
-- RESULTADO ESPERADO:
-- ============================================================================
-- Você deve ver uma política chamada "companies_allow_insert" 
-- com cmd = 'INSERT' e with_check = 'true'
-- ============================================================================
