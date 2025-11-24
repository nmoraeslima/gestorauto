-- ============================================================================
-- PASSO 1: ESTRUTURA DO BANCO DE DADOS - SUPABASE SQL
-- SaaS Multi-tenant de Estética Automotiva
-- ============================================================================
-- Este script cria toda a estrutura do banco de dados com:
-- - Multi-tenancy (isolamento por company_id)
-- - Row Level Security (RLS) em todas as tabelas
-- - Triggers automáticos
-- - Índices para performance
-- ============================================================================

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- TABELA: companies (Empresas/Tenants)
-- ============================================================================
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL, -- URL amigável
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    logo_url TEXT,
    
    -- Controle de Assinatura
    subscription_status VARCHAR(20) NOT NULL DEFAULT 'trial' 
        CHECK (subscription_status IN ('active', 'trial', 'expired', 'cancelled')),
    subscription_plan VARCHAR(20) NOT NULL DEFAULT 'basic' 
        CHECK (subscription_plan IN ('basic', 'intermediate', 'premium')),
    trial_ends_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
    subscription_ends_at TIMESTAMP WITH TIME ZONE,
    
    -- Limites por Plano
    max_users INTEGER DEFAULT 2, -- Basic: 2, Intermediate: 5, Premium: ilimitado
    max_customers INTEGER DEFAULT 50, -- Basic: 50, Intermediate: 200, Premium: ilimitado
    
    -- Metadados
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE -- Soft delete
);

-- Índices para performance
CREATE INDEX idx_companies_slug ON companies(slug);
CREATE INDEX idx_companies_subscription_status ON companies(subscription_status);

-- ============================================================================
-- TABELA: profiles (Usuários vinculados às empresas)
-- ============================================================================
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    
    -- Dados do Usuário
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    avatar_url TEXT,
    
    -- Controle de Acesso
    role VARCHAR(20) NOT NULL DEFAULT 'user' 
        CHECK (role IN ('owner', 'admin', 'manager', 'user')),
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Metadados
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_profiles_company_id ON profiles(company_id);
CREATE INDEX idx_profiles_email ON profiles(email);

-- ============================================================================
-- TABELA: customers (Clientes da estética)
-- ============================================================================
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    
    -- Dados do Cliente
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20) NOT NULL,
    cpf VARCHAR(14) UNIQUE,
    birth_date DATE,
    address TEXT,
    notes TEXT,
    
    -- Classificação
    customer_type VARCHAR(20) DEFAULT 'individual' 
        CHECK (customer_type IN ('individual', 'corporate')),
    vip BOOLEAN DEFAULT FALSE,
    
    -- Metadados
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Índices
CREATE INDEX idx_customers_company_id ON customers(company_id);
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_cpf ON customers(cpf) WHERE cpf IS NOT NULL;

-- ============================================================================
-- TABELA: vehicles (Veículos dos clientes)
-- ============================================================================
CREATE TABLE vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    
    -- Dados do Veículo
    brand VARCHAR(100) NOT NULL, -- Marca (ex: Toyota)
    model VARCHAR(100) NOT NULL, -- Modelo (ex: Corolla)
    year INTEGER,
    color VARCHAR(50),
    license_plate VARCHAR(10) UNIQUE NOT NULL,
    
    -- Fotos (array de URLs do Supabase Storage)
    photos TEXT[] DEFAULT '{}',
    
    -- Observações
    notes TEXT,
    
    -- Metadados
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Índices
CREATE INDEX idx_vehicles_company_id ON vehicles(company_id);
CREATE INDEX idx_vehicles_customer_id ON vehicles(customer_id);
CREATE INDEX idx_vehicles_license_plate ON vehicles(license_plate);

-- ============================================================================
-- TABELA: services (Catálogo de Serviços)
-- ============================================================================
CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    
    -- Dados do Serviço
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100), -- Ex: Lavagem, Polimento, Vitrificação
    
    -- Precificação
    price DECIMAL(10, 2) NOT NULL,
    duration_minutes INTEGER DEFAULT 60, -- Duração estimada
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Metadados
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_services_company_id ON services(company_id);
CREATE INDEX idx_services_category ON services(category);

