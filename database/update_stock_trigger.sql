-- Update trigger to record stock movements
CREATE OR REPLACE FUNCTION deduct_stock_on_work_order_completion()
RETURNS TRIGGER AS $$
BEGIN
    -- Só executa se o status mudou para 'completed'
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
        -- Iterar sobre os produtos da O.S. para registrar movimentação e baixar estoque
        -- Nota: O UPDATE no products pode ser feito via loop ou query direta.
        -- Vamos fazer um loop para garantir que inserimos o movimento correto para cada produto.
        
        DECLARE
            product_record RECORD;
        BEGIN
            FOR product_record IN 
                SELECT * FROM work_order_products 
                WHERE work_order_id = NEW.id 
                AND company_id = NEW.company_id
            LOOP
                -- 1. Baixar Estoque
                UPDATE products 
                SET quantity = quantity - product_record.quantity
                WHERE id = product_record.product_id;

                -- 2. Registrar Movimentação
                INSERT INTO stock_movements (
                    company_id,
                    product_id,
                    type,
                    quantity,
                    reason,
                    created_by,
                    created_at
                ) VALUES (
                    NEW.company_id,
                    product_record.product_id,
                    'exit',
                    product_record.quantity,
                    'Uso na O.S. #' || NEW.order_number,
                    NEW.assigned_to, -- Pode ser null, mas tenta pegar o responsável
                    NOW()
                );
            END LOOP;
        END;
        
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
