-- ============================================================================
-- VERIFICAR E CORRIGIR RLS POLICIES
-- ============================================================================

-- 1. Verificar políticas atuais de profiles
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
WHERE tablename = 'profiles';

-- 2. Verificar políticas atuais de companies
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
WHERE tablename = 'companies';

-- ============================================================================
-- CORRIGIR POLÍTICAS SE NECESSÁRIO
-- ============================================================================

-- Dropar políticas antigas de profiles
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Owners can delete profiles" ON profiles;

-- Criar políticas corretas para profiles
CREATE POLICY "Users can view their own profile"
ON profiles FOR SELECT
TO authenticated
USING (id = auth.uid());

CREATE POLICY "Users can view profiles from their company"
ON profiles FOR SELECT
TO authenticated
USING (
    company_id IN (
        SELECT company_id 
        FROM profiles 
        WHERE id = auth.uid()
    )
);

CREATE POLICY "Users can update their own profile"
ON profiles FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

CREATE POLICY "Admins can insert profiles"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (
    company_id IN (
        SELECT company_id 
        FROM profiles 
        WHERE id = auth.uid() 
        AND role IN ('owner', 'admin')
    )
);

CREATE POLICY "Owners can delete profiles"
ON profiles FOR DELETE
TO authenticated
USING (
    company_id IN (
        SELECT company_id 
        FROM profiles 
        WHERE id = auth.uid() 
        AND role = 'owner'
    )
);

-- Dropar políticas antigas de companies
DROP POLICY IF EXISTS "Users can view their own company" ON companies;
DROP POLICY IF EXISTS "Owners can update their company" ON companies;
DROP POLICY IF EXISTS "companies_allow_insert" ON companies;

-- Criar políticas corretas para companies
CREATE POLICY "Users can view their own company"
ON companies FOR SELECT
TO authenticated
USING (
    id IN (
        SELECT company_id 
        FROM profiles 
        WHERE id = auth.uid()
    )
);

CREATE POLICY "Owners can update their company"
ON companies FOR UPDATE
TO authenticated
USING (
    id IN (
        SELECT company_id 
        FROM profiles 
        WHERE id = auth.uid() 
        AND role = 'owner'
    )
)
WITH CHECK (
    id IN (
        SELECT company_id 
        FROM profiles 
        WHERE id = auth.uid() 
        AND role = 'owner'
    )
);

-- Política para signup (já existe via função SECURITY DEFINER)
CREATE POLICY "Allow signup to create company"
ON companies FOR INSERT
TO authenticated, anon
WITH CHECK (true);

-- ============================================================================
-- TESTAR ACESSO
-- ============================================================================

-- Teste 1: Ver seu próprio perfil (deve funcionar)
SELECT * FROM profiles WHERE id = auth.uid();

-- Teste 2: Ver sua empresa (deve funcionar)
SELECT c.* 
FROM companies c
JOIN profiles p ON p.company_id = c.id
WHERE p.id = auth.uid();

-- Teste 3: Ver perfis da sua empresa (deve funcionar)
SELECT p.* 
FROM profiles p
WHERE p.company_id = (
    SELECT company_id 
    FROM profiles 
    WHERE id = auth.uid()
);
