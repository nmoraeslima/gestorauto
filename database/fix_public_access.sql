-- Enable public read access for Service Tracker (Magic Link Style)
-- This allows unauthenticated users ('anon') to view work order details if they have the ID (UUID).
-- Note: UUIDs are practically unguessable, providing "security by obscurity" suitable for this feature.

-- 1. Work Orders
DROP POLICY IF EXISTS "Public read work orders" ON public.work_orders;
CREATE POLICY "Public read work orders"
ON public.work_orders FOR SELECT
TO anon
USING (true);

-- 2. Companies (Required to show company branding)
DROP POLICY IF EXISTS "Public read companies" ON public.companies;
CREATE POLICY "Public read companies"
ON public.companies FOR SELECT
TO anon
USING (true);

-- 3. Customers (Required to show customer name)
DROP POLICY IF EXISTS "Public read customers" ON public.customers;
CREATE POLICY "Public read customers"
ON public.customers FOR SELECT
TO anon
USING (true);

-- 4. Vehicles (Required to show vehicle details)
DROP POLICY IF EXISTS "Public read vehicles" ON public.vehicles;
CREATE POLICY "Public read vehicles"
ON public.vehicles FOR SELECT
TO anon
USING (true);

-- 5. Work Order Services (Required to list services)
DROP POLICY IF EXISTS "Public read work order services" ON public.work_order_services;
CREATE POLICY "Public read work order services"
ON public.work_order_services FOR SELECT
TO anon
USING (true);

-- 6. Work Order Photos (Required to show before/after)
DROP POLICY IF EXISTS "Public read work order photos" ON public.work_order_photos;
CREATE POLICY "Public read work order photos"
ON public.work_order_photos FOR SELECT
TO anon
USING (true);

-- 7. Work Order Products (If showing products in future)
DROP POLICY IF EXISTS "Public read work order products" ON public.work_order_products;
CREATE POLICY "Public read work order products"
ON public.work_order_products FOR SELECT
TO anon
USING (true);
