-- Add is_active column to customers table
-- This allows us to deactivate customers instead of deleting them when they have operational dependencies

ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Create index for filtering active/inactive customers
CREATE INDEX IF NOT EXISTS idx_customers_is_active ON customers(is_active);

-- Update existing customers to be active
UPDATE customers 
SET is_active = TRUE 
WHERE is_active IS NULL;

COMMENT ON COLUMN customers.is_active IS 'Indicates if the customer is active. Customers with operational data cannot be deleted, only deactivated.';
