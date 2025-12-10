-- ============================================================================
-- FINAL FIX: BOOKING LOGIC, DATA INTEGRITY & CONCURRENCY
-- ============================================================================

-- 1. DATA CLEANUP & DEDUPLICATION (Normalize Phones & Merge Duplicates)
DO $$
DECLARE
  r RECORD;
  keeper_id UUID;
  duplicate_id UUID;
  dup_cursor REFCURSOR;
BEGIN
  -- A. Normalize all phones (Remove formatting like '(', ')', '-', ' ')
  UPDATE customers 
  SET phone = regexp_replace(phone, '\D', '', 'g') 
  WHERE phone ~ '\D';

  -- B. Identify Duplicates (Same Company + Same Phone) and Merge
  FOR r IN
    SELECT company_id, phone, count(*)
    FROM customers
    GROUP BY company_id, phone
    HAVING count(*) > 1
  LOOP
    -- 1. Identify "Keeper" (Latest created/updated or Oldest? Oldest ensures history continuity)
    -- We pick the OLDER record as the main one, as it likely has the legacy data.
    SELECT id INTO keeper_id
    FROM customers
    WHERE company_id = r.company_id AND phone = r.phone
    ORDER BY created_at ASC
    LIMIT 1;

    -- 2. Process Duplicates
    FOR duplicate_id IN 
        SELECT id FROM customers 
        WHERE company_id = r.company_id AND phone = r.phone AND id <> keeper_id
    LOOP
        -- Move Vehicles
        UPDATE vehicles SET customer_id = keeper_id WHERE customer_id = duplicate_id;
        
        -- Move Appointments
        UPDATE appointments SET customer_id = keeper_id WHERE customer_id = duplicate_id;
        
        -- Move Work Orders
        UPDATE work_orders SET customer_id = keeper_id WHERE customer_id = duplicate_id;
        
        -- Move Transactions
        UPDATE financial_transactions SET customer_id = keeper_id WHERE customer_id = duplicate_id;

        -- Delete the Duplicate Customer
        DELETE FROM customers WHERE id = duplicate_id;
    END LOOP;
  END LOOP;
END $$;


-- 2. ADD UNIQUE CONSTRAINT (Prevent Future Duplicates)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'unique_customer_phone_per_company'
    ) THEN
        ALTER TABLE customers 
        ADD CONSTRAINT unique_customer_phone_per_company 
        UNIQUE (company_id, phone);
    END IF;
END $$;


-- 3. REVIVE "GHOST" CUSTOMERS (Fix Visibility)
-- Ensure any customer with data is active and not deleted
UPDATE customers 
SET is_active = true, deleted_at = NULL 
WHERE id IN (
    SELECT customer_id FROM appointments 
    UNION 
    SELECT customer_id FROM vehicles
) AND (is_active IS NULL OR is_active = false OR deleted_at IS NOT NULL);


