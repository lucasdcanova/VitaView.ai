/**
 * HIPAA/LGPD Compliance Service
 * 
 * This service handles audit logging, consent management, and data subject rights
 * in compliance with HIPAA (US) and LGPD (Brazil) regulations.
 * 
 * Key Features:
 * - Comprehensive audit logging for PHI access
 * - User consent management
 * - Data deletion request handling
 * - Security incident tracking
 */

import { db, pool } from '../db';
import { Request } from 'express';
import crypto from 'crypto';
import logger from '../logger';

// Compliance configuration
const COMPLIANCE_CONFIG = {
    // HIPAA requires 6 years minimum, we use 7 for safety
    auditLogRetentionYears: 7,
    // Brazilian medical records law requires 20 years
    medicalRecordRetentionYears: 20,
    // LGPD requires 72-hour notification
    incidentNotificationHours: 72,
    // Privacy policy version
    privacyPolicyVersion: '1.0.0',
};

// Types
interface AuditLogEntry {
    userId?: number;
    clinicId?: number;
    targetUserId?: number;
    action: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'EXPORT' | 'LOGIN' | 'LOGOUT' | 'CONSENT' | 'REVOKE_CONSENT';
    resourceType: string;
    resourceId?: number;
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
    requestMethod?: string;
    requestPath?: string;
    statusCode?: number;
    oldValue?: any;
    newValue?: any;
    accessReason?: 'treatment' | 'payment' | 'operations' | 'patient_request' | 'legal_obligation';
    severity?: 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
}

interface ConsentEntry {
    userId: number;
    consentType: 'data_processing' | 'health_data' | 'marketing' | 'third_party_sharing' | 'ai_analysis';
    granted: boolean;
    purpose: string;
    legalBasis: 'consent' | 'legitimate_interest' | 'legal_obligation' | 'health_protection' | 'contract';
    ipAddress?: string;
    userAgent?: string;
    expiresAt?: Date;
}

interface DeletionRequest {
    userId: number;
    requestType: 'full_deletion' | 'partial_deletion' | 'anonymization';
    reason?: string;
    dataCategories?: string[];
    ipAddress?: string;
    userAgent?: string;
}

interface SecurityIncident {
    incidentType: 'data_breach' | 'unauthorized_access' | 'malware' | 'phishing' | 'other';
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    affectedUsersCount?: number;
    affectedDataTypes?: string[];
}

class ComplianceService {
    /**
     * Log an audit entry for HIPAA/LGPD compliance
     */
    async logAudit(entry: AuditLogEntry, req?: Request): Promise<void> {
        try {
            // Extract request information if available
            const ipAddress = entry.ipAddress || this.getClientIP(req);
            const userAgent = entry.userAgent || req?.headers['user-agent'];
            const sessionId = entry.sessionId || this.getSessionId(req);

            // Extract clinicId from request (injected by ensureTenant middleware)
            const clinicId = entry.clinicId || (req as any)?.tenantId || (req as any)?.user?.clinicId;

            // Redact sensitive information from values
            const redactedOldValue = this.redactSensitiveData(entry.oldValue);
            const redactedNewValue = this.redactSensitiveData(entry.newValue);

            await pool.query(`
        INSERT INTO audit_logs (
          user_id, clinic_id, target_user_id, action, resource_type, resource_id,
          ip_address, user_agent, session_id, request_method, request_path,
          status_code, old_value, new_value, access_reason, severity, compliance_flags
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      `, [
                entry.userId || null,
                clinicId || null,
                entry.targetUserId || null,
                entry.action,
                entry.resourceType,
                entry.resourceId || null,
                ipAddress,
                userAgent,
                sessionId,
                entry.requestMethod || req?.method,
                entry.requestPath || req?.path,
                entry.statusCode || null,
                redactedOldValue ? JSON.stringify(redactedOldValue) : null,
                redactedNewValue ? JSON.stringify(redactedNewValue) : null,
                entry.accessReason || 'operations',
                entry.severity || 'INFO',
                JSON.stringify({ hipaa: true, lgpd: true })
            ]);

            // Log critical events to Winston as well
            if (entry.severity === 'CRITICAL' || entry.severity === 'ERROR') {
                logger.error(`[COMPLIANCE AUDIT] ${entry.action} on ${entry.resourceType}`, {
                    userId: entry.userId,
                    resourceId: entry.resourceId,
                    severity: entry.severity
                });
            }
        } catch (error) {
            // Never let audit logging failures break the application
            logger.error('[COMPLIANCE] Failed to log audit entry', { error, entry });
        }
    }

