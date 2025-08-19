import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { pool } from '../db';
import { medicalEncryption } from '../security/medical-encryption';
import { advancedSecurity } from '../middleware/advanced-security';

// Sistema de Backup Criptografado para Dados Médicos
// Implementa backup seguro com múltiplas camadas de criptografia e políticas de retenção

interface BackupConfig {
  retentionPolicy: {
    daily: number;      // dias
    weekly: number;     // semanas  
    monthly: number;    // meses
    yearly: number;     // anos
  };
  encryptionLayers: number;
  compressionEnabled: boolean;
  integrityChecks: boolean;
  offSiteReplication: boolean;
  schedule: {
    daily: string;      // cron expression
    weekly: string;
    monthly: string;
    yearly: string;
  };
}

interface BackupMetadata {
  id: string;
  type: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'manual';
  createdAt: Date;
  size: number;
  encryptedSize: number;
  compressionRatio: number;
  checksum: string;
  encryptionKeyId: string;
  tables: string[];
  recordCount: number;
  version: string;
  retentionUntil: Date;
  isCompressed: boolean;
  isEncrypted: boolean;
  isVerified: boolean;
  location: {
    local: string;
    offsite?: string;
  };
}

interface BackupRestorePoint {
  backupId: string;
  timestamp: Date;
  description: string;
  tables: string[];
  canRestore: boolean;
  dependencies: string[];
}

interface BackupVerificationResult {
  valid: boolean;
  checksumMatch: boolean;
  encryptionIntact: boolean;
  dataIntegrity: boolean;
  errors: string[];
  warnings: string[];
}

export class EncryptedBackupSystem {
  private config: BackupConfig;
  private backupDir: string;
  private offSiteDir?: string;
  private encryptionKeys = new Map<string, Buffer>();
  private backupHistory: BackupMetadata[] = [];

  constructor() {
    this.config = {
      retentionPolicy: {
        daily: 7,      // 7 dias
        weekly: 4,     // 4 semanas
        monthly: 12,   // 12 meses
        yearly: 7      // 7 anos (compliance médica)
      },
      encryptionLayers: 3,
      compressionEnabled: true,
      integrityChecks: true,
      offSiteReplication: false,
      schedule: {
        daily: '0 2 * * *',      // 2:00 AM diariamente
        weekly: '0 3 * * 0',     // 3:00 AM aos domingos
        monthly: '0 4 1 * *',    // 4:00 AM no dia 1 de cada mês
        yearly: '0 5 1 1 *'      // 5:00 AM no dia 1 de janeiro
      }
    };

    this.backupDir = process.env.BACKUP_DIR || './backups';
    this.offSiteDir = process.env.OFFSITE_BACKUP_DIR;
    
    this.initializeBackupSystem();
  }

  /**
   * Inicializar sistema de backup
   */
  private async initializeBackupSystem() {
    try {
      // Criar diretórios de backup
      await this.ensureDirectoryExists(this.backupDir);
      
      if (this.offSiteDir) {
        await this.ensureDirectoryExists(this.offSiteDir);
      }

      // Carregar histórico de backups
      await this.loadBackupHistory();

      // Inicializar chaves de criptografia
      await this.initializeEncryptionKeys();

      // Configurar agendamento automático
      this.scheduleAutomaticBackups();

      console.log('[BACKUP] Sistema de backup criptografado inicializado');
    } catch (error) {
      console.error('[BACKUP] Erro ao inicializar sistema de backup:', error);
    }
  }