-- 4. UPDATE BOOKING RPC (Concurrency, Notifications, Auto-Revive)
CREATE OR REPLACE FUNCTION create_booking(
  p_company_id UUID,
  p_customer_data JSONB,
  p_vehicle_data JSONB,
  p_appointment_data JSONB,
  p_service_data JSONB
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
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

  -- Scheduling & Validation
  v_scheduled_at TIMESTAMPTZ;
  v_end_at TIMESTAMPTZ;
  v_min_advance_hours INTEGER;
  v_max_advance_days INTEGER;
  v_overlap_count INTEGER;
  v_customer_name TEXT;
  v_service_name TEXT;
BEGIN
  -- Extract variables (Sanitize Input Phone)
  v_customer_phone := regexp_replace(p_customer_data->>'phone', '\D', '', 'g');
  v_vehicle_plate := UPPER(trim(p_vehicle_data->>'license_plate'));
  v_service_id := (p_service_data->>'service_id')::UUID;
  v_scheduled_at := (p_appointment_data->>'scheduled_at')::TIMESTAMPTZ;
  v_customer_name := trim(p_customer_data->>'name');

  -- 1. LOAD SETTINGS & VALIDATE
  SELECT booking_settings INTO v_booking_settings
  FROM companies
  WHERE id = p_company_id;

  v_auto_approve := COALESCE((v_booking_settings->>'auto_approve')::BOOLEAN, false);
  v_min_advance_hours := COALESCE((v_booking_settings->>'min_advance_hours')::INTEGER, 1);
  v_max_advance_days := COALESCE((v_booking_settings->>'max_advance_days')::INTEGER, 30);
  
  -- 1.1 Time Validation
  IF v_scheduled_at < NOW() + (v_min_advance_hours || ' hours')::INTERVAL THEN
     RETURN jsonb_build_object('success', false, 'error', 'Agendamento muito próximo. Antecedência mínima necessária.');
  END IF;

  IF v_scheduled_at > NOW() + (v_max_advance_days || ' days')::INTERVAL THEN
     RETURN jsonb_build_object('success', false, 'error', 'Agendamento muito distante. Limite excedido.');
  END IF;

  -- 2. VALIDATE SERVICE & PRICE
  SELECT name, price, duration_minutes, is_active 
  INTO v_service_name, v_real_price, v_real_duration, v_service_active
  FROM services
  WHERE id = v_service_id AND company_id = p_company_id;

  IF v_real_price IS NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'Serviço não encontrado');
  END IF;

  IF v_service_active IS FALSE THEN
      RETURN jsonb_build_object('success', false, 'error', 'Serviço indisponível');
  END IF;

  -- Calculate end time
  v_end_at := v_scheduled_at + (v_real_duration || ' minutes')::INTERVAL;
  v_initial_status := CASE WHEN v_auto_approve THEN 'scheduled' ELSE 'pending' END;

  -- 3. CONCURRENCY CHECK
  SELECT COUNT(*) INTO v_overlap_count
  FROM appointments a
  WHERE a.company_id = p_company_id
    AND a.status NOT IN ('cancelled', 'rejected') 
    AND (a.scheduled_at < v_end_at) 
    AND ((a.scheduled_at + (a.duration_minutes || ' minutes')::INTERVAL) > v_scheduled_at);

  IF v_overlap_count > 0 THEN
      RETURN jsonb_build_object('success', false, 'error', 'Horário indisponível. Por favor, escolha outro.');
  END IF;

  -- 4. FIND OR CREATE CUSTOMER
  -- Logic: Search by phone. If found, revive if needed. If not, insert.
  SELECT id INTO v_customer_id 
  FROM customers 
  WHERE company_id = p_company_id AND phone = v_customer_phone
  LIMIT 1;

  IF v_customer_id IS NOT NULL THEN
      -- Customer exists -> RE-ACTIVATE if hidden
      UPDATE customers 
      SET is_active = true, deleted_at = NULL 
      WHERE id = v_customer_id AND (is_active = false OR deleted_at IS NOT NULL);
  ELSE
    INSERT INTO customers (
      company_id, name, phone, email, source, is_active
    ) VALUES (
      p_company_id,
      v_customer_name,
      v_customer_phone,
      NULLIF(trim(p_customer_data->>'email'), ''),
      'booking',
      true
    ) RETURNING id INTO v_customer_id;
  END IF;

  -- 5. FIND/CREATE VEHICLE
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

  -- 6. CREATE APPOINTMENT
  INSERT INTO appointments (
    company_id, customer_id, vehicle_id, title, scheduled_at, status, duration_minutes, notes
  ) VALUES (
    p_company_id,
    v_customer_id,
    v_vehicle_id,
    v_service_name || ' - ' || v_customer_name,
    v_scheduled_at,
    v_initial_status,
    v_real_duration,
    NULLIF(trim(p_appointment_data->>'notes'), '')
  ) RETURNING id INTO v_appointment_id;

  -- 7. LINK SERVICE
  INSERT INTO appointment_services (
    appointment_id, service_id, price, duration_minutes
  ) VALUES (
    v_appointment_id,
    v_service_id,
    v_real_price,
    v_real_duration
  );

  -- 8. CREATE NOTIFICATION
  INSERT INTO app_notifications (
    company_id,
    title,
    message,
    type,
    link
  ) VALUES (
    p_company_id,
    '📅 Novo Agendamento' || (CASE WHEN v_auto_approve THEN ' (Confirmado)' ELSE ' (Pendente)' END),
    'Novo agendamento de ' || v_customer_name || ' para ' || to_char(v_scheduled_at, 'DD/MM HH24:MI'),
    'info',
    '/operations/appointments?date=' || to_char(v_scheduled_at, 'YYYY-MM-DD')
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
