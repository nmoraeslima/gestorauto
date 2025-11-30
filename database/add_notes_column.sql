-- ============================================================================
-- FIX: Add missing 'notes' column to appointments table
-- ============================================================================

-- Add notes column if it doesn't exist
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'appointments'
ORDER BY ordinal_position;