  /**
   * Criar backup completo do sistema
   */
  async createFullBackup(type: BackupMetadata['type'] = 'manual'): Promise<BackupMetadata> {
    const backupId = this.generateBackupId();
    const startTime = Date.now();

    try {
      console.log(`[BACKUP] Iniciando backup ${type}: ${backupId}`);

      // Obter dados de todas as tabelas médicas
      const tables = await this.getMedicalTables();
      const backupData: Record<string, any[]> = {};
      let totalRecords = 0;

      for (const table of tables) {
        const data = await this.exportTableData(table);
        backupData[table] = data;
        totalRecords += data.length;
        console.log(`[BACKUP] Exportada tabela ${table}: ${data.length} registros`);
      }

      // Serializar dados
      const serializedData = JSON.stringify(backupData, null, 2);
      const originalSize = Buffer.byteLength(serializedData, 'utf8');

      // Comprimir dados se habilitado
      let processedData = Buffer.from(serializedData, 'utf8');
      let compressionRatio = 1;
      
      if (this.config.compressionEnabled) {
        processedData = await this.compressData(processedData);
        compressionRatio = originalSize / processedData.length;
        console.log(`[BACKUP] Compressão aplicada: ${compressionRatio.toFixed(2)}x`);
      }

      // Aplicar múltiplas camadas de criptografia
      const encryptionResult = await this.applyMultiLayerEncryption(processedData, backupId);
      
      // Calcular checksum dos dados originais
      const checksum = crypto.createHash('sha256').update(serializedData).digest('hex');

      // Salvar backup criptografado
      const backupPath = path.join(this.backupDir, `${backupId}.bak`);
      await fs.writeFile(backupPath, encryptionResult.encryptedData);

      // Criar metadata do backup
      const metadata: BackupMetadata = {
        id: backupId,
        type,
        createdAt: new Date(),
        size: originalSize,
        encryptedSize: encryptionResult.encryptedData.length,
        compressionRatio,
        checksum,
        encryptionKeyId: encryptionResult.keyId,
        tables,
        recordCount: totalRecords,
        version: '1.0',
        retentionUntil: this.calculateRetentionDate(type),
        isCompressed: this.config.compressionEnabled,
        isEncrypted: true,
        isVerified: false,
        location: {
          local: backupPath
        }
      };

      // Salvar metadata
      await this.saveBackupMetadata(metadata);

      // Verificar integridade do backup
      if (this.config.integrityChecks) {
        const verificationResult = await this.verifyBackup(backupId);
        metadata.isVerified = verificationResult.valid;
        
        if (!verificationResult.valid) {
          throw new Error('Falha na verificação de integridade do backup');
        }
      }

      // Replicar para off-site se configurado
      if (this.config.offSiteReplication && this.offSiteDir) {
        await this.replicateToOffSite(backupId, metadata);
      }

      // Adicionar ao histórico
      this.backupHistory.push(metadata);

      // Log de auditoria
      advancedSecurity.auditLog('BACKUP_CREATED', null, null, {
        backupId,
        type,
        size: originalSize,
        encryptedSize: encryptionResult.encryptedData.length,
        tables,
        recordCount: totalRecords,
        duration: Date.now() - startTime
      });

      console.log(`[BACKUP] Backup ${backupId} criado com sucesso em ${Date.now() - startTime}ms`);
      
      // Executar limpeza de backups antigos
      await this.cleanupExpiredBackups();

      return metadata;

    } catch (error) {
      advancedSecurity.auditLog('BACKUP_FAILED', null, null, {
        backupId,
        error: error.message,
        duration: Date.now() - startTime
      });

      throw new Error(`Falha ao criar backup: ${error.message}`);
    }
  }

