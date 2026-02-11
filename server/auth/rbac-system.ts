import { Request, Response, NextFunction } from 'express';
import { advancedSecurity } from '../middleware/advanced-security';

// Sistema RBAC (Role-Based Access Control) para dados médicos
// Implementa controle granular de permissões seguindo padrões HIPAA/LGPD

interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
  conditions?: PermissionCondition[];
  description: string;
}

interface PermissionCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'in' | 'not_in' | 'contains' | 'time_based';
  value: any;
}

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  isSystemRole: boolean;
  hierarchy: number; // 1 = highest, 10 = lowest
  maxDataAccess: 'own' | 'department' | 'organization' | 'all';
  restrictions: RoleRestriction[];
}

interface RoleRestriction {
  type: 'time' | 'ip' | 'device' | 'location' | 'data_sensitivity';
  condition: any;
}

interface UserRole {
  userId: string;
  roleId: string;
  assignedBy: string;
  assignedAt: Date;
  expiresAt?: Date;
  isActive: boolean;
  context?: {
    department?: string;
    organization?: string;
    temporaryElevation?: boolean;
  };
}

interface AccessRequest {
  userId: string;
  resource: string;
  action: string;
  resourceId?: string;
  context: {
    ip: string;
    userAgent: string;
    sessionId: string;
    timestamp: Date;
  };
  metadata?: any;
}

export class RBACSystem {
  private permissions = new Map<string, Permission>();
  private roles = new Map<string, Role>();
  private userRoles = new Map<string, UserRole[]>();
  private accessHistory = new Map<string, AccessRequest[]>();

  constructor() {
    this.initializeDefaultPermissions();
    this.initializeDefaultRoles();
  }

