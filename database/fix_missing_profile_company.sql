-- Script para criar perfil e empresa manualmente para usuário existente
-- IMPORTANTE: Substitua os valores conforme necessário

-- 1. Criar empresa (se não existir)
INSERT INTO companies (
    id,
    name,
    slug,
    email,
    subscription_status,
    subscription_plan,
    trial_ends_at,
    max_users,
    max_customers
)
VALUES (
    gen_random_uuid(), -- ID será gerado automaticamente
    'Minha Empresa', -- ALTERE: Nome da sua empresa
    'minha-empresa', -- ALTERE: Slug único (sem espaços, tudo minúsculo)
    'nmoraes.lima@outlook.com', -- ALTERE: Seu email
    'trial', -- Status inicial: trial
    'basic', -- Plano inicial: basic
    NOW() + INTERVAL '7 days', -- Trial de 7 dias
    2, -- Máximo de usuários no plano basic
    50 -- Máximo de clientes no plano basic
)
ON CONFLICT (slug) DO NOTHING
RETURNING id, name, slug;

-- 2. Criar perfil (se não existir)
-- IMPORTANTE: Substitua o user_id pelo ID retornado na consulta 1 do debug
INSERT INTO profiles (
    id,
    company_id,
    full_name,
    email,
    role,
    is_active
)
VALUES (
    '7ae248e7-4356-433d-a8ca-66a754935f9c', -- ALTERE: ID do usuário (da consulta 1)
    (SELECT id FROM companies WHERE email = 'nmoraes.lima@outlook.com'), -- Pega o ID da empresa criada acima
    'Natan Lima', -- ALTERE: Seu nome completo
    'nmoraes.lima@outlook.com', -- ALTERE: Seu email
    'owner', -- Papel: owner (dono da empresa)
    true -- Ativo
)
ON CONFLICT (id) DO UPDATE
SET 
    company_id = EXCLUDED.company_id,
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email
RETURNING id, company_id, full_name, email;

-- 3. Verificar se foi criado corretamente
SELECT 
    p.id as profile_id,
    p.full_name,
    p.email as profile_email,
    p.role,
    c.id as company_id,
    c.name as company_name,
    c.subscription_status
FROM profiles p
JOIN companies c ON c.id = p.company_id
WHERE p.id = '7ae248e7-4356-433d-a8ca-66a754935f9c'; -- ALTERE: ID do usuário
