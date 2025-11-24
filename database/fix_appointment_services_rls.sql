-- Fix RLS policies for appointment_services table
-- The previous policies incorrectly compared company_id with auth.uid()

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view appointment services of their company" ON appointment_services;
DROP POLICY IF EXISTS "Users can insert appointment services for their company" ON appointment_services;
DROP POLICY IF EXISTS "Users can update appointment services of their company" ON appointment_services;
DROP POLICY IF EXISTS "Users can delete appointment services of their company" ON appointment_services;

-- Create correct policies linking through profiles table

-- SELECT
CREATE POLICY "Users can view appointment services of their company" ON appointment_services
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM appointments
            JOIN profiles ON profiles.company_id = appointments.company_id
            WHERE appointments.id = appointment_services.appointment_id
            AND profiles.id = auth.uid()
        )
    );

-- INSERT
CREATE POLICY "Users can insert appointment services for their company" ON appointment_services
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM appointments
            JOIN profiles ON profiles.company_id = appointments.company_id
            WHERE appointments.id = appointment_services.appointment_id
            AND profiles.id = auth.uid()
        )
    );

-- UPDATE
CREATE POLICY "Users can update appointment services of their company" ON appointment_services
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM appointments
            JOIN profiles ON profiles.company_id = appointments.company_id
            WHERE appointments.id = appointment_services.appointment_id
            AND profiles.id = auth.uid()
        )
    );

-- DELETE
CREATE POLICY "Users can delete appointment services of their company" ON appointment_services
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM appointments
            JOIN profiles ON profiles.company_id = appointments.company_id
            WHERE appointments.id = appointment_services.appointment_id
            AND profiles.id = auth.uid()
        )
    );