-- ============================================================================
-- TABELA: products (Estoque de Produtos)
-- ============================================================================
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    
    -- Dados do Produto
    name VARCHAR(255) NOT NULL,
    description TEXT,
    sku VARCHAR(100), -- Código do produto
    category VARCHAR(100),
    
    -- Estoque
    quantity DECIMAL(10, 2) DEFAULT 0,
    unit VARCHAR(20) DEFAULT 'un', -- un, ml, L, kg, etc.
    min_stock DECIMAL(10, 2) DEFAULT 0, -- Alerta de estoque mínimo
    
    -- Precificação
    cost_price DECIMAL(10, 2) DEFAULT 0,
    sale_price DECIMAL(10, 2) DEFAULT 0,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Metadados
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_products_company_id ON products(company_id);
CREATE INDEX idx_products_sku ON products(sku);

-- ============================================================================
-- TABELA: appointments (Agendamentos)
-- ============================================================================
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
    
    -- Dados do Agendamento
    title VARCHAR(255) NOT NULL,
    description TEXT,
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    
    -- Status
    status VARCHAR(20) DEFAULT 'scheduled' 
        CHECK (status IN ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled')),
    
    -- Responsável
    assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
    
    -- Metadados
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_appointments_company_id ON appointments(company_id);
CREATE INDEX idx_appointments_customer_id ON appointments(customer_id);
CREATE INDEX idx_appointments_scheduled_at ON appointments(scheduled_at);
CREATE INDEX idx_appointments_status ON appointments(status);

-- ============================================================================
-- TABELA: work_orders (Ordens de Serviço - Tabela Principal)
-- ============================================================================
CREATE TABLE work_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    
    -- Número da O.S. (sequencial por empresa)
    order_number VARCHAR(50) NOT NULL,
    
    -- Status
    status VARCHAR(20) DEFAULT 'draft' 
        CHECK (status IN ('draft', 'in_progress', 'completed', 'cancelled')),
    
    -- Checklist de Entrada do Veículo (JSON)
    entry_checklist JSONB DEFAULT '{
        "fuel_level": null,
        "mileage": null,
        "scratches": [],
        "personal_items": [],
        "notes": ""
    }'::jsonb,
    
    -- Datas
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Valores
    subtotal DECIMAL(10, 2) DEFAULT 0,
    discount DECIMAL(10, 2) DEFAULT 0,
    total DECIMAL(10, 2) DEFAULT 0,
    
    -- Observações
    notes TEXT,
    
    -- Responsável
    assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
    
    -- Metadados
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_work_orders_company_id ON work_orders(company_id);
CREATE INDEX idx_work_orders_customer_id ON work_orders(customer_id);
CREATE INDEX idx_work_orders_vehicle_id ON work_orders(vehicle_id);
CREATE INDEX idx_work_orders_status ON work_orders(status);
CREATE INDEX idx_work_orders_order_number ON work_orders(order_number);

-- ============================================================================
-- TABELA: work_order_services (Serviços aplicados na O.S.)
-- ============================================================================
CREATE TABLE work_order_services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    
    -- Dados do Serviço (snapshot no momento da O.S.)
    service_name VARCHAR(255) NOT NULL,
    quantity INTEGER DEFAULT 1,
    unit_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    
    -- Metadados
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_work_order_services_company_id ON work_order_services(company_id);
CREATE INDEX idx_work_order_services_work_order_id ON work_order_services(work_order_id);

-- ============================================================================
-- TABELA: work_order_products (Produtos consumidos na O.S.)
-- ============================================================================
CREATE TABLE work_order_products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    
    -- Dados do Produto (snapshot no momento da O.S.)
    product_name VARCHAR(255) NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL,
    unit VARCHAR(20),
    unit_cost DECIMAL(10, 2),
    
    -- Metadados
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_work_order_products_company_id ON work_order_products(company_id);
CREATE INDEX idx_work_order_products_work_order_id ON work_order_products(work_order_id);
CREATE INDEX idx_work_order_products_product_id ON work_order_products(product_id);

-- ============================================================================
-- TABELA: financial_transactions (Fluxo de Caixa)
-- ============================================================================
CREATE TABLE financial_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    
    -- Tipo de Transação
    type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
    category VARCHAR(100) NOT NULL, -- Ex: Serviço, Produto, Fornecedor, Salário
    
    -- Dados Financeiros
    description TEXT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending' 
        CHECK (status IN ('pending', 'paid', 'cancelled')),
    
    -- Datas
    due_date DATE NOT NULL,
    paid_at TIMESTAMP WITH TIME ZONE,
    
    -- Relacionamentos (opcional)
    work_order_id UUID REFERENCES work_orders(id) ON DELETE SET NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    
    -- Metadados
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_financial_transactions_company_id ON financial_transactions(company_id);
CREATE INDEX idx_financial_transactions_type ON financial_transactions(type);
CREATE INDEX idx_financial_transactions_status ON financial_transactions(status);
CREATE INDEX idx_financial_transactions_due_date ON financial_transactions(due_date);

