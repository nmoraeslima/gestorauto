-- Create appointment_services table to link appointments and services
CREATE TABLE IF NOT EXISTS appointment_services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    price DECIMAL(10, 2) NOT NULL DEFAULT 0,
    duration_minutes INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_appointment_services_appointment_id ON appointment_services(appointment_id);
CREATE INDEX IF NOT EXISTS idx_appointment_services_service_id ON appointment_services(service_id);

-- Add RLS policies
ALTER TABLE appointment_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view appointment services of their company" ON appointment_services
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM appointments
            WHERE appointments.id = appointment_services.appointment_id
            AND appointments.company_id = auth.uid()::uuid
        )
    );

CREATE POLICY "Users can insert appointment services for their company" ON appointment_services
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM appointments
            WHERE appointments.id = appointment_services.appointment_id
            AND appointments.company_id = auth.uid()::uuid
        )
    );

CREATE POLICY "Users can update appointment services of their company" ON appointment_services
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM appointments
            WHERE appointments.id = appointment_services.appointment_id
            AND appointments.company_id = auth.uid()::uuid
        )
    );

CREATE POLICY "Users can delete appointment services of their company" ON appointment_services
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM appointments
            WHERE appointments.id = appointment_services.appointment_id
            AND appointments.company_id = auth.uid()::uuid
        )
    );
