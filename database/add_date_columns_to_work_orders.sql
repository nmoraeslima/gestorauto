-- Add missing date columns to work_orders table
-- These are used in the WorkOrderModal.tsx

ALTER TABLE work_orders 
ADD COLUMN IF NOT EXISTS entry_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS expected_completion_date TIMESTAMP WITH TIME ZONE;
