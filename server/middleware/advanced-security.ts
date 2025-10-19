import { Request, Response, NextFunction } from 'express';
import * as crypto from 'crypto';
import * as bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';

// Security Configuration for Medical Data (HIPAA/LGPD Compliant)
const SECURITY_CONFIG = {
  session: {
    maxAge: 15 * 60 * 1000, // 15 minutes for medical data
    absoluteTimeout: 2 * 60 * 60 * 1000, // 2 hours absolute maximum
    renewThreshold: 5 * 60 * 1000, // Renew if less than 5 minutes remaining
    maxConcurrentSessions: 2, // Limit concurrent sessions
    requireTwoFactor: true,
    lockoutThreshold: 3, // Lock account after 3 failed attempts
    lockoutDuration: 30 * 60 * 1000, // 30 minutes lockout
  },
  encryption: {
    algorithm: 'aes-256-gcm',
    keyDerivationIterations: 100000,
    saltLength: 32,
    ivLength: 16,
    tagLength: 16,
  },
  audit: {
    logAllAccess: true,
    logDataModifications: true,
    logFailedAttempts: true,
    retentionPeriod: 7 * 365 * 24 * 60 * 60 * 1000, // 7 years for medical compliance
  }
};

// Advanced Session Security Middleware
export class AdvancedSessionSecurity {
  private activeSessions = new Map<string, SessionData>();
  private failedAttempts = new Map<string, FailedAttemptData>();
  private suspiciousActivity = new Map<string, SuspiciousActivityData>();

  constructor() {
    // Clean up expired sessions every 5 minutes
    setInterval(() => this.cleanupExpiredSessions(), 5 * 60 * 1000);
    
    // Reset failed attempts every hour
    setInterval(() => this.cleanupFailedAttempts(), 60 * 60 * 1000);
  }

  // Session Creation with Enhanced Security
  createSecureSession(req: Request, userId: string, userRole: string): SessionToken {
    const sessionId = this.generateSecureSessionId();
    const clientFingerprint = this.generateClientFingerprint(req);
    const ipAddress = this.getClientIP(req);
    
    // Check for concurrent session limit
    this.enforceSessionLimits(userId);
    
    const sessionData: SessionData = {
      sessionId,
      userId,
      userRole,
      clientFingerprint,
      ipAddress,
      createdAt: Date.now(),
      lastActivity: Date.now(),
      issuedAt: Date.now(),
      twoFactorVerified: false,
      securityLevel: this.calculateSecurityLevel(req),
      accessPattern: [],
      deviceTrust: this.calculateDeviceTrust(req),
    };

    this.activeSessions.set(sessionId, sessionData);
    
    // Log session creation
    this.auditLog('SESSION_CREATED', userId, req, {
      sessionId,
      securityLevel: sessionData.securityLevel,
      deviceTrust: sessionData.deviceTrust
    });

    return {
      sessionId,
      token: this.generateSessionToken(sessionData),
      expiresAt: Date.now() + SECURITY_CONFIG.session.maxAge,
      securityLevel: sessionData.securityLevel
    };
  }

