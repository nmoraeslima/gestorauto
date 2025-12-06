-- Function to check limits before inserting
CREATE OR REPLACE FUNCTION check_subscription_limits()
RETURNS TRIGGER AS $$
DECLARE
    current_count INTEGER;
    plan_limit INTEGER;
    company_plan TEXT;
    limit_type TEXT;
BEGIN
    -- Determine which table allows which limit
    IF TG_TABLE_NAME = 'customers' THEN
        limit_type := 'max_customers';
    ELSIF TG_TABLE_NAME = 'profiles' THEN
        limit_type := 'max_users';
    ELSE
        RETURN NEW;
    END IF;

    -- Get Company Plan
    SELECT subscription_plan INTO company_plan
    FROM companies
    WHERE id = NEW.company_id;

    -- Define Limits (Mirroring Typescript Code)
    -- Basic
    IF company_plan = 'basic' THEN
        IF limit_type = 'max_customers' THEN plan_limit := 50; END IF;
        IF limit_type = 'max_users' THEN plan_limit := 1; END IF;
    -- Intermediate (Pro)
    ELSIF company_plan = 'intermediate' THEN
        IF limit_type = 'max_customers' THEN plan_limit := 300; END IF;
        IF limit_type = 'max_users' THEN plan_limit := 3; END IF;
    -- Premium
    ELSIF company_plan = 'premium' THEN
        plan_limit := 999999;
    -- Default / Trial
    ELSE
        plan_limit := 50; -- Fallback limit
    END IF;

    -- Check Current Count
    EXECUTE format('SELECT count(*) FROM %I WHERE company_id = $1', TG_TABLE_NAME)
    INTO current_count
    USING NEW.company_id;

    -- Enforce
    IF current_count >= plan_limit THEN
        RAISE EXCEPTION 'Limite do plano atingido. Atualize seu plano para adicionar mais registros.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply Triggers
DROP TRIGGER IF EXISTS check_customer_limit ON customers;
CREATE TRIGGER check_customer_limit
    BEFORE INSERT ON customers
    FOR EACH ROW
    EXECUTE FUNCTION check_subscription_limits();

-- Note: Users (profiles) creation is usually handled by auth trigger, but if we have a "Invite User" feature, this trigger protects it.
DROP TRIGGER IF EXISTS check_user_limit ON profiles;
CREATE TRIGGER check_user_limit
    BEFORE INSERT ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION check_subscription_limits();
