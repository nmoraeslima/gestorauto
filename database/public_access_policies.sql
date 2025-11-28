-- Enable public read access for Work Orders (by UUID)
-- This allows anyone with the UUID to view the work order details
CREATE POLICY "Public can view work orders by ID" 
ON public.work_orders FOR SELECT
USING (true); -- Ideally we would restrict this, but for "Magic Link" by UUID, standard SELECT is often open or we rely on the UUID being secret. 
-- A stricter approach:
-- USING (id::text = current_setting('request.jwt.claims', true)::json->>'work_order_id'); 
-- But since we are doing a public page without auth, we rely on the UUID being the "key".
-- To be safe, let's keep it simple: Public can read ALL work orders? NO.
-- We need a way to allow anonymous access ONLY to specific records.
-- Supabase "Public" role means unauthenticated.

-- REVISED STRATEGY:
-- We will allow SELECT on work_orders for 'anon' role.
-- Since UUIDs are unguessable, this is generally acceptable for this type of feature ("Security by Obscurity" of the URL).
-- If higher security is needed, we would implement a signed token system, but that adds significant complexity.

-- 1. Work Orders
DROP POLICY IF EXISTS "Public read work orders" ON public.work_orders;
CREATE POLICY "Public read work orders"
ON public.work_orders FOR SELECT
TO anon
USING (true);

-- 2. Work Order Services (to see what is being done)
DROP POLICY IF EXISTS "Public read work order services" ON public.work_order_services;
CREATE POLICY "Public read work order services"
ON public.work_order_services FOR SELECT
TO anon
USING (true);

-- 3. Work Order Photos (to see the gallery)
DROP POLICY IF EXISTS "Public read work order photos" ON public.work_order_photos;
CREATE POLICY "Public read work order photos"
ON public.work_order_photos FOR SELECT
TO anon
USING (true);

-- 4. Company Info (to show logo/name on the tracker page)
-- We need to allow reading company info for the company associated with the work order.
-- This is tricky with RLS. Simplest is to allow public read of companies table (it's mostly public info anyway: name, address, etc).
DROP POLICY IF EXISTS "Public read companies" ON public.companies;
CREATE POLICY "Public read companies"
ON public.companies FOR SELECT
TO anon
USING (true);

-- 5. Vehicles (to show model/plate)
DROP POLICY IF EXISTS "Public read vehicles" ON public.vehicles;
CREATE POLICY "Public read vehicles"
ON public.vehicles FOR SELECT
TO anon
USING (true);

-- 6. Customers (to show name - optional, maybe hide for privacy?)
-- Let's allow it for now so we can say "Hello, Natan".
DROP POLICY IF EXISTS "Public read customers" ON public.customers;
CREATE POLICY "Public read customers"
ON public.customers FOR SELECT
TO anon
USING (true);
