-- ============================================
-- EXTEND TRIAL PERIOD TO INFINITE
-- ============================================
-- Este script estende o período de trial para 100 anos
-- Efetivamente dando acesso full-time ao sistema
-- ============================================

-- OPÇÃO 1: Estender trial para 100 anos (praticamente infinito)
-- Substitua 'seu-email@exemplo.com' pelo email da sua empresa

UPDATE companies
SET 
    trial_ends_at = NOW() + INTERVAL '100 years',
    subscription_status = 'trial'
WHERE email = 'seu-email@exemplo.com';

-- ============================================

-- OPÇÃO 2: Mudar para assinatura ATIVA (recomendado)
-- Isso remove completamente a verificação de trial

UPDATE companies
SET 
    subscription_status = 'active',
    subscription_plan = 'premium',
    subscription_ends_at = NOW() + INTERVAL '100 years'
WHERE email = 'seu-email@exemplo.com';

-- ============================================

-- VERIFICAR O RESULTADO
-- Execute este SELECT para confirmar a mudança

SELECT 
    id,
    name,
    email,
    subscription_status,
    subscription_plan,
    trial_ends_at,
    subscription_ends_at,
    CASE 
        WHEN subscription_status = 'active' THEN 'Acesso Full ✅'
        WHEN subscription_status = 'trial' AND trial_ends_at > NOW() THEN 
            'Trial ativo até ' || trial_ends_at::date
        ELSE 'Expirado ❌'
    END as status_descricao
FROM companies
WHERE email = 'seu-email@exemplo.com';

-- ============================================

-- OPÇÃO 3: Aplicar para TODAS as empresas (cuidado!)
-- Descomente apenas se quiser aplicar para todos os usuários

-- UPDATE companies
-- SET 
--     subscription_status = 'active',
--     subscription_plan = 'premium',
--     subscription_ends_at = NOW() + INTERVAL '100 years';

-- ============================================

-- NOTAS IMPORTANTES:
-- 1. Substitua 'seu-email@exemplo.com' pelo email real da empresa
-- 2. OPÇÃO 1: Mantém como trial mas por 100 anos
-- 3. OPÇÃO 2: Muda para ACTIVE (recomendado) - remove avisos de trial
-- 4. Após executar, faça logout e login novamente para atualizar o cache
-- 5. Se usar Supabase Dashboard, execute na aba SQL Editor