  /**
   * Inicializar permissões padrão do sistema médico
   */
  private initializeDefaultPermissions() {
    const defaultPermissions: Permission[] = [
      // Exames médicos
      {
        id: 'exam:read:own',
        name: 'Visualizar Próprios Exames',
        resource: 'exam',
        action: 'read',
        conditions: [{ field: 'userId', operator: 'equals', value: '{{current_user_id}}' }],
        description: 'Permite visualizar apenas os próprios exames médicos'
      },
      {
        id: 'exam:write:own',
        name: 'Criar/Editar Próprios Exames',
        resource: 'exam',
        action: 'write',
        conditions: [{ field: 'userId', operator: 'equals', value: '{{current_user_id}}' }],
        description: 'Permite criar e editar apenas os próprios exames'
      },
      {
        id: 'exam:delete:own',
        name: 'Excluir Próprios Exames',
        resource: 'exam',
        action: 'delete',
        conditions: [{ field: 'userId', operator: 'equals', value: '{{current_user_id}}' }],
        description: 'Permite excluir apenas os próprios exames'
      },
      {
        id: 'exam:read:department',
        name: 'Visualizar Exames do Departamento',
        resource: 'exam',
        action: 'read',
        conditions: [{ field: 'department', operator: 'equals', value: '{{user_department}}' }],
        description: 'Permite visualizar exames de pacientes do mesmo departamento'
      },
      {
        id: 'exam:read:all',
        name: 'Visualizar Todos os Exames',
        resource: 'exam',
        action: 'read',
        description: 'Permite visualizar todos os exames do sistema'
      },

      // Métricas de saúde
      {
        id: 'health_metrics:read:own',
        name: 'Visualizar Próprias Métricas',
        resource: 'health_metrics',
        action: 'read',
        conditions: [{ field: 'userId', operator: 'equals', value: '{{current_user_id}}' }],
        description: 'Permite visualizar apenas as próprias métricas de saúde'
      },
      {
        id: 'health_metrics:write:own',
        name: 'Registrar Próprias Métricas',
        resource: 'health_metrics',
        action: 'write',
        conditions: [{ field: 'userId', operator: 'equals', value: '{{current_user_id}}' }],
        description: 'Permite registrar apenas as próprias métricas'
      },
      {
        id: 'health_metrics:read:patients',
        name: 'Visualizar Métricas de Pacientes',
        resource: 'health_metrics',
        action: 'read',
        description: 'Permite visualizar métricas de pacientes sob cuidado'
      },

      // Diagnósticos
      {
        id: 'diagnosis:read:own',
        name: 'Visualizar Próprios Diagnósticos',
        resource: 'diagnosis',
        action: 'read',
        conditions: [{ field: 'userId', operator: 'equals', value: '{{current_user_id}}' }],
        description: 'Permite visualizar apenas os próprios diagnósticos'
      },
      {
        id: 'diagnosis:create:patients',
        name: 'Criar Diagnósticos para Pacientes',
        resource: 'diagnosis',
        action: 'create',
        description: 'Permite criar diagnósticos para pacientes'
      },
      {
        id: 'diagnosis:update:own',
        name: 'Atualizar Próprios Diagnósticos',
        resource: 'diagnosis',
        action: 'update',
        description: 'Permite atualizar diagnósticos criados pelo usuário'
      },

      // Medicamentos
      {
        id: 'medication:read:own',
        name: 'Visualizar Próprios Medicamentos',
        resource: 'medication',
        action: 'read',
        conditions: [{ field: 'userId', operator: 'equals', value: '{{current_user_id}}' }],
        description: 'Permite visualizar apenas os próprios medicamentos'
      },
      {
        id: 'medication:prescribe',
        name: 'Prescrever Medicamentos',
        resource: 'medication',
        action: 'prescribe',
        description: 'Permite prescrever medicamentos para pacientes'
      },

      // Relatórios
      {
        id: 'report:generate:own',
        name: 'Gerar Próprios Relatórios',
        resource: 'report',
        action: 'generate',
        conditions: [{ field: 'userId', operator: 'equals', value: '{{current_user_id}}' }],
        description: 'Permite gerar relatórios dos próprios dados'
      },
      {
        id: 'report:generate:department',
        name: 'Gerar Relatórios do Departamento',
        resource: 'report',
        action: 'generate',
        description: 'Permite gerar relatórios departamentais'
      },
      {
        id: 'report:export:encrypted',
        name: 'Exportar Relatórios Criptografados',
        resource: 'report',
        action: 'export',
        description: 'Permite exportar relatórios com criptografia'
      },

      // Administração
      {
        id: 'user:manage:department',
        name: 'Gerenciar Usuários do Departamento',
        resource: 'user',
        action: 'manage',
        description: 'Permite gerenciar usuários do mesmo departamento'
      },
      {
        id: 'role:assign:basic',
        name: 'Atribuir Papéis Básicos',
        resource: 'role',
        action: 'assign',
        conditions: [{ field: 'roleHierarchy', operator: 'in', value: [8, 9, 10] }],
        description: 'Permite atribuir apenas papéis básicos'
      },
      {
        id: 'audit:read:own',
        name: 'Visualizar Próprios Logs de Auditoria',
        resource: 'audit',
        action: 'read',
        conditions: [{ field: 'userId', operator: 'equals', value: '{{current_user_id}}' }],
        description: 'Permite visualizar apenas os próprios logs de auditoria'
      },
      {
        id: 'audit:read:all',
        name: 'Visualizar Todos os Logs de Auditoria',
        resource: 'audit',
        action: 'read',
        description: 'Permite visualizar todos os logs de auditoria do sistema'
      },

      // Sistema
      {
        id: 'system:backup:create',
        name: 'Criar Backups do Sistema',
        resource: 'system',
        action: 'backup',
        description: 'Permite criar backups do sistema'
      },
      {
        id: 'system:config:modify',
        name: 'Modificar Configurações do Sistema',
        resource: 'system',
        action: 'config',
        description: 'Permite modificar configurações do sistema'
      }
    ];

    defaultPermissions.forEach(permission => {
      this.permissions.set(permission.id, permission);
    });
  }

