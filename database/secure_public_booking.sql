-- ============================================================================
-- SECURITY HARDENING: PUBLIC BOOKING
-- Addresses vulnerabilities in RPC and RLS policies
-- ============================================================================

-- 1. DROP EXISTING POLICIES FOR PUBLIC ACCESS TO PREVENT LEAKS
-- Only allow what is strictly necessary

-- Policies for Companies (Public needs to see Name, Logo, Slug)
DROP POLICY IF EXISTS "Public read companies" ON public.companies;
-- Re-create with strictly necessary columns if possible (Postgres RLS is row-based, so we rely on frontend not selecting sensitive data, OR we use a VIEW. For now, SELECT on row is OK as sensitive data like revenue is in other tables).
CREATE POLICY "Public read companies"
ON public.companies FOR SELECT
TO anon
USING (true); -- Ideally, filter by subscription_status = 'active' or similar if we want to hide inactive companies.

-- Policies for Services (Public needs to see active services)
DROP POLICY IF EXISTS "Public read services" ON public.services;
CREATE POLICY "Public read services"
ON public.services FOR SELECT
TO anon
USING (is_active = true); -- CRITICAL: Only active services

-- Policies for Vehicles (Public needs to see vehicles to link? RPC does the linking. Frontend checks if vehicle exists? 
-- The frontend calls `rpc('create_booking')` which handles logic. 
-- Does frontend need to select vehicles? PublicBooking code doesn't simplify vehicle selection from existing list for anon users 
-- (privacy breach to list client vehicles).
-- It asks for Plate/Model. It does NOT query `vehicles` table directly to list them.
-- So we REMOVE public select on vehicles table.
DROP POLICY IF EXISTS "Public read vehicles" ON public.vehicles;
-- Only Authenticated users (company staff) should see vehicle list.
-- If we need to validade vehicle existence, we use RPC.

-- Policies for Customers 
-- CRITICAL: Public should NOT see customer list. PII Leak.
DROP POLICY IF EXISTS "Public read customers" ON public.customers;
-- Only Authenticated.

-- Policies for Appointments
-- CRITICAL: Public should NOT see appointment list.
DROP POLICY IF EXISTS "Public read appointments" ON public.appointments;


-- 2. SECURE RPC: CREATE_BOOKING
-- Fixes price manipulation vulnerability by looking up service price from DB.

CREATE OR REPLACE FUNCTION create_booking(
  p_company_id UUID,
  p_customer_data JSONB,
  p_vehicle_data JSONB,
  p_appointment_data JSONB,
  p_service_data JSONB
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with privileges of the creator (admin)
SET search_path = public
AS $$
DECLARE
  v_customer_id UUID;
  v_vehicle_id UUID;
  v_appointment_id UUID;
  v_customer_phone TEXT;
  v_vehicle_plate TEXT;
  v_booking_settings JSONB;
  v_auto_approve BOOLEAN;
  v_initial_status VARCHAR;
  
  -- Service Validation
  v_service_id UUID;
  v_real_price DECIMAL(10,2);
  v_real_duration INTEGER;
  v_service_active BOOLEAN;
BEGIN
  -- Extract phone and plate
  v_customer_phone := regexp_replace(p_customer_data->>'phone', '\D', '', 'g');
  v_vehicle_plate := UPPER(trim(p_vehicle_data->>'license_plate'));
  v_service_id := (p_service_data->>'service_id')::UUID;

  -- 1. VALIDATE SERVICE (Security Fix)
  SELECT price, duration_minutes, is_active 
  INTO v_real_price, v_real_duration, v_service_active
  FROM services
  WHERE id = v_service_id AND company_id = p_company_id;

  IF v_real_price IS NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'Serviço não encontrado');
  END IF;

  IF v_service_active IS FALSE THEN
      RETURN jsonb_build_object('success', false, 'error', 'Serviço indisponível');
  END IF;

  -- 2. Determine Initial Status
  SELECT booking_settings INTO v_booking_settings
  FROM companies
  WHERE id = p_company_id;

  v_auto_approve := COALESCE((v_booking_settings->>'auto_approve')::BOOLEAN, false);
  v_initial_status := CASE WHEN v_auto_approve THEN 'scheduled' ELSE 'pending' END;

  -- 3. Find or Create Customer
  SELECT id INTO v_customer_id 
  FROM customers 
  WHERE company_id = p_company_id AND phone = v_customer_phone
  LIMIT 1;

  IF v_customer_id IS NULL THEN
    INSERT INTO customers (
      company_id, name, phone, email, source
    ) VALUES (
      p_company_id,
      trim(p_customer_data->>'name'),
      v_customer_phone,
      NULLIF(trim(p_customer_data->>'email'), ''),
      'booking'
    ) RETURNING id INTO v_customer_id;
  END IF;

  -- 4. Find or Create Vehicle
  SELECT id INTO v_vehicle_id 
  FROM vehicles 
  WHERE company_id = p_company_id AND license_plate = v_vehicle_plate
  LIMIT 1;

  IF v_vehicle_id IS NULL THEN
    INSERT INTO vehicles (
      company_id, customer_id, brand, model, license_plate, year
    ) VALUES (
      p_company_id,
      v_customer_id,
      NULLIF(trim(p_vehicle_data->>'brand'), ''),
      trim(p_vehicle_data->>'model'),
      v_vehicle_plate,
      COALESCE((p_vehicle_data->>'year')::INTEGER, EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER)
    ) RETURNING id INTO v_vehicle_id;
  END IF;

  -- 5. Create Appointment
  INSERT INTO appointments (
    company_id, customer_id, vehicle_id, title, scheduled_at, status, duration_minutes, notes
  ) VALUES (
    p_company_id,
    v_customer_id,
    v_vehicle_id,
    p_appointment_data->>'title',
    (p_appointment_data->>'scheduled_at')::TIMESTAMPTZ,
    v_initial_status,
    v_real_duration, -- Use REAL duration from DB
    NULLIF(trim(p_appointment_data->>'notes'), '')
  ) RETURNING id INTO v_appointment_id;

  -- 6. Link Service
  INSERT INTO appointment_services (
    appointment_id, service_id, price, duration_minutes
  ) VALUES (
    v_appointment_id,
    v_service_id,
    v_real_price, -- Use REAL price from DB (Security Fix)
    v_real_duration
  );

  RETURN jsonb_build_object(
    'success', true,
    'appointment_id', v_appointment_id,
    'customer_id', v_customer_id,
    'status', v_initial_status
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$;

-- Grant execution to public (anon)
GRANT EXECUTE ON FUNCTION create_booking TO anon, authenticated, service_role;
