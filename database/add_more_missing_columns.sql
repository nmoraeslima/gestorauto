-- Add remaining missing columns to work_orders table
-- Including financial and payment fields

ALTER TABLE work_orders 
ADD COLUMN IF NOT EXISTS discount_type TEXT DEFAULT 'percentage',
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'cash',
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS subtotal DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS discount DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_amount DECIMAL(10, 2) DEFAULT 0;

-- Ensure previous columns are also added just in case
ALTER TABLE work_orders 
ADD COLUMN IF NOT EXISTS customer_belongings TEXT,
ADD COLUMN IF NOT EXISTS damage_notes TEXT,
ADD COLUMN IF NOT EXISTS fuel_level INTEGER DEFAULT 50,
ADD COLUMN IF NOT EXISTS odometer INTEGER,
ADD COLUMN IF NOT EXISTS internal_notes TEXT,
ADD COLUMN IF NOT EXISTS customer_notes TEXT;