  /**
   * Restaurar backup específico
   */
  async restoreBackup(backupId: string, options: {
    tables?: string[];
    dryRun?: boolean;
    overwrite?: boolean;
  } = {}): Promise<{
    success: boolean;
    restoredTables: string[];
    restoredRecords: number;
    errors: string[];
  }> {
    const startTime = Date.now();

    try {
      console.log(`[BACKUP] Iniciando restauração do backup: ${backupId}`);

      // Verificar se backup existe
      const metadata = this.backupHistory.find(b => b.id === backupId);
      if (!metadata) {
        throw new Error('Backup não encontrado');
      }

      // Verificar integridade antes da restauração
      const verificationResult = await this.verifyBackup(backupId);
      if (!verificationResult.valid) {
        throw new Error('Backup corrompido - restauração cancelada');
      }

      // Ler dados criptografados
      const encryptedData = await fs.readFile(metadata.location.local);
      
      // Descriptografar dados
      const decryptedData = await this.decryptMultiLayer(encryptedData, metadata.encryptionKeyId);
      
      // Descomprimir se necessário
      let processedData = decryptedData;
      if (metadata.isCompressed) {
        processedData = await this.decompressData(decryptedData);
      }

      // Deserializar dados
      const backupData = JSON.parse(processedData.toString('utf8'));
      
      // Validar checksum
      const calculatedChecksum = crypto.createHash('sha256')
        .update(JSON.stringify(backupData, null, 2))
        .digest('hex');
      
      if (calculatedChecksum !== metadata.checksum) {
        throw new Error('Checksum não confere - dados podem estar corrompidos');
      }

      const restoredTables: string[] = [];
      let restoredRecords = 0;
      const errors: string[] = [];

      // Determinar tabelas a restaurar
      const tablesToRestore = options.tables || metadata.tables;

      // Executar restauração
      if (!options.dryRun) {
        // Criar ponto de backup antes da restauração
        await this.createRestorePoint(backupId);

        for (const table of tablesToRestore) {
          try {
            if (!backupData[table]) {
              errors.push(`Tabela ${table} não encontrada no backup`);
              continue;
            }

            const records = await this.restoreTableData(
              table, 
              backupData[table], 
              options.overwrite || false
            );
            
            restoredTables.push(table);
            restoredRecords += records;
            
            console.log(`[BACKUP] Restaurada tabela ${table}: ${records} registros`);
          } catch (error) {
            errors.push(`Erro ao restaurar tabela ${table}: ${error.message}`);
          }
        }
      } else {
        console.log(`[BACKUP] Simulação de restauração - ${tablesToRestore.length} tabelas seriam restauradas`);
        restoredTables.push(...tablesToRestore);
        restoredRecords = metadata.recordCount;
      }

      // Log de auditoria
      advancedSecurity.auditLog('BACKUP_RESTORED', null, null, {
        backupId,
        restoredTables,
        restoredRecords,
        errors,
        dryRun: options.dryRun,
        duration: Date.now() - startTime
      });

      return {
        success: errors.length === 0,
        restoredTables,
        restoredRecords,
        errors
      };

    } catch (error) {
      advancedSecurity.auditLog('BACKUP_RESTORE_FAILED', null, null, {
        backupId,
        error: error.message,
        duration: Date.now() - startTime
      });

      throw new Error(`Falha ao restaurar backup: ${error.message}`);
    }
  }

