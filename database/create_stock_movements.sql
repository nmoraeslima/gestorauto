-- Create stock_movements table
CREATE TABLE IF NOT EXISTS stock_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('entry', 'exit', 'adjustment')),
    quantity DECIMAL(10, 2) NOT NULL,
    reason TEXT NOT NULL, -- Mandatory justification
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_stock_movements_company_id ON stock_movements(company_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_product_id ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created_at ON stock_movements(created_at);

-- Enable RLS
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view stock movements from their company"
    ON stock_movements FOR SELECT
    USING (company_id IN (
        SELECT company_id FROM profiles WHERE id = auth.uid()
    ));

CREATE POLICY "Users can insert stock movements in their company"
    ON stock_movements FOR INSERT
    WITH CHECK (company_id IN (
        SELECT company_id FROM profiles WHERE id = auth.uid()
    ));

-- Trigger to update product stock automatically
CREATE OR REPLACE FUNCTION update_product_stock_on_movement()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.type = 'entry' THEN
        UPDATE products 
        SET quantity = quantity + NEW.quantity
        WHERE id = NEW.product_id;
    ELSIF NEW.type = 'exit' THEN
        UPDATE products 
        SET quantity = quantity - NEW.quantity
        WHERE id = NEW.product_id;
    ELSIF NEW.type = 'adjustment' THEN
        -- For adjustment, we assume the quantity in movement is the difference
        -- OR we could make it the new total. 
        -- Standard practice: Adjustment usually means "Add or Remove to correct".
        -- Let's treat 'adjustment' as a signed value or handle it like entry/exit?
        -- To keep it simple and consistent with 'quantity' being positive:
        -- We might need to know if it's a positive or negative adjustment.
        -- BUT, usually 'entry' and 'exit' cover flows. 'Adjustment' might be a specific type of entry/exit.
        -- Let's assume 'adjustment' acts like 'entry' if we want to add, but usually we use negative for removal?
        -- Wait, the check constraint allows 'entry', 'exit', 'adjustment'.
        -- Let's define: 
        -- 'entry': Adds to stock.
        -- 'exit': Removes from stock.
        -- 'adjustment': This is tricky. Let's assume for this system:
        -- If the user wants to set the stock to a specific value, the UI calculates the difference.
        -- So the movement is always a delta.
        -- Let's treat 'adjustment' as a delta. If we want to support negative quantity, we need to allow it.
        -- But usually quantity is positive and type determines sign.
        -- Let's stick to: Entry (+), Exit (-). 
        -- If type is 'adjustment', we need to know the direction.
        -- Let's change the logic: 
        -- We will use 'entry' (add), 'exit' (remove). 
        -- 'adjustment' will be treated as 'entry' if we add, or we need another field?
        -- Let's keep it simple: The UI will determine if it's an 'entry' or 'exit' movement even for adjustments.
        -- OR, we allow 'quantity' to be negative? No, confusing.
        
        -- REVISED APPROACH for Adjustment:
        -- Let's just use Entry/Exit for everything in the DB logic, but the UI can call it "Adjustment".
        -- However, to track "Loss" vs "Sales", the 'reason' field helps.
        -- But 'type' helps filtering.
        -- Let's say:
        -- Entry: +
        -- Exit: -
        -- Adjustment: Could be + or -. 
        -- Let's handle 'adjustment' by checking the sign? No, quantity is usually absolute.
        -- Let's assume for now: 
        -- Entry -> +
        -- Exit -> -
        -- Adjustment -> Let's say we don't use 'adjustment' as a DB type for calculation, OR we assume Adjustment is always positive (adding found stock) or we need 'loss' (exit).
        -- Let's simplify: The DB will only have 'entry' and 'exit' types for calculation? 
        -- No, the user wants "Adjustment" option.
        -- Let's allow 'adjustment' to be ADDITION. If it's a loss, use 'exit' with reason 'Perda/Ajuste'.
        -- Actually, let's make 'adjustment' ADD to stock (like finding items). 
        -- If we want to remove, we use 'exit'.
        -- BETTER: Let's allow negative quantity in the table? 
        -- No, let's stick to: 
        -- Entry: +
        -- Exit: -
        -- Adjustment: + (Use Exit for negative adjustment).
        -- Wait, that's confusing for the user.
        -- Let's change the Trigger logic to be robust:
        -- We will rely on the UI to send 'entry' or 'exit'. 
        -- If the user selects "Adjustment" in UI:
        --   - If New Stock > Old Stock -> Send 'entry' (Reason: Ajuste de Estoque)
        --   - If New Stock < Old Stock -> Send 'exit' (Reason: Ajuste de Estoque)
        -- So the DB only needs 'entry' and 'exit'? 
        -- Or we keep 'adjustment' tag but we need to know sign.
        -- Let's add a 'operation' column? No.
        -- Let's just say:
        -- Entry: +
        -- Exit: -
        -- Adjustment: + (if we want to support negative, we need to allow signed quantity).
        
        -- DECISION: I will allow 'adjustment' in the enum, but I will treat it as:
        -- If the user wants to adjust, they pick "Entry" or "Exit" in the modal, OR
        -- I will handle 'adjustment' as an alias for 'entry' (positive) in the trigger, 
        -- and if it's a negative adjustment, the UI should send 'exit'.
        -- Actually, let's just use 'entry' and 'exit' for the DB types to keep math simple.
        -- The 'reason' will distinguish "Sale" from "Loss" from "Adjustment".
        -- I will update the check constraint to just 'entry' and 'exit' to avoid ambiguity?
        -- No, 'adjustment' is a valid business concept.
        -- Let's assume 'adjustment' in DB means "Manual Correction". 
        -- But does it add or subtract? 
        -- Let's make the trigger handle it: 
        -- We will add a column `direction` or just infer? 
        -- Let's keep it simple: The UI sends 'entry' or 'exit'. The 'type' in DB will be 'entry' or 'exit'.
        -- The UI "Adjustment" tab will ask "Is this an addition or removal?" or calculate it.
        -- I will stick to 'entry' and 'exit' in the DB for simplicity and robustness.
        -- The 'reason' field is mandatory and will contain "Ajuste de Estoque".
        
        -- WAIT, the user asked for "Opções de entrada, saída e ajuste".
        -- I will implement the UI with these 3 tabs.
        -- "Ajuste" tab: User sets the "Final Quantity". System calculates diff and sends Entry or Exit.
        -- Perfect.
        
        UPDATE products 
        SET quantity = quantity + NEW.quantity
        WHERE id = NEW.product_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Wait, I need to handle 'exit' correctly in the trigger above.
-- Let's rewrite the trigger to be safe.

CREATE OR REPLACE FUNCTION update_product_stock_on_movement()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.type = 'entry' THEN
        UPDATE products 
        SET quantity = quantity + NEW.quantity
        WHERE id = NEW.product_id;
    ELSIF NEW.type = 'exit' THEN
        UPDATE products 
        SET quantity = quantity - NEW.quantity
        WHERE id = NEW.product_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_stock_movement_created
    AFTER INSERT ON stock_movements
    FOR EACH ROW EXECUTE FUNCTION update_product_stock_on_movement();
