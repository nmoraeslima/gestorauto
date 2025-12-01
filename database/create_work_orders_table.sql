-- Create work_orders table if it doesn't exist
CREATE TABLE IF NOT EXISTS work_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL, -- Added appointment_id directly
    
    order_number VARCHAR(50) NOT NULL,
    
    status VARCHAR(20) DEFAULT 'draft' 
        CHECK (status IN ('draft', 'in_progress', 'completed', 'cancelled')),
    
    entry_checklist JSONB DEFAULT '{
        "fuel_level": null,
        "mileage": null,
        "scratches": [],
        "personal_items": [],
        "notes": ""
    }'::jsonb,
    
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    subtotal DECIMAL(10, 2) DEFAULT 0,
    discount DECIMAL(10, 2) DEFAULT 0,
    total DECIMAL(10, 2) DEFAULT 0,
    
    notes TEXT,
    
    assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indices for work_orders
CREATE INDEX IF NOT EXISTS idx_work_orders_company_id ON work_orders(company_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_customer_id ON work_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_vehicle_id ON work_orders(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_status ON work_orders(status);
CREATE INDEX IF NOT EXISTS idx_work_orders_order_number ON work_orders(order_number);
CREATE INDEX IF NOT EXISTS idx_work_orders_appointment_id ON work_orders(appointment_id);

-- Enable RLS for work_orders
ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;

-- Policies for work_orders
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'work_orders' AND policyname = 'Users can view work orders from their company') THEN
        CREATE POLICY "Users can view work orders from their company" ON work_orders FOR SELECT USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'work_orders' AND policyname = 'Users can insert work orders in their company') THEN
        CREATE POLICY "Users can insert work orders in their company" ON work_orders FOR INSERT WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'work_orders' AND policyname = 'Users can update work orders from their company') THEN
        CREATE POLICY "Users can update work orders from their company" ON work_orders FOR UPDATE USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'work_orders' AND policyname = 'Users can delete work orders from their company') THEN
        CREATE POLICY "Users can delete work orders from their company" ON work_orders FOR DELETE USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));
    END IF;
END $$;


-- Create work_order_services table if it doesn't exist
CREATE TABLE IF NOT EXISTS work_order_services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    
    service_name VARCHAR(255) NOT NULL,
    quantity INTEGER DEFAULT 1,
    unit_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indices for work_order_services
CREATE INDEX IF NOT EXISTS idx_work_order_services_company_id ON work_order_services(company_id);
CREATE INDEX IF NOT EXISTS idx_work_order_services_work_order_id ON work_order_services(work_order_id);

-- Enable RLS for work_order_services
ALTER TABLE work_order_services ENABLE ROW LEVEL SECURITY;

-- Policies for work_order_services
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'work_order_services' AND policyname = 'Users can view work order services from their company') THEN
        CREATE POLICY "Users can view work order services from their company" ON work_order_services FOR SELECT USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'work_order_services' AND policyname = 'Users can insert work order services in their company') THEN
        CREATE POLICY "Users can insert work order services in their company" ON work_order_services FOR INSERT WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'work_order_services' AND policyname = 'Users can update work order services from their company') THEN
        CREATE POLICY "Users can update work order services from their company" ON work_order_services FOR UPDATE USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'work_order_services' AND policyname = 'Users can delete work order services from their company') THEN
        CREATE POLICY "Users can delete work order services from their company" ON work_order_services FOR DELETE USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));
    END IF;
END $$;


-- Create work_order_products table if it doesn't exist
CREATE TABLE IF NOT EXISTS work_order_products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    
    product_name VARCHAR(255) NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL,
    unit VARCHAR(20),
    unit_cost DECIMAL(10, 2),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indices for work_order_products
CREATE INDEX IF NOT EXISTS idx_work_order_products_company_id ON work_order_products(company_id);
CREATE INDEX IF NOT EXISTS idx_work_order_products_work_order_id ON work_order_products(work_order_id);
CREATE INDEX IF NOT EXISTS idx_work_order_products_product_id ON work_order_products(product_id);

-- Enable RLS for work_order_products
ALTER TABLE work_order_products ENABLE ROW LEVEL SECURITY;

-- Policies for work_order_products
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'work_order_products' AND policyname = 'Users can view work order products from their company') THEN
        CREATE POLICY "Users can view work order products from their company" ON work_order_products FOR SELECT USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'work_order_products' AND policyname = 'Users can insert work order products in their company') THEN
        CREATE POLICY "Users can insert work order products in their company" ON work_order_products FOR INSERT WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'work_order_products' AND policyname = 'Users can update work order products from their company') THEN
        CREATE POLICY "Users can update work order products from their company" ON work_order_products FOR UPDATE USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'work_order_products' AND policyname = 'Users can delete work order products from their company') THEN
        CREATE POLICY "Users can delete work order products from their company" ON work_order_products FOR DELETE USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));
    END IF;
END $$;
