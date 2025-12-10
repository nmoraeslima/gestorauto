-- ============================================================================
-- FIX: Timezone support for booking slots
-- ============================================================================

-- Function to get available time slots with timezone support
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
  v_timezone TEXT;
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

  -- Get booking parameters
  v_start_time := (v_settings->'working_hours'->v_day_name->>'start')::TIME;
  v_end_time := (v_settings->'working_hours'->v_day_name->>'end')::TIME;
  v_slot_duration := COALESCE((v_settings->>'slot_duration')::INTEGER, 30);
  v_buffer_minutes := COALESCE((v_settings->>'buffer_minutes')::INTEGER, 0);
  
  -- Get configured timezone (default to 'America/Sao_Paulo')
  v_timezone := COALESCE(v_settings->>'timezone', 'America/Sao_Paulo');

  -- Calculate minimum advance time
  v_min_advance := ((v_settings->>'min_advance_hours')::INTEGER || ' hours')::INTERVAL;

  -- Initialize loop variables using the correct timezone
  -- We take the date and time, treat them as being in the company's timezone, and convert to TIMESTAMP WITH TIME ZONE
  v_current_slot := (p_date || ' ' || v_start_time)::TIMESTAMP AT TIME ZONE v_timezone;
  v_end_of_day := (p_date || ' ' || v_end_time)::TIMESTAMP AT TIME ZONE v_timezone;

  -- Verify if the resulting timestamp is valid (e.g., might be different date in UTC)
  -- The slot logic relies on absolute time comparison, so TSTZ is correct

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
          -- Check for overlap
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