-- ============================================================================
-- TRIGGERS: updated_at automático
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger em todas as tabelas com updated_at
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON vehicles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_work_orders_updated_at BEFORE UPDATE ON work_orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_financial_transactions_updated_at BEFORE UPDATE ON financial_transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TRIGGER: Criar perfil automático após signup
-- ============================================================================
CREATE OR REPLACE FUNCTION create_profile_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, company_id, full_name, email, role)
    VALUES (
        NEW.id,
        (NEW.raw_user_meta_data->>'company_id')::UUID,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuário'),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'role', 'owner')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION create_profile_for_new_user();

-- ============================================================================
-- TRIGGER: Baixa automática de estoque ao completar O.S.
-- ============================================================================
CREATE OR REPLACE FUNCTION deduct_stock_on_work_order_completion()
RETURNS TRIGGER AS $$
BEGIN
    -- Só executa se o status mudou para 'completed'
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
        -- Deduzir produtos do estoque
        UPDATE products p
        SET quantity = p.quantity - wop.quantity
        FROM work_order_products wop
        WHERE wop.work_order_id = NEW.id
          AND wop.product_id = p.id
          AND wop.company_id = NEW.company_id;
        
        -- Registrar transação financeira (receita)
        INSERT INTO financial_transactions (
            company_id,
            type,
            category,
            description,
            amount,
            status,
            due_date,
            paid_at,
            work_order_id,
            customer_id
        )
        VALUES (
            NEW.company_id,
            'income',
            'Serviço',
            'O.S. #' || NEW.order_number,
            NEW.total,
            'paid',
            CURRENT_DATE,
            NOW(),
            NEW.id,
            NEW.customer_id
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_work_order_completed
    AFTER UPDATE ON work_orders
    FOR EACH ROW EXECUTE FUNCTION deduct_stock_on_work_order_completion();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) - POLÍTICAS DE SEGURANÇA
-- ============================================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_order_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_order_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- POLÍTICAS: companies
-- ============================================================================
-- Usuários podem ver apenas sua própria empresa
CREATE POLICY "Users can view their own company"
    ON companies FOR SELECT
    TO authenticated
    USING (
        id IN (
            SELECT company_id FROM profiles WHERE id = auth.uid()
        )
    );

-- Permite inserção para usuários autenticados (necessário para signup)
CREATE POLICY "Enable insert for authenticated users"
    ON companies FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Apenas owners podem atualizar a empresa
CREATE POLICY "Owners can update their company"
    ON companies FOR UPDATE
    TO authenticated
    USING (
        id IN (
            SELECT company_id FROM profiles 
            WHERE id = auth.uid() AND role = 'owner'
        )
    )
    WITH CHECK (
        id IN (
            SELECT company_id FROM profiles 
            WHERE id = auth.uid() AND role = 'owner'
        )
    );

-- Apenas owners podem deletar a empresa
CREATE POLICY "Owners can delete their company"
    ON companies FOR DELETE
    TO authenticated
    USING (
        id IN (
            SELECT company_id FROM profiles 
            WHERE id = auth.uid() AND role = 'owner'
        )
    );


-- ============================================================================
-- POLÍTICAS: profiles
-- ============================================================================
-- Política de SELECT: Permite que usuários autenticados vejam perfis
CREATE POLICY "Enable read access for authenticated users"
    ON profiles FOR SELECT
    TO authenticated
    USING (true);

-- Política de INSERT: Permite inserção para usuários autenticados (necessário para o trigger)
CREATE POLICY "Enable insert for authenticated users"
    ON profiles FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Política de UPDATE: Usuários podem atualizar apenas seu próprio perfil
CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- Política de DELETE: Apenas owners podem deletar perfis da mesma empresa
CREATE POLICY "Owners can delete profiles"
    ON profiles FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role = 'owner'
            AND p.company_id = profiles.company_id
        )
    );


-- ============================================================================
-- POLÍTICAS: customers
-- ============================================================================
CREATE POLICY "Users can view customers from their company"
    ON customers FOR SELECT
    USING (company_id IN (
        SELECT company_id FROM profiles WHERE id = auth.uid()
    ));

