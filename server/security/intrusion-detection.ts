import { Request } from 'express';
import { advancedSecurity } from '../middleware/advanced-security';

// Sistema de Detecção de Intrusão e Anomalias para Dados Médicos
// Implementa monitoramento em tempo real e análise comportamental

interface SecurityEvent {
  id: string;
  type: SecurityEventType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  userId?: string;
  ip: string;
  userAgent: string;
  description: string;
  metadata: any;
  riskScore: number;
  actionTaken: string[];
}

type SecurityEventType = 
  | 'failed_login' 
  | 'brute_force' 
  | 'anomalous_access' 
  | 'data_exfiltration' 
  | 'privilege_escalation'
  | 'suspicious_behavior'
  | 'malicious_upload'
  | 'unauthorized_access'
  | 'session_hijack'
  | 'sql_injection'
  | 'xss_attempt'
  | 'unusual_location'
  | 'off_hours_access'
  | 'multiple_device_access'
  | 'rapid_data_access';

interface UserBehaviorProfile {
  userId: string;
  normalAccessPatterns: {
    commonIPs: string[];
    usualHours: number[];
    averageSessionDuration: number;
    commonUserAgents: string[];
    typicalResources: string[];
    locationHistory: string[];
  };
  riskScore: number;
  lastUpdated: Date;
  accessFrequency: Map<string, number>;
  anomalyCount: number;
}

interface ThreatIntelligence {
  maliciousIPs: Set<string>;
  suspiciousUserAgents: string[];
  knownAttackPatterns: RegExp[];
  geolocationRisks: Map<string, number>;
  lastUpdated: Date;
}

interface DetectionRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  severity: SecurityEvent['severity'];
  conditions: RuleCondition[];
  actions: RuleAction[];
  threshold: number;
  timeWindow: number; // milliseconds
}

interface RuleCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'regex' | 'in_range';
  value: any;
}

interface RuleAction {
  type: 'block_ip' | 'block_user' | 'alert' | 'escalate' | 'log' | 'rate_limit' | 'require_2fa';
  parameters: any;
  duration?: number;
}

export class IntrusionDetectionSystem {
  private securityEvents: SecurityEvent[] = [];
  private userProfiles = new Map<string, UserBehaviorProfile>();
  private threatIntel: ThreatIntelligence;
  private detectionRules: DetectionRule[] = [];
  private blockedIPs = new Map<string, Date>();
  private blockedUsers = new Map<string, Date>();
  private alertSubscribers: Array<(event: SecurityEvent) => void> = [];

  constructor() {
    this.initializeThreatIntelligence();
    this.initializeDetectionRules();
    this.startBackgroundProcessing();
  }

