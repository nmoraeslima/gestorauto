-- ============================================================================
-- FIX: Null Due Date Error in Service Reminders
-- ============================================================================

-- This migration updates the schedule_service_reminder trigger function
-- to handle cases where completed_at is NULL by defaulting to current date.
-- This prevents the "null value in column due_date" error.

CREATE OR REPLACE FUNCTION schedule_service_reminder()
RETURNS TRIGGER AS $$
DECLARE
    svc RECORD;
    reminder_date DATE;
    base_date DATE;
BEGIN
    -- Only proceed if status changed to 'completed'
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
        
        -- Safe date calculation: Use completed_at or fallback to current date
        base_date := COALESCE(NEW.completed_at::DATE, CURRENT_DATE);

        -- Loop through services in this work order
        FOR svc IN 
            SELECT wos.service_id, s.recurrence_interval, s.name
            FROM work_order_services wos
            JOIN services s ON s.id = wos.service_id
            WHERE wos.work_order_id = NEW.id
            AND s.recurrence_interval IS NOT NULL
            AND s.recurrence_interval > 0
        LOOP
            -- Calculate due date
            reminder_date := (base_date + (svc.recurrence_interval || ' days')::INTERVAL)::DATE;
            
            -- Create Reminder (with extra safety for required fields)
            INSERT INTO service_reminders (
                company_id,
                customer_id,
                vehicle_id,
                service_id,
                work_order_id,
                due_date,
                status
            ) VALUES (
                NEW.company_id,
                NEW.customer_id,
                NEW.vehicle_id,
                svc.service_id,
                NEW.id,
                reminder_date,
                'pending'
            );
        END LOOP;
        
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