CREATE POLICY "Users can insert customers in their company"
    ON customers FOR INSERT
    WITH CHECK (company_id IN (
        SELECT company_id FROM profiles WHERE id = auth.uid()
    ));

CREATE POLICY "Users can update customers from their company"
    ON customers FOR UPDATE
    USING (company_id IN (
        SELECT company_id FROM profiles WHERE id = auth.uid()
    ));

CREATE POLICY "Users can delete customers from their company"
    ON customers FOR DELETE
    USING (company_id IN (
        SELECT company_id FROM profiles WHERE id = auth.uid()
    ));

-- ============================================================================
-- POLÍTICAS: vehicles
-- ============================================================================
CREATE POLICY "Users can view vehicles from their company"
    ON vehicles FOR SELECT
    USING (company_id IN (
        SELECT company_id FROM profiles WHERE id = auth.uid()
    ));

CREATE POLICY "Users can insert vehicles in their company"
    ON vehicles FOR INSERT
    WITH CHECK (company_id IN (
        SELECT company_id FROM profiles WHERE id = auth.uid()
    ));

CREATE POLICY "Users can update vehicles from their company"
    ON vehicles FOR UPDATE
    USING (company_id IN (
        SELECT company_id FROM profiles WHERE id = auth.uid()
    ));

CREATE POLICY "Users can delete vehicles from their company"
    ON vehicles FOR DELETE
    USING (company_id IN (
        SELECT company_id FROM profiles WHERE id = auth.uid()
    ));

-- ============================================================================
-- POLÍTICAS: services
-- ============================================================================
CREATE POLICY "Users can view services from their company"
    ON services FOR SELECT
    USING (company_id IN (
        SELECT company_id FROM profiles WHERE id = auth.uid()
    ));

CREATE POLICY "Users can insert services in their company"
    ON services FOR INSERT
    WITH CHECK (company_id IN (
        SELECT company_id FROM profiles WHERE id = auth.uid()
    ));

CREATE POLICY "Users can update services from their company"
    ON services FOR UPDATE
    USING (company_id IN (
        SELECT company_id FROM profiles WHERE id = auth.uid()
    ));

CREATE POLICY "Users can delete services from their company"
    ON services FOR DELETE
    USING (company_id IN (
        SELECT company_id FROM profiles WHERE id = auth.uid()
    ));

-- ============================================================================
-- POLÍTICAS: products
-- ============================================================================
CREATE POLICY "Users can view products from their company"
    ON products FOR SELECT
    USING (company_id IN (
        SELECT company_id FROM profiles WHERE id = auth.uid()
    ));

CREATE POLICY "Users can insert products in their company"
    ON products FOR INSERT
    WITH CHECK (company_id IN (
        SELECT company_id FROM profiles WHERE id = auth.uid()
    ));

CREATE POLICY "Users can update products from their company"
    ON products FOR UPDATE
    USING (company_id IN (
        SELECT company_id FROM profiles WHERE id = auth.uid()
    ));

CREATE POLICY "Users can delete products from their company"
    ON products FOR DELETE
    USING (company_id IN (
        SELECT company_id FROM profiles WHERE id = auth.uid()
    ));

-- ============================================================================
-- POLÍTICAS: appointments
-- ============================================================================
CREATE POLICY "Users can view appointments from their company"
    ON appointments FOR SELECT
    USING (company_id IN (
        SELECT company_id FROM profiles WHERE id = auth.uid()
    ));

CREATE POLICY "Users can insert appointments in their company"
    ON appointments FOR INSERT
    WITH CHECK (company_id IN (
        SELECT company_id FROM profiles WHERE id = auth.uid()
    ));

CREATE POLICY "Users can update appointments from their company"
    ON appointments FOR UPDATE
    USING (company_id IN (
        SELECT company_id FROM profiles WHERE id = auth.uid()
    ));

CREATE POLICY "Users can delete appointments from their company"
    ON appointments FOR DELETE
    USING (company_id IN (
        SELECT company_id FROM profiles WHERE id = auth.uid()
    ));

-- ============================================================================
-- POLÍTICAS: work_orders
-- ============================================================================
CREATE POLICY "Users can view work orders from their company"
    ON work_orders FOR SELECT
    USING (company_id IN (
        SELECT company_id FROM profiles WHERE id = auth.uid()
    ));

CREATE POLICY "Users can insert work orders in their company"
    ON work_orders FOR INSERT
    WITH CHECK (company_id IN (
        SELECT company_id FROM profiles WHERE id = auth.uid()
    ));