    /**
     * Log PHI (Protected Health Information) access
     */
    async logPHIAccess(
        userId: number,
        patientId: number,
        resourceType: string,
        resourceId: number,
        action: 'READ' | 'CREATE' | 'UPDATE' | 'DELETE' | 'EXPORT',
        accessReason: AuditLogEntry['accessReason'],
        req?: Request
    ): Promise<void> {
        await this.logAudit({
            userId,
            targetUserId: patientId,
            action,
            resourceType,
            resourceId,
            accessReason,
            severity: 'INFO'
        }, req);
    }

    /**
     * Record user consent (LGPD Art. 8)
     */
    async recordConsent(consent: ConsentEntry): Promise<number> {
        try {
            const result = await pool.query(`
        INSERT INTO user_consents (
          user_id, consent_type, granted, purpose, legal_basis,
          version, ip_address, user_agent, expires_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id
      `, [
                consent.userId,
                consent.consentType,
                consent.granted,
                consent.purpose,
                consent.legalBasis,
                COMPLIANCE_CONFIG.privacyPolicyVersion,
                consent.ipAddress,
                consent.userAgent,
                consent.expiresAt || null
            ]);

            // Log the consent action
            await this.logAudit({
                userId: consent.userId,
                action: consent.granted ? 'CONSENT' : 'REVOKE_CONSENT',
                resourceType: 'consent',
                resourceId: result.rows[0].id,
                accessReason: 'patient_request',
                severity: 'INFO'
            });

            return result.rows[0].id;
        } catch (error) {
            logger.error('[COMPLIANCE] Failed to record consent', { error, consent });
            throw error;
        }
    }

    /**
     * Revoke user consent
     */
    async revokeConsent(userId: number, consentType: string, ipAddress?: string): Promise<boolean> {
        try {
            const result = await pool.query(`
        UPDATE user_consents 
        SET revoked_at = NOW(), granted = FALSE
        WHERE user_id = $1 AND consent_type = $2 AND revoked_at IS NULL
        RETURNING id
      `, [userId, consentType]);

            if (result.rowCount && result.rowCount > 0) {
                await this.logAudit({
                    userId,
                    action: 'REVOKE_CONSENT',
                    resourceType: 'consent',
                    resourceId: result.rows[0]?.id,
                    accessReason: 'patient_request',
                    severity: 'INFO'
                });
                return true;
            }

            return false;
        } catch (error) {
            logger.error('[COMPLIANCE] Failed to revoke consent', { error, userId, consentType });
            throw error;
        }
    }

    /**
     * Check if user has active consent for a specific type
     */
    async hasActiveConsent(userId: number, consentType: string): Promise<boolean> {
        try {
            const result = await pool.query(`
        SELECT id FROM user_consents 
        WHERE user_id = $1 
          AND consent_type = $2 
          AND granted = TRUE 
          AND revoked_at IS NULL
          AND (expires_at IS NULL OR expires_at > NOW())
        ORDER BY created_at DESC
        LIMIT 1
      `, [userId, consentType]);

            return result.rows.length > 0;
        } catch (error) {
            logger.error('[COMPLIANCE] Failed to check consent', { error, userId, consentType });
            return false;
        }
    }

    /**
     * Get all consents for a user
     */
    async getUserConsents(userId: number): Promise<any[]> {
        try {
            const result = await pool.query(`
        SELECT 
          consent_type, granted, purpose, legal_basis, version,
          granted_at, revoked_at, expires_at
        FROM user_consents 
        WHERE user_id = $1
        ORDER BY granted_at DESC
      `, [userId]);

            return result.rows;
        } catch (error) {
            logger.error('[COMPLIANCE] Failed to get user consents', { error, userId });
            throw error;
        }
    }

