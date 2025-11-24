-- Add missing columns to work_orders table
-- Based on usage in WorkOrderModal.tsx

ALTER TABLE work_orders 
ADD COLUMN IF NOT EXISTS customer_belongings TEXT,
ADD COLUMN IF NOT EXISTS damage_notes TEXT,
ADD COLUMN IF NOT EXISTS fuel_level INTEGER DEFAULT 50,
ADD COLUMN IF NOT EXISTS odometer INTEGER,
ADD COLUMN IF NOT EXISTS internal_notes TEXT,
ADD COLUMN IF NOT EXISTS customer_notes TEXT;