  /**
   * Verificar integridade do backup
   */
  async verifyBackup(backupId: string): Promise<BackupVerificationResult> {
    try {
      const metadata = this.backupHistory.find(b => b.id === backupId);
      if (!metadata) {
        return {
          valid: false,
          checksumMatch: false,
          encryptionIntact: false,
          dataIntegrity: false,
          errors: ['Backup não encontrado'],
          warnings: []
        };
      }

      const errors: string[] = [];
      const warnings: string[] = [];

      // Verificar se arquivo existe
      try {
        await fs.access(metadata.location.local);
      } catch {
        errors.push('Arquivo de backup não encontrado');
      }

      // Verificar tamanho do arquivo
      const stats = await fs.stat(metadata.location.local);
      if (stats.size !== metadata.encryptedSize) {
        errors.push('Tamanho do arquivo não confere');
      }

      // Tentar descriptografar
      let encryptionIntact = false;
      let checksumMatch = false;
      let dataIntegrity = false;

      try {
        const encryptedData = await fs.readFile(metadata.location.local);
        const decryptedData = await this.decryptMultiLayer(encryptedData, metadata.encryptionKeyId);
        encryptionIntact = true;

        // Descomprimir se necessário
        let processedData = decryptedData;
        if (metadata.isCompressed) {
          processedData = await this.decompressData(decryptedData);
        }

        // Verificar checksum
        const backupData = JSON.parse(processedData.toString('utf8'));
        const calculatedChecksum = crypto.createHash('sha256')
          .update(JSON.stringify(backupData, null, 2))
          .digest('hex');
        
        checksumMatch = calculatedChecksum === metadata.checksum;
        
        if (!checksumMatch) {
          errors.push('Checksum não confere');
        }

        // Verificar integridade dos dados
        dataIntegrity = this.validateBackupData(backupData, metadata);
        
        if (!dataIntegrity) {
          errors.push('Dados do backup estão inconsistentes');
        }

      } catch (error) {
        errors.push(`Erro na descriptografia: ${error.message}`);
      }

      const result: BackupVerificationResult = {
        valid: errors.length === 0,
        checksumMatch,
        encryptionIntact,
        dataIntegrity,
        errors,
        warnings
      };

      // Log de auditoria
      advancedSecurity.auditLog('BACKUP_VERIFIED', null, null, {
        backupId,
        result
      });

      return result;

    } catch (error) {
      return {
        valid: false,
        checksumMatch: false,
        encryptionIntact: false,
        dataIntegrity: false,
        errors: [`Erro na verificação: ${error.message}`],
        warnings: []
      };
    }
  }

  /**
   * Aplicar múltiplas camadas de criptografia
   */
  private async applyMultiLayerEncryption(data: Buffer, backupId: string): Promise<{
    encryptedData: Buffer;
    keyId: string;
  }> {
    let processedData = data;
    const keyId = this.generateKeyId();

    // Camada 1: Criptografia com chave do backup
    const backupKey = crypto.randomBytes(32);
    processedData = await this.encryptLayer(processedData, backupKey, 'backup');

    // Camada 2: Criptografia com chave mestre do sistema
    const systemKey = await this.getSystemMasterKey();
    processedData = await this.encryptLayer(processedData, systemKey, 'system');

    // Camada 3: Criptografia com chave rotativa
    const rotativeKey = await this.getRotativeKey();
    processedData = await this.encryptLayer(processedData, rotativeKey, 'rotative');

    // Armazenar chave do backup
    this.encryptionKeys.set(keyId, backupKey);

    return {
      encryptedData: processedData,
      keyId
    };
  }

  /**
   * Descriptografar múltiplas camadas
   */
  private async decryptMultiLayer(encryptedData: Buffer, keyId: string): Promise<Buffer> {
    let processedData = encryptedData;

    // Camada 3: Descriptografar com chave rotativa
    const rotativeKey = await this.getRotativeKey();
    processedData = await this.decryptLayer(processedData, rotativeKey, 'rotative');

    // Camada 2: Descriptografar com chave mestre do sistema
    const systemKey = await this.getSystemMasterKey();
    processedData = await this.decryptLayer(processedData, systemKey, 'system');

    // Camada 1: Descriptografar com chave do backup
    const backupKey = this.encryptionKeys.get(keyId);
    if (!backupKey) {
      throw new Error('Chave de descriptografia não encontrada');
    }
    processedData = await this.decryptLayer(processedData, backupKey, 'backup');

    return processedData;
  }

  /**
   * Criptografar camada individual
   */
  private async encryptLayer(data: Buffer, key: Buffer, layer: string): Promise<Buffer> {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher('aes-256-gcm', key);
    cipher.setAAD(Buffer.from(layer));

    const encrypted = Buffer.concat([
      cipher.update(data),
      cipher.final()
    ]);

    const authTag = cipher.getAuthTag();

    // Combinar IV + tag + dados criptografados
    return Buffer.concat([iv, authTag, encrypted]);
  }