  /**
   * Inicializar papéis padrão do sistema
   */
  private initializeDefaultRoles() {
    const defaultRoles: Role[] = [
      {
        id: 'super_admin',
        name: 'Super Administrador',
        description: 'Acesso total ao sistema - usar apenas em emergências',
        permissions: Array.from(this.permissions.keys()),
        isSystemRole: true,
        hierarchy: 1,
        maxDataAccess: 'all',
        restrictions: []
      },
      {
        id: 'medical_director',
        name: 'Diretor Médico',
        description: 'Supervisão médica e administrativa',
        permissions: [
          'exam:read:all', 'health_metrics:read:patients', 'diagnosis:create:patients',
          'medication:prescribe', 'report:generate:department', 'user:manage:department',
          'audit:read:all', 'role:assign:basic'
        ],
        isSystemRole: true,
        hierarchy: 2,
        maxDataAccess: 'organization',
        restrictions: []
      },
      {
        id: 'physician',
        name: 'Médico',
        description: 'Profissional médico com acesso a dados de pacientes',
        permissions: [
          'exam:read:department', 'health_metrics:read:patients', 'diagnosis:create:patients',
          'diagnosis:update:own', 'medication:prescribe', 'report:generate:department',
          'audit:read:own'
        ],
        isSystemRole: true,
        hierarchy: 4,
        maxDataAccess: 'department',
        restrictions: [
          {
            type: 'data_sensitivity',
            condition: { maxLevel: 'high' }
          }
        ]
      },
      {
        id: 'nurse',
        name: 'Enfermeiro(a)',
        description: 'Profissional de enfermagem com acesso limitado',
        permissions: [
          'exam:read:department', 'health_metrics:read:patients', 'health_metrics:write:own',
          'medication:read:own', 'report:generate:own'
        ],
        isSystemRole: true,
        hierarchy: 6,
        maxDataAccess: 'department',
        restrictions: [
          {
            type: 'data_sensitivity',
            condition: { maxLevel: 'medium' }
          }
        ]
      },
      {
        id: 'technician',
        name: 'Técnico',
        description: 'Técnico em procedimentos médicos',
        permissions: [
          'exam:write:own', 'health_metrics:write:own', 'report:generate:own'
        ],
        isSystemRole: true,
        hierarchy: 7,
        maxDataAccess: 'own',
        restrictions: [
          {
            type: 'data_sensitivity',
            condition: { maxLevel: 'low' }
          }
        ]
      },
      {
        id: 'patient',
        name: 'Paciente',
        description: 'Usuário paciente com acesso aos próprios dados',
        permissions: [
          'exam:read:own', 'exam:write:own', 'exam:delete:own',
          'health_metrics:read:own', 'health_metrics:write:own',
          'diagnosis:read:own', 'medication:read:own',
          'report:generate:own', 'audit:read:own'
        ],
        isSystemRole: true,
        hierarchy: 8,
        maxDataAccess: 'own',
        restrictions: []
      },
      {
        id: 'guest',
        name: 'Visitante',
        description: 'Acesso muito limitado para demonstrações',
        permissions: [
          'exam:read:own', 'health_metrics:read:own'
        ],
        isSystemRole: true,
        hierarchy: 10,
        maxDataAccess: 'own',
        restrictions: [
          {
            type: 'time',
            condition: { maxSessionDuration: 30 * 60 * 1000 } // 30 minutos
          }
        ]
      }
    ];

    defaultRoles.forEach(role => {
      this.roles.set(role.id, role);
    });
  }

