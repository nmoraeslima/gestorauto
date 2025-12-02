-- ============================================================================
-- SCRIPT DE TESTE DE ISOLAMENTO ENTRE EMPRESAS
-- Execute este script para verificar se o RLS está funcionando corretamente
-- ============================================================================

-- 1. VERIFICAR SE RLS ESTÁ HABILITADO
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename IN ('customers', 'vehicles', 'services', 'products', 'appointments')
ORDER BY tablename;

-- 2. LISTAR TODAS AS POLÍTICAS ATIVAS
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
WHERE tablename IN ('customers', 'vehicles')
ORDER BY tablename, policyname;

-- 3. TESTAR ISOLAMENTO (Execute como usuário autenticado)
-- Este teste deve retornar apenas dados da empresa do usuário logado
SELECT 
    'customers' as table_name,
    COUNT(*) as total_records,
    COUNT(DISTINCT company_id) as distinct_companies
FROM customers
UNION ALL
SELECT 
    'vehicles' as table_name,
    COUNT(*) as total_records,
    COUNT(DISTINCT company_id) as distinct_companies
FROM vehicles;

-- 4. VERIFICAR SE HÁ COMPANY_ID DO USUÁRIO ATUAL
SELECT 
    p.id as user_id,
    p.company_id,
    p.full_name,
    c.name as company_name
FROM profiles p
JOIN companies c ON c.id = p.company_id
WHERE p.id = auth.uid();

-- 5. CONTAR REGISTROS POR EMPRESA (Apenas para debug - deve mostrar só sua empresa)
SELECT 
    company_id,
    COUNT(*) as customer_count
FROM customers
GROUP BY company_id;

SELECT 
    company_id,
    COUNT(*) as vehicle_count
FROM vehicles
GROUP BY company_id;
