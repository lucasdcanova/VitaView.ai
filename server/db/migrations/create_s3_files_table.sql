-- Tabela para armazenar referências de arquivos no S3
CREATE TABLE IF NOT EXISTS s3_files (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  profile_id INTEGER REFERENCES profiles(id) ON DELETE CASCADE,
  exam_id INTEGER REFERENCES exams(id) ON DELETE CASCADE,
  s3_key VARCHAR(512) NOT NULL UNIQUE,
  original_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(50) NOT NULL,
  file_size BIGINT,
  mime_type VARCHAR(100),
  upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_accessed TIMESTAMP,
  metadata JSONB DEFAULT '{}',
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMP,
  INDEX idx_s3_files_user_id (user_id),
  INDEX idx_s3_files_profile_id (profile_id),
  INDEX idx_s3_files_exam_id (exam_id),
  INDEX idx_s3_files_file_type (file_type),
  INDEX idx_s3_files_upload_date (upload_date)
);

-- Adicionar comentários para documentação
COMMENT ON TABLE s3_files IS 'Armazena referências para arquivos sensíveis armazenados no Amazon S3';
COMMENT ON COLUMN s3_files.s3_key IS 'Chave única do arquivo no S3 bucket';
COMMENT ON COLUMN s3_files.file_type IS 'Tipo de arquivo: medical-records, prescriptions, lab-results, patient-photos, insurance-documents, personal-documents';
COMMENT ON COLUMN s3_files.metadata IS 'Metadados adicionais do arquivo em formato JSON';
COMMENT ON COLUMN s3_files.is_deleted IS 'Soft delete - arquivo marcado como excluído mas ainda existe no S3';

-- Função para atualizar last_accessed automaticamente
CREATE OR REPLACE FUNCTION update_s3_file_last_accessed()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_accessed = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para registrar acesso ao arquivo
CREATE TRIGGER update_s3_file_access
BEFORE UPDATE ON s3_files
FOR EACH ROW
WHEN (OLD.* IS DISTINCT FROM NEW.*)
EXECUTE FUNCTION update_s3_file_last_accessed();