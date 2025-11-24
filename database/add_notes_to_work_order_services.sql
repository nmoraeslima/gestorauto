-- Add notes column to work_order_services table
-- Used in WorkOrderModal.tsx for service-specific notes

ALTER TABLE work_order_services 
ADD COLUMN IF NOT EXISTS notes TEXT;
