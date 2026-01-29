import type { Express } from "express";
import { biometricTwoFactorAuth } from "../auth/biometric-2fa";
import { intrusionDetection } from "../security/intrusion-detection";
import { advancedSecurity } from "../middleware/advanced-security";
import { rbacSystem } from "../auth/rbac-system";
import { webApplicationFirewall } from "../security/waf";
import { encryptedBackup } from "../backup/encrypted-backup";

export function registerSecurityRoutes(app: Express) {
    // Set up biometric and 2FA authentication routes
    app.post("/api/auth/biometric/register", biometricTwoFactorAuth.registerBiometric.bind(biometricTwoFactorAuth));
    app.post("/api/auth/biometric/verify-registration", biometricTwoFactorAuth.verifyBiometricRegistration.bind(biometricTwoFactorAuth));
    app.post("/api/auth/totp/setup", biometricTwoFactorAuth.setupTOTP.bind(biometricTwoFactorAuth));
    app.post("/api/auth/totp/verify-setup", biometricTwoFactorAuth.verifyTOTPSetup.bind(biometricTwoFactorAuth));
    app.post("/api/auth/mfa/authenticate", biometricTwoFactorAuth.authenticate.bind(biometricTwoFactorAuth));

    // Security and backup management routes
    app.get("/api/security/statistics", rbacSystem.requirePermission('audit', 'read'), async (req, res) => {
        try {
            const stats = intrusionDetection.getSecurityStatistics();
            res.json(stats);
        } catch (error) {
            res.status(500).json({ message: "Erro ao obter estatísticas de segurança" });
        }
    });

    // WAF management routes
    app.get("/api/waf/statistics", rbacSystem.requirePermission('security', 'read'), async (req, res) => {
        try {
            const stats = webApplicationFirewall.getStatistics();
            res.json(stats);
        } catch (error) {
            res.status(500).json({ message: "Erro ao obter estatísticas do WAF" });
        }
    });

    app.get("/api/waf/rules", rbacSystem.requirePermission('security', 'read'), async (req, res) => {
        try {
            const rules = webApplicationFirewall.getActiveRules();
            res.json(rules);
        } catch (error) {
            res.status(500).json({ message: "Erro ao obter regras do WAF" });
        }
    });

    app.post("/api/waf/rules/:ruleId/toggle", rbacSystem.requirePermission('security', 'update'), async (req, res) => {
        try {
            const { ruleId } = req.params;
            const { enabled } = req.body;
            webApplicationFirewall.toggleRule(ruleId, enabled);

            advancedSecurity.auditLog('WAF_RULE_TOGGLED', req.user?.id?.toString(), req, { ruleId, enabled });
            res.json({ success: true, message: `Regra ${ruleId} ${enabled ? 'ativada' : 'desativada'}` });
        } catch (error) {
            res.status(500).json({ message: "Erro ao atualizar regra do WAF" });
        }
    });

    app.post("/api/waf/whitelist", rbacSystem.requirePermission('security', 'update'), async (req, res) => {
        try {
            const { ip } = req.body;
            webApplicationFirewall.whitelistIP(ip);

            advancedSecurity.auditLog('WAF_IP_WHITELISTED', req.user?.id?.toString(), req, { ip });
            res.json({ success: true, message: `IP ${ip} adicionado à lista branca` });
        } catch (error) {
            res.status(500).json({ message: "Erro ao adicionar IP à lista branca" });
        }
    });

    app.post("/api/waf/blacklist", rbacSystem.requirePermission('security', 'update'), async (req, res) => {
        try {
            const { ip } = req.body;
            webApplicationFirewall.blacklistIP(ip);

            advancedSecurity.auditLog('WAF_IP_BLACKLISTED', req.user?.id?.toString(), req, { ip });
            res.json({ success: true, message: `IP ${ip} adicionado à lista negra` });
        } catch (error) {
            res.status(500).json({ message: "Erro ao adicionar IP à lista negra" });
        }
    });

    app.post("/api/backup/create", rbacSystem.requirePermission('system', 'backup'), async (req, res) => {
        try {
            const { type } = req.body;
            const backup = await encryptedBackup.createFullBackup(type || 'manual');
            res.json(backup);
        } catch (error) {
            res.status(500).json({ message: "Erro ao criar backup", error: (error as Error).message });
        }
    });

    app.get("/api/backup/history", rbacSystem.requirePermission('system', 'backup'), async (req, res) => {
        try {
            const history = await encryptedBackup.getBackupHistory();
            res.json(history);
        } catch (error) {
            res.status(500).json({ message: "Erro ao obter histórico de backups" });
        }
    });

    app.post("/api/backup/restore/:backupId", rbacSystem.requirePermission('system', 'backup'), async (req, res) => {
        try {
            const { backupId } = req.params;
            const { tables, dryRun, overwrite } = req.body;
            const result = await encryptedBackup.restoreBackup(backupId, { tables, dryRun, overwrite });
            res.json(result);
        } catch (error) {
            res.status(500).json({ message: "Erro ao restaurar backup", error: (error as Error).message });
        }
    });

    app.post("/api/backup/verify/:backupId", rbacSystem.requirePermission('system', 'backup'), async (req, res) => {
        try {
            const { backupId } = req.params;
            const result = await encryptedBackup.verifyBackup(backupId);
            res.json(result);
        } catch (error) {
            res.status(500).json({ message: "Erro ao verificar backup", error: (error as Error).message });
        }
    });
}
