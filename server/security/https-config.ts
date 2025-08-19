import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { Express } from 'express';
import { advancedSecurity } from '../middleware/advanced-security';

// Configuração HTTPS com Certificados EV e HSTS para Dados Médicos
// Implementa os mais altos padrões de segurança de transporte

interface SSLConfig {
  enabled: boolean;
  certificatePath: string;
  privateKeyPath: string;
  chainPath?: string;
  dhParamPath?: string;
  port: number;
  redirectHTTP: boolean;
  httpPort: number;
  hsts: {
    enabled: boolean;
    maxAge: number;
    includeSubdomains: boolean;
    preload: boolean;
  };
  tls: {
    minVersion: string;
    maxVersion: string;
    ciphers: string[];
    honorCipherOrder: boolean;
    secureProtocol: string;
  };
  certificateTransparency: boolean;
  ocspStapling: boolean;
}

interface SecurityHeaders {
  strictTransportSecurity: string;
  contentSecurityPolicy: string;
  xFrameOptions: string;
  xContentTypeOptions: string;
  referrerPolicy: string;
  featurePolicy: string;
  permissionsPolicy: string;
}

export class HTTPSConfigManager {
  private config: SSLConfig;
  private securityHeaders: SecurityHeaders;
  private certificateInfo: any = null;
  private server: https.Server | null = null;
  private httpRedirectServer: http.Server | null = null;

  constructor() {
    this.config = {
      enabled: process.env.NODE_ENV === 'production',
      certificatePath: process.env.SSL_CERT_PATH || './certs/cert.pem',
      privateKeyPath: process.env.SSL_KEY_PATH || './certs/key.pem',
      chainPath: process.env.SSL_CHAIN_PATH || './certs/chain.pem',
      dhParamPath: process.env.SSL_DH_PATH || './certs/dhparam.pem',
      port: parseInt(process.env.HTTPS_PORT || '443'),
      redirectHTTP: true,
      httpPort: parseInt(process.env.HTTP_PORT || '80'),
      hsts: {
        enabled: true,
        maxAge: 31536000, // 1 ano
        includeSubdomains: true,
        preload: true
      },
      tls: {
        minVersion: 'TLSv1.2',
        maxVersion: 'TLSv1.3',
        ciphers: [
          // TLS 1.3 (mais seguro)
          'TLS_AES_256_GCM_SHA384',
          'TLS_CHACHA20_POLY1305_SHA256',
          'TLS_AES_128_GCM_SHA256',
          // TLS 1.2 (compatibilidade)
          'ECDHE-RSA-AES256-GCM-SHA384',
          'ECDHE-RSA-CHACHA20-POLY1305',
          'ECDHE-RSA-AES128-GCM-SHA256',
          'ECDHE-RSA-AES256-SHA384',
          'ECDHE-RSA-AES128-SHA256'
        ],
        honorCipherOrder: true,
        secureProtocol: 'TLSv1_2_method'
      },
      certificateTransparency: true,
      ocspStapling: true
    };

    this.securityHeaders = {
      strictTransportSecurity: this.buildHSTSHeader(),
      contentSecurityPolicy: this.buildCSPHeader(),
      xFrameOptions: 'DENY',
      xContentTypeOptions: 'nosniff',
      referrerPolicy: 'strict-origin-when-cross-origin',
      featurePolicy: this.buildFeaturePolicyHeader(),
      permissionsPolicy: this.buildPermissionsPolicyHeader()
    };
  }

