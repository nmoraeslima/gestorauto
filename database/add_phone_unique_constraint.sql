-- Add unique constraint to phone field in customers table
-- This prevents duplicate phone numbers across customers

ALTER TABLE customers 
ADD CONSTRAINT customers_phone_company_unique UNIQUE (company_id, phone);

-- Note: This creates a composite unique constraint on (company_id, phone)
-- This means the same phone number can exist in different companies,
-- but not within the same company