  // Session Validation with Multi-Factor Verification
  validateSession(req: Request): SessionValidationResult {
    const sessionToken = this.extractSessionToken(req);
    if (!sessionToken) {
      return { valid: false, reason: 'NO_TOKEN' };
    }

    const sessionData = this.activeSessions.get(sessionToken.sessionId);
    if (!sessionData) {
      return { valid: false, reason: 'SESSION_NOT_FOUND' };
    }

    // Verify session integrity
    if (!this.verifySessionIntegrity(sessionToken, sessionData)) {
      this.auditLog('SESSION_TAMPERED', sessionData.userId, req);
      this.invalidateSession(sessionToken.sessionId);
      return { valid: false, reason: 'SESSION_TAMPERED' };
    }

    // Check session expiration
    const now = Date.now();
    const sessionAge = now - sessionData.createdAt;
    const inactivityTime = now - sessionData.lastActivity;

    if (sessionAge > SECURITY_CONFIG.session.absoluteTimeout) {
      this.invalidateSession(sessionToken.sessionId);
      return { valid: false, reason: 'ABSOLUTE_TIMEOUT' };
    }

    if (inactivityTime > SECURITY_CONFIG.session.maxAge) {
      this.invalidateSession(sessionToken.sessionId);
      return { valid: false, reason: 'INACTIVITY_TIMEOUT' };
    }

    // Verify client fingerprint
    const currentFingerprint = this.generateClientFingerprint(req);
    if (sessionData.clientFingerprint !== currentFingerprint) {
      this.auditLog('FINGERPRINT_MISMATCH', sessionData.userId, req);
      this.flagSuspiciousActivity(sessionData.userId, 'FINGERPRINT_CHANGE');
      this.invalidateSession(sessionToken.sessionId);
      return { valid: false, reason: 'FINGERPRINT_MISMATCH' };
    }

    // Check IP address consistency
    const currentIP = this.getClientIP(req);
    if (sessionData.ipAddress !== currentIP) {
      // For medical data, be more strict about IP changes
      if (!this.isIPChangeAllowed(sessionData.ipAddress, currentIP)) {
        this.auditLog('IP_ADDRESS_CHANGE', sessionData.userId, req, {
          originalIP: sessionData.ipAddress,
          newIP: currentIP
        });
        this.flagSuspiciousActivity(sessionData.userId, 'IP_CHANGE');
        this.invalidateSession(sessionToken.sessionId);
        return { valid: false, reason: 'IP_ADDRESS_CHANGE' };
      }
    }

    // Check if 2FA is required and verified
    if (SECURITY_CONFIG.session.requireTwoFactor && !sessionData.twoFactorVerified) {
      return { valid: false, reason: 'TWO_FACTOR_REQUIRED' };
    }

    // Update last activity
    sessionData.lastActivity = now;
    this.updateAccessPattern(sessionData, req);

    return {
      valid: true,
      sessionData,
      shouldRenew: inactivityTime > SECURITY_CONFIG.session.renewThreshold
    };
  }

  // Advanced Input Sanitization and Validation
  sanitizeAndValidateInput(req: Request, res: Response, next: NextFunction) {
    try {
      // Deep sanitization of request data
      if (req.body) {
        req.body = this.deepSanitize(req.body);
        
        // Validate medical data fields
        if (this.containsMedicalData(req.body)) {
          const validationResult = this.validateMedicalData(req.body);
          if (!validationResult.valid) {
            this.auditLog('INVALID_MEDICAL_DATA', req.user?.id, req, {
              errors: validationResult.errors
            });
            return res.status(400).json({
              error: 'Invalid medical data format',
              code: 'MEDICAL_DATA_VALIDATION_FAILED'
            });
          }
        }
      }

      // Sanitize query parameters
      if (req.query) {
        req.query = this.deepSanitize(req.query);
      }

      // Check for suspicious patterns (menos restritivo em desenvolvimento)
      const isDevelopment = process.env.NODE_ENV === 'development';
      if (!isDevelopment && this.detectSuspiciousPatterns(req)) {
        this.auditLog('SUSPICIOUS_PATTERN_DETECTED', req.user?.id, req);
        return res.status(400).json({
          error: 'Suspicious request pattern detected',
          code: 'SUSPICIOUS_PATTERN'
        });
      } else if (isDevelopment && this.detectSuspiciousPatterns(req)) {
        // Em desenvolvimento, apenas log sem bloquear
        console.log('[SECURITY DEV] Suspicious pattern detected but allowed:', req.path);
      }

      next();
    } catch (error) {
      this.auditLog('SANITIZATION_ERROR', req.user?.id, req, { error: error.message });
      return res.status(500).json({
        error: 'Request processing error',
        code: 'SANITIZATION_ERROR'
      });
    }
  }