  /**
   * Verificar se um usuário tem permissão para uma ação específica
   */
  async checkPermission(request: AccessRequest): Promise<{
    allowed: boolean;
    reason?: string;
    conditions?: any;
    auditData: any;
  }> {
    try {
      const startTime = Date.now();

      // Obter papéis do usuário
      const userRoles = this.getUserRoles(request.userId);

      if (!userRoles || userRoles.length === 0) {
        return {
          allowed: false,
          reason: 'No roles assigned to user',
          auditData: {
            userId: request.userId,
            resource: request.resource,
            action: request.action,
            decision: 'DENY',
            reason: 'NO_ROLES',
            timestamp: new Date(),
            processingTime: Date.now() - startTime
          }
        };
      }

      // Verificar cada papel do usuário
      for (const userRole of userRoles) {
        if (!userRole.isActive) continue;

        // Verificar expiração do papel
        if (userRole.expiresAt && userRole.expiresAt < new Date()) {
          continue;
        }

        const role = this.roles.get(userRole.roleId);
        if (!role) continue;

        // Verificar restrições do papel
        const restrictionCheck = await this.checkRoleRestrictions(role, request);
        if (!restrictionCheck.allowed) {
          continue;
        }

        // Verificar permissões do papel
        for (const permissionId of role.permissions) {
          const permission = this.permissions.get(permissionId);
          if (!permission) continue;

          // Verificar se a permissão corresponde ao recurso e ação
          if (permission.resource === request.resource && permission.action === request.action) {
            // Verificar condições da permissão
            const conditionCheck = await this.checkPermissionConditions(
              permission,
              request,
              userRole
            );

            if (conditionCheck.allowed) {
              // Log de acesso bem-sucedido
              this.logAccess(request, 'ALLOW', userRole.roleId, permission.id);

              return {
                allowed: true,
                conditions: conditionCheck.conditions,
                auditData: {
                  userId: request.userId,
                  resource: request.resource,
                  action: request.action,
                  decision: 'ALLOW',
                  roleId: userRole.roleId,
                  permissionId: permission.id,
                  timestamp: new Date(),
                  processingTime: Date.now() - startTime
                }
              };
            }
          }
        }
      }

      // Acesso negado
      this.logAccess(request, 'DENY', undefined, undefined);

      return {
        allowed: false,
        reason: 'Permission not found or conditions not met',
        auditData: {
          userId: request.userId,
          resource: request.resource,
          action: request.action,
          decision: 'DENY',
          reason: 'INSUFFICIENT_PERMISSIONS',
          timestamp: new Date(),
          processingTime: Date.now() - startTime
        }
      };

    } catch (error) {
      // Log de erro
      advancedSecurity.auditLog('RBAC_ERROR', request.userId, null, {
        error: error.message,
        request: request
      });

      return {
        allowed: false,
        reason: `RBAC error: ${error.message}`,
        auditData: {
          userId: request.userId,
          resource: request.resource,
          action: request.action,
          decision: 'ERROR',
          error: error.message,
          timestamp: new Date()
        }
      };
    }
  }

