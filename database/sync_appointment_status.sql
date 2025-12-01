-- Add appointment_id to work_orders if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'work_orders' AND column_name = 'appointment_id') THEN
        ALTER TABLE work_orders ADD COLUMN appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL;
        CREATE INDEX idx_work_orders_appointment_id ON work_orders(appointment_id);
    END IF;
END $$;

-- Create function to sync status from Work Order to Appointment
CREATE OR REPLACE FUNCTION sync_appointment_status_trigger()
RETURNS TRIGGER AS $$
BEGIN
    -- Only proceed if status has changed and there is a linked appointment
    IF (OLD.status IS DISTINCT FROM NEW.status) AND (NEW.appointment_id IS NOT NULL) THEN
        
        -- Map Work Order status to Appointment status
        -- in_progress -> in_progress
        -- completed -> completed
        -- cancelled -> cancelled
        -- draft -> (do nothing or maybe revert to scheduled? Let's keep it simple and only sync forward progress)
        
        IF NEW.status = 'in_progress' THEN
            UPDATE appointments SET status = 'in_progress' WHERE id = NEW.appointment_id;
        ELSIF NEW.status = 'completed' THEN
            UPDATE appointments SET status = 'completed' WHERE id = NEW.appointment_id;
        ELSIF NEW.status = 'cancelled' THEN
            UPDATE appointments SET status = 'cancelled' WHERE id = NEW.appointment_id;
        END IF;
        
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create Trigger
DROP TRIGGER IF EXISTS on_work_order_status_change ON work_orders;
CREATE TRIGGER on_work_order_status_change
    AFTER UPDATE ON work_orders
    FOR EACH ROW
    EXECUTE FUNCTION sync_appointment_status_trigger();
