-- ============================================================================
-- RPC: Create Booking Function (Security Definer)
-- Handles the entire booking flow transactionally and bypasses RLS
-- ============================================================================

CREATE OR REPLACE FUNCTION create_booking(
  p_company_id UUID,
  p_customer_data JSONB,
  p_vehicle_data JSONB,
  p_appointment_data JSONB,
  p_service_data JSONB
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with privileges of the creator (admin), bypassing RLS
SET search_path = public -- Security best practice
AS $$
DECLARE
  v_customer_id UUID;
  v_vehicle_id UUID;
  v_appointment_id UUID;
  v_customer_phone TEXT;
  v_vehicle_plate TEXT;
BEGIN
  -- Extract phone and plate for searching
  v_customer_phone := regexp_replace(p_customer_data->>'phone', '\D', '', 'g');
  v_vehicle_plate := p_vehicle_data->>'license_plate';

  -- 1. Find or Create Customer
  SELECT id INTO v_customer_id 
  FROM customers 
  WHERE company_id = p_company_id AND phone = v_customer_phone
  LIMIT 1;

  IF v_customer_id IS NULL THEN
    INSERT INTO customers (
      company_id, 
      name, 
      phone, 
      email, 
      source
    ) VALUES (
      p_company_id,
      p_customer_data->>'name',
      v_customer_phone,
      NULLIF(p_customer_data->>'email', ''),
      'booking'
    ) RETURNING id INTO v_customer_id;
  END IF;

  -- 2. Find or Create Vehicle
  SELECT id INTO v_vehicle_id 
  FROM vehicles 
  WHERE company_id = p_company_id AND license_plate = v_vehicle_plate
  LIMIT 1;

  IF v_vehicle_id IS NULL THEN
    INSERT INTO vehicles (
      company_id, 
      customer_id, 
      brand, 
      model, 
      license_plate, 
      year
    ) VALUES (
      p_company_id,
      v_customer_id,
      COALESCE(p_vehicle_data->>'brand', 'Não informado'),
      p_vehicle_data->>'model',
      v_vehicle_plate,
      COALESCE((p_vehicle_data->>'year')::INTEGER, EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER)
    ) RETURNING id INTO v_vehicle_id;
  END IF;

  -- 3. Create Appointment
  INSERT INTO appointments (
    company_id, 
    customer_id, 
    vehicle_id, 
    title, 
    scheduled_at, 
    status, 
    duration_minutes, 
    notes
  ) VALUES (
    p_company_id,
    v_customer_id,
    v_vehicle_id,
    p_appointment_data->>'title',
    (p_appointment_data->>'scheduled_at')::TIMESTAMPTZ,
    'scheduled',
    (p_appointment_data->>'duration_minutes')::INTEGER,
    NULLIF(p_appointment_data->>'notes', '')
  ) RETURNING id INTO v_appointment_id;

  -- 4. Link Service
  INSERT INTO appointment_services (
    appointment_id, 
    service_id, 
    price, 
    duration_minutes
  ) VALUES (
    v_appointment_id,
    (p_service_data->>'service_id')::UUID,
    (p_service_data->>'price')::NUMERIC,
    (p_service_data->>'duration_minutes')::INTEGER
  );

  -- Return the appointment ID
  RETURN jsonb_build_object(
    'success', true,
    'appointment_id', v_appointment_id,
    'customer_id', v_customer_id
  );

EXCEPTION WHEN OTHERS THEN
  -- Return error details if something fails
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'detail', SQLSTATE
  );
END;
$$;

-- Grant execute permission to public (anon) and authenticated users
GRANT EXECUTE ON FUNCTION create_booking TO anon, authenticated, service_role;
