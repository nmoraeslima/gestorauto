-- ============================================================================
-- MELHORIA: Função de signup com slug único automático
-- ============================================================================

-- Substituir a função anterior por uma versão melhorada
CREATE OR REPLACE FUNCTION create_company_for_signup(
    p_name TEXT,
    p_slug TEXT,
    p_email TEXT,
    p_phone TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_company_id UUID;
    v_final_slug TEXT;
    v_slug_exists BOOLEAN;
    v_counter INTEGER := 1;
BEGIN
    -- Verificar se o slug já existe
    v_final_slug := p_slug;
    
    LOOP
        SELECT EXISTS(SELECT 1 FROM companies WHERE slug = v_final_slug) INTO v_slug_exists;
        
        -- Se o slug não existe, usar ele
        IF NOT v_slug_exists THEN
            EXIT;
        END IF;
        
        -- Se existe, adicionar um número ao final
        v_final_slug := p_slug || '-' || v_counter;
        v_counter := v_counter + 1;
        
        -- Limite de segurança para evitar loop infinito
        IF v_counter > 100 THEN
            RAISE EXCEPTION 'Não foi possível gerar um slug único após 100 tentativas';
        END IF;
    END LOOP;
    
    -- Inserir a empresa com o slug único
    INSERT INTO companies (
        name,
        slug,
        email,
        phone,
        subscription_status,
        subscription_plan,
        trial_ends_at,
        max_users,
        max_customers
    )
    VALUES (
        p_name,
        v_final_slug,
        p_email,
        p_phone,
        'trial',
        'basic',
        NOW() + INTERVAL '7 days',
        2,
        50
    )
    RETURNING id INTO v_company_id;
    
    RETURN v_company_id;
END;
$$;

-- Verificar se a função foi atualizada
SELECT 
    routine_name,
    routine_type,
    security_type
FROM information_schema.routines
WHERE routine_name = 'create_company_for_signup';

-- ============================================================================
-- AGORA A FUNÇÃO:
-- ============================================================================
-- 1. Verifica se o slug já existe
-- 2. Se existir, adiciona um número ao final (ex: minha-empresa-1, minha-empresa-2)
-- 3. Tenta até encontrar um slug único
-- 4. Cria a empresa com o slug único
-- ============================================================================