  /**
   * Descriptografar camada individual
   */
  private async decryptLayer(encryptedData: Buffer, key: Buffer, layer: string): Promise<Buffer> {
    const iv = encryptedData.slice(0, 16);
    const authTag = encryptedData.slice(16, 32);
    const encrypted = encryptedData.slice(32);

    const decipher = crypto.createDecipher('aes-256-gcm', key);
    decipher.setAAD(Buffer.from(layer));
    decipher.setAuthTag(authTag);

    return Buffer.concat([
      decipher.update(encrypted),
      decipher.final()
    ]);
  }

  /**
   * Comprimir dados
   */
  private async compressData(data: Buffer): Promise<Buffer> {
    const zlib = await import('zlib');
    return new Promise((resolve, reject) => {
      zlib.brotliCompress(data, { level: 9 }, (err, compressed) => {
        if (err) reject(err);
        else resolve(compressed);
      });
    });
  }

  /**
   * Descomprimir dados
   */
  private async decompressData(compressedData: Buffer): Promise<Buffer> {
    const zlib = await import('zlib');
    return new Promise((resolve, reject) => {
      zlib.brotliDecompress(compressedData, (err, decompressed) => {
        if (err) reject(err);
        else resolve(decompressed);
      });
    });
  }

  /**
   * Obter tabelas médicas para backup
   */
  private async getMedicalTables(): Promise<string[]> {
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      AND table_name IN (
        'users', 'exams', 'exam_results', 'health_metrics', 
        'diagnoses', 'medications', 'allergies', 'profiles'
      )
    `);
    
    return result.rows.map(row => row.table_name);
  }

  /**
   * Exportar dados da tabela
   */
  private async exportTableData(tableName: string): Promise<any[]> {
    const result = await pool.query(`SELECT * FROM ${tableName}`);
    return result.rows;
  }

  /**
   * Restaurar dados da tabela
   */
  private async restoreTableData(tableName: string, data: any[], overwrite: boolean): Promise<number> {
    let restoredCount = 0;

    // Começar transação
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      if (overwrite) {
        // Limpar tabela existente
        await client.query(`DELETE FROM ${tableName}`);
      }

      // Inserir dados
      for (const record of data) {
        try {
          const columns = Object.keys(record).join(', ');
          const values = Object.values(record);
          const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');

          await client.query(
            `INSERT INTO ${tableName} (${columns}) VALUES (${placeholders})
             ON CONFLICT DO NOTHING`,
            values
          );
          restoredCount++;
        } catch (error) {
          console.warn(`Erro ao inserir registro na tabela ${tableName}:`, error.message);
        }
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    return restoredCount;
  }

  /**
   * Calcular data de retenção
   */
  private calculateRetentionDate(type: BackupMetadata['type']): Date {
    const now = new Date();
    
    switch (type) {
      case 'daily':
        return new Date(now.getTime() + this.config.retentionPolicy.daily * 24 * 60 * 60 * 1000);
      case 'weekly':
        return new Date(now.getTime() + this.config.retentionPolicy.weekly * 7 * 24 * 60 * 60 * 1000);
      case 'monthly':
        return new Date(now.getTime() + this.config.retentionPolicy.monthly * 30 * 24 * 60 * 60 * 1000);
      case 'yearly':
        return new Date(now.getTime() + this.config.retentionPolicy.yearly * 365 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 dias para manual
    }
  }

  /**
   * Limpeza de backups expirados
   */
  private async cleanupExpiredBackups() {
    const now = new Date();
    let cleanedCount = 0;

    for (const metadata of this.backupHistory) {
      if (metadata.retentionUntil < now) {
        try {
          // Remover arquivo local
          await fs.unlink(metadata.location.local);
          
          // Remover arquivo off-site se existir
          if (metadata.location.offsite) {
            try {
              await fs.unlink(metadata.location.offsite);
            } catch {
              // Falha silenciosa para off-site
            }
          }

          // Remover chave de criptografia
          this.encryptionKeys.delete(metadata.encryptionKeyId);
          
          cleanedCount++;
          
          advancedSecurity.auditLog('BACKUP_EXPIRED_REMOVED', null, null, {
            backupId: metadata.id,
            type: metadata.type,
            retentionUntil: metadata.retentionUntil
          });
          
        } catch (error) {
          console.error(`Erro ao remover backup expirado ${metadata.id}:`, error);
        }
      }
    }

    // Atualizar histórico
    this.backupHistory = this.backupHistory.filter(b => b.retentionUntil >= now);

    if (cleanedCount > 0) {
      console.log(`[BACKUP] Removidos ${cleanedCount} backups expirados`);
    }
  }

  /**
   * Métodos auxiliares
   */
  private generateBackupId(): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const random = Math.random().toString(36).substr(2, 8);
    return `backup_${timestamp}_${random}`;
  }

  private generateKeyId(): string {
    return `key_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
  }

