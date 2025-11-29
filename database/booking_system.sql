-- ============================================================================
-- MIGRATION: Online Booking System
-- ============================================================================

-- 1. Add booking settings to companies table
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS booking_settings JSONB DEFAULT '{
  "enabled": true,
  "auto_approve": false,
  "min_advance_hours": 2,
  "max_advance_days": 30,
  "slot_duration": 30,
  "buffer_minutes": 15,
  "working_hours": {
    "monday": {"enabled": true, "start": "08:00", "end": "18:00"},
    "tuesday": {"enabled": true, "start": "08:00", "end": "18:00"},
    "wednesday": {"enabled": true, "start": "08:00", "end": "18:00"},
    "thursday": {"enabled": true, "start": "08:00", "end": "18:00"},
    "friday": {"enabled": true, "start": "08:00", "end": "18:00"},
    "saturday": {"enabled": true, "start": "08:00", "end": "14:00"},
    "sunday": {"enabled": false, "start": "00:00", "end": "00:00"}
  },
  "blocked_dates": []
}'::jsonb;

-- 2. Performance indices for booking queries
CREATE INDEX IF NOT EXISTS idx_appointments_availability 
ON appointments(company_id, scheduled_at, status) 
WHERE status != 'cancelled';

CREATE INDEX IF NOT EXISTS idx_companies_slug 
ON companies(slug);

CREATE INDEX IF NOT EXISTS idx_services_booking 
ON services(company_id, is_active, duration_minutes) 
WHERE is_active = true;

-- 3. Function to get available time slots
CREATE OR REPLACE FUNCTION get_available_slots(
  p_company_id UUID,
  p_date DATE,
  p_service_duration INTEGER DEFAULT 60
) RETURNS TABLE (
  slot_time TIMESTAMP WITH TIME ZONE,
  is_available BOOLEAN
) AS $$
DECLARE
  v_settings JSONB;
  v_day_name TEXT;
  v_start_time TIME;
  v_end_time TIME;
  v_slot_duration INTEGER;
  v_buffer_minutes INTEGER;
  v_current_slot TIMESTAMP WITH TIME ZONE;
  v_end_of_day TIMESTAMP WITH TIME ZONE;
  v_min_advance INTERVAL;
  v_is_blocked BOOLEAN;
BEGIN
  -- Get company booking settings
  SELECT booking_settings INTO v_settings
  FROM companies
  WHERE id = p_company_id;

  -- Check if booking is enabled
  IF NOT (v_settings->>'enabled')::BOOLEAN THEN
    RETURN;
  END IF;

  -- Get day of week name
  v_day_name := LOWER(TO_CHAR(p_date, 'Day'));
  v_day_name := TRIM(v_day_name);

  -- Check if day is enabled
  IF NOT (v_settings->'working_hours'->v_day_name->>'enabled')::BOOLEAN THEN
    RETURN;
  END IF;

  -- Check if date is blocked
  SELECT EXISTS(
    SELECT 1 FROM jsonb_array_elements_text(v_settings->'blocked_dates') AS blocked_date
    WHERE blocked_date::DATE = p_date
  ) INTO v_is_blocked;

  IF v_is_blocked THEN
    RETURN;
  END IF;

  -- Get working hours for the day
  v_start_time := (v_settings->'working_hours'->v_day_name->>'start')::TIME;
  v_end_time := (v_settings->'working_hours'->v_day_name->>'end')::TIME;
  v_slot_duration := (v_settings->>'slot_duration')::INTEGER;
  v_buffer_minutes := (v_settings->>'buffer_minutes')::INTEGER;

  -- Calculate minimum advance time
  v_min_advance := ((v_settings->>'min_advance_hours')::INTEGER || ' hours')::INTERVAL;

  -- Initialize loop variables
  v_current_slot := p_date + v_start_time;
  v_end_of_day := p_date + v_end_time;

  -- Generate slots
  WHILE v_current_slot + (p_service_duration || ' minutes')::INTERVAL <= v_end_of_day LOOP
    -- Check if slot is in the future (respecting min_advance_hours)
    IF v_current_slot >= NOW() + v_min_advance THEN
      -- Check if slot conflicts with existing appointments
      slot_time := v_current_slot;
      is_available := NOT EXISTS (
        SELECT 1
        FROM appointments a
        JOIN appointment_services aps ON aps.appointment_id = a.id
        WHERE a.company_id = p_company_id
          AND a.status NOT IN ('cancelled')
          AND a.scheduled_at < v_current_slot + (p_service_duration || ' minutes')::INTERVAL
          AND (a.scheduled_at + (aps.duration_minutes || ' minutes')::INTERVAL + (v_buffer_minutes || ' minutes')::INTERVAL) > v_current_slot
      );
      
      RETURN NEXT;
    END IF;

    -- Move to next slot
    v_current_slot := v_current_slot + (v_slot_duration || ' minutes')::INTERVAL;
  END LOOP;

  RETURN;
END;
$$ LANGUAGE plpgsql STABLE;

-- 4. RLS Policies for public booking access
-- Allow public to read company info by slug for booking
CREATE POLICY "Public can view company info for booking"
    ON companies FOR SELECT
    USING (booking_settings->>'enabled' = 'true');

-- Allow public to read active services for booking
CREATE POLICY "Public can view active services for booking"
    ON services FOR SELECT
    USING (is_active = true);

-- Allow public to insert appointments (will be pending approval)
CREATE POLICY "Public can create appointments"
    ON appointments FOR INSERT
    WITH CHECK (true);

-- Allow public to insert appointment services
CREATE POLICY "Public can create appointment services"
    ON appointment_services FOR INSERT
    WITH CHECK (true);

-- 5. Add public customer creation for booking
-- Customers created via booking should be marked as such
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS source VARCHAR(20) DEFAULT 'manual' 
CHECK (source IN ('manual', 'booking', 'import'));

CREATE POLICY "Public can create customers via booking"
    ON customers FOR INSERT
    WITH CHECK (source = 'booking');

-- 6. Add vehicles for public booking
CREATE POLICY "Public can create vehicles via booking"
    ON vehicles FOR INSERT
    WITH CHECK (true);

-- 7. Trigger to send notification on new booking
CREATE OR REPLACE FUNCTION notify_new_booking()
RETURNS TRIGGER AS $$
BEGIN
  -- Create notification for company
  INSERT INTO app_notifications (
    company_id,
    title,
    message,
    type,
    link
  ) VALUES (
    NEW.company_id,
    'Novo Agendamento Online',
    'Um cliente agendou um serviço através do sistema online.',
    'info',
    '/appointments'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_new_booking_notify ON appointments;
CREATE TRIGGER on_new_booking_notify
    AFTER INSERT ON appointments
    FOR EACH ROW 
    WHEN (NEW.status = 'scheduled')
    EXECUTE FUNCTION notify_new_booking();