    /**
     * Create data deletion request (LGPD Art. 18)
     */
    async createDeletionRequest(request: DeletionRequest): Promise<number> {
        try {
            const result = await pool.query(`
        INSERT INTO data_deletion_requests (
          user_id, request_type, reason, data_categories, ip_address, user_agent
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
      `, [
                request.userId,
                request.requestType,
                request.reason,
                request.dataCategories ? JSON.stringify(request.dataCategories) : null,
                request.ipAddress,
                request.userAgent
            ]);

            // Log the deletion request
            await this.logAudit({
                userId: request.userId,
                action: 'CREATE',
                resourceType: 'deletion_request',
                resourceId: result.rows[0].id,
                accessReason: 'patient_request',
                severity: 'WARNING'
            });

            // TODO: Send notification to DPO
            logger.warn('[COMPLIANCE] New data deletion request', {
                requestId: result.rows[0].id,
                userId: request.userId,
                requestType: request.requestType
            });

            return result.rows[0].id;
        } catch (error) {
            logger.error('[COMPLIANCE] Failed to create deletion request', { error, request });
            throw error;
        }
    }

    /**
     * Process data deletion request
     */
    async processDeletionRequest(
        requestId: number,
        reviewedBy: number,
        action: 'approve' | 'reject',
        notes?: string,
        rejectionReason?: string
    ): Promise<boolean> {
        try {
            if (action === 'approve') {
                // Update request status
                await pool.query(`
          UPDATE data_deletion_requests 
          SET status = 'in_progress', reviewed_by = $1, review_notes = $2, updated_at = NOW()
          WHERE id = $3
        `, [reviewedBy, notes, requestId]);

                // Get request details
                const request = await pool.query(`
          SELECT user_id, request_type, data_categories FROM data_deletion_requests WHERE id = $1
        `, [requestId]);

                if (request.rows.length === 0) {
                    throw new Error('Deletion request not found');
                }

                const { user_id, request_type, data_categories } = request.rows[0];

                // Execute deletion based on request type
                if (request_type === 'full_deletion') {
                    await this.executeFullDeletion(user_id);
                } else if (request_type === 'partial_deletion' && data_categories) {
                    await this.executePartialDeletion(user_id, data_categories);
                } else if (request_type === 'anonymization') {
                    await this.executeAnonymization(user_id);
                }

                // Mark as completed
                await pool.query(`
          UPDATE data_deletion_requests 
          SET status = 'completed', completed_at = NOW(), updated_at = NOW()
          WHERE id = $1
        `, [requestId]);

                // Log the action
                await this.logAudit({
                    userId: reviewedBy,
                    targetUserId: user_id,
                    action: 'DELETE',
                    resourceType: 'user_data',
                    accessReason: 'patient_request',
                    severity: 'WARNING'
                });

            } else {
                // Reject request
                await pool.query(`
          UPDATE data_deletion_requests 
          SET status = 'rejected', reviewed_by = $1, review_notes = $2, 
              rejection_reason = $3, updated_at = NOW()
          WHERE id = $4
        `, [reviewedBy, notes, rejectionReason, requestId]);
            }

            return true;
        } catch (error) {
            logger.error('[COMPLIANCE] Failed to process deletion request', { error, requestId });
            throw error;
        }
    }

    /**
     * Report a security incident (LGPD Art. 48, HIPAA Breach Notification)
     */
    async reportSecurityIncident(incident: SecurityIncident): Promise<string> {
        try {
            const incidentId = crypto.randomUUID();

            await pool.query(`
        INSERT INTO security_incidents (
          incident_id, incident_type, severity, affected_users_count,
          affected_data_types, description, discovered_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
      `, [
                incidentId,
                incident.incidentType,
                incident.severity,
                incident.affectedUsersCount || 0,
                incident.affectedDataTypes ? JSON.stringify(incident.affectedDataTypes) : null,
                incident.description
            ]);

            // Log as critical
            await this.logAudit({
                action: 'CREATE',
                resourceType: 'security_incident',
                accessReason: 'operations',
                severity: 'CRITICAL',
                newValue: { incidentId, ...incident }
            });

            // Alert for high/critical incidents
            if (incident.severity === 'high' || incident.severity === 'critical') {
                logger.error('[SECURITY INCIDENT] Critical incident reported', {
                    incidentId,
                    severity: incident.severity,
                    type: incident.incidentType,
                    affectedUsers: incident.affectedUsersCount
                });

                // TODO: Send immediate notification to DPO and security team
                // TODO: If data breach, prepare for 72-hour notification to ANPD
            }

            return incidentId;
        } catch (error) {
            logger.error('[COMPLIANCE] Failed to report security incident', { error, incident });
            throw error;
        }
    }