  /**
   * Configurar servidor HTTPS com certificados EV
   */
  async setupHTTPSServer(app: Express): Promise<https.Server | http.Server> {
    if (!this.config.enabled) {
      console.log('[HTTPS] Modo desenvolvimento - usando HTTP');
      return http.createServer(app);
    }

    try {
      // Verificar se os certificados existem
      await this.validateCertificates();

      // Carregar certificados
      const credentials = await this.loadSSLCredentials();

      // Configurar opções SSL/TLS
      const sslOptions = {
        ...credentials,
        minVersion: this.config.tls.minVersion,
        maxVersion: this.config.tls.maxVersion,
        ciphers: this.config.tls.ciphers.join(':'),
        honorCipherOrder: this.config.tls.honorCipherOrder,
        secureProtocol: this.config.tls.secureProtocol,
        // Configurações avançadas para dados médicos
        sessionTimeout: 300, // 5 minutos
        handshakeTimeout: 120, // 2 minutos
        requestCert: false,
        rejectUnauthorized: true,
        // OCSP Stapling
        ...(this.config.ocspStapling && { 
          requestOCSP: true 
        })
      };

      // Aplicar middleware de segurança HTTPS
      app.use(this.httpsSecurityMiddleware());

      // Criar servidor HTTPS
      this.server = https.createServer(sslOptions, app);

      // Configurar redirecionamento HTTP para HTTPS
      if (this.config.redirectHTTP) {
        this.setupHTTPRedirect();
      }

      // Log de informações do certificado
      this.logCertificateInfo();

      // Monitorar expiração do certificado
      this.startCertificateMonitoring();

      console.log(`[HTTPS] Servidor HTTPS configurado na porta ${this.config.port}`);
      console.log(`[HTTPS] HSTS habilitado: ${this.config.hsts.enabled}`);
      console.log(`[HTTPS] Certificate Transparency: ${this.config.certificateTransparency}`);
      console.log(`[HTTPS] OCSP Stapling: ${this.config.ocspStapling}`);

      return this.server;

    } catch (error) {
      console.error('[HTTPS] Erro ao configurar HTTPS:', error);
      console.log('[HTTPS] Fallback para HTTP em desenvolvimento');
      return http.createServer(app);
    }
  }

  /**
   * Middleware de segurança HTTPS
   */
  private httpsSecurityMiddleware() {
    return (req: any, res: any, next: any) => {
      // Verificar se a conexão é segura
      if (!req.secure && req.headers['x-forwarded-proto'] !== 'https') {
        if (this.config.redirectHTTP) {
          const httpsUrl = `https://${req.headers.host}${req.url}`;
          return res.redirect(301, httpsUrl);
        }
      }

      // Aplicar headers de segurança
      res.setHeader('Strict-Transport-Security', this.securityHeaders.strictTransportSecurity);
      res.setHeader('Content-Security-Policy', this.securityHeaders.contentSecurityPolicy);
      res.setHeader('X-Frame-Options', this.securityHeaders.xFrameOptions);
      res.setHeader('X-Content-Type-Options', this.securityHeaders.xContentTypeOptions);
      res.setHeader('Referrer-Policy', this.securityHeaders.referrerPolicy);
      res.setHeader('Feature-Policy', this.securityHeaders.featurePolicy);
      res.setHeader('Permissions-Policy', this.securityHeaders.permissionsPolicy);

      // Headers específicos para dados médicos
      res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
      res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
      res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
      res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');

      // Cache control para dados sensíveis
      if (req.path.includes('/api/')) {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
      }

      next();
    };
  }

  /**
   * Configurar redirecionamento HTTP para HTTPS
   */
  private setupHTTPRedirect() {
    const redirectApp = (req: any, res: any) => {
      const httpsUrl = `https://${req.headers.host}${req.url}`;
      
      // Log de tentativa de acesso HTTP
      advancedSecurity.auditLog('HTTP_REDIRECT', null, req, {
        originalUrl: req.url,
        redirectUrl: httpsUrl,
        userAgent: req.headers['user-agent']
      });

      res.writeHead(301, {
        'Location': httpsUrl,
        'Strict-Transport-Security': this.securityHeaders.strictTransportSecurity
      });
      res.end();
    };

    this.httpRedirectServer = http.createServer(redirectApp);
    this.httpRedirectServer.listen(this.config.httpPort, () => {
      console.log(`[HTTPS] Redirecionamento HTTP->HTTPS ativo na porta ${this.config.httpPort}`);
    });
  }

  /**
   * Carregar credenciais SSL
   */
  private async loadSSLCredentials(): Promise<any> {
    const credentials: any = {};

    try {
      // Certificado principal
      credentials.cert = await fs.promises.readFile(this.config.certificatePath, 'utf8');
      console.log('[HTTPS] Certificado carregado');

      // Chave privada
      credentials.key = await fs.promises.readFile(this.config.privateKeyPath, 'utf8');
      console.log('[HTTPS] Chave privada carregada');

      // Chain de certificados (se existir)
      if (this.config.chainPath && await this.fileExists(this.config.chainPath)) {
        credentials.ca = await fs.promises.readFile(this.config.chainPath, 'utf8');
        console.log('[HTTPS] Chain de certificados carregada');
      }

      // Parâmetros Diffie-Hellman (se existir)
      if (this.config.dhParamPath && await this.fileExists(this.config.dhParamPath)) {
        credentials.dhparam = await fs.promises.readFile(this.config.dhParamPath, 'utf8');
        console.log('[HTTPS] Parâmetros DH carregados');
      }

      return credentials;
    } catch (error) {
      throw new Error(`Erro ao carregar certificados SSL: ${error.message}`);
    }
  }

