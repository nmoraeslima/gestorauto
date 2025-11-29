-- ============================================================================
-- FIX: Public Booking RLS Policies
-- ============================================================================
-- Este arquivo corrige as políticas RLS para permitir agendamento público

-- 1. DROP policies conflitantes (se existirem)
DROP POLICY IF EXISTS "Public can view company info for booking" ON companies;
DROP POLICY IF EXISTS "Public can view active services for booking" ON services;
DROP POLICY IF EXISTS "Public can create appointments" ON appointments;
DROP POLICY IF EXISTS "Public can create appointment services" ON appointment_services;
DROP POLICY IF EXISTS "Public can create customers via booking" ON customers;
DROP POLICY IF EXISTS "Public can create vehicles via booking" ON vehicles;

-- 2. Recriar policies corretas

-- Companies: permitir leitura pública apenas se booking habilitado
CREATE POLICY "booking_public_read_companies"
    ON companies FOR SELECT
    TO anon, authenticated
    USING ((booking_settings->>'enabled')::boolean = true);

-- Services: permitir leitura pública de serviços ativos
CREATE POLICY "booking_public_read_services"
    ON services FOR SELECT
    TO anon, authenticated
    USING (is_active = true);

-- Customers: permitir criação e leitura pública
CREATE POLICY "booking_public_insert_customers"
    ON customers FOR INSERT
    TO anon, authenticated
    WITH CHECK (source = 'booking');

CREATE POLICY "booking_public_select_customers"
    ON customers FOR SELECT
    TO anon, authenticated
    USING (true);

-- Vehicles: permitir criação e leitura pública
CREATE POLICY "booking_public_insert_vehicles"
    ON vehicles FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "booking_public_select_vehicles"
    ON vehicles FOR SELECT
    TO anon, authenticated
    USING (true);

-- Appointments: permitir criação pública
CREATE POLICY "booking_public_insert_appointments"
    ON appointments FOR INSERT
    TO anon, authenticated
    WITH CHECK (status = 'scheduled');

-- Appointment Services: permitir criação pública
CREATE POLICY "booking_public_insert_appointment_services"
    ON appointment_services FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);
