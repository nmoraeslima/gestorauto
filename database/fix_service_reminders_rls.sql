-- ============================================================================
-- FIX: Add missing INSERT policy for service_reminders
-- ============================================================================

-- The previous migration created SELECT and UPDATE policies but missed INSERT.
-- This caused RLS violations when the trigger tried to create new reminders.

DROP POLICY IF EXISTS "Users can insert reminders for their company" ON service_reminders;

CREATE POLICY "Users can insert reminders for their company"
    ON service_reminders FOR INSERT
    WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

-- Also adding DELETE policy just in case
DROP POLICY IF EXISTS "Users can delete reminders from their company" ON service_reminders;

CREATE POLICY "Users can delete reminders from their company"
    ON service_reminders FOR DELETE
    USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

-- Verify policies
SELECT * FROM pg_policies WHERE tablename = 'service_reminders';
