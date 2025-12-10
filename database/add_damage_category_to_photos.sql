-- Migration to add 'damage' category to work_order_photos

DO $$
BEGIN
    -- 1. Drop existing check constraint if it exists
    -- Note: PostgreSQL usually names it {table}_{column}_check by default
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'work_order_photos_category_check') THEN
        ALTER TABLE work_order_photos DROP CONSTRAINT work_order_photos_category_check;
    END IF;

    -- 2. Add new constraint including 'damage'
    ALTER TABLE work_order_photos 
    ADD CONSTRAINT work_order_photos_category_check 
    CHECK (category IN ('before', 'after', 'damage'));

END $$;
