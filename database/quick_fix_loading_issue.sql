-- SOLUÇÃO RÁPIDA: Verificar e criar dados faltantes
-- Execute este script no Supabase SQL Editor

-- 1. Verificar se o usuário tem perfil
DO $$
DECLARE
    v_user_id uuid;
    v_company_id uuid;
    v_profile_exists boolean;
BEGIN
    -- Pegar o ID do usuário pelo email
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = 'nmoraes.lima@outlook.com';
    
    IF v_user_id IS NULL THEN
        RAISE NOTICE 'Usuário não encontrado!';
        RETURN;
    END IF;
    
    -- Verificar se perfil existe
    SELECT EXISTS(SELECT 1 FROM profiles WHERE id = v_user_id) INTO v_profile_exists;
    
    IF NOT v_profile_exists THEN
        RAISE NOTICE 'Perfil não existe! Criando...';
        
        -- Criar empresa primeiro
        INSERT INTO companies (name, slug, email, subscription_status, subscription_plan, trial_ends_at, max_users, max_customers)
        VALUES ('Minha Empresa', 'minha-empresa-' || substring(v_user_id::text, 1, 8), 'nmoraes.lima@outlook.com', 'trial', 'basic', NOW() + INTERVAL '7 days', 2, 50)
        RETURNING id INTO v_company_id;
        
        -- Criar perfil
        INSERT INTO profiles (id, company_id, full_name, email, role, is_active)
        VALUES (v_user_id, v_company_id, 'Natan Lima', 'nmoraes.lima@outlook.com', 'owner', true);
        
        RAISE NOTICE 'Perfil e empresa criados com sucesso!';
    ELSE
        RAISE NOTICE 'Perfil já existe!';
    END IF;
END $$;

-- 2. Verificar resultado
SELECT 
    p.id as profile_id,
    p.full_name,
    p.email,
    p.role,
    c.id as company_id,
    c.name as company_name,
    c.subscription_status
FROM profiles p
JOIN companies c ON c.id = p.company_id
WHERE p.email = 'nmoraes.lima@outlook.com';
