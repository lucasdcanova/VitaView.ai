-- HIPAA/LGPD Compliance Tables Migration
-- VitaView.ai
-- Created: 2026-01-11

-- ===========================================
-- User Consents Table (LGPD Art. 8)
-- ===========================================
CREATE TABLE IF NOT EXISTS user_consents (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    consent_type TEXT NOT NULL, -- 'data_processing', 'health_data', 'marketing', 'third_party_sharing'
    granted BOOLEAN NOT NULL,
    purpose TEXT NOT NULL,
    legal_basis TEXT NOT NULL, -- 'consent', 'legitimate_interest', 'legal_obligation', 'health_protection'
    version TEXT NOT NULL, -- Version of privacy policy
    ip_address TEXT,
    user_agent TEXT,
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    revoked_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_consents_user_id ON user_consents(user_id);
CREATE INDEX IF NOT EXISTS idx_user_consents_type ON user_consents(consent_type);
CREATE INDEX IF NOT EXISTS idx_user_consents_granted_at ON user_consents(granted_at);

-- ===========================================
-- Audit Logs Table (HIPAA §164.312(b), LGPD Art. 37)
-- ===========================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    target_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action TEXT NOT NULL, -- 'CREATE', 'READ', 'UPDATE', 'DELETE', 'EXPORT', 'LOGIN', 'LOGOUT'
    resource_type TEXT NOT NULL, -- 'exam', 'profile', 'prescription', 'diagnosis', etc.
    resource_id INTEGER,
    ip_address TEXT,
    user_agent TEXT,
    session_id TEXT,
    request_method TEXT, -- 'GET', 'POST', 'PUT', 'DELETE'
    request_path TEXT,
    status_code INTEGER,
    old_value JSONB, -- Previous state (for updates/deletes)
    new_value JSONB, -- New state (redacted for sensitive fields)
    access_reason TEXT, -- 'treatment', 'payment', 'operations', 'patient_request'
    severity TEXT DEFAULT 'INFO', -- 'DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL'
    compliance_flags JSONB DEFAULT '{"hipaa": true, "lgpd": true}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes for efficient querying (required for compliance audits)
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target_user_id ON audit_logs(target_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON audit_logs(severity);
CREATE INDEX IF NOT EXISTS idx_audit_logs_session_id ON audit_logs(session_id);

-- Composite index for common compliance queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_compliance_query 
    ON audit_logs(created_at, user_id, resource_type, action);

-- ===========================================
-- Data Deletion Requests Table (LGPD Art. 18)
-- ===========================================
CREATE TABLE IF NOT EXISTS data_deletion_requests (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    request_type TEXT NOT NULL, -- 'full_deletion', 'partial_deletion', 'anonymization'
    reason TEXT,
    data_categories JSONB, -- Array of categories to delete
    status TEXT DEFAULT 'pending' NOT NULL, -- 'pending', 'in_progress', 'completed', 'rejected', 'cancelled'
    reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    review_notes TEXT,
    completed_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    legal_retention_until TIMESTAMP WITH TIME ZONE,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_data_deletion_requests_user_id ON data_deletion_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_data_deletion_requests_status ON data_deletion_requests(status);
CREATE INDEX IF NOT EXISTS idx_data_deletion_requests_created_at ON data_deletion_requests(created_at);

-- ===========================================
-- Data Processing Records Table (LGPD Art. 37)
-- ===========================================
CREATE TABLE IF NOT EXISTS data_processing_records (
    id SERIAL PRIMARY KEY,
    processing_id TEXT NOT NULL UNIQUE, -- UUID for reference
    data_category TEXT NOT NULL, -- 'health_data', 'personal_data', 'financial_data'
    purpose TEXT NOT NULL,
    legal_basis TEXT NOT NULL,
    data_controller TEXT DEFAULT 'VitaView.ai' NOT NULL,
    data_processor TEXT,
    retention_period TEXT NOT NULL, -- e.g., '7 years', '20 years'
    security_measures JSONB,
    international_transfer BOOLEAN DEFAULT FALSE,
    transfer_safeguards TEXT,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_data_processing_records_category ON data_processing_records(data_category);
CREATE INDEX IF NOT EXISTS idx_data_processing_records_active ON data_processing_records(is_active);

-- ===========================================
-- Security Incidents Table (LGPD Art. 48, HIPAA Breach Notification)
-- ===========================================
CREATE TABLE IF NOT EXISTS security_incidents (
    id SERIAL PRIMARY KEY,
    incident_id TEXT NOT NULL UNIQUE, -- UUID for reference
    incident_type TEXT NOT NULL, -- 'data_breach', 'unauthorized_access', 'malware', 'phishing'
    severity TEXT NOT NULL, -- 'low', 'medium', 'high', 'critical'
    affected_users_count INTEGER,
    affected_data_types JSONB,
    description TEXT NOT NULL,
    discovered_at TIMESTAMP WITH TIME ZONE NOT NULL,
    contained_at TIMESTAMP WITH TIME ZONE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    reported_to_authority BOOLEAN DEFAULT FALSE,
    reported_to_authority_at TIMESTAMP WITH TIME ZONE,
    users_notified BOOLEAN DEFAULT FALSE,
    users_notified_at TIMESTAMP WITH TIME ZONE,
    root_cause TEXT,
    remediation_steps JSONB,
    preventive_measures JSONB,
    investigated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'investigating' NOT NULL, -- 'investigating', 'contained', 'resolved', 'closed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_security_incidents_severity ON security_incidents(severity);
CREATE INDEX IF NOT EXISTS idx_security_incidents_status ON security_incidents(status);
CREATE INDEX IF NOT EXISTS idx_security_incidents_discovered_at ON security_incidents(discovered_at);

-- ===========================================
-- Insert Default Data Processing Records (LGPD Art. 37)
-- ===========================================
INSERT INTO data_processing_records (processing_id, data_category, purpose, legal_basis, retention_period, security_measures, is_active)
VALUES 
(
    'dpr-health-analysis',
    'health_data',
    'Análise de exames médicos usando inteligência artificial para auxiliar profissionais de saúde',
    'health_protection',
    '20 years',
    '["AES-256-GCM encryption", "TLS 1.3", "Access control", "Audit logging", "Data minimization"]',
    TRUE
),
(
    'dpr-user-account',
    'personal_data',
    'Gerenciamento de conta de usuário e autenticação',
    'contract',
    '5 years after account deletion',
    '["Scrypt password hashing", "Session management", "Rate limiting"]',
    TRUE
),
(
    'dpr-payment',
    'financial_data',
    'Processamento de pagamentos e assinaturas via Stripe',
    'contract',
    '5 years',
    '["PCI-DSS compliance via Stripe", "No card data stored locally"]',
    TRUE
),
(
    'dpr-audit-logs',
    'personal_data',
    'Registro de auditoria para conformidade regulatória (HIPAA/LGPD)',
    'legal_obligation',
    '7 years',
    '["Immutable logs", "Encrypted storage", "Access restricted to admins"]',
    TRUE
)
ON CONFLICT (processing_id) DO NOTHING;

-- ===========================================
-- Grant Comments for Documentation
-- ===========================================
COMMENT ON TABLE user_consents IS 'LGPD Art. 8 - Explicit consent tracking for data processing';
COMMENT ON TABLE audit_logs IS 'HIPAA §164.312(b) & LGPD Art. 37 - Audit trail for PHI access';
COMMENT ON TABLE data_deletion_requests IS 'LGPD Art. 18 - Data subject right to erasure requests';
COMMENT ON TABLE data_processing_records IS 'LGPD Art. 37 - Records of processing activities';
COMMENT ON TABLE security_incidents IS 'LGPD Art. 48 & HIPAA Breach Notification - Security incident tracking';

-- ===========================================
-- Retention Policy View (for compliance audits)
-- ===========================================
CREATE OR REPLACE VIEW data_retention_status AS
SELECT 
    'audit_logs' as table_name,
    COUNT(*) as total_records,
    MIN(created_at) as oldest_record,
    MAX(created_at) as newest_record,
    COUNT(*) FILTER (WHERE created_at < NOW() - INTERVAL '7 years') as records_past_retention
FROM audit_logs
UNION ALL
SELECT 
    'user_consents' as table_name,
    COUNT(*) as total_records,
    MIN(created_at) as oldest_record,
    MAX(created_at) as newest_record,
    0 as records_past_retention -- Consents kept indefinitely for proof
FROM user_consents
UNION ALL
SELECT 
    'exams' as table_name,
    COUNT(*) as total_records,
    MIN(upload_date) as oldest_record,
    MAX(upload_date) as newest_record,
    COUNT(*) FILTER (WHERE upload_date < NOW() - INTERVAL '20 years') as records_past_retention
FROM exams;
