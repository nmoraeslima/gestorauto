-- ============================================================================
-- DEBUG: Verificar dados do usuário atual
-- ============================================================================

-- 1. Ver todos os usuários do auth
SELECT 
    id,
    email,
    created_at,
    raw_user_meta_data
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;

-- 2. Ver perfis criados
SELECT 
    id,
    company_id,
    full_name,
    email,
    role,
    created_at
FROM profiles
ORDER BY created_at DESC
LIMIT 5;

-- 3. Ver empresas criadas
SELECT 
    id,
    name,
    slug,
    email,
    subscription_status,
    trial_ends_at,
    created_at
FROM companies
ORDER BY created_at DESC
LIMIT 5;

-- 4. Verificar se há usuários sem perfil
SELECT 
    u.id,
    u.email,
    p.id as profile_id
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
WHERE p.id IS NULL;

-- 5. Verificar se há perfis sem empresa
SELECT 
    p.id,
    p.email,
    p.company_id,
    c.id as company_exists
FROM profiles p
LEFT JOIN companies c ON c.id = p.company_id
WHERE c.id IS NULL;

-- ============================================================================
-- SE ENCONTRAR PROBLEMAS:
-- ============================================================================
-- Se houver usuário sem perfil, execute:
-- DELETE FROM auth.users WHERE id = 'USER_ID_AQUI';
--
-- Se houver perfil sem empresa, execute:
-- DELETE FROM profiles WHERE id = 'PROFILE_ID_AQUI';
-- ============================================================================
