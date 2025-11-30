-- Create app_notifications table
CREATE TABLE IF NOT EXISTS app_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info', -- info, success, warning, error
    link VARCHAR(255),
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_notifications_company_id ON app_notifications(company_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON app_notifications(read);

-- RLS
ALTER TABLE app_notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their company notifications
CREATE POLICY "Users can view their company notifications"
    ON app_notifications FOR SELECT
    USING (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()));

-- Policy: System/Triggers can insert notifications (and authenticated users if needed)
CREATE POLICY "System can insert notifications"
    ON app_notifications FOR INSERT
    WITH CHECK (true);

-- Grant permissions
GRANT ALL ON app_notifications TO postgres;
GRANT ALL ON app_notifications TO service_role;
GRANT SELECT, INSERT, UPDATE ON app_notifications TO authenticated;
GRANT SELECT, INSERT ON app_notifications TO anon; -- Needed if anon triggers the insert via non-security-definer function, though RPC handles it.