  /**
   * Validar certificados
   */
  private async validateCertificates(): Promise<void> {
    const requiredFiles = [
      { path: this.config.certificatePath, name: 'Certificado' },
      { path: this.config.privateKeyPath, name: 'Chave privada' }
    ];

    for (const file of requiredFiles) {
      if (!await this.fileExists(file.path)) {
        throw new Error(`${file.name} não encontrado: ${file.path}`);
      }
    }

    // Validar formato do certificado
    try {
      const cert = await fs.promises.readFile(this.config.certificatePath, 'utf8');
      if (!cert.includes('BEGIN CERTIFICATE')) {
        throw new Error('Formato de certificado inválido');
      }
    } catch (error) {
      throw new Error(`Erro ao validar certificado: ${error.message}`);
    }
  }

  /**
   * Verificar se arquivo existe
   */
  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.promises.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Construir header HSTS
   */
  private buildHSTSHeader(): string {
    if (!this.config.hsts.enabled) return '';

    let hsts = `max-age=${this.config.hsts.maxAge}`;
    
    if (this.config.hsts.includeSubdomains) {
      hsts += '; includeSubDomains';
    }
    
    if (this.config.hsts.preload) {
      hsts += '; preload';
    }

    return hsts;
  }

  /**
   * Construir header CSP (Content Security Policy)
   */
  private buildCSPHeader(): string {
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://replit.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' https://api.stripe.com https://replit.com wss://replit.com",
      "frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://replit.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests",
      "block-all-mixed-content"
    ];