    /**
     * Export user data (LGPD Art. 18 - Portability)
     */
    async exportUserData(userId: number, format: 'json' | 'csv' = 'json'): Promise<any> {
        try {
            // Gather all user data
            const userData: any = {};

            // User profile
            const userResult = await pool.query(`
        SELECT id, username, full_name, email, birth_date, gender, 
               phone_number, address, created_at
        FROM users WHERE id = $1
      `, [userId]);
            userData.profile = userResult.rows[0] || null;

            // Patient profiles
            const profilesResult = await pool.query(`
        SELECT * FROM profiles WHERE user_id = $1
      `, [userId]);
            userData.patientProfiles = profilesResult.rows;

            // Exams
            const examsResult = await pool.query(`
        SELECT id, name, file_type, status, upload_date, laboratory_name, 
               exam_date, requesting_physician
        FROM exams WHERE user_id = $1
      `, [userId]);
            userData.exams = examsResult.rows;

            // Diagnoses
            const diagnosesResult = await pool.query(`
        SELECT * FROM diagnoses WHERE user_id = $1
      `, [userId]);
            userData.diagnoses = diagnosesResult.rows;

            // Medications
            const medicationsResult = await pool.query(`
        SELECT * FROM medications WHERE user_id = $1
      `, [userId]);
            userData.medications = medicationsResult.rows;

            // Allergies
            const allergiesResult = await pool.query(`
        SELECT * FROM allergies WHERE user_id = $1
      `, [userId]);
            userData.allergies = allergiesResult.rows;

            // Consents
            const consentsResult = await pool.query(`
        SELECT consent_type, granted, purpose, granted_at, revoked_at
        FROM user_consents WHERE user_id = $1
      `, [userId]);
            userData.consents = consentsResult.rows;

            // Log the export
            await this.logAudit({
                userId,
                targetUserId: userId,
                action: 'EXPORT',
                resourceType: 'user_data',
                accessReason: 'patient_request',
                severity: 'INFO'
            });

            // Add metadata
            userData.exportMetadata = {
                exportedAt: new Date().toISOString(),
                format,
                dataController: 'VitaView.ai',
                purpose: 'Data portability request (LGPD Art. 18)',
                version: COMPLIANCE_CONFIG.privacyPolicyVersion
            };

            return userData;
        } catch (error) {
            logger.error('[COMPLIANCE] Failed to export user data', { error, userId });
            throw error;
        }
    }

