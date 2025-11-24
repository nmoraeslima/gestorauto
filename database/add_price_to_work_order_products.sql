-- Add price columns to work_order_products table
-- The schema had unit_cost but was missing sales price columns

ALTER TABLE work_order_products 
ADD COLUMN IF NOT EXISTS unit_price DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_price DECIMAL(10, 2) DEFAULT 0;
