-- Verificar dados do usuário que está tentando fazer login
-- Substitua o email pelo seu email de login

-- 1. Verificar se o usuário existe no auth
SELECT 
    id,
    email,
    created_at,
    email_confirmed_at
FROM auth.users
WHERE email = 'nmoraes.lima@outlook.com';

-- 2. Verificar se existe perfil para este usuário
SELECT 
    p.id,
    p.company_id,
    p.full_name,
    p.email,
    p.role,
    p.is_active,
    p.created_at
FROM profiles p
WHERE p.id = (SELECT id FROM auth.users WHERE email = 'nmoraes.lima@outlook.com');

-- 3. Verificar se existe empresa associada
SELECT 
    c.id,
    c.name,
    c.slug,
    c.email,
    c.subscription_status,
    c.subscription_plan,
    c.trial_ends_at,
    c.created_at
FROM companies c
WHERE c.id = (
    SELECT company_id 
    FROM profiles 
    WHERE id = (SELECT id FROM auth.users WHERE email = 'nmoraes.lima@outlook.com')
);

-- 4. Verificar se há problemas de RLS (Row Level Security)
-- Execute este comando como superuser ou com permissões adequadas
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
WHERE tablename IN ('profiles', 'companies')
ORDER BY tablename, policyname;
