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
        'workOrder', json_build_object(
            'id', wo.id,
            'status', wo.status,
            'created_at', wo.created_at,
            'updated_at', wo.updated_at,
            'entry_date', wo.entry_date,
            'completed_at', wo.completed_at,
            'expected_completion_date', wo.expected_completion_date,
            'fuel_level', wo.fuel_level,
            'odometer', wo.odometer,
            'damage_notes', wo.damage_notes,
            'customer_belongings', wo.customer_belongings,
            'entry_checklist', wo.entry_checklist, -- Maintain backward compatibility if used
            'discount', wo.discount,
            'discount_type', wo.discount_type,
            'subtotal', wo.subtotal, 
            'total', wo.total
        ),
        'company', json_build_object(
            'name', c.name,
            'phone', c.phone,
            'address', c.address,
            'logo_url', c.logo_url,
            'subscription_plan', c.subscription_plan
        ),
        'customer', json_build_object(
            'name', cust.name
        ),
        'vehicle', json_build_object(
            'brand', v.brand,
            'model', v.model,
            'license_plate', v.license_plate,
            'color', v.color
        ),
        'services', COALESCE((
            SELECT json_agg(json_build_object(
                'id', wos.id,
                'service_name', wos.service_name,
                'quantity', wos.quantity,
                'unit_price', wos.unit_price,
                'total_price', wos.total_price
            ))
            FROM work_order_services wos
            WHERE wos.work_order_id = wo.id
        ), '[]'::json),
        'photos', COALESCE((
            SELECT json_agg(json_build_object(
                'id', wop.id,
                'file_path', wop.file_path,
                'category', wop.category,
                'created_at', wop.created_at
            ))
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
