-- ============================================================================
-- ROLLBACK SIGNUP: Função para deletar empresa "órfã" em caso de erro no cadastro
-- ============================================================================

CREATE OR REPLACE FUNCTION rollback_company_signup(p_company_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_count INTEGER;
    v_created_at TIMESTAMP WITH TIME ZONE;
BEGIN
    -- 1. Obter a data de criação da empresa
    SELECT created_at INTO v_created_at
    FROM companies
    WHERE id = p_company_id;

    -- Se não encontrar a empresa, não faz nada (pode ter sido deletada já)
    IF v_created_at IS NULL THEN
        RETURN;
    END IF;

    -- 2. Segurança: Empresa deve ser RECENTE (criada nos últimos 10 minutos)
    -- Isso evita que alguém mal intencionado tente deletar empresas antigas
    IF v_created_at < (NOW() - INTERVAL '10 minutes') THEN
        RAISE EXCEPTION 'Operação negada: Empresa antiga demais para rollback';
    END IF;

    -- 3. Segurança: Empresa não deve ter usuários vinculados
    -- Se tiver usuário, significa que o cadastro funcionou ou alguém entrou
    SELECT COUNT(*) INTO v_user_count
    FROM profiles
    WHERE company_id = p_company_id;

    IF v_user_count > 0 THEN
        RAISE EXCEPTION 'Operação negada: Empresa possui usuários ativos';
    END IF;

    -- 4. Executar a exclusão (Soft Delete ou Hard Delete?)
    -- Como é um rollback de cadastro falho, fazemos Hard Delete para não sujar o banco
    DELETE FROM companies
    WHERE id = p_company_id;

    -- Se existissem outras tabelas vinculadas (logs, etc), o CASCADE cuidaria
    -- ou deveríamos deletar manualmente. Por enquanto, companies é a raiz.
END;
$$;