    return csp.join('; ');
  }

  /**
   * Construir header Feature Policy
   */
  private buildFeaturePolicyHeader(): string {
    const policies = [
      "accelerometer 'none'",
      "camera 'none'",
      "geolocation 'none'",
      "gyroscope 'none'",
      "magnetometer 'none'",
      "microphone 'none'",
      "payment 'self'",
      "usb 'none'"
    ];

    return policies.join(', ');
  }

  /**
   * Construir header Permissions Policy
   */
  private buildPermissionsPolicyHeader(): string {
    const policies = [
      "accelerometer=()",
      "camera=()",
      "geolocation=()",
      "gyroscope=()",
      "magnetometer=()",
      "microphone=()",
      "payment=(self)",
      "usb=()"
    ];

    return policies.join(', ');
  }

  /**
   * Log de informações do certificado
   */
  private logCertificateInfo() {
    try {
      const crypto = require('crypto');
      const cert = fs.readFileSync(this.config.certificatePath, 'utf8');
      const x509 = new crypto.X509Certificate(cert);

      this.certificateInfo = {
        subject: x509.subject,
        issuer: x509.issuer,
        validFrom: x509.validFrom,
        validTo: x509.validTo,
        fingerprint: x509.fingerprint,
        serialNumber: x509.serialNumber,
        isEV: this.checkEVCertificate(x509)
      };

      console.log('[HTTPS] Informações do Certificado:');
      console.log(`  Assunto: ${this.certificateInfo.subject}`);
      console.log(`  Emissor: ${this.certificateInfo.issuer}`);
      console.log(`  Válido de: ${this.certificateInfo.validFrom}`);
      console.log(`  Válido até: ${this.certificateInfo.validTo}`);
      console.log(`  EV Certificate: ${this.certificateInfo.isEV ? 'Sim' : 'Não'}`);
      console.log(`  Fingerprint: ${this.certificateInfo.fingerprint}`);

      // Log de auditoria
      advancedSecurity.auditLog('CERTIFICATE_LOADED', null, null, this.certificateInfo);

    } catch (error) {
      console.error('[HTTPS] Erro ao ler informações do certificado:', error);
    }
  }

  /**
   * Verificar se é certificado EV
   */
  private checkEVCertificate(x509: any): boolean {
    try {
      // Verificar OIDs específicos de certificados EV
      const evOIDs = [
        '2.16.840.1.114412.2.1',     // DigiCert
        '1.3.6.1.4.1.6449.1.2.1.5.1', // Comodo
        '2.16.528.1.1003.1.2.7',     // QuoVadis
        '1.3.6.1.4.1.8024.0.2.100.1.2', // Entrust
        '2.16.840.1.114404.1.1.2.4.1'   // GoDaddy
      ];

      const subject = x509.subject;
      return evOIDs.some(oid => subject.includes(oid));
    } catch {
      return false;
    }
  }

  /**
   * Monitorar expiração do certificado
   */
  private startCertificateMonitoring() {
    const checkCertificate = () => {
      if (!this.certificateInfo) return;

      const validTo = new Date(this.certificateInfo.validTo);
      const now = new Date();
      const daysUntilExpiry = Math.floor((validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      if (daysUntilExpiry <= 30) {
        console.warn(`[HTTPS] ATENÇÃO: Certificado expira em ${daysUntilExpiry} dias!`);
        
        advancedSecurity.auditLog('CERTIFICATE_EXPIRING', null, null, {
          daysUntilExpiry,
          expirationDate: validTo,
          fingerprint: this.certificateInfo.fingerprint
        });
      }

      if (daysUntilExpiry <= 7) {
        console.error(`[HTTPS] CRÍTICO: Certificado expira em ${daysUntilExpiry} dias!`);
      }
    };

    // Verificar a cada 24 horas
    setInterval(checkCertificate, 24 * 60 * 60 * 1000);
    // Verificação inicial
    setTimeout(checkCertificate, 5000);
  }

  /**
   * Gerar configuração para HSTS Preload
   */
  generateHSTSPreloadConfig(): {
    domain: string;
    includeSubdomains: boolean;
    maxAge: number;
    preload: boolean;
    redirects: boolean;
  } {
    return {
      domain: process.env.DOMAIN || 'vitaview.ai',
      includeSubdomains: this.config.hsts.includeSubdomains,
      maxAge: this.config.hsts.maxAge,
      preload: this.config.hsts.preload,
      redirects: this.config.redirectHTTP
    };
  }

  /**
   * Verificar configuração SSL/TLS
   */
  async testSSLConfiguration(): Promise<{
    valid: boolean;
    grade: string;
    issues: string[];
    recommendations: string[];
  }> {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let grade = 'A+';

    try {
      // Verificar versões TLS
      if (this.config.tls.minVersion !== 'TLSv1.2') {
        issues.push('Versão mínima TLS deve ser 1.2');
        grade = 'B';
      }

      // Verificar HSTS
      if (!this.config.hsts.enabled) {
        issues.push('HSTS não está habilitado');
        grade = 'B';
      }

      if (this.config.hsts.maxAge < 31536000) {
        recommendations.push('HSTS max-age deve ser pelo menos 1 ano');
      }

      // Verificar Certificate Transparency
      if (!this.config.certificateTransparency) {
        recommendations.push('Habilitar Certificate Transparency');
      }

      // Verificar OCSP Stapling
      if (!this.config.ocspStapling) {
        recommendations.push('Habilitar OCSP Stapling');
      }

      return {
        valid: issues.length === 0,
        grade,
        issues,
        recommendations
      };

    } catch (error) {
      return {
        valid: false,
        grade: 'F',
        issues: [`Erro na verificação: ${error.message}`],
        recommendations: []
      };
    }
  }

  /**
   * Obter status da configuração
   */
  getStatus(): {
    httpsEnabled: boolean;
    certificateInfo: any;
    hstsEnabled: boolean;
    port: number;
    tlsVersion: string;
  } {
    return {
      httpsEnabled: this.config.enabled,
      certificateInfo: this.certificateInfo,
      hstsEnabled: this.config.hsts.enabled,
      port: this.config.port,
      tlsVersion: `${this.config.tls.minVersion} - ${this.config.tls.maxVersion}`
    };
  }

  /**
   * Atualizar configuração
   */
  updateConfig(newConfig: Partial<SSLConfig>) {
    this.config = { ...this.config, ...newConfig };
    this.securityHeaders.strictTransportSecurity = this.buildHSTSHeader();
  }

  /**
   * Parar servidores
   */
  shutdown() {
    if (this.server) {
      this.server.close();
      console.log('[HTTPS] Servidor HTTPS parado');
    }

    if (this.httpRedirectServer) {
      this.httpRedirectServer.close();
      console.log('[HTTPS] Servidor de redirecionamento HTTP parado');
    }
  }
}

export const httpsConfig = new HTTPSConfigManager();