CREATE POLICY "Users can update work orders from their company"
    ON work_orders FOR UPDATE
    USING (company_id IN (
        SELECT company_id FROM profiles WHERE id = auth.uid()
    ));

CREATE POLICY "Users can delete work orders from their company"
    ON work_orders FOR DELETE
    USING (company_id IN (
        SELECT company_id FROM profiles WHERE id = auth.uid()
    ));

-- ============================================================================
-- POLÍTICAS: work_order_services
-- ============================================================================
CREATE POLICY "Users can view work order services from their company"
    ON work_order_services FOR SELECT
    USING (company_id IN (
        SELECT company_id FROM profiles WHERE id = auth.uid()
    ));

CREATE POLICY "Users can insert work order services in their company"
    ON work_order_services FOR INSERT
    WITH CHECK (company_id IN (
        SELECT company_id FROM profiles WHERE id = auth.uid()
    ));

CREATE POLICY "Users can update work order services from their company"
    ON work_order_services FOR UPDATE
    USING (company_id IN (
        SELECT company_id FROM profiles WHERE id = auth.uid()
    ));

CREATE POLICY "Users can delete work order services from their company"
    ON work_order_services FOR DELETE
    USING (company_id IN (
        SELECT company_id FROM profiles WHERE id = auth.uid()
    ));

-- ============================================================================
-- POLÍTICAS: work_order_products
-- ============================================================================
CREATE POLICY "Users can view work order products from their company"
    ON work_order_products FOR SELECT
    USING (company_id IN (
        SELECT company_id FROM profiles WHERE id = auth.uid()
    ));

CREATE POLICY "Users can insert work order products in their company"
    ON work_order_products FOR INSERT
    WITH CHECK (company_id IN (
        SELECT company_id FROM profiles WHERE id = auth.uid()
    ));

CREATE POLICY "Users can update work order products from their company"
    ON work_order_products FOR UPDATE
    USING (company_id IN (
        SELECT company_id FROM profiles WHERE id = auth.uid()
    ));

CREATE POLICY "Users can delete work order products from their company"
    ON work_order_products FOR DELETE
    USING (company_id IN (
        SELECT company_id FROM profiles WHERE id = auth.uid()
    ));

-- ============================================================================
-- POLÍTICAS: financial_transactions
-- ============================================================================
CREATE POLICY "Users can view financial transactions from their company"
    ON financial_transactions FOR SELECT
    USING (company_id IN (
        SELECT company_id FROM profiles WHERE id = auth.uid()
    ));

CREATE POLICY "Users can insert financial transactions in their company"
    ON financial_transactions FOR INSERT
    WITH CHECK (company_id IN (
        SELECT company_id FROM profiles WHERE id = auth.uid()
    ));

CREATE POLICY "Users can update financial transactions from their company"
    ON financial_transactions FOR UPDATE
    USING (company_id IN (
        SELECT company_id FROM profiles WHERE id = auth.uid()
    ));

CREATE POLICY "Users can delete financial transactions from their company"
    ON financial_transactions FOR DELETE
    USING (company_id IN (
        SELECT company_id FROM profiles WHERE id = auth.uid()
    ));

-- ============================================================================
-- FUNÇÃO AUXILIAR: Verificar status da assinatura
-- ============================================================================
CREATE OR REPLACE FUNCTION check_subscription_status()
RETURNS TABLE (
    company_id UUID,
    subscription_status VARCHAR,
    is_active BOOLEAN,
    days_remaining INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.subscription_status,
        CASE 
            WHEN c.subscription_status = 'active' THEN TRUE
            WHEN c.subscription_status = 'trial' AND c.trial_ends_at > NOW() THEN TRUE
            ELSE FALSE
        END as is_active,
        CASE 
            WHEN c.subscription_status = 'trial' THEN 
                EXTRACT(DAY FROM (c.trial_ends_at - NOW()))::INTEGER
            WHEN c.subscription_status = 'active' THEN 
                EXTRACT(DAY FROM (c.subscription_ends_at - NOW()))::INTEGER
            ELSE 0
        END as days_remaining
    FROM companies c
    WHERE c.id IN (
        SELECT company_id FROM profiles WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- DADOS INICIAIS (SEED) - Opcional
-- ============================================================================
-- Você pode adicionar dados de exemplo aqui se desejar

-- ============================================================================
-- FIM DO SCRIPT
-- ============================================================================
