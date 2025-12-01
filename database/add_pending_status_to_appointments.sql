-- Add 'pending' to the allowed status values for appointments
ALTER TABLE appointments 
DROP CONSTRAINT appointments_status_check;

ALTER TABLE appointments 
ADD CONSTRAINT appointments_status_check 
CHECK (status IN ('pending', 'scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled'));
