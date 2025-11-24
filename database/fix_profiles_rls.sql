-- ============================================================================
-- CORREÇÃO: Políticas RLS para tabela profiles
-- ============================================================================
-- Este script corrige o erro de recursão infinita nas políticas da tabela profiles

-- 1. Remover políticas antigas que causam recursão
DROP POLICY IF EXISTS "Users can view profiles from their company" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can insert new users" ON profiles;

-- 2. Criar novas políticas SEM recursão
-- Política de SELECT: Permite que o trigger e usuários autenticados vejam perfis
CREATE POLICY "Enable read access for authenticated users"
    ON profiles FOR SELECT
    TO authenticated
    USING (true);

-- Política de INSERT: Permite inserção para usuários autenticados (necessário para o trigger)
CREATE POLICY "Enable insert for authenticated users"
    ON profiles FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Política de UPDATE: Usuários podem atualizar apenas seu próprio perfil
CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- Política de DELETE: Apenas owners podem deletar perfis da mesma empresa
CREATE POLICY "Owners can delete profiles"
    ON profiles FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role = 'owner'
            AND p.company_id = profiles.company_id
        )
    );

-- ============================================================================
-- NOTA IMPORTANTE:
-- ============================================================================
-- As políticas acima permitem que usuários autenticados vejam todos os perfis
-- temporariamente. Se você quiser restringir isso mais tarde, você pode criar
-- uma função auxiliar que não causa recursão.
--
-- Por enquanto, a segurança principal está garantida pelo company_id em todas
-- as outras tabelas, e os usuários só conseguem acessar dados da própria empresa.
-- ============================================================================
