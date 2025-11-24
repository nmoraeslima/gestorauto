-- ============================================================================
-- SOLUÇÃO DEFINITIVA: Reordenar o fluxo de signup
-- ============================================================================
-- Em vez de desabilitar RLS, vamos criar uma função PostgreSQL que bypassa RLS
-- usando SECURITY DEFINER

-- 1. Criar função para criar empresa (bypassa RLS)
CREATE OR REPLACE FUNCTION create_company_for_signup(
    p_name TEXT,
    p_slug TEXT,
    p_email TEXT,
    p_phone TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER -- Esta função roda com privilégios do owner do banco
AS $$
DECLARE
    v_company_id UUID;
BEGIN
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
        p_slug,
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

-- 2. Conceder permissão para executar a função
GRANT EXECUTE ON FUNCTION create_company_for_signup(TEXT, TEXT, TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION create_company_for_signup(TEXT, TEXT, TEXT, TEXT) TO authenticated;

-- 3. Testar a função (opcional)
-- SELECT create_company_for_signup('Teste', 'teste-slug', 'teste@example.com', '11999999999');

-- ============================================================================
-- PRÓXIMO PASSO:
-- ============================================================================
-- Agora você precisa modificar o código do AuthContext.tsx para usar esta função
-- em vez de fazer INSERT direto na tabela companies.
--
-- Substitua o código de criação de empresa (linhas 78-92) por:
--
-- const { data: companyId, error: companyError } = await supabase
--     .rpc('create_company_for_signup', {
--         p_name: data.company_name,
--         p_slug: data.company_slug,
--         p_email: data.email,
--         p_phone: data.phone || null,
--     });
--
-- if (companyError) {
--     console.error('Company creation error:', companyError);
--     toast.error('Erro ao criar empresa: ' + companyError.message);
--     return { error: companyError as unknown as AuthError };
-- }
--
-- E depois use companyId em vez de company.id
-- ============================================================================
