-- ============================================================================
-- TABELA: work_order_photos
-- Armazena metadados das fotos de veículos (antes/depois)
-- Arquivos reais ficam no Supabase Storage
-- ============================================================================

CREATE TABLE IF NOT EXISTS work_order_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  
  -- Metadados da foto
  file_path TEXT NOT NULL,          -- Caminho no Supabase Storage
  file_name TEXT NOT NULL,          -- Nome original do arquivo
  file_size INTEGER NOT NULL,       -- Tamanho em bytes (após compressão)
  mime_type TEXT NOT NULL,          -- image/webp, image/jpeg, etc
  
  -- Categorização
  category TEXT NOT NULL CHECK (category IN ('before', 'after')),
  description TEXT,                 -- Nota/descrição opcional
  
  -- Ordem de exibição
  display_order INTEGER DEFAULT 0,
  
  -- Auditoria
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT fk_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  CONSTRAINT fk_work_order FOREIGN KEY (work_order_id) REFERENCES work_orders(id) ON DELETE CASCADE
);

-- ============================================================================
-- ÍNDICES para Performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_work_order_photos_work_order 
ON work_order_photos(work_order_id);

CREATE INDEX IF NOT EXISTS idx_work_order_photos_category 
ON work_order_photos(category);

CREATE INDEX IF NOT EXISTS idx_work_order_photos_company 
ON work_order_photos(company_id);

CREATE INDEX IF NOT EXISTS idx_work_order_photos_created_at 
ON work_order_photos(created_at);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE work_order_photos ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver fotos da própria empresa
CREATE POLICY "Users can view photos from their company"
ON work_order_photos FOR SELECT
TO authenticated
USING (
  company_id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid()
  )
);

-- Usuários podem inserir fotos para sua empresa
CREATE POLICY "Users can insert photos for their company"
ON work_order_photos FOR INSERT
TO authenticated
WITH CHECK (
  company_id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid()
  )
);

-- Usuários podem atualizar fotos da própria empresa
CREATE POLICY "Users can update photos from their company"
ON work_order_photos FOR UPDATE
TO authenticated
USING (
  company_id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid()
  )
);

-- Usuários podem deletar fotos da própria empresa
CREATE POLICY "Users can delete photos from their company"
ON work_order_photos FOR DELETE
TO authenticated
USING (
  company_id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid()
  )
);

-- ============================================================================
-- FUNÇÃO: Limpeza Automática de Fotos Antigas (5 meses)
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_old_work_order_photos()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
  photo_record RECORD;
BEGIN
  -- Deletar fotos de O.S. concluídas há mais de 5 meses
  -- Também deleta os arquivos do Storage
  
  deleted_count := 0;
  
  FOR photo_record IN
    SELECT p.id, p.file_path
    FROM work_order_photos p
    INNER JOIN work_orders wo ON wo.id = p.work_order_id
    WHERE wo.status = 'completed'
    AND p.created_at < NOW() - INTERVAL '5 months'
  LOOP
    -- Deletar registro do banco
    DELETE FROM work_order_photos WHERE id = photo_record.id;
    
    -- Nota: Deletar do Storage deve ser feito via aplicação
    -- usando supabase.storage.from('work-order-photos').remove([path])
    
    deleted_count := deleted_count + 1;
  END LOOP;
  
  RETURN deleted_count;
END;
$$;

COMMENT ON FUNCTION cleanup_old_work_order_photos IS 
'Deleta fotos de O.S. concluídas há mais de 5 meses para economizar storage';

-- ============================================================================
-- TRIGGER: Atualizar updated_at automaticamente
-- ============================================================================

CREATE OR REPLACE FUNCTION update_work_order_photos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_work_order_photos_updated_at
BEFORE UPDATE ON work_order_photos
FOR EACH ROW
EXECUTE FUNCTION update_work_order_photos_updated_at();

-- ============================================================================
-- COMENTÁRIOS
-- ============================================================================

COMMENT ON TABLE work_order_photos IS 
'Armazena metadados de fotos de veículos (antes/depois do serviço)';

COMMENT ON COLUMN work_order_photos.file_path IS 
'Caminho completo no Supabase Storage (ex: company_id/work_order_id/before/photo.webp)';

COMMENT ON COLUMN work_order_photos.category IS 
'Categoria da foto: before (antes do serviço) ou after (depois do serviço)';
