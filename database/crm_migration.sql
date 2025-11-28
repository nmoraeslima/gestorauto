-- ============================================================================
-- MIGRATION: Predictive CRM
-- ============================================================================

-- 1. Add recurrence_interval to services table
ALTER TABLE services 
ADD COLUMN IF NOT EXISTS recurrence_interval INTEGER DEFAULT NULL; -- Days until next service

-- 2. Create service_reminders table
CREATE TABLE IF NOT EXISTS service_reminders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
    
    due_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'cancelled', 'completed')),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_service_reminders_company_id ON service_reminders(company_id);
CREATE INDEX IF NOT EXISTS idx_service_reminders_due_date ON service_reminders(due_date);
CREATE INDEX IF NOT EXISTS idx_service_reminders_status ON service_reminders(status);

-- RLS Policies
ALTER TABLE service_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view reminders from their company"
    ON service_reminders FOR SELECT
    USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update reminders from their company"
    ON service_reminders FOR UPDATE
    USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

-- 3. Trigger Function to Schedule Reminders
CREATE OR REPLACE FUNCTION schedule_service_reminder()
RETURNS TRIGGER AS $$
DECLARE
    svc RECORD;
    reminder_date DATE;
BEGIN
    -- Only proceed if status changed to 'completed'
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
        
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
            reminder_date := (NEW.completed_at::DATE + (svc.recurrence_interval || ' days')::INTERVAL)::DATE;
            
            -- Create Reminder
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

-- 4. Apply Trigger
DROP TRIGGER IF EXISTS on_work_order_completed_schedule_reminder ON work_orders;
CREATE TRIGGER on_work_order_completed_schedule_reminder
    AFTER UPDATE ON work_orders
    FOR EACH ROW EXECUTE FUNCTION schedule_service_reminder();
