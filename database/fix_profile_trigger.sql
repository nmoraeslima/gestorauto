-- ============================================================================
-- CORREÇÃO: Trigger de criação de perfil com SECURITY DEFINER
-- ============================================================================

-- 1. Remover o trigger antigo
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. Remover a função antiga
DROP FUNCTION IF EXISTS create_profile_for_new_user();

-- 3. Criar nova função com SECURITY DEFINER (bypassa RLS)
CREATE OR REPLACE FUNCTION create_profile_for_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER -- Roda com privilégios do owner, bypassa RLS
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, company_id, full_name, email, role)
    VALUES (
        NEW.id,
        (NEW.raw_user_meta_data->>'company_id')::UUID,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuário'),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'role', 'owner')
    );
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log do erro mas não falha o signup
        RAISE WARNING 'Error creating profile: %', SQLERRM;
        RETURN NEW;
END;
$$;

-- 4. Recriar o trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_profile_for_new_user();

-- 5. Verificar se o trigger foi criado
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- ============================================================================
-- RESULTADO ESPERADO:
-- ============================================================================
-- Você deve ver o trigger 'on_auth_user_created' listado
-- ============================================================================