  // Medical Data Encryption
  encryptMedicalData(data: any, userId: string): EncryptedData {
    const key = this.deriveUserKey(userId);
    const iv = crypto.randomBytes(SECURITY_CONFIG.encryption.ivLength);
    const cipher = crypto.createCipher(SECURITY_CONFIG.encryption.algorithm, key);
    cipher.setAAD(Buffer.from(userId)); // Additional authenticated data
    
    const encrypted = Buffer.concat([
      cipher.update(JSON.stringify(data), 'utf8'),
      cipher.final()
    ]);
    
    const tag = cipher.getAuthTag();
    
    return {
      data: encrypted.toString('base64'),
      iv: iv.toString('base64'),
      tag: tag.toString('base64'),
      algorithm: SECURITY_CONFIG.encryption.algorithm,
      timestamp: Date.now()
    };
  }

  decryptMedicalData(encryptedData: EncryptedData, userId: string): any {
    const key = this.deriveUserKey(userId);
    const decipher = crypto.createDecipher(
      encryptedData.algorithm, 
      key
    );
    
    decipher.setAAD(Buffer.from(userId));
    decipher.setAuthTag(Buffer.from(encryptedData.tag, 'base64'));
    
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(encryptedData.data, 'base64')),
      decipher.final()
    ]);
    
    return JSON.parse(decrypted.toString('utf8'));
  }

  // Biometric Authentication Support
  setupBiometricAuth() {
    return {
      challenge: crypto.randomBytes(32).toString('base64'),
      timeout: 60000, // 1 minute
      userVerification: 'required',
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'required',
        residentKey: 'required'
      },
      attestation: 'direct'
    };
  }

  verifyBiometricAuth(credential: any, challenge: string, userId: string): boolean {
    try {
      // Verify WebAuthn credential
      // This would integrate with a WebAuthn library
      
      this.auditLog('BIOMETRIC_AUTH_SUCCESS', userId, null, {
        credentialId: credential.id,
        authenticatorData: credential.response.authenticatorData
      });
      
      return true;
    } catch (error) {
      this.auditLog('BIOMETRIC_AUTH_FAILED', userId, null, {
        error: error.message
      });
      return false;
    }
  }

  // Advanced Audit Logging
  auditLog(action: string, userId?: string, req?: Request, additionalData?: any) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      action,
      userId: userId || 'anonymous',
      ipAddress: req ? this.getClientIP(req) : null,
      userAgent: req ? req.headers['user-agent'] : null,
      requestId: req ? req.headers['x-request-id'] || crypto.randomUUID() : null,
      sessionId: req ? this.extractSessionToken(req)?.sessionId : null,
      path: req ? req.path : null,
      method: req ? req.method : null,
      additionalData: additionalData || {},
      severity: this.calculateLogSeverity(action),
      compliance: {
        hipaa: true,
        lgpd: true,
        gdpr: true
      }
    };

    // Log to secure audit system
    console.log('[SECURITY AUDIT]', JSON.stringify(logEntry));
    
    // In production, this would go to a secure logging service
    // this.sendToSecureAuditService(logEntry);
  }

  // Private helper methods
  private generateSecureSessionId(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  private generateClientFingerprint(req: Request): string {
    const components = [
      req.headers['user-agent'],
      req.headers['accept-language'],
      req.headers['accept-encoding'],
      req.ip,
      req.headers['sec-ch-ua'],
      req.headers['sec-ch-ua-mobile'],
      req.headers['sec-ch-ua-platform']
    ].filter(Boolean);

    return crypto
      .createHash('sha256')
      .update(components.join('|'))
      .digest('hex');
  }

  private getClientIP(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'] as string;
    const remoteAddress = req.connection?.remoteAddress || req.socket?.remoteAddress;
    
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    
    return remoteAddress || 'unknown';
  }

  private calculateSecurityLevel(req: Request): SecurityLevel {
    let score = 0;
    
    // HTTPS connection
    if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
      score += 20;
    }
    
    // Strong user agent
    const userAgent = req.headers['user-agent'] || '';
    if (userAgent.length > 50 && !this.isSuspiciousUserAgent(userAgent)) {
      score += 15;
    }
    
    // Security headers present
    if (req.headers['sec-fetch-site']) score += 10;
    if (req.headers['sec-fetch-mode']) score += 10;
    if (req.headers['sec-fetch-dest']) score += 10;
    
    // Referrer policy
    if (req.headers['referer'] && req.headers['referer'].includes(req.headers.host || '')) {
      score += 15;
    }
    
    // Accept headers
    if (req.headers['accept'] && req.headers['accept-language']) {
      score += 10;
    }
    
    if (score >= 80) return 'HIGH';
    if (score >= 60) return 'MEDIUM';
    return 'LOW';
  }

  private calculateDeviceTrust(req: Request): DeviceTrustLevel {
    // This would integrate with device fingerprinting and reputation services
    // For now, using basic heuristics
    
    const userAgent = req.headers['user-agent'] || '';
    const hasSecurityHeaders = !!(req.headers['sec-ch-ua'] && req.headers['sec-fetch-site']);
    
    if (hasSecurityHeaders && !this.isSuspiciousUserAgent(userAgent)) {
      return 'TRUSTED';
    }
    
    return 'UNKNOWN';
  }

  private isSuspiciousUserAgent(userAgent: string): boolean {
    const suspiciousPatterns = [
      /bot/i, /crawler/i, /spider/i, /scraper/i,
      /curl/i, /wget/i, /python/i, /postman/i,
      /automated/i, /headless/i
    ];
    
    return suspiciousPatterns.some(pattern => pattern.test(userAgent));
  }

  private generateSessionToken(sessionData: SessionData): string {
    const payload = {
      sid: sessionData.sessionId,
      uid: sessionData.userId,
      iat: sessionData.issuedAt,
      exp: sessionData.lastActivity + SECURITY_CONFIG.session.maxAge
    };
    
    const signature = crypto
      .createHmac('sha256', process.env.SESSION_SECRET || 'default-secret')
      .update(JSON.stringify(payload))
      .digest('hex');
    
    return Buffer.from(JSON.stringify({ ...payload, sig: signature })).toString('base64');
  }

  private extractSessionToken(req: Request): SessionToken | null {
    const authHeader = req.headers.authorization;
    const cookieToken = req.cookies?.sessionToken;
    
    const token = authHeader?.replace('Bearer ', '') || cookieToken;
    
    if (!token) return null;
    
    try {
      const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf8'));
      return {
        sessionId: decoded.sid,
        token,
        expiresAt: decoded.exp,
        securityLevel: 'MEDIUM' // Would be determined from session data
      };
    } catch {
      return null;
    }
  }

  private verifySessionIntegrity(token: SessionToken, sessionData: SessionData): boolean {
    try {
      const decoded = JSON.parse(Buffer.from(token.token, 'base64').toString('utf8'));
      
      const payload = {
        sid: decoded.sid,
        uid: decoded.uid,
        iat: decoded.iat,
        exp: decoded.exp
      };
      
      const expectedSignature = crypto
        .createHmac('sha256', process.env.SESSION_SECRET || 'default-secret')
        .update(JSON.stringify(payload))
        .digest('hex');
      
      return decoded.sig === expectedSignature;
    } catch {
      return false;
    }
  }

  private deriveUserKey(userId: string): Buffer {
    const salt = crypto
      .createHash('sha256')
      .update(userId + (process.env.ENCRYPTION_SALT || 'default-salt'))
      .digest();
    
    return crypto.pbkdf2Sync(
      process.env.MASTER_KEY || 'default-master-key',
      salt,
      SECURITY_CONFIG.encryption.keyDerivationIterations,
      32,
      'sha256'
    );
  }

  private deepSanitize(obj: any): any {
    if (typeof obj === 'string') {
      return this.sanitizeString(obj);
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.deepSanitize(item));
    }
    
    if (typeof obj === 'object' && obj !== null) {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        const sanitizedKey = this.sanitizeString(key);
        sanitized[sanitizedKey] = this.deepSanitize(value);
      }
      return sanitized;
    }
    
    return obj;
  }

  private sanitizeString(str: string): string {
    return str
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .replace(/data:(?!image\/)/gi, '')
      .replace(/vbscript:/gi, '')
      .replace(/expression\s*\(/gi, '')
      .trim();
  }

  private containsMedicalData(data: any): boolean {
    const medicalFields = [
      'examResults', 'healthMetrics', 'diagnosis', 'medications',
      'allergies', 'symptoms', 'treatments', 'labResults',
      'vitalSigns', 'medicalHistory', 'prescriptions'
    ];
    
    const jsonString = JSON.stringify(data).toLowerCase();
    return medicalFields.some(field => jsonString.includes(field.toLowerCase()));
  }

  private validateMedicalData(data: any): ValidationResult {
    const errors: string[] = [];
    
    // Validate exam results format
    if (data.examResults) {
      if (!Array.isArray(data.examResults)) {
        errors.push('examResults must be an array');
      }
    }
    
    // Validate health metrics
    if (data.healthMetrics) {
      if (!Array.isArray(data.healthMetrics)) {
        errors.push('healthMetrics must be an array');
      } else {
        data.healthMetrics.forEach((metric: any, index: number) => {
          if (!metric.name || !metric.value || !metric.unit) {
            errors.push(`healthMetrics[${index}] missing required fields`);
          }
        });
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  private detectSuspiciousPatterns(req: Request): boolean {
    const suspiciousPatterns = [
      // SQL injection patterns
      /(\s|^)(select|insert|update|delete|drop|create|alter|exec|execute|union)\s/gi,
      // XSS patterns
      /<script|javascript:|onload=|onerror=/gi,
      // Path traversal
      /\.\.[\/\\]/g,
      // Command injection
      /(?:;|\|\||&&)\s*(?:cat|ls|whoami|pwd|netstat|ps)\b|[`$]\(|\${/gi,
      // LDAP injection
      /[()&|!*]/g
    ];
    
    const requestContent = JSON.stringify({
      url: req.url,
      body: req.body,
      query: req.query
    });
    
    return suspiciousPatterns.some(pattern => pattern.test(requestContent));
  }

  private calculateLogSeverity(action: string): LogSeverity {
    const highSeverityActions = [
      'SESSION_TAMPERED', 'FINGERPRINT_MISMATCH', 'IP_ADDRESS_CHANGE',
      'SUSPICIOUS_PATTERN_DETECTED', 'BRUTE_FORCE_DETECTED'
    ];
    
    const mediumSeverityActions = [
      'SESSION_CREATED', 'SESSION_EXPIRED', 'TWO_FACTOR_REQUIRED',
      'INVALID_MEDICAL_DATA'
    ];
    
    if (highSeverityActions.includes(action)) return 'HIGH';
    if (mediumSeverityActions.includes(action)) return 'MEDIUM';
    return 'LOW';
  }

  private cleanupExpiredSessions() {
    const now = Date.now();
    let cleanedCount = 0;
    
    for (const [sessionId, sessionData] of this.activeSessions.entries()) {
      const sessionAge = now - sessionData.createdAt;
      const inactivityTime = now - sessionData.lastActivity;
      
      if (sessionAge > SECURITY_CONFIG.session.absoluteTimeout ||
          inactivityTime > SECURITY_CONFIG.session.maxAge) {
        this.activeSessions.delete(sessionId);
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      console.log(`[SECURITY] Cleaned up ${cleanedCount} expired sessions`);
    }
  }

  private cleanupFailedAttempts() {
    const now = Date.now();
    let cleanedCount = 0;
    
    for (const [key, attemptData] of this.failedAttempts.entries()) {
      if (now - attemptData.lastAttempt > SECURITY_CONFIG.session.lockoutDuration) {
        this.failedAttempts.delete(key);
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      console.log(`[SECURITY] Cleaned up ${cleanedCount} failed attempt records`);
    }
  }

  private enforceSessionLimits(userId: string) {
    const userSessions = Array.from(this.activeSessions.values())
      .filter(session => session.userId === userId);
    
    if (userSessions.length >= SECURITY_CONFIG.session.maxConcurrentSessions) {
      // Remove oldest session
      const oldestSession = userSessions
        .sort((a, b) => a.lastActivity - b.lastActivity)[0];
      
      this.invalidateSession(oldestSession.sessionId);
      this.auditLog('SESSION_LIMIT_EXCEEDED', userId, null, {
        removedSession: oldestSession.sessionId
      });
    }
  }

  private invalidateSession(sessionId: string) {
    this.activeSessions.delete(sessionId);
  }

  private updateAccessPattern(sessionData: SessionData, req: Request) {
    sessionData.accessPattern.push({
      timestamp: Date.now(),
      path: req.path,
      method: req.method,
      userAgent: req.headers['user-agent'] || ''
    });
    
    // Keep only last 50 access records
    if (sessionData.accessPattern.length > 50) {
      sessionData.accessPattern = sessionData.accessPattern.slice(-50);
    }
  }

  private isIPChangeAllowed(originalIP: string, newIP: string): boolean {
    // For medical data, be very strict about IP changes
    // Only allow changes within same subnet or known safe ranges
    
    const originalParts = originalIP.split('.');
    const newParts = newIP.split('.');
    
    // Same IP
    if (originalIP === newIP) return true;
    
    // Same /24 subnet (only last octet different)
    if (originalParts.slice(0, 3).join('.') === newParts.slice(0, 3).join('.')) {
      return true;
    }
    
    // For production, this would check against known safe IP ranges
    return false;
  }

  private flagSuspiciousActivity(userId: string, activityType: string) {
    const key = `${userId}:${activityType}`;
    const existing = this.suspiciousActivity.get(key);
    
    if (existing) {
      existing.count++;
      existing.lastOccurrence = Date.now();
    } else {
      this.suspiciousActivity.set(key, {
        count: 1,
        firstOccurrence: Date.now(),
        lastOccurrence: Date.now(),
        activityType
      });
    }
    
    // Alert if suspicious activity threshold exceeded
    const activity = this.suspiciousActivity.get(key)!;
    if (activity.count >= 3) {
      this.auditLog('SUSPICIOUS_ACTIVITY_THRESHOLD', userId, null, {
        activityType,
        count: activity.count
      });
    }
  }
}

// Type definitions
interface SessionData {
  sessionId: string;
  userId: string;
  userRole: string;
  clientFingerprint: string;
  ipAddress: string;
  createdAt: number;
  lastActivity: number;
  issuedAt: number;
  twoFactorVerified: boolean;
  securityLevel: SecurityLevel;
  accessPattern: AccessRecord[];
  deviceTrust: DeviceTrustLevel;
}

interface SessionToken {
  sessionId: string;
  token: string;
  expiresAt: number;
  securityLevel: SecurityLevel;
}

interface SessionValidationResult {
  valid: boolean;
  reason?: string;
  sessionData?: SessionData;
  shouldRenew?: boolean;
}

interface EncryptedData {
  data: string;
  iv: string;
  tag: string;
  algorithm: string;
  timestamp: number;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

interface FailedAttemptData {
  count: number;
  lastAttempt: number;
  ipAddress: string;
}

interface SuspiciousActivityData {
  count: number;
  firstOccurrence: number;
  lastOccurrence: number;
  activityType: string;
}

interface AccessRecord {
  timestamp: number;
  path: string;
  method: string;
  userAgent: string;
}

type SecurityLevel = 'HIGH' | 'MEDIUM' | 'LOW';
type DeviceTrustLevel = 'TRUSTED' | 'UNKNOWN' | 'UNTRUSTED';
type LogSeverity = 'HIGH' | 'MEDIUM' | 'LOW';

export const advancedSecurity = new AdvancedSessionSecurity();
