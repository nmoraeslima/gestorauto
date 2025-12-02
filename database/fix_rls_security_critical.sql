-- ============================================================================
-- VERIFICAÇÃO E CORREÇÃO CRÍTICA DE SEGURANÇA - RLS
-- Este script garante o isolamento total entre empresas
-- ============================================================================

-- 1. VERIFICAR SE RLS ESTÁ HABILITADO
DO $$
BEGIN
    -- Habilitar RLS em todas as tabelas críticas
    ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
    ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
    ALTER TABLE services ENABLE ROW LEVEL SECURITY;
    ALTER TABLE products ENABLE ROW LEVEL SECURITY;
    ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
    ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;
    ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;
    
    RAISE NOTICE 'RLS habilitado em todas as tabelas';
END $$;

-- 2. REMOVER TODAS AS POLÍTICAS EXISTENTES DE CUSTOMERS
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'customers'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON customers';
        RAISE NOTICE 'Política removida: %', r.policyname;
    END LOOP;
END $$;

-- 3. CRIAR POLÍTICAS CORRETAS PARA CUSTOMERS
CREATE POLICY "customers_select_own_company"
    ON customers FOR SELECT
    USING (
        company_id IN (
            SELECT company_id 
            FROM profiles 
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "customers_insert_own_company"
    ON customers FOR INSERT
    WITH CHECK (
        company_id IN (
            SELECT company_id 
            FROM profiles 
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "customers_update_own_company"
    ON customers FOR UPDATE
    USING (
        company_id IN (
            SELECT company_id 
            FROM profiles 
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "customers_delete_own_company"
    ON customers FOR DELETE
    USING (
        company_id IN (
            SELECT company_id 
            FROM profiles 
            WHERE id = auth.uid()
        )
    );

-- 4. REMOVER TODAS AS POLÍTICAS EXISTENTES DE VEHICLES
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'vehicles'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON vehicles';
        RAISE NOTICE 'Política removida: %', r.policyname;
    END LOOP;
END $$;

-- 5. CRIAR POLÍTICAS CORRETAS PARA VEHICLES
CREATE POLICY "vehicles_select_own_company"
    ON vehicles FOR SELECT
    USING (
        company_id IN (
            SELECT company_id 
            FROM profiles 
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "vehicles_insert_own_company"
    ON vehicles FOR INSERT
    WITH CHECK (
        company_id IN (
            SELECT company_id 
            FROM profiles 
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "vehicles_update_own_company"
    ON vehicles FOR UPDATE
    USING (
        company_id IN (
            SELECT company_id 
            FROM profiles 
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "vehicles_delete_own_company"
    ON vehicles FOR DELETE
    USING (
        company_id IN (
            SELECT company_id 
            FROM profiles 
            WHERE id = auth.uid()
        )
    );

-- 6. VERIFICAÇÃO FINAL
DO $$
DECLARE
    customer_count INTEGER;
    vehicle_count INTEGER;
BEGIN
    -- Contar políticas de customers
    SELECT COUNT(*) INTO customer_count
    FROM pg_policies
    WHERE tablename = 'customers';
    
    -- Contar políticas de vehicles
    SELECT COUNT(*) INTO vehicle_count
    FROM pg_policies
    WHERE tablename = 'vehicles';
    
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'VERIFICAÇÃO FINAL DE SEGURANÇA';
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'Políticas em customers: %', customer_count;
    RAISE NOTICE 'Políticas em vehicles: %', vehicle_count;
    RAISE NOTICE '==============================================';
    
    IF customer_count < 4 OR vehicle_count < 4 THEN
        RAISE WARNING 'ATENÇÃO: Número insuficiente de políticas!';
    ELSE
        RAISE NOTICE 'Segurança configurada corretamente!';
    END IF;
END $$;
