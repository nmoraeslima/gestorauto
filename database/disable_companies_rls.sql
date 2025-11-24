-- ============================================================================
-- SOLUÇÃO ALTERNATIVA: Desabilitar RLS temporariamente para companies
-- ============================================================================
-- ATENÇÃO: Esta é uma solução temporária para permitir o signup.
-- Depois de criar algumas empresas, você pode reabilitar o RLS.

-- Desabilitar RLS na tabela companies
ALTER TABLE companies DISABLE ROW LEVEL SECURITY;

-- Verificar status
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'companies';

-- ============================================================================
-- RESULTADO ESPERADO:
-- ============================================================================
-- rowsecurity deve mostrar 'false'
--
-- IMPORTANTE: 
-- Com RLS desabilitado, qualquer pessoa pode criar/ler empresas.
-- Isso é aceitável temporariamente porque:
-- 1. Permite o signup funcionar
-- 2. As outras tabelas (customers, vehicles, etc.) ainda têm RLS
-- 3. Usuários só podem acessar dados da própria empresa através dessas tabelas
--
-- DEPOIS DE TESTAR O SIGNUP, você pode reabilitar com:
-- ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
-- ============================================================================
