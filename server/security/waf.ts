import { Request, Response, NextFunction } from 'express';
import { advancedSecurity } from '../middleware/advanced-security';
import { intrusionDetection } from './intrusion-detection';

// Web Application Firewall (WAF) para Dados Médicos
// Implementa proteção avançada contra ataques web específicos para aplicações de saúde

interface WAFRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  category: 'sql_injection' | 'xss' | 'path_traversal' | 'command_injection' | 'file_upload' | 'rate_limiting' | 'geo_blocking' | 'medical_data_protection';
  severity: 'low' | 'medium' | 'high' | 'critical';
  pattern?: RegExp;
  customCheck?: (req: Request) => boolean;
  action: 'block' | 'log' | 'challenge' | 'rate_limit';
  blockDuration?: number; // em milissegundos
}

interface WAFConfig {
  enabled: boolean;
  logAllRequests: boolean;
  blockMaliciousRequests: boolean;
  rateLimitEnabled: boolean;
  geoBlockingEnabled: boolean;
  medicalDataProtection: boolean;
  maxRequestSize: number;
  allowedFileTypes: string[];
  blockedCountries: string[];
  whitelistedIPs: string[];
  blacklistedIPs: string[];
}

interface RequestStats {
  totalRequests: number;
  blockedRequests: number;
  suspiciousRequests: number;
  topAttackTypes: Record<string, number>;
  topBlockedIPs: Record<string, number>;
  requestsByCountry: Record<string, number>;
}

interface RateLimitEntry {
  count: number;
  windowStart: number;
  blocked: boolean;
  blockedUntil?: number;
}

export class WebApplicationFirewall {
  private config: WAFConfig;
  private rules: WAFRule[] = [];
  private rateLimitMap = new Map<string, RateLimitEntry>();
  private requestStats: RequestStats;
  private blockedIPs = new Set<string>();
  private allowedIPs = new Set<string>();

  constructor() {
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    this.config = {
      enabled: true,
      logAllRequests: false,
      blockMaliciousRequests: !isDevelopment, // Menos restritivo em desenvolvimento
      rateLimitEnabled: !isDevelopment, // Desabilitar rate limiting em desenvolvimento
      geoBlockingEnabled: false,
      medicalDataProtection: true,
      maxRequestSize: 50 * 1024 * 1024, // 50MB
      allowedFileTypes: ['.pdf', '.jpg', '.jpeg', '.png', '.gif', '.docx', '.xlsx'],
      blockedCountries: [], // Configurável conforme necessário
      whitelistedIPs: ['127.0.0.1', '::1', 'localhost'], // Whitelist localhost
      blacklistedIPs: []
    };

    this.requestStats = {
      totalRequests: 0,
      blockedRequests: 0,
      suspiciousRequests: 0,
      topAttackTypes: {},
      topBlockedIPs: {},
      requestsByCountry: {}
    };

    this.initializeWAFRules();
    this.startBackgroundTasks();
  }

