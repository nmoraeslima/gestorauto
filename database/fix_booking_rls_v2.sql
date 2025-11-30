-- ============================================================================
-- FIX: Complete RLS Policies for Public Booking
-- Execute este SQL para corrigir completamente as policies
-- ============================================================================

-- 1. REMOVER todas as policies antigas que podem estar conflitando
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Drop all existing policies on customers
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'customers' AND policyname LIKE '%booking%') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON customers';
    END LOOP;
    
    -- Drop all existing policies on vehicles
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'vehicles' AND policyname LIKE '%booking%') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON vehicles';
    END LOOP;
    
    -- Drop all existing policies on appointments
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'appointments' AND policyname LIKE '%booking%') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON appointments';
    END LOOP;
    
    -- Drop all existing policies on appointment_services
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'appointment_services' AND policyname LIKE '%booking%') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON appointment_services';
    END LOOP;
END $$;

-- 2. CUSTOMERS - Permitir SELECT e INSERT público
CREATE POLICY "booking_public_select_customers"
    ON customers FOR SELECT
    TO public
    USING (true);

CREATE POLICY "booking_public_insert_customers"
    ON customers FOR INSERT
    TO public
    WITH CHECK (source = 'booking');

-- 3. VEHICLES - Permitir SELECT e INSERT público
CREATE POLICY "booking_public_select_vehicles"
    ON vehicles FOR SELECT
    TO public
    USING (true);

CREATE POLICY "booking_public_insert_vehicles"
    ON vehicles FOR INSERT
    TO public
    WITH CHECK (true);

-- 4. APPOINTMENTS - Permitir INSERT público
CREATE POLICY "booking_public_insert_appointments"
    ON appointments FOR INSERT
    TO public
    WITH CHECK (status = 'scheduled');

-- 5. APPOINTMENT_SERVICES - Permitir INSERT público
CREATE POLICY "booking_public_insert_appointment_services"
    ON appointment_services FOR INSERT
    TO public
    WITH CHECK (true);

-- 6. Verificar se RLS está habilitado
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_services ENABLE ROW LEVEL SECURITY;

-- 7. Verificar policies criadas
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename IN ('customers', 'vehicles', 'appointments', 'appointment_services')
    AND policyname LIKE '%booking%'
ORDER BY tablename, policyname;