  /**
   * Middleware Express para verificação de permissões
   */
  requirePermission(resource: string, action: string) {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        // Verificar se o usuário está autenticado
        if (!req.user || !req.user.id) {
          return res.status(401).json({
            error: 'Authentication required',
            code: 'AUTH_REQUIRED'
          });
        }

        // Criar requisição de acesso
        const accessRequest: AccessRequest = {
          userId: String(req.user.id),
          resource,
          action,
          resourceId: req.params.id || req.params.examId || req.params.userId,
          context: {
            ip: req.ip || 'unknown',
            userAgent: req.headers['user-agent'] || 'unknown',
            sessionId: (req as any).sessionID || 'unknown',
            timestamp: new Date()
          },
          metadata: {
            method: req.method,
            path: req.path,
            query: req.query,
            body: req.body
          }
        };

        // Verificar permissão
        // Garantir papel padrão para usuários legados (ex.: papel vindo da coluna role do usuário)
        let userRoles = this.getUserRoles(String(req.user.id));
        const expectedRole = req.user.role ? this.mapLegacyRole(req.user.role as string) : null;

        if ((!userRoles || userRoles.length === 0) && expectedRole) {
          await this.assignRole(String(req.user.id), expectedRole, 'system-auto');
          userRoles = this.getUserRoles(String(req.user.id));
        } else if (expectedRole) {
          const hasExpected = userRoles?.some(role => role.roleId === expectedRole && role.isActive);
          if (!hasExpected) {
            await this.assignRole(String(req.user.id), expectedRole, 'system-auto');
            userRoles = this.getUserRoles(String(req.user.id));
          }
        }

        const permissionResult = await this.checkPermission(accessRequest);

        // Log de auditoria
        advancedSecurity.auditLog('RBAC_CHECK', req.user.id, req, permissionResult.auditData);

        if (!permissionResult.allowed) {
          return res.status(403).json({
            error: 'Access denied',
            reason: permissionResult.reason,
            code: 'ACCESS_DENIED'
          });
        }

        // Adicionar informações de permissão ao request
        req.rbac = {
          allowed: true,
          conditions: permissionResult.conditions,
          auditData: permissionResult.auditData
        };

        next();

      } catch (error) {
        advancedSecurity.auditLog('RBAC_MIDDLEWARE_ERROR', req.user?.id, req, {
          error: error.message
        });

        return res.status(500).json({
          error: 'Permission check failed',
          code: 'RBAC_ERROR'
        });
      }
    };
  }

  /**
   * Mapear papeis antigos ou provenientes da coluna `role` da tabela users
   */
  private mapLegacyRole(role: string): string | null {
    const normalized = role.toLowerCase();

    switch (normalized) {
      case 'admin':
      case 'super_admin':
        return 'super_admin';
      case 'physician':
      case 'clinician':
      case 'doctor':
        return 'physician';
      case 'user':
        return 'patient';
      case 'nurse':
        return 'nurse';
      case 'technician':
        return 'technician';
      case 'patient':
        return 'patient';
      default:
        return 'physician';
    }
  }

  /**
   * Verificar restrições do papel
   */
  private async checkRoleRestrictions(role: Role, request: AccessRequest): Promise<{
    allowed: boolean;
    reason?: string;
  }> {
    for (const restriction of role.restrictions) {
      switch (restriction.type) {
        case 'time':
          const hour = new Date().getHours();
          if (restriction.condition.allowedHours &&
            !restriction.condition.allowedHours.includes(hour)) {
            return { allowed: false, reason: 'Outside allowed hours' };
          }
          break;

        case 'ip':
          if (restriction.condition.allowedIPs &&
            !restriction.condition.allowedIPs.includes(request.context.ip)) {
            return { allowed: false, reason: 'IP not allowed' };
          }
          break;

        case 'data_sensitivity':
          // Esta verificação seria feita com base no nível de sensibilidade dos dados
          // Por enquanto, apenas verificamos se o usuário pode acessar dados sensíveis
          break;
      }
    }

    return { allowed: true };
  }

  /**
   * Verificar condições da permissão
   */
  private async checkPermissionConditions(
    permission: Permission,
    request: AccessRequest,
    userRole: UserRole
  ): Promise<{ allowed: boolean; conditions?: any }> {
    if (!permission.conditions || permission.conditions.length === 0) {
      return { allowed: true };
    }

    for (const condition of permission.conditions) {
      let conditionValue = condition.value;

      // Substituir placeholders
      if (typeof conditionValue === 'string') {
        conditionValue = conditionValue.replace('{{current_user_id}}', request.userId);
        conditionValue = conditionValue.replace('{{user_department}}', userRole.context?.department || '');
      }

      // Verificar condição (implementação simplificada)
      switch (condition.operator) {
        case 'equals':
          if (condition.field === 'userId') {
            const metadataBodyUserId = request.metadata?.body && typeof request.metadata.body === 'object'
              ? (request.metadata.body as any).userId
              : undefined;
            const resourceOwnerId =
              request.metadata?.resourceOwnerId ||
              metadataBodyUserId ||
              (request.resource === 'user' ? request.resourceId : undefined);

            if (resourceOwnerId && String(resourceOwnerId) !== String(request.userId)) {
              return { allowed: false };
            }
          }
          break;
      }
    }

    return { allowed: true, conditions: permission.conditions };
  }

  /**
   * Obter papéis do usuário
   */
  private getUserRoles(userId: string): UserRole[] {
    return this.userRoles.get(userId) || [];
  }

  /**
   * Atribuir papel a um usuário
   */
  async assignRole(userId: string, roleId: string, assignedBy: string, context?: any): Promise<boolean> {
    try {
      const role = this.roles.get(roleId);
      if (!role) {
        throw new Error('Role not found');
      }

      const userRole: UserRole = {
        userId,
        roleId,
        assignedBy,
        assignedAt: new Date(),
        isActive: true,
        context
      };

      const existingRoles = this.userRoles.get(userId) || [];
      existingRoles.push(userRole);
      this.userRoles.set(userId, existingRoles);

      // Log de auditoria
      advancedSecurity.auditLog('ROLE_ASSIGNED', userId, null, {
        roleId,
        assignedBy,
        context
      });

      return true;
    } catch (error) {
      advancedSecurity.auditLog('ROLE_ASSIGNMENT_ERROR', userId, null, {
        error: error.message,
        roleId,
        assignedBy
      });
      return false;
    }
  }

  /**
   * Remover papel de um usuário
   */
  async revokeRole(userId: string, roleId: string, revokedBy: string): Promise<boolean> {
    try {
      const userRoles = this.userRoles.get(userId) || [];
      const updatedRoles = userRoles.map(userRole => {
        if (userRole.roleId === roleId) {
          return { ...userRole, isActive: false };
        }
        return userRole;
      });

      this.userRoles.set(userId, updatedRoles);

      // Log de auditoria
      advancedSecurity.auditLog('ROLE_REVOKED', userId, null, {
        roleId,
        revokedBy
      });

      return true;
    } catch (error) {
      advancedSecurity.auditLog('ROLE_REVOCATION_ERROR', userId, null, {
        error: error.message,
        roleId,
        revokedBy
      });
      return false;
    }
  }

  /**
   * Log de acesso
   */
  private logAccess(
    request: AccessRequest,
    decision: 'ALLOW' | 'DENY',
    roleId?: string,
    permissionId?: string
  ) {
    const accessLog = {
      ...request,
      decision,
      roleId,
      permissionId,
      timestamp: new Date()
    };

    // Armazenar histórico de acesso
    const history = this.accessHistory.get(request.userId) || [];
    history.push(request);

    // Manter apenas os últimos 1000 acessos
    if (history.length > 1000) {
      history.splice(0, history.length - 1000);
    }

    this.accessHistory.set(request.userId, history);

    // Log de auditoria
    advancedSecurity.auditLog('RBAC_ACCESS', request.userId, null, accessLog);
  }

  /**
   * Obter estatísticas de acesso
   */
  getAccessStatistics(userId: string): {
    totalAccesses: number;
    allowedAccesses: number;
    deniedAccesses: number;
    recentActivity: AccessRequest[];
  } {
    const history = this.accessHistory.get(userId) || [];
    const recent = history.slice(-10);

    return {
      totalAccesses: history.length,
      allowedAccesses: history.filter(a => (a as any).decision === 'ALLOW').length,
      deniedAccesses: history.filter(a => (a as any).decision === 'DENY').length,
      recentActivity: recent
    };
  }

  /**
   * Listar todos os papéis disponíveis
   */
  getAllRoles(): Role[] {
    return Array.from(this.roles.values());
  }

  /**
   * Listar todas as permissões disponíveis
   */
  getAllPermissions(): Permission[] {
    return Array.from(this.permissions.values());
  }
}

// Declaração para adicionar propriedades ao objeto Request
declare global {
  namespace Express {
    interface Request {
      rbac?: {
        allowed: boolean;
        conditions?: any;
        auditData: any;
      };
    }
  }
}

export const rbacSystem = new RBACSystem();