  /**
   * Inicializar regras do WAF
   */
  private initializeWAFRules() {
    this.rules = [
      // SQL Injection Protection
      {
        id: 'sql_injection_1',
        name: 'SQL Injection - UNION Attacks',
        description: 'Detecta tentativas de UNION SQL injection',
        enabled: true,
        category: 'sql_injection',
        severity: 'critical',
        pattern: /(\bUNION\b.*\bSELECT\b)|(\bUNION\b.*\bALL\b.*\bSELECT\b)/i,
        action: 'block',
        blockDuration: 60 * 60 * 1000 // 1 hora
      },
      {
        id: 'sql_injection_2',
        name: 'SQL Injection - Boolean Based',
        description: 'Detecta ataques SQL injection baseados em boolean',
        enabled: true,
        category: 'sql_injection',
        severity: 'critical',
        pattern: /(\bAND\b|\bOR\b)\s*(\d+\s*=\s*\d+|\'\w*\'\s*=\s*\'\w*\')/i,
        action: 'block',
        blockDuration: 60 * 60 * 1000
      },
      {
        id: 'sql_injection_3',
        name: 'SQL Injection - Time Based',
        description: 'Detecta ataques SQL injection baseados em tempo',
        enabled: true,
        category: 'sql_injection',
        severity: 'critical',
        pattern: /(sleep|benchmark|waitfor)\s*\(|pg_sleep\s*\(/i,
        action: 'block',
        blockDuration: 2 * 60 * 60 * 1000 // 2 horas
      },

      // XSS Protection
      {
        id: 'xss_1',
        name: 'XSS - Script Tags',
        description: 'Detecta tags script maliciosas',
        enabled: true,
        category: 'xss',
        severity: 'high',
        pattern: /<script[^>]*>.*?<\/script>|<script[^>]*\/?>|javascript:/i,
        action: 'block',
        blockDuration: 30 * 60 * 1000 // 30 minutos
      },
      {
        id: 'xss_2',
        name: 'XSS - Event Handlers',
        description: 'Detecta event handlers maliciosos',
        enabled: true,
        category: 'xss',
        severity: 'high',
        pattern: /on(load|error|click|mouse|focus|blur|change|submit)\s*=/i,
        action: 'block',
        blockDuration: 30 * 60 * 1000
      },
      {
        id: 'xss_3',
        name: 'XSS - Data URLs',
        description: 'Detecta data URLs maliciosas',
        enabled: true,
        category: 'xss',
        severity: 'medium',
        pattern: /data:(?!image\/)[^;]*;.*base64/i,
        action: 'log'
      },

      // Path Traversal Protection
      {
        id: 'path_traversal_1',
        name: 'Path Traversal - Directory Navigation',
        description: 'Detecta tentativas de navegação de diretório',
        enabled: true,
        category: 'path_traversal',
        severity: 'high',
        pattern: /\.\.[\/\\]|[\/\\]\.\.[\/\\]|[\/\\]\.\.$|^\.\.[\/\\]/,
        action: 'block',
        blockDuration: 60 * 60 * 1000
      },
      {
        id: 'path_traversal_2',
        name: 'Path Traversal - Encoded',
        description: 'Detecta path traversal com encoding',
        enabled: true,
        category: 'path_traversal',
        severity: 'high',
        pattern: /(%2e%2e[%2f%5c]|%2e%2e$|^%2e%2e)/i,
        action: 'block',
        blockDuration: 60 * 60 * 1000
      },

      // Command Injection Protection
      {
        id: 'command_injection_1',
        name: 'Command Injection - Shell Commands',
        description: 'Detecta tentativas de injeção de comandos',
        enabled: true,
        category: 'command_injection',
        severity: 'critical',
        pattern: /(?:;|\|\||&&)\s*(?:cat|ls|whoami|pwd|netstat|ps)\b|[`$]\(|\${/i,
        action: 'block',
        blockDuration: 2 * 60 * 60 * 1000
      },

      // Medical Data Protection
      {
        id: 'medical_data_1',
        name: 'Medical Data - Large Data Export',
        description: 'Detecta tentativas de exportação massiva de dados médicos',
        enabled: true,
        category: 'medical_data_protection',
        severity: 'high',
        customCheck: (req: Request) => {
          const isMedicalEndpoint = /\/(exams|health-metrics|diagnoses|medications)/.test(req.path);
          const hasLargeLimit = req.query.limit && parseInt(req.query.limit as string) > 1000;
          return isMedicalEndpoint && hasLargeLimit;
        },
        action: 'challenge'
      },
      {
        id: 'medical_data_2',
        name: 'Medical Data - Rapid Access',
        description: 'Detecta acesso muito rápido a dados médicos sensíveis',
        enabled: true,
        category: 'medical_data_protection',
        severity: 'medium',
        customCheck: (req: Request) => {
          const ip = this.getClientIP(req);
          const now = Date.now();
          const rateLimitKey = `medical_${ip}`;
          const entry = this.rateLimitMap.get(rateLimitKey);
          
          if (!entry) {
            this.rateLimitMap.set(rateLimitKey, {
              count: 1,
              windowStart: now,
              blocked: false
            });
            return false;
          }
          
          const windowDuration = 60 * 1000; // 1 minuto
          if (now - entry.windowStart > windowDuration) {
            entry.count = 1;
            entry.windowStart = now;
            return false;
          }
          
          entry.count++;
          return entry.count > 50; // Mais de 50 requests por minuto
        },
        action: 'rate_limit'
      },

      // File Upload Protection
      {
        id: 'file_upload_1',
        name: 'File Upload - Malicious Extensions',
        description: 'Bloqueia uploads de arquivos com extensões perigosas',
        enabled: true,
        category: 'file_upload',
        severity: 'high',
        customCheck: (req: Request) => {
          const dangerousExtensions = ['.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js', '.jar', '.php', '.asp', '.jsp'];
          const contentType = req.headers['content-type'] || '';
          const fileName = req.headers['x-filename'] as string || '';
          
          if (contentType.includes('multipart/form-data') || fileName) {
            return dangerousExtensions.some(ext => fileName.toLowerCase().endsWith(ext));
          }
          return false;
        },
        action: 'block',
        blockDuration: 60 * 60 * 1000
      },

      // Rate Limiting
      {
        id: 'rate_limit_1',
        name: 'Rate Limiting - General',
        description: 'Limite geral de requisições por IP',
        enabled: true,
        category: 'rate_limiting',
        severity: 'medium',
        customCheck: (req: Request) => {
          const ip = this.getClientIP(req);
          const now = Date.now();
          const windowDuration = 60 * 1000; // 1 minuto
          const maxRequests = 100;
          
          const entry = this.rateLimitMap.get(ip);
          if (!entry) {
            this.rateLimitMap.set(ip, {
              count: 1,
              windowStart: now,
              blocked: false
            });
            return false;
          }
          
          if (now - entry.windowStart > windowDuration) {
            entry.count = 1;
            entry.windowStart = now;
            entry.blocked = false;
            return false;
          }
          
          entry.count++;
          if (entry.count > maxRequests && !entry.blocked) {
            entry.blocked = true;
            entry.blockedUntil = now + 5 * 60 * 1000; // Bloquear por 5 minutos
            return true;
          }
          
          return entry.blocked && (!entry.blockedUntil || now < entry.blockedUntil);
        },
        action: 'rate_limit'
      }
    ];
  }

  /**
   * Middleware principal do WAF
   */
  middleware() {
    return async (req: Request, res: Response, next: NextFunction) => {
      if (!this.config.enabled) {
        return next();
      }

      const startTime = Date.now();
      const ip = this.getClientIP(req);
      
      try {
        // Incrementar estatísticas
        this.requestStats.totalRequests++;

        // Verificar lista negra de IPs
        if (this.config.blacklistedIPs.includes(ip) || this.blockedIPs.has(ip)) {
          return this.blockRequest(req, res, 'IP_BLACKLISTED', 'IP está na lista negra');
        }

        // Verificar lista branca de IPs
        if (this.config.whitelistedIPs.includes(ip)) {
          return next();
        }

        // Verificar tamanho da requisição
        const contentLength = parseInt(req.headers['content-length'] || '0');
        if (contentLength > this.config.maxRequestSize) {
          return this.blockRequest(req, res, 'REQUEST_TOO_LARGE', 'Requisição muito grande');
        }

        // Aplicar regras do WAF
        for (const rule of this.rules.filter(r => r.enabled)) {
          const ruleTriggered = await this.checkRule(rule, req);
          
          if (ruleTriggered) {
            // Log do evento
            this.logWAFEvent(rule, req, 'RULE_TRIGGERED');
            
            // Atualizar estatísticas
            this.updateStats(rule.category, ip);
            
            // Executar ação
            switch (rule.action) {
              case 'block':
                if (rule.blockDuration) {
                  this.blockIPTemporarily(ip, rule.blockDuration);
                }
                return this.blockRequest(req, res, rule.id, rule.description);
              
              case 'challenge':
                res.setHeader('X-WAF-Challenge', 'required');
                res.setHeader('X-WAF-Rule', rule.id);
                break;
              
              case 'rate_limit':
                res.setHeader('X-RateLimit-Limit', '100');
                res.setHeader('X-RateLimit-Remaining', '0');
                res.setHeader('X-RateLimit-Reset', (Date.now() + 60000).toString());
                if (this.config.blockMaliciousRequests) {
                  return this.blockRequest(req, res, 'RATE_LIMITED', 'Rate limit excedido');
                }
                break;
              
              case 'log':
                // Apenas log, continuar processamento
                break;
            }
          }
        }

        // Log opcional de todas as requisições
        if (this.config.logAllRequests) {
          this.logWAFEvent(null, req, 'REQUEST_ALLOWED');
        }

        // Adicionar headers de segurança
        this.addSecurityHeaders(res);

        next();

      } catch (error) {
        console.error('[WAF] Erro no processamento:', error);
        this.logWAFEvent(null, req, 'ERROR', { error: error.message });
        next();
      }
    };
  }

  /**
   * Verificar se uma regra é ativada
   */
  private async checkRule(rule: WAFRule, req: Request): Promise<boolean> {
    try {
      // Verificação por padrão regex
      if (rule.pattern) {
        const requestContent = this.getRequestContent(req);
        if (rule.pattern.test(requestContent)) {
          return true;
        }
      }

      // Verificação personalizada
      if (rule.customCheck) {
        return rule.customCheck(req);
      }

      return false;
    } catch (error) {
      console.error(`[WAF] Erro ao verificar regra ${rule.id}:`, error);
      return false;
    }
  }

  /**
   * Obter conteúdo da requisição para análise
   */
  private getRequestContent(req: Request): string {
    return JSON.stringify({
      url: req.url,
      method: req.method,
      headers: req.headers,
      query: req.query,
      body: req.body,
      path: req.path
    });
  }

  /**
   * Bloquear requisição
   */
  private blockRequest(req: Request, res: Response, ruleId: string, reason: string) {
    this.requestStats.blockedRequests++;
    
    // Log de auditoria
    advancedSecurity.auditLog('WAF_BLOCKED', req.user?.id, req, {
      ruleId,
      reason,
      ip: this.getClientIP(req),
      userAgent: req.headers['user-agent']
    });

    res.status(403).json({
      error: 'Request blocked by Web Application Firewall',
      code: 'WAF_BLOCKED',
      reference: `WAF-${Date.now()}`
    });
  }

  /**
   * Adicionar headers de segurança
   */
  private addSecurityHeaders(res: Response) {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('X-WAF-Protected', 'VitaView-WAF-v1.0');
  }

  /**
   * Log de eventos do WAF
   */
  private logWAFEvent(rule: WAFRule | null, req: Request, action: string, metadata?: any) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      action,
      ruleId: rule?.id,
      ruleName: rule?.name,
      severity: rule?.severity,
      ip: this.getClientIP(req),
      userAgent: req.headers['user-agent'],
      method: req.method,
      path: req.path,
      url: req.url,
      userId: req.user?.id,
      metadata: metadata || {}
    };

    // Log para sistema de auditoria
    advancedSecurity.auditLog('WAF_EVENT', req.user?.id, req, logEntry);

    // Log específico do WAF
    if (rule && rule.severity === 'critical') {
      console.error('[WAF CRITICAL]', logEntry);
    } else if (action === 'RULE_TRIGGERED') {
      console.warn('[WAF BLOCKED]', logEntry);
    }
  }

  /**
   * Atualizar estatísticas
   */
  private updateStats(category: string, ip: string) {
    this.requestStats.topAttackTypes[category] = (this.requestStats.topAttackTypes[category] || 0) + 1;
    this.requestStats.topBlockedIPs[ip] = (this.requestStats.topBlockedIPs[ip] || 0) + 1;
    this.requestStats.suspiciousRequests++;
  }

  /**
   * Bloquear IP temporariamente
   */
  private blockIPTemporarily(ip: string, duration: number) {
    this.blockedIPs.add(ip);
    
    setTimeout(() => {
      this.blockedIPs.delete(ip);
      console.log(`[WAF] IP ${ip} desbloqueado após ${duration}ms`);
    }, duration);

    console.log(`[WAF] IP ${ip} bloqueado por ${duration}ms`);
  }

  /**
   * Obter IP do cliente
   */
  private getClientIP(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'] as string;
    const remoteAddress = req.connection?.remoteAddress || req.socket?.remoteAddress;
    
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    
    return remoteAddress || 'unknown';
  }

  /**
   * Tarefas em background
   */
  private startBackgroundTasks() {
    // Limpeza de rate limits a cada 5 minutos
    setInterval(() => {
      const now = Date.now();
      const fiveMinutesAgo = now - 5 * 60 * 1000;
      
      for (const [key, entry] of this.rateLimitMap.entries()) {
        if (entry.windowStart < fiveMinutesAgo) {
          this.rateLimitMap.delete(key);
        }
      }
    }, 5 * 60 * 1000);

    // Relatório de estatísticas a cada hora
    setInterval(() => {
      console.log('[WAF] Estatísticas da última hora:', this.getStatistics());
    }, 60 * 60 * 1000);
  }

  /**
   * API pública
   */
  
  /**
   * Obter estatísticas do WAF
   */
  getStatistics(): RequestStats {
    return { ...this.requestStats };
  }

  /**
   * Adicionar regra personalizada
   */
  addCustomRule(rule: WAFRule) {
    this.rules.push(rule);
  }

  /**
   * Remover regra
   */
  removeRule(ruleId: string) {
    this.rules = this.rules.filter(rule => rule.id !== ruleId);
  }

  /**
   * Habilitar/desabilitar regra
   */
  toggleRule(ruleId: string, enabled: boolean) {
    const rule = this.rules.find(r => r.id === ruleId);
    if (rule) {
      rule.enabled = enabled;
    }
  }

  /**
   * Adicionar IP à lista branca
   */
  whitelistIP(ip: string) {
    if (!this.config.whitelistedIPs.includes(ip)) {
      this.config.whitelistedIPs.push(ip);
    }
  }

  /**
   * Adicionar IP à lista negra
   */
  blacklistIP(ip: string) {
    if (!this.config.blacklistedIPs.includes(ip)) {
      this.config.blacklistedIPs.push(ip);
    }
    this.blockedIPs.add(ip);
  }

  /**
   * Remover IP da lista negra
   */
  unblockIP(ip: string) {
    this.config.blacklistedIPs = this.config.blacklistedIPs.filter(blockedIP => blockedIP !== ip);
    this.blockedIPs.delete(ip);
  }

  /**
   * Atualizar configuração
   */
  updateConfig(newConfig: Partial<WAFConfig>) {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Obter regras ativas
   */
  getActiveRules(): WAFRule[] {
    return this.rules.filter(rule => rule.enabled);
  }

  /**
   * Reset das estatísticas
   */
  resetStatistics() {
    this.requestStats = {
      totalRequests: 0,
      blockedRequests: 0,
      suspiciousRequests: 0,
      topAttackTypes: {},
      topBlockedIPs: {},
      requestsByCountry: {}
    };
  }
}

export const webApplicationFirewall = new WebApplicationFirewall();