  /**
   * Inicializar inteligência de ameaças
   */
  private initializeThreatIntelligence() {
    this.threatIntel = {
      maliciousIPs: new Set([
        // IPs conhecidos por atividade maliciosa
        '192.168.1.100', // Exemplo
        '10.0.0.50'       // Exemplo
      ]),
      suspiciousUserAgents: [
        'sqlmap',
        'nikto',
        'nmap',
        'burp',
        'owasp zap',
        'acunetix',
        'nessus'
      ],
      knownAttackPatterns: [
        /(\bUNION\b.*\bSELECT\b)/i,
        /<script[^>]*>.*?<\/script>/i,
        /(\b(exec|execute|sp_)\b)/i,
        /(javascript:|vbscript:|onload=|onerror=)/i,
        /(\.\./.*){3,}/,
        /(sleep|benchmark|waitfor)\s*\(/i
      ],
      geolocationRisks: new Map([
        ['CN', 0.7], // China
        ['RU', 0.7], // Rússia
        ['KP', 0.9], // Coreia do Norte
        ['IR', 0.8]  // Irã
      ]),
      lastUpdated: new Date()
    };

    // Atualizar inteligência de ameaças a cada 6 horas
    setInterval(() => this.updateThreatIntelligence(), 6 * 60 * 60 * 1000);
  }

  /**
   * Inicializar regras de detecção
   */
  private initializeDetectionRules() {
    this.detectionRules = [
      {
        id: 'brute_force_detection',
        name: 'Detecção de Força Bruta',
        description: 'Detecta tentativas repetidas de login falhadas',
        enabled: true,
        severity: 'high',
        conditions: [
          { field: 'eventType', operator: 'equals', value: 'failed_login' },
          { field: 'count', operator: 'greater_than', value: 5 }
        ],
        actions: [
          { type: 'block_ip', parameters: {}, duration: 30 * 60 * 1000 },
          { type: 'alert', parameters: { message: 'Tentativa de força bruta detectada' } }
        ],
        threshold: 5,
        timeWindow: 5 * 60 * 1000 // 5 minutos
      },
      {
        id: 'anomalous_data_access',
        name: 'Acesso Anômalo a Dados',
        description: 'Detecta padrões de acesso incomuns aos dados médicos',
        enabled: true,
        severity: 'medium',
        conditions: [
          { field: 'resourceType', operator: 'equals', value: 'medical_data' },
          { field: 'accessFrequency', operator: 'greater_than', value: 'normal_threshold' }
        ],
        actions: [
          { type: 'require_2fa', parameters: {} },
          { type: 'alert', parameters: { message: 'Acesso anômalo a dados médicos' } }
        ],
        threshold: 3,
        timeWindow: 10 * 60 * 1000 // 10 minutos
      },
      {
        id: 'off_hours_access',
        name: 'Acesso Fora do Horário',
        description: 'Detecta acessos fora do horário normal de trabalho',
        enabled: true,
        severity: 'medium',
        conditions: [
          { field: 'hour', operator: 'not_equals', value: 'business_hours' },
          { field: 'userRole', operator: 'not_equals', value: 'emergency_staff' }
        ],
        actions: [
          { type: 'alert', parameters: { message: 'Acesso fora do horário detectado' } },
          { type: 'log', parameters: { level: 'warning' } }
        ],
        threshold: 1,
        timeWindow: 60 * 60 * 1000 // 1 hora
      },
      {
        id: 'suspicious_location',
        name: 'Localização Suspeita',
        description: 'Detecta acessos de localizações incomuns ou de risco',
        enabled: true,
        severity: 'high',
        conditions: [
          { field: 'geolocation', operator: 'in_range', value: 'high_risk_countries' },
          { field: 'userHistory', operator: 'not_equals', value: 'location' }
        ],
        actions: [
          { type: 'require_2fa', parameters: {} },
          { type: 'alert', parameters: { message: 'Acesso de localização suspeita' } }
        ],
        threshold: 1,
        timeWindow: 5 * 60 * 1000 // 5 minutos
      },
      {
        id: 'rapid_data_access',
        name: 'Acesso Rápido a Dados',
        description: 'Detecta tentativas de exfiltração de dados por acesso rápido',
        enabled: true,
        severity: 'critical',
        conditions: [
          { field: 'requestsPerMinute', operator: 'greater_than', value: 100 },
          { field: 'dataVolumeAccessed', operator: 'greater_than', value: 'threshold' }
        ],
        actions: [
          { type: 'block_user', parameters: {}, duration: 60 * 60 * 1000 },
          { type: 'escalate', parameters: { level: 'security_team' } }
        ],
        threshold: 50,
        timeWindow: 60 * 1000 // 1 minuto
      },
      {
        id: 'privilege_escalation',
        name: 'Escalação de Privilégios',
        description: 'Detecta tentativas de escalação de privilégios',
        enabled: true,
        severity: 'critical',
        conditions: [
          { field: 'actionAttempted', operator: 'contains', value: 'admin' },
          { field: 'userRole', operator: 'not_equals', value: 'admin' }
        ],
        actions: [
          { type: 'block_user', parameters: {}, duration: 2 * 60 * 60 * 1000 },
          { type: 'escalate', parameters: { level: 'ciso' } }
        ],
        threshold: 1,
        timeWindow: 5 * 60 * 1000 // 5 minutos
      }
    ];
  }

  /**
   * Analisar requisição em tempo real
   */
  async analyzeRequest(req: Request): Promise<{
    threat: boolean;
    riskScore: number;
    events: SecurityEvent[];
    actions: string[];
  }> {
    const events: SecurityEvent[] = [];
    const actions: string[] = [];
    let totalRiskScore = 0;

    try {
      const ip = this.getClientIP(req);
      const userAgent = req.headers['user-agent'] || '';
      const userId = req.user?.id;

      // Verificar se IP está bloqueado
      if (this.isIPBlocked(ip)) {
        const event = this.createSecurityEvent(
          'unauthorized_access',
          'critical',
          `Tentativa de acesso de IP bloqueado: ${ip}`,
          { ip, userAgent, userId },
          100
        );
        events.push(event);
        actions.push('BLOCK_REQUEST');
        totalRiskScore += 100;
      }

      // Verificar se usuário está bloqueado
      if (userId && this.isUserBlocked(userId)) {
        const event = this.createSecurityEvent(
          'unauthorized_access',
          'high',
          `Tentativa de acesso de usuário bloqueado: ${userId}`,
          { ip, userAgent, userId },
          80
        );
        events.push(event);
        actions.push('BLOCK_REQUEST');
        totalRiskScore += 80;
      }

      // Verificar inteligência de ameaças
      const threatCheck = await this.checkThreatIntelligence(req);
      if (threatCheck.threat) {
        events.push(...threatCheck.events);
        actions.push(...threatCheck.actions);
        totalRiskScore += threatCheck.riskScore;
      }

      // Analisar comportamento do usuário
      if (userId) {
        const behaviorCheck = await this.analyzeBehavior(req, userId);
        if (behaviorCheck.anomaly) {
          events.push(...behaviorCheck.events);
          totalRiskScore += behaviorCheck.riskScore;
        }
      }

      // Verificar padrões de ataque
      const attackCheck = this.checkAttackPatterns(req);
      if (attackCheck.detected) {
        events.push(...attackCheck.events);
        actions.push(...attackCheck.actions);
        totalRiskScore += attackCheck.riskScore;
      }

      // Aplicar regras de detecção
      const ruleCheck = await this.applyDetectionRules(req, events);
      if (ruleCheck.triggered) {
        actions.push(...ruleCheck.actions);
      }

      // Armazenar eventos
      this.securityEvents.push(...events);

      // Notificar subscribers
      events.forEach(event => {
        this.notifySubscribers(event);
      });

      return {
        threat: totalRiskScore > 50,
        riskScore: totalRiskScore,
        events,
        actions
      };

    } catch (error) {
      console.error('Erro na análise de segurança:', error);
      
      const errorEvent = this.createSecurityEvent(
        'suspicious_behavior',
        'medium',
        'Erro interno na análise de segurança',
        { error: error.message },
        30
      );
      
      return {
        threat: false,
        riskScore: 30,
        events: [errorEvent],
        actions: ['LOG_ERROR']
      };
    }
  }

  /**
   * Verificar inteligência de ameaças
   */
  private async checkThreatIntelligence(req: Request): Promise<{
    threat: boolean;
    events: SecurityEvent[];
    actions: string[];
    riskScore: number;
  }> {
    const events: SecurityEvent[] = [];
    const actions: string[] = [];
    let riskScore = 0;

    const ip = this.getClientIP(req);
    const userAgent = req.headers['user-agent'] || '';

    // Verificar IP malicioso
    if (this.threatIntel.maliciousIPs.has(ip)) {
      const event = this.createSecurityEvent(
        'suspicious_behavior',
        'high',
        `Acesso de IP malicioso conhecido: ${ip}`,
        { ip, userAgent },
        80
      );
      events.push(event);
      actions.push('BLOCK_IP', 'ALERT_SECURITY_TEAM');
      riskScore += 80;
    }

    // Verificar User-Agent suspeito
    const suspiciousUA = this.threatIntel.suspiciousUserAgents.find(ua => 
      userAgent.toLowerCase().includes(ua.toLowerCase())
    );
    
    if (suspiciousUA) {
      const event = this.createSecurityEvent(
        'suspicious_behavior',
        'medium',
        `User-Agent suspeito detectado: ${suspiciousUA}`,
        { ip, userAgent, suspiciousUA },
        60
      );
      events.push(event);
      actions.push('REQUIRE_CAPTCHA', 'ALERT_MODERATE');
      riskScore += 60;
    }

    return {
      threat: riskScore > 0,
      events,
      actions,
      riskScore
    };
  }

  /**
   * Analisar comportamento do usuário
   */
  private async analyzeBehavior(req: Request, userId: string): Promise<{
    anomaly: boolean;
    events: SecurityEvent[];
    riskScore: number;
  }> {
    const events: SecurityEvent[] = [];
    let riskScore = 0;

    // Obter perfil do usuário
    let profile = this.userProfiles.get(userId);
    if (!profile) {
      profile = this.createUserProfile(userId);
    }

    const ip = this.getClientIP(req);
    const hour = new Date().getHours();
    const userAgent = req.headers['user-agent'] || '';

    // Verificar IP incomum
    if (!profile.normalAccessPatterns.commonIPs.includes(ip)) {
      const event = this.createSecurityEvent(
        'anomalous_access',
        'medium',
        `Acesso de IP não usual para o usuário: ${ip}`,
        { userId, ip, normalIPs: profile.normalAccessPatterns.commonIPs },
        40
      );
      events.push(event);
      riskScore += 40;
    }

    // Verificar horário incomum
    if (!profile.normalAccessPatterns.usualHours.includes(hour)) {
      const event = this.createSecurityEvent(
        'off_hours_access',
        'low',
        `Acesso fora do horário usual: ${hour}h`,
        { userId, hour, usualHours: profile.normalAccessPatterns.usualHours },
        20
      );
      events.push(event);
      riskScore += 20;
    }

    // Verificar User-Agent incomum
    if (!profile.normalAccessPatterns.commonUserAgents.includes(userAgent)) {
      const event = this.createSecurityEvent(
        'anomalous_access',
        'low',
        'User-Agent não usual detectado',
        { userId, userAgent },
        15
      );
      events.push(event);
      riskScore += 15;
    }

    // Atualizar perfil do usuário
    this.updateUserProfile(userId, req);

    return {
      anomaly: riskScore > 0,
      events,
      riskScore
    };
  }

  /**
   * Verificar padrões de ataque
   */
  private checkAttackPatterns(req: Request): {
    detected: boolean;
    events: SecurityEvent[];
    actions: string[];
    riskScore: number;
  } {
    const events: SecurityEvent[] = [];
    const actions: string[] = [];
    let riskScore = 0;

    const requestContent = JSON.stringify({
      url: req.url,
      body: req.body,
      query: req.query,
      headers: req.headers
    });

    for (const pattern of this.threatIntel.knownAttackPatterns) {
      if (pattern.test(requestContent)) {
        const event = this.createSecurityEvent(
          'sql_injection',
          'critical',
          'Padrão de ataque detectado na requisição',
          { 
            pattern: pattern.source,
            url: req.url,
            method: req.method,
            ip: this.getClientIP(req)
          },
          90
        );
        events.push(event);
        actions.push('BLOCK_REQUEST', 'ESCALATE_SECURITY');
        riskScore += 90;
      }
    }

    return {
      detected: riskScore > 0,
      events,
      actions,
      riskScore
    };
  }

  /**
   * Aplicar regras de detecção
   */
  private async applyDetectionRules(req: Request, events: SecurityEvent[]): Promise<{
    triggered: boolean;
    actions: string[];
  }> {
    const actions: string[] = [];

    for (const rule of this.detectionRules.filter(r => r.enabled)) {
      const ruleEvents = events.filter(event => 
        this.matchesRuleConditions(event, rule.conditions)
      );

      if (ruleEvents.length >= rule.threshold) {
        // Regra ativada
        for (const action of rule.actions) {
          switch (action.type) {
            case 'block_ip':
              const ip = this.getClientIP(req);
              this.blockIP(ip, action.duration || 60 * 60 * 1000);
              actions.push('BLOCK_IP');
              break;
            
            case 'block_user':
              if (req.user?.id) {
                this.blockUser(req.user.id, action.duration || 60 * 60 * 1000);
                actions.push('BLOCK_USER');
              }
              break;
            
            case 'alert':
              this.sendAlert(rule, ruleEvents);
              actions.push('ALERT');
              break;
            
            case 'escalate':
              this.escalateIncident(rule, ruleEvents, action.parameters.level);
              actions.push('ESCALATE');
              break;
          }
        }
      }
    }

    return {
      triggered: actions.length > 0,
      actions
    };
  }

  /**
   * Criar evento de segurança
   */
  private createSecurityEvent(
    type: SecurityEventType,
    severity: SecurityEvent['severity'],
    description: string,
    metadata: any,
    riskScore: number
  ): SecurityEvent {
    return {
      id: this.generateEventId(),
      type,
      severity,
      timestamp: new Date(),
      userId: metadata.userId,
      ip: metadata.ip || 'unknown',
      userAgent: metadata.userAgent || 'unknown',
      description,
      metadata,
      riskScore,
      actionTaken: []
    };
  }

  /**
   * Criar perfil de usuário
   */
  private createUserProfile(userId: string): UserBehaviorProfile {
    const profile: UserBehaviorProfile = {
      userId,
      normalAccessPatterns: {
        commonIPs: [],
        usualHours: [],
        averageSessionDuration: 0,
        commonUserAgents: [],
        typicalResources: [],
        locationHistory: []
      },
      riskScore: 0,
      lastUpdated: new Date(),
      accessFrequency: new Map(),
      anomalyCount: 0
    };

    this.userProfiles.set(userId, profile);
    return profile;
  }

  /**
   * Atualizar perfil do usuário
   */
  private updateUserProfile(userId: string, req: Request) {
    const profile = this.userProfiles.get(userId);
    if (!profile) return;

    const ip = this.getClientIP(req);
    const hour = new Date().getHours();
    const userAgent = req.headers['user-agent'] || '';

    // Atualizar IPs comuns
    if (!profile.normalAccessPatterns.commonIPs.includes(ip)) {
      profile.normalAccessPatterns.commonIPs.push(ip);
      if (profile.normalAccessPatterns.commonIPs.length > 10) {
        profile.normalAccessPatterns.commonIPs.shift();
      }
    }

    // Atualizar horários usuais
    if (!profile.normalAccessPatterns.usualHours.includes(hour)) {
      profile.normalAccessPatterns.usualHours.push(hour);
    }

    // Atualizar User-Agents comuns
    if (!profile.normalAccessPatterns.commonUserAgents.includes(userAgent)) {
      profile.normalAccessPatterns.commonUserAgents.push(userAgent);
      if (profile.normalAccessPatterns.commonUserAgents.length > 5) {
        profile.normalAccessPatterns.commonUserAgents.shift();
      }
    }

    profile.lastUpdated = new Date();
  }

  /**
   * Verificar se regra corresponde às condições
   */
  private matchesRuleConditions(event: SecurityEvent, conditions: RuleCondition[]): boolean {
    return conditions.every(condition => {
      const fieldValue = this.getEventFieldValue(event, condition.field);
      
      switch (condition.operator) {
        case 'equals':
          return fieldValue === condition.value;
        case 'not_equals':
          return fieldValue !== condition.value;
        case 'greater_than':
          return Number(fieldValue) > Number(condition.value);
        case 'contains':
          return String(fieldValue).includes(String(condition.value));
        default:
          return false;
      }
    });
  }

  /**
   * Obter valor do campo do evento
   */
  private getEventFieldValue(event: SecurityEvent, field: string): any {
    switch (field) {
      case 'eventType':
        return event.type;
      case 'severity':
        return event.severity;
      case 'userId':
        return event.userId;
      case 'ip':
        return event.ip;
      default:
        return event.metadata[field];
    }
  }

  /**
   * Bloquear IP
   */
  private blockIP(ip: string, duration: number) {
    const expiresAt = new Date(Date.now() + duration);
    this.blockedIPs.set(ip, expiresAt);
    
    advancedSecurity.auditLog('IP_BLOCKED', null, null, {
      ip,
      duration,
      expiresAt
    });
  }

  /**
   * Bloquear usuário
   */
  private blockUser(userId: string, duration: number) {
    const expiresAt = new Date(Date.now() + duration);
    this.blockedUsers.set(userId, expiresAt);
    
    advancedSecurity.auditLog('USER_BLOCKED', userId, null, {
      userId,
      duration,
      expiresAt
    });
  }

  /**
   * Verificar se IP está bloqueado
   */
  private isIPBlocked(ip: string): boolean {
    const blockedUntil = this.blockedIPs.get(ip);
    if (!blockedUntil) return false;
    
    if (blockedUntil > new Date()) {
      return true;
    } else {
      this.blockedIPs.delete(ip);
      return false;
    }
  }

  /**
   * Verificar se usuário está bloqueado
   */
  private isUserBlocked(userId: string): boolean {
    const blockedUntil = this.blockedUsers.get(userId);
    if (!blockedUntil) return false;
    
    if (blockedUntil > new Date()) {
      return true;
    } else {
      this.blockedUsers.delete(userId);
      return false;
    }
  }

  /**
   * Enviar alerta
   */
  private sendAlert(rule: DetectionRule, events: SecurityEvent[]) {
    const alert = {
      rule: rule.name,
      severity: rule.severity,
      events,
      timestamp: new Date()
    };

    advancedSecurity.auditLog('SECURITY_ALERT', null, null, alert);
    console.warn('[SECURITY ALERT]', alert);
  }

  /**
   * Escalar incidente
   */
  private escalateIncident(rule: DetectionRule, events: SecurityEvent[], level: string) {
    const incident = {
      rule: rule.name,
      severity: rule.severity,
      escalationLevel: level,
      events,
      timestamp: new Date()
    };

    advancedSecurity.auditLog('SECURITY_ESCALATION', null, null, incident);
    console.error('[SECURITY ESCALATION]', incident);
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
   * Gerar ID do evento
   */
  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Notificar subscribers
   */
  private notifySubscribers(event: SecurityEvent) {
    this.alertSubscribers.forEach(subscriber => {
      try {
        subscriber(event);
      } catch (error) {
        console.error('Erro ao notificar subscriber:', error);
      }
    });
  }

  /**
   * Atualizar inteligência de ameaças
   */
  private async updateThreatIntelligence() {
    try {
      // Em produção, isso faria fetch de feeds de threat intelligence
      console.log('[IDS] Atualizando inteligência de ameaças...');
      this.threatIntel.lastUpdated = new Date();
    } catch (error) {
      console.error('Erro ao atualizar threat intelligence:', error);
    }
  }

  /**
   * Processamento em background
   */
  private startBackgroundProcessing() {
    // Limpeza de eventos antigos a cada hora
    setInterval(() => {
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      this.securityEvents = this.securityEvents.filter(event => 
        event.timestamp > oneWeekAgo
      );
    }, 60 * 60 * 1000);

    // Limpeza de IPs e usuários bloqueados expirados
    setInterval(() => {
      const now = new Date();
      
      for (const [ip, expiresAt] of this.blockedIPs.entries()) {
        if (expiresAt <= now) {
          this.blockedIPs.delete(ip);
        }
      }
      
      for (const [userId, expiresAt] of this.blockedUsers.entries()) {
        if (expiresAt <= now) {
          this.blockedUsers.delete(userId);
        }
      }
    }, 5 * 60 * 1000); // A cada 5 minutos
  }

  /**
   * Subscrever alertas
   */
  subscribeToAlerts(callback: (event: SecurityEvent) => void) {
    this.alertSubscribers.push(callback);
  }

  /**
   * Obter estatísticas de segurança
   */
  getSecurityStatistics(timeRange: number = 24 * 60 * 60 * 1000): {
    totalEvents: number;
    eventsBySeverity: Record<string, number>;
    eventsByType: Record<string, number>;
    blockedIPs: number;
    blockedUsers: number;
    topThreats: SecurityEvent[];
  } {
    const since = new Date(Date.now() - timeRange);
    const recentEvents = this.securityEvents.filter(event => event.timestamp > since);

    const eventsBySeverity = recentEvents.reduce((acc, event) => {
      acc[event.severity] = (acc[event.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const eventsByType = recentEvents.reduce((acc, event) => {
      acc[event.type] = (acc[event.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topThreats = recentEvents
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, 10);

    return {
      totalEvents: recentEvents.length,
      eventsBySeverity,
      eventsByType,
      blockedIPs: this.blockedIPs.size,
      blockedUsers: this.blockedUsers.size,
      topThreats
    };
  }

  /**
   * Middleware Express para detecção de intrusão
   */
  middleware() {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const analysis = await this.analyzeRequest(req);
        
        // Adicionar informações de segurança ao request
        (req as any).security = analysis;

        // Bloquear requisição se for uma ameaça crítica
        if (analysis.threat && analysis.riskScore > 80) {
          return res.status(403).json({
            error: 'Request blocked by security system',
            code: 'SECURITY_THREAT_DETECTED'
          });
        }

        // Aplicar ações de segurança
        if (analysis.actions.includes('REQUIRE_CAPTCHA')) {
          res.setHeader('X-Require-Captcha', 'true');
        }

        if (analysis.actions.includes('RATE_LIMIT')) {
          res.setHeader('X-Rate-Limited', 'true');
        }

        next();
      } catch (error) {
        console.error('Erro no middleware de detecção de intrusão:', error);
        next();
      }
    };
  }
}

export const intrusionDetection = new IntrusionDetectionSystem();