# 📋 VitaView.ai - Conformidade HIPAA & LGPD

## 📖 Índice
1. [Visão Geral](#visão-geral)
2. [Status Atual de Conformidade](#status-atual-de-conformidade)
3. [Requisitos HIPAA](#requisitos-hipaa)
4. [Requisitos LGPD](#requisitos-lgpd)
5. [Implementações Existentes](#implementações-existentes)
6. [Gaps Identificados e Plano de Ação](#gaps-identificados-e-plano-de-ação)
7. [Políticas e Procedimentos](#políticas-e-procedimentos)

---

## Visão Geral

O VitaView.ai é um sistema de análise de exames médicos que processa PHI (Protected Health Information) / Dados Sensíveis de Saúde. Portanto, deve estar em conformidade com:

- **HIPAA** (Health Insurance Portability and Accountability Act) - EUA
- **LGPD** (Lei Geral de Proteção de Dados) - Brasil

### Classificação dos Dados

| Tipo de Dado | Classificação HIPAA | Classificação LGPD |
|--------------|--------------------|--------------------|
| Exames médicos | PHI | Dados Sensíveis |
| Métricas de saúde | PHI | Dados Sensíveis |
| Diagnósticos (CID) | PHI | Dados Sensíveis |
| Prescrições | PHI | Dados Sensíveis |
| Alergias | PHI | Dados Sensíveis |
| Dados cadastrais | PII | Dados Pessoais |
| Dados de pagamento | - | Dados Pessoais |

---

## Status Atual de Conformidade

### ✅ Implementado
- [x] Criptografia AES-256-GCM para dados em repouso
- [x] TLS/HTTPS para dados em trânsito
- [x] Autenticação segura com hash scrypt
- [x] Sessões seguras com PostgreSQL
- [x] Rate limiting para proteção contra brute force
- [x] Audit logging com winston
- [x] Web Application Firewall (WAF)
- [x] Intrusion Detection System
- [x] Sanitização de entrada de dados
- [x] Validação de dados médicos
- [x] CORS configurado
- [x] Content Security Policy (CSP)
- [x] Headers de segurança (Helmet)

### ⚠️ Parcialmente Implementado
- [ ] Sistema completo de audit trail para todas operações PHI
- [ ] Gestão de consentimento explícito (LGPD)
- [ ] Portal de direitos do titular (LGPD)
- [ ] Backup criptografado automatizado

### ❌ Necessita Implementação
- [ ] Data Protection Officer (DPO) designado
- [ ] Política de retenção de dados documentada
- [ ] Procedimento de resposta a incidentes
- [ ] Business Associate Agreements (BAA) template
- [ ] Treinamento de equipe documentado

---

## Requisitos HIPAA

### 1. Technical Safeguards (45 CFR 164.312)

#### 1.1 Access Control (§164.312(a)(1))
| Requisito | Status | Implementação |
|-----------|--------|---------------|
| Identificação única de usuário | ✅ | `users.id`, `users.username` |
| Procedimento de acesso de emergência | ⚠️ | Necessita documentação |
| Logout automático | ✅ | 15 min inatividade (`session.maxAge`) |
| Criptografia | ✅ | AES-256-GCM |

#### 1.2 Audit Controls (§164.312(b))
| Requisito | Status | Implementação |
|-----------|--------|---------------|
| Registro de acessos | ✅ | `logger.ts`, `advanced-security.ts` |
| Rastreamento de modificações | ⚠️ | Parcial - Necessita campos `updatedBy`, `updatedAt` |
| Retenção de logs (6 anos mínimo) | ✅ | 7 anos configurado |
| Logs tamper-proof | ⚠️ | Logs locais, necessita centralização |

#### 1.3 Integrity (§164.312(c)(1))
| Requisito | Status | Implementação |
|-----------|--------|---------------|
| Proteção contra alteração | ✅ | GCM authentication tag |
| Verificação de integridade | ✅ | Hash SHA-256 |
| Backup com integridade | ⚠️ | `medical-encryption.ts` (parcial) |

#### 1.4 Person Authentication (§164.312(d))
| Requisito | Status | Implementação |
|-----------|--------|---------------|
| Verificação de identidade | ✅ | Passport.js + scrypt |
| Multi-Factor Authentication | ⚠️ | Estrutura existe, não obrigatório |
| Biometria (opcional) | ✅ | WebAuthn configurado |

#### 1.5 Transmission Security (§164.312(e)(1))
| Requisito | Status | Implementação |
|-----------|--------|---------------|
| Controles de integridade | ✅ | HTTPS + GCM auth tag |
| Criptografia em trânsito | ✅ | TLS 1.2+ |

### 2. Administrative Safeguards (45 CFR 164.308)

| Requisito | Status | Observação |
|-----------|--------|------------|
| Security Officer designado | ❌ | Necessita documentar |
| Análise de risco documentada | ⚠️ | Necessita documento formal |
| Política de senhas | ✅ | Mínimo 8 caracteres, hash seguro |
| Treinamento de workforce | ❌ | Necessita programa |
| Plano de contingência | ⚠️ | Backup existe, necessita documentar |
| Business Associate Agreements | ❌ | Necessita template |

### 3. Physical Safeguards (45 CFR 164.310)

| Requisito | Status | Observação |
|-----------|--------|------------|
| Controle de acesso às instalações | N/A | Cloud-based (Neon/AWS) |
| Segurança de estações de trabalho | N/A | Responsabilidade do usuário |
| Controles de dispositivos/mídia | ✅ | Dados criptografados em S3 |

---

## Requisitos LGPD

### 1. Princípios (Art. 6º)

| Princípio | Status | Implementação |
|-----------|--------|---------------|
| Finalidade | ✅ | Análise de exames médicos |
| Adequação | ✅ | Dados coletados são pertinentes |
| Necessidade | ✅ | Minimização de dados |
| Livre acesso | ⚠️ | Necessita portal de acesso |
| Qualidade dos dados | ✅ | Validação implementada |
| Transparência | ⚠️ | Privacy Policy existe |
| Segurança | ✅ | Criptografia + controles |
| Prevenção | ✅ | WAF + IDS |
| Não discriminação | ✅ | Sem tratamento discriminatório |
| Responsabilização | ⚠️ | Necessita DPO |

### 2. Bases Legais para Dados Sensíveis de Saúde (Art. 11)

| Base Legal | Aplicável | Observação |
|-----------|-----------|------------|
| Consentimento explícito | ✅ | Necessita implementar gestão |
| Tutela da saúde | ✅ | Análise de exames |
| Cumprimento de obrigação legal | ⚠️ | Depende do contexto |

### 3. Direitos do Titular (Art. 18)

| Direito | Status | Implementação |
|---------|--------|---------------|
| Confirmação de tratamento | ⚠️ | Endpoint necessário |
| Acesso aos dados | ⚠️ | Endpoint parcial |
| Correção de dados | ✅ | PUT /api/profiles/:id |
| Anonimização/bloqueio | ❌ | Não implementado |
| Portabilidade | ❌ | Não implementado |
| Eliminação | ⚠️ | DELETE existe, precisa validar |
| Informação sobre compartilhamento | ⚠️ | Necessita documentar |
| Revogação de consentimento | ❌ | Não implementado |

### 4. Notificação de Incidentes (Art. 48)

| Requisito | Status | Observação |
|-----------|--------|------------|
| Notificação à ANPD em 3 dias | ❌ | Procedimento não documentado |
| Notificação ao titular | ❌ | Procedimento não documentado |
| Documentação de incidentes | ⚠️ | Logs existem |

### 5. Data Protection Officer (Art. 41)

| Requisito | Status | Observação |
|-----------|--------|------------|
| DPO designado | ❌ | Necessita designar |
| Contato público | ❌ | Necessita publicar |
| Comunicação com ANPD | ❌ | Não estruturado |

---

## Implementações Existentes

### 1. Sistema de Criptografia (`medical-encryption.ts`)
```typescript
// AES-256-GCM com PBKDF2
- ALGORITHM: 'aes-256-gcm'
- KEY_LENGTH: 32 bytes (256 bits)
- PBKDF2_ITERATIONS: 100,000
- KEY_ROTATION_INTERVAL: 90 dias
- BACKUP_KEY_RETENTION: 7 anos
```

### 2. Segurança de Sessão (`advanced-security.ts`)
```typescript
- maxAge: 15 minutos
- absoluteTimeout: 2 horas
- maxConcurrentSessions: 2
- lockoutThreshold: 3 tentativas
- lockoutDuration: 30 minutos
- retentionPeriod: 7 anos
```

### 3. Logging e Auditoria (`logger.ts`)
```typescript
- Níveis: error, warn, info, http, debug
- Arquivos: error.log, combined.log
- Formato: JSON com timestamp
```

### 4. Web Application Firewall (`waf.ts`)
- Proteção contra SQL Injection
- Proteção contra XSS
- Proteção contra Path Traversal
- Bloqueio de IPs maliciosos

### 5. Intrusion Detection (`intrusion-detection.ts`)
- Detecção de padrões anômalos
- Alertas em tempo real
- Bloqueio automático

---

## Gaps Identificados e Plano de Ação

### Alta Prioridade 🔴

#### 1. Sistema de Gestão de Consentimento
**Gap**: Não há rastreamento explícito de consentimento do titular.
**Ação**:
- Criar tabela `user_consents` no banco de dados
- Implementar endpoint para registrar consentimento
- Adicionar checkbox de consentimento no registro
- Manter histórico de consentimentos

#### 2. Portal de Direitos do Titular (LGPD)
**Gap**: Titular não pode exercer direitos facilmente.
**Ação**:
- Criar página `/data-rights` no frontend
- Implementar endpoints:
  - GET /api/data-export (portabilidade)
  - POST /api/data-deletion-request (eliminação)
  - GET /api/processing-info (informações)

#### 3. Audit Trail Completo
**Gap**: Não há rastreamento de quem modificou cada registro.
**Ação**:
- Adicionar campos `createdBy`, `updatedBy`, `deletedBy`, `deletedAt`
- Criar tabela `audit_logs` centralizada
- Registrar todas operações em PHI

### Média Prioridade 🟡

#### 4. Procedimento de Resposta a Incidentes
**Gap**: Não há procedimento documentado.
**Ação**:
- Documentar processo de identificação
- Definir equipe de resposta
- Criar templates de notificação (ANPD e titulares)
- Estabelecer SLAs (72 horas LGPD)

#### 5. Multi-Factor Authentication Obrigatório
**Gap**: MFA existe mas não é obrigatório.
**Ação**:
- Tornar MFA obrigatório para profissionais de saúde
- Implementar TOTP (Google Authenticator)
- Adicionar SMS como fallback

#### 6. Backup Automatizado e Testado
**Gap**: Sistema de backup existe mas não está automatizado.
**Ação**:
- Configurar backup diário automatizado
- Implementar verificação de integridade
- Testar restauração mensalmente
- Documentar procedimento

### Baixa Prioridade 🟢

#### 7. Documentação Formal
**Gap**: Políticas não estão documentadas formalmente.
**Ação**:
- Redigir Política de Privacidade completa
- Criar Política de Segurança da Informação
- Documentar Política de Retenção de Dados
- Criar manual de procedimentos

#### 8. Business Associate Agreements
**Gap**: Não há template de BAA.
**Ação**:
- Criar template de BAA para parceiros
- Revisar contratos existentes
- Implementar processo de due diligence

---

## Políticas e Procedimentos

### Política de Retenção de Dados

| Tipo de Dado | Período de Retenção | Base Legal |
|--------------|---------------------|------------|
| Exames médicos | 20 anos | Lei 13.787/2018 (Brasil) |
| Logs de auditoria | 7 anos | HIPAA |
| Dados de sessão | 7 dias após expiração | Operacional |
| Backups | 7 anos | HIPAA |
| Dados de pagamento | 5 anos | Código Tributário |

### Política de Senhas
- Mínimo: 8 caracteres
- Complexidade: Ao menos 1 maiúscula, 1 número
- Expiração: 90 dias (recomendado)
- Histórico: Últimas 5 senhas não podem ser reutilizadas
- Hash: scrypt (memory-hard)

### Política de Acesso
- Princípio do menor privilégio
- Revisão de acessos trimestral
- Desativação imediata em desligamento
- Logs de todos os acessos

---

## Checklist de Conformidade

### HIPAA Technical Safeguards
- [x] Access Control - Unique User ID
- [x] Access Control - Automatic Logoff
- [x] Access Control - Encryption/Decryption
- [x] Audit Controls - Activity Logging
- [x] Integrity - Authentication Mechanisms
- [x] Person Authentication - Password + MFA option
- [x] Transmission Security - TLS Encryption

### LGPD Requirements
- [x] Dados criptografados em repouso
- [x] Dados criptografados em trânsito
- [ ] Gestão de consentimento documentada
- [ ] Portal de direitos do titular
- [ ] DPO designado e publicado
- [ ] Procedimento de incidentes documentado
- [x] Política de privacidade publicada

---

## Próximos Passos

1. **Imediato (1-2 semanas)**
   - Implementar tabela de consentimentos
   - Criar endpoints de direitos do titular
   - Adicionar campos de auditoria nas tabelas

2. **Curto Prazo (1 mês)**
   - Implementar MFA obrigatório
   - Documentar procedimentos de incidentes
   - Treinar equipe em compliance

3. **Médio Prazo (3 meses)**
   - Designar DPO oficial
   - Criar programa de treinamento
   - Realizar auditoria completa
   - Implementar testes de penetração

---

## Contatos

| Função | Responsável | Contato |
|--------|-------------|---------|
| DPO | [A designar] | dpo@vitaview.ai |
| Security Officer | [A designar] | security@vitaview.ai |
| Suporte ao Titular | - | privacy@vitaview.ai |

---

*Documento atualizado em: 2026-01-11*
*Versão: 1.0*
*Próxima revisão: 2026-04-11*
