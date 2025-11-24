-- Add appointment_id to work_orders table
ALTER TABLE work_orders 
ADD COLUMN appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL;

-- Add index for performance
CREATE INDEX idx_work_orders_appointment_id ON work_orders(appointment_id);
