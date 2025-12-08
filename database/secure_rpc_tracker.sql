-- SECURE PUBLIC ACCESS IMPLEMENTATION
-- This script replaces the previous insecure "USING (true)" policies.
-- It uses a SECURITY DEFINER function to strictly limit access to specific records by ID.

-- 1. CLEANUP: Remove any permissive policies if they were applied
DROP POLICY IF EXISTS "Public read work orders" ON public.work_orders;
DROP POLICY IF EXISTS "Public read companies" ON public.companies;
DROP POLICY IF EXISTS "Public read customers" ON public.customers;
DROP POLICY IF EXISTS "Public read vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Public read work order services" ON public.work_order_services;
DROP POLICY IF EXISTS "Public read work order photos" ON public.work_order_photos;

-- 2. CREATE SECURE FUNCTION
-- This function runs with "SECURITY DEFINER", meaning it bypasses RLS checks.
-- It explicitly takes an ID and returns ONLY data related to that ID.
-- This prevents anyone from listing/scraping the entire table.

CREATE OR REPLACE FUNCTION get_public_work_order(p_work_order_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER -- Critical: Allows the function to read tables that are otherwise locked
AS $$
DECLARE
    v_result JSON;
BEGIN
    SELECT json_build_object(
        'workOrder', to_jsonb(wo),
        'company', to_jsonb(c),
        'customer', to_jsonb(cust),
        'vehicle', to_jsonb(v),
        'services', COALESCE((
            SELECT json_agg(wos)
            FROM work_order_services wos
            WHERE wos.work_order_id = wo.id
        ), '[]'::json),
        'photos', COALESCE((
            SELECT json_agg(wop)
            FROM work_order_photos wop
            WHERE wop.work_order_id = wo.id
        ), '[]'::json)
    ) INTO v_result
    FROM work_orders wo
    JOIN companies c ON c.id = wo.company_id
    JOIN customers cust ON cust.id = wo.customer_id
    JOIN vehicles v ON v.id = wo.vehicle_id
    WHERE wo.id = p_work_order_id;

    RETURN v_result;
END;
$$;

-- 3. GRANT ACCESS
-- Only allow the public (anon) role to execute this specific function.
GRANT EXECUTE ON FUNCTION get_public_work_order(UUID) TO anon;
GRANT EXECUTE ON FUNCTION get_public_work_order(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_public_work_order(UUID) TO service_role;

COMMENT ON FUNCTION get_public_work_order IS 'Returns work order details for public tracking pages securely. Prevents scraping.';