    /**
     * Get audit logs for a user (for compliance audits)
     */
    async getAuditLogs(filters: {
        userId?: number;
        targetUserId?: number;
        resourceType?: string;
        action?: string;
        startDate?: Date;
        endDate?: Date;
        limit?: number;
        offset?: number;
    }): Promise<any[]> {
        try {
            let query = 'SELECT * FROM audit_logs WHERE 1=1';
            const params: any[] = [];
            let paramIndex = 1;

            if (filters.userId) {
                query += ` AND user_id = $${paramIndex++}`;
                params.push(filters.userId);
            }
            if (filters.targetUserId) {
                query += ` AND target_user_id = $${paramIndex++}`;
                params.push(filters.targetUserId);
            }
            if (filters.resourceType) {
                query += ` AND resource_type = $${paramIndex++}`;
                params.push(filters.resourceType);
            }
            if (filters.action) {
                query += ` AND action = $${paramIndex++}`;
                params.push(filters.action);
            }
            if (filters.startDate) {
                query += ` AND created_at >= $${paramIndex++}`;
                params.push(filters.startDate);
            }
            if (filters.endDate) {
                query += ` AND created_at <= $${paramIndex++}`;
                params.push(filters.endDate);
            }

            query += ` ORDER BY created_at DESC`;
            query += ` LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
            params.push(filters.limit || 100, filters.offset || 0);

            const result = await pool.query(query, params);
            return result.rows;
        } catch (error) {
            logger.error('[COMPLIANCE] Failed to get audit logs', { error, filters });
            throw error;
        }
    }

    // Private helper methods

    private getClientIP(req?: Request): string | undefined {
        if (!req) return undefined;
        const forwarded = req.headers['x-forwarded-for'] as string;
        if (forwarded) {
            return forwarded.split(',')[0].trim();
        }
        return req.connection?.remoteAddress || req.socket?.remoteAddress;
    }

    private getSessionId(req?: Request): string | undefined {
        if (!req) return undefined;
        return req.sessionID || (req as any).session?.id;
    }

    private redactSensitiveData(data: any): any {
        if (!data) return data;

        const sensitiveFields = [
            'password', 'senha', 'secret', 'token', 'apiKey', 'api_key',
            'creditCard', 'credit_card', 'cvv', 'ssn', 'cpf',
            'originalContent', 'detailedAnalysis', 'rawText'
        ];

        const redact = (obj: any): any => {
            if (typeof obj !== 'object' || obj === null) return obj;

            const redacted: any = Array.isArray(obj) ? [] : {};

            for (const [key, value] of Object.entries(obj)) {
                const lowerKey = key.toLowerCase();
                if (sensitiveFields.some(field => lowerKey.includes(field.toLowerCase()))) {
                    redacted[key] = '[REDACTED]';
                } else if (typeof value === 'object' && value !== null) {
                    redacted[key] = redact(value);
                } else {
                    redacted[key] = value;
                }
            }

            return redacted;
        };

        return redact(data);
    }

    private async executeFullDeletion(userId: number): Promise<void> {
        // Delete in order respecting foreign keys
        await pool.query('DELETE FROM health_metrics WHERE user_id = $1', [userId]);
        await pool.query('DELETE FROM exam_results WHERE exam_id IN (SELECT id FROM exams WHERE user_id = $1)', [userId]);
        await pool.query('DELETE FROM exams WHERE user_id = $1', [userId]);
        await pool.query('DELETE FROM notifications WHERE user_id = $1', [userId]);
        await pool.query('DELETE FROM diagnoses WHERE user_id = $1', [userId]);
        await pool.query('DELETE FROM medications WHERE user_id = $1', [userId]);
        await pool.query('DELETE FROM allergies WHERE user_id = $1', [userId]);
        await pool.query('DELETE FROM surgeries WHERE user_id = $1', [userId]);
        await pool.query('DELETE FROM evolutions WHERE user_id = $1', [userId]);
        await pool.query('DELETE FROM appointments WHERE user_id = $1', [userId]);
        await pool.query('DELETE FROM prescriptions WHERE user_id = $1', [userId]);
        await pool.query('DELETE FROM profiles WHERE user_id = $1', [userId]);
        await pool.query('DELETE FROM subscriptions WHERE user_id = $1', [userId]);
        await pool.query('DELETE FROM doctors WHERE user_id = $1', [userId]);

        // Anonymize user record instead of deleting (for audit trail)
        await pool.query(`
      UPDATE users SET 
        username = 'deleted_' || $1,
        password = 'deleted',
        full_name = '[DELETED]',
        email = NULL,
        phone_number = NULL,
        address = NULL
      WHERE id = $1
    `, [userId]);

        logger.warn('[COMPLIANCE] Full user data deletion completed', { userId });
    }

    private async executePartialDeletion(userId: number, categories: string[]): Promise<void> {
        for (const category of categories) {
            switch (category) {
                case 'exams':
                    await pool.query('DELETE FROM health_metrics WHERE user_id = $1', [userId]);
                    await pool.query('DELETE FROM exam_results WHERE exam_id IN (SELECT id FROM exams WHERE user_id = $1)', [userId]);
                    await pool.query('DELETE FROM exams WHERE user_id = $1', [userId]);
                    break;
                case 'diagnoses':
                    await pool.query('DELETE FROM diagnoses WHERE user_id = $1', [userId]);
                    break;
                case 'medications':
                    await pool.query('DELETE FROM medications WHERE user_id = $1', [userId]);
                    break;
                case 'allergies':
                    await pool.query('DELETE FROM allergies WHERE user_id = $1', [userId]);
                    break;
                case 'appointments':
                    await pool.query('DELETE FROM appointments WHERE user_id = $1', [userId]);
                    break;
            }
        }

        logger.warn('[COMPLIANCE] Partial user data deletion completed', { userId, categories });
    }

    private async executeAnonymization(userId: number): Promise<void> {
        // Anonymize personal identifiable information while keeping medical data for research
        await pool.query(`
      UPDATE users SET 
        username = 'anon_' || $1,
        full_name = 'Anonymous',
        email = NULL,
        phone_number = NULL,
        address = NULL
      WHERE id = $1
    `, [userId]);

        await pool.query(`
      UPDATE profiles SET 
        name = 'Anonymous',
        cpf = NULL,
        rg = NULL,
        phone = NULL,
        email = NULL,
        cep = NULL,
        street = NULL,
        city = NULL,
        guardian_name = NULL
      WHERE user_id = $1
    `, [userId]);

        logger.warn('[COMPLIANCE] User data anonymization completed', { userId });
    }
}

// Export singleton instance
export const complianceService = new ComplianceService();