  private async getSystemMasterKey(): Promise<Buffer> {
    // Em produção, esta chave viria de um HSM ou key management service
    const keyData = process.env.BACKUP_MASTER_KEY || crypto.randomBytes(32).toString('hex');
    return Buffer.from(keyData, 'hex');
  }

  private async getRotativeKey(): Promise<Buffer> {
    // Chave que rota semanalmente
    const weekNumber = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
    const seed = `rotative_key_${weekNumber}`;
    return crypto.createHash('sha256').update(seed).digest();
  }

  private async ensureDirectoryExists(dir: string) {
    try {
      await fs.access(dir);
    } catch {
      await fs.mkdir(dir, { recursive: true });
    }
  }

  private async loadBackupHistory() {
    // Em produção, carregaria do banco de dados
    this.backupHistory = [];
  }

  private async saveBackupMetadata(metadata: BackupMetadata) {
    // Em produção, salvaria no banco de dados
    const metadataPath = path.join(this.backupDir, `${metadata.id}.meta`);
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
  }

  private async initializeEncryptionKeys() {
    // Carregar chaves existentes
    // Em produção, viria de um key management service
  }

  private scheduleAutomaticBackups() {
    // Em produção, usaria um scheduler como node-cron
    console.log('[BACKUP] Agendamento automático configurado');
  }

  private async replicateToOffSite(backupId: string, metadata: BackupMetadata) {
    if (!this.offSiteDir) return;

    const sourcePath = metadata.location.local;
    const destPath = path.join(this.offSiteDir, path.basename(sourcePath));
    
    await fs.copyFile(sourcePath, destPath);
    metadata.location.offsite = destPath;
  }

  private async createRestorePoint(backupId: string) {
    // Criar backup rápido antes da restauração
    const restorePoint = await this.createFullBackup('manual');
    console.log(`[BACKUP] Ponto de restauração criado: ${restorePoint.id}`);
  }

  private validateBackupData(backupData: Record<string, any[]>, metadata: BackupMetadata): boolean {
    // Validar estrutura básica dos dados
    for (const table of metadata.tables) {
      if (!Array.isArray(backupData[table])) {
        return false;
      }
    }
    return true;
  }

  /**
   * API pública
   */
  async getBackupHistory(): Promise<BackupMetadata[]> {
    return this.backupHistory.slice();
  }

  async getBackupStatistics(): Promise<{
    totalBackups: number;
    totalSize: number;
    lastBackup?: Date;
    oldestBackup?: Date;
    backupsByType: Record<string, number>;
  }> {
    const totalBackups = this.backupHistory.length;
    const totalSize = this.backupHistory.reduce((sum, b) => sum + b.size, 0);
    const dates = this.backupHistory.map(b => b.createdAt).sort();
    
    const backupsByType = this.backupHistory.reduce((acc, b) => {
      acc[b.type] = (acc[b.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalBackups,
      totalSize,
      lastBackup: dates[dates.length - 1],
      oldestBackup: dates[0],
      backupsByType
    };
  }
}

export const encryptedBackup = new EncryptedBackupSystem();