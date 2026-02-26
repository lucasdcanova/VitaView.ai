# VitaView AI

Plataforma clínica web/PWA com prontuário eletrônico, agenda, gestão de pacientes, documentos médicos (prescrição/atestado/solicitação de exames), análises de exames com IA, assistente clínico (Vita Assist), gestão de assinatura e recursos administrativos.

Este README foi atualizado com base em uma varredura do código em **26/02/2026** (frontend, backend, rotas e schema), substituindo a descrição antiga focada apenas em análise bioquímica.

## Resumo do Sistema

- **Frontend**: React + TypeScript + Vite + Wouter + React Query + Tailwind + Radix UI
- **Backend**: Node.js + Express + Passport (sessão) + Drizzle ORM
- **Banco**: PostgreSQL
- **IA**: OpenAI (extração, interpretação, transcrição e chat clínico)
- **Pagamentos**: Stripe (assinatura e portal de billing)
- **PWA**: Manifest + Service Worker + modo standalone
- **Multi-tenant**: suporte a clínica/equipe com contexto de clínica ativa
- **Segurança**: WAF, rotas de backup, RBAC, MFA (TOTP + biometria), trilhas/auditoria (módulos no schema/rotas)

## Inventário (Snapshot do Código)

- **31 rotas explícitas no frontend** em `client/src/App.tsx`
- **23 rotas protegidas** (área autenticada)
- **191 handlers HTTP** (`auth.ts`, `routes.ts` e `server/routes/*.ts`)
- **162 endpoints `/api` únicos**
- **46 tabelas Drizzle** em `shared/schema.ts`

## Funcionalidades do App (Visão por Módulo)

### 1. Landing pública e páginas institucionais

- Landing page principal (`/`)
- Termos de uso (`/termos`)
- Política de privacidade (`/privacidade`)
- Página de quick summary pública (`/quick-summary`)
- SEO/OG meta tags e schema.org no `client/index.html`

### 2. Autenticação e acesso

- Cadastro com validação de formulário (Zod)
- Login por email/senha (Passport Local)
- Logout com sessão server-side
- Recuperação de senha (`/forgot-password`)
- Cadastro com aceite de termos e consentimento LGPD
- Fluxo de convite de clínica por token (`/accept-invitation/:token`)
- Cadastro de secretária somente por convite/código (frontend + backend)
- Sessão com cookie `httpOnly`, `sameSite: strict`, persistência em session store

### 3. Agenda médica e atendimento

- Agenda com calendário (`/agenda`)
- CRUD de agendamentos (`/api/appointments`)
- Bloqueio/desbloqueio de agenda por faixa (`/api/appointments/blocks`)
- Sala de espera (waiting room)
- Iniciar atendimento a partir da agenda
- Fluxo para secretária com seleção de profissional da clínica
- Agendamento assistido por IA com comando em linguagem natural + anexos (`/api/appointments/ai-schedule`)

### 4. Triage / triagem

- Criação de triagem individual e em lote (`/api/triage`, `/api/triage/batch`)
- Consulta por agendamento (`/api/triage/appointment/:appointmentId`)
- Histórico por paciente (`/api/triage/history/:profileId`)
- Edição de triagem (`/api/triage/:id`)
- Badge/visualização de triagem no frontend

### 5. Gestão de pacientes e prontuário

- Cadastro/edição/remoção de pacientes (`/api/profiles`)
- Seleção de paciente ativo (`/api/users/active-profile`)
- Dashboard do paciente (`/api/patient-dashboard/:profileId`)
- Módulo de atendimento (`/atendimento`) com abas e lazy loading
- Diagnósticos (CRUD)
- Cirurgias (CRUD)
- Evoluções (CRUD + finalização)
- Hábitos (CRUD)
- Alergias (CRUD)
- Medicações contínuas (CRUD)
- Checagem de interações medicamentosas (`/api/medications/interactions`)

### 6. Exames e pipeline de IA

- Upload de exames (arquivo único e múltiplo)
- Processamento com IA para extração/estruturação de dados
- Identificação automática de paciente a partir de exame
- Geração de insights/interpretação (`/api/exams/:id/analyze`, `/api/exams/:id/insights`)
- Resumo rápido de exames (`/api/exams/quick-summary`)
- Histórico de exames (`/history`, `/exam-history`)
- Lista de resultados (`/results`)
- Detalhe de resultado (`/results/:id`)
- Relatório do exame (`/report/:id`) com exportação PDF
- Métricas de saúde derivadas (`/api/health-metrics`, `/api/health-metrics/latest`)
- Timeline de exames (`/exam-timeline`)
- Exclusão de exames e limpeza de métricas relacionadas

### 7. Atendimento clínico com IA (anamnese e voz)

- Transcrição de consulta por áudio (`/api/consultation/transcribe`)
- Processamento de transcrição para anamnese estruturada
- Extração/enriquecimento de registro clínico (`/api/patient-record/analyze`, `/api/patient-record/enhance`)
- Melhorias de texto de anamnese via IA (services/openai)

### 8. Prontuário longitudinal e linha do tempo de saúde

- Página `/health-trends` com visão longitudinal
- Timeline combinada de exames, diagnósticos, cirurgias, evoluções e triagens
- Gestão de diagnósticos com CID-10
- Gestão de alergias, hábitos e cirurgias
- Gestão de médicos vinculados ao paciente/usuário
- Exportações/relatórios legais (PDFs via jsPDF)

### 9. Prescrição, atestados e solicitação de exames (módulos clínicos embutidos no atendimento)

- Prescrições: prescrição aguda com composição de itens e observações
- Prescrições: medicações contínuas e renovação de receita
- Prescrições: histórico por paciente
- Prescrições: medicamentos customizados (`/api/custom-medications`)
- Prescrições: geração/finalização (`/api/prescriptions`, `/api/prescriptions/generate`)
- Prescrições: PDF (`/api/documents/prescription/pdf`)
- Atestados: emissão com parâmetros clínicos
- Atestados: histórico e reimpressão
- Atestados: templates (`/api/certificate-templates`)
- Atestados: PDF (`/api/documents/certificate/pdf`)
- Solicitação de exames: criação/edição de pedidos
- Solicitação de exames: protocolos reutilizáveis (`/api/exam-protocols`)
- Solicitação de exames: histórico e reimpressão
- Solicitação de exames: busca TUSS (`/api/tuss/search`)

### 10. Vita Assist (assistente clínico)

- Chat com IA (`/api/vita-assist/chat`)
- Conversas persistidas (`/api/vita-assist/conversations`)
- Histórico de conversas
- Seleção de paciente para contexto da conversa
- Contexto adicional por conversa (`/api/vita-assist/conversations/:id/context`)
- Exclusão de conversas

### 11. Importação em lote de pacientes

- Extração de pacientes a partir de imagens/PDF/CSV (`/api/patients/bulk-import/extract`)
- Revisão/normalização/confirmar importação (`/api/patients/bulk-import/confirm`)
- Tratamento de duplicidades no backend/storage

### 12. Relatórios e analytics

- Relatórios gerenciais (`/reports`)
- Filtros por período (7d/30d/90d/1y/custom)
- KPIs de pacientes, exames/procedimentos, faturamento estimado, ticket médio
- Séries e gráficos (Recharts)
- Endpoint de analytics (`/api/analytics`)

### 13. Assinaturas, billing e limites de uso

- Página de assinatura/planos (`/subscription`)
- Planos solo/clínica/hospital (agrupamento no frontend)
- Planos mensais/semestrais/anuais
- Limites por plano (`/api/subscription/limits`, `/api/subscription/can-upload/:profileId`)
- Checkout via Stripe (`/api/create-payment-intent`, `/api/create-subscription`)
- Portal de cobrança Stripe (`/api/create-billing-portal-session`)
- Ativação/cancelamento de assinatura (`/api/activate-subscription`, `/api/cancel-subscription`)
- Webhook Stripe (`/api/webhook`)
- Tratamento de plano gratuito sem Stripe

### 14. Clínica e equipe (multi-tenant)

- Página “Minha Clínica” (`/minha-clinica`)
- Criação de clínica
- Seleção de clínica ativa (`/api/my-clinic/select`)
- Gestão de membros (admin/member/secretary)
- Convites por email e por código (`/api/clinics/:id/invite`, `/api/clinic-invitations/accept-code`)
- Aceite/rejeição de convite por token
- Lista de convites do usuário (`/api/my-invitations`)
- Remoção de membros da clínica
- Regras de acesso por plano (Team/Business/Hospital)

### 15. Perfil do profissional e configurações

- Página de perfil (`/profile`)
- Edição de dados pessoais e profissionais (CRM, especialidade, RQE etc.)
- Upload e recorte de foto profissional (`/api/users/profile-photo`)
- Preferências do usuário (`/api/user/preferences`)
- Alteração de senha (fluxo no frontend + backend)
- Tema claro/escuro e preferências visuais
- Exportação de dados do usuário (LGPD) (`/api/user/export`)
- Exclusão de conta (`/api/user`, `/api/user/me`)

### 16. Segurança, MFA e governança

- MFA por biometria (WebAuthn/biometric endpoints)
- MFA por TOTP (`/api/auth/totp/*`)
- Endpoint unificado de autenticação MFA (`/api/auth/mfa/authenticate`)
- WAF com métricas e regras (`/api/waf/*`)
- Rotas de backup criptografado (`/api/backup/*`)
- RBAC por domínio/permissão em rotas admin/security/system
- Logs e trilhas (`audit_logs`, `security_incidents`, `storage_logs` no schema)
- Endpoint de relatório de violação CSP (`/api/csp-violation-report`)

### 17. Administração, suporte e operação

- Painel admin (`/admin`, `/admin-panel`)
- Gestão de usuários e planos
- Alteração de plano de usuário
- Monitoramento de uso de IA/fair use (`/api/admin/usage-stats`)
- Custos de IA (`/admin/ai-costs`, `/api/admin/ai-costs`)
- KPI financeiro administrativo (`/api/admin/financial-kpi`)
- Usuários deletados e inspeção de registro deletado
- Bug reports (`/api/bug-reports`, `/api/admin/bug-reports`)
- Base de conhecimento/admin de artigos (`/admin/knowledge-base`, `/api/support/articles`)
- Busca e chat de suporte (`/api/support/search`, `/api/support/chat`)

### 18. PWA, mobile e UX operacional

- Manifest PWA (`client/public/manifest.json`) com `display: standalone`
- `start_url` em `/auth`
- Service Worker (`client/public/sw.js`)
- Cache de assets estáticos e estratégia `stale-while-revalidate`
- API com estratégia network-first e fallback offline simples JSON
- Eventos online/offline, banner de atualização e instalação (`use-pwa.tsx`, `pwa-manager.ts`)
- Monitor de conexão com aviso de servidor offline
- Command Palette global (`CommandPalette`)
- Onboarding guiado (`OnboardingTour`)
- Notificações e toasts

## Rotas Frontend Ativas (AppRouter)

### Públicas

| Rota | Tela | Observação |
|---|---|---|
| `/` | Home | Landing pública |
| `/termos` | TermsPage | Página institucional |
| `/privacidade` | PrivacyPage | Página institucional |
| `/quick-summary` | QuickSummaryPage | Página pública |

### Autenticação

| Rota | Tela | Observação |
|---|---|---|
| `/auth` | AuthPage | Login/cadastro |
| `/accept-invitation/:token` | AuthPage | Cadastro/aceite com token |
| `/forgot-password` | ForgotPasswordPage | Recuperação de senha |

### Área autenticada (protegidas)

| Rota | Tela | Finalidade |
|---|---|---|
| `/dashboard` | redirect | Legado, redireciona para `/agenda` |
| `/agenda` | Agenda | Agenda, calendário, triagem e sala de espera |
| `/pacientes` | Patients | Gestão/lista de pacientes |
| `/upload` | UploadExams | Upload de exames |
| `/upload-exams` | UploadExams | Alias da tela de upload |
| `/history` | ExamHistory | Histórico de exames |
| `/exam-history` | ExamHistory | Alias do histórico |
| `/report/:id` | ExamReport | Relatório detalhado do exame |
| `/diagnosis/:id` | DiagnosisPage | Diagnóstico por exame/contexto |
| `/results` | ExamResults | Lista/resultados de exames |
| `/results/:id` | ExamResultSingle | Resultado individual |
| `/health-trends` | HealthTrends | Prontuário longitudinal |
| `/atendimento` | PatientView | Atendimento do paciente |
| `/exam-timeline` | ExamTimeline | Timeline de exames |
| `/profile` | Profile | Perfil/configurações |
| `/bulk-import` | BulkImport | Importação em lote de pacientes |
| `/reports` | ReportsPage | Relatórios gerenciais |
| `/subscription` | SubscriptionManagement | Planos e billing |
| `/admin-panel` | AdminPanel | Painel administrativo |
| `/admin` | AdminPanel | Alias admin |
| `/admin/knowledge-base` | KnowledgeBaseAdmin | Base de conhecimento |
| `/admin/ai-costs` | AdminAICosts | Custos de IA |
| `/vita-assist` | VitaAssist | Assistente clínico IA |
| `/minha-clinica` | MyClinic | Clínica e equipe |

## Mapa de APIs (por domínio)

Observação: existem rotas repetidas/compatíveis em `server/routes.ts` e `server/routes/documents.ts` para alguns domínios durante refatoração modular.

### Autenticação e usuário

- `/api/register`
- `/api/login`
- `/api/logout`
- `/api/user`
- `/api/user/preferences`
- `/api/forgot-password`
- `/api/user/profile`
- `/api/user/export`
- `/api/user/me`
- `/api/users/profile-photo`
- `/api/users/profile-photo/:userId`

### Segurança / MFA / WAF / Backup

- `/api/auth/biometric/register`
- `/api/auth/biometric/verify-registration`
- `/api/auth/totp/setup`
- `/api/auth/totp/verify-setup`
- `/api/auth/mfa/authenticate`
- `/api/security/statistics`
- `/api/waf/statistics`
- `/api/waf/rules`
- `/api/waf/rules/:ruleId/toggle`
- `/api/waf/whitelist`
- `/api/waf/blacklist`
- `/api/backup/create`
- `/api/backup/history`
- `/api/backup/restore/:backupId`
- `/api/backup/verify/:backupId`
- `/api/csp-violation-report`

### Pacientes e prontuário

- `/api/profiles`
- `/api/profiles/:id`
- `/api/users/active-profile`
- `/api/diagnoses`
- `/api/diagnoses/:id`
- `/api/surgeries`
- `/api/surgeries/:id`
- `/api/evolutions`
- `/api/evolutions/:id`
- `/api/evolutions/:id/finalize`
- `/api/habits`
- `/api/habits/:id`
- `/api/allergies`
- `/api/allergies/:id`
- `/api/allergies/patient/:profileId`
- `/api/medications`
- `/api/medications/:id`
- `/api/medications/interactions`
- `/api/patient-dashboard/:profileId`
- `/api/reports/chronological`

### Agenda e triagem

- `/api/appointments`
- `/api/appointments/:id`
- `/api/appointments/blocks`
- `/api/appointments/ai-schedule`
- `/api/clinic/appointments`
- `/api/triage`
- `/api/triage/batch`
- `/api/triage/:id`
- `/api/triage/appointment/:appointmentId`
- `/api/triage/history/:profileId`
- `/api/doctor/dashboard-stats`

### Exames, IA e métricas

- `/api/exams`
- `/api/exams/:id`
- `/api/exams/:id/analyze`
- `/api/exams/:id/insights`
- `/api/exams/upload`
- `/api/exams/upload-multiple`
- `/api/exams/quick-summary`
- `/api/exam-results`
- `/api/health-metrics`
- `/api/health-metrics/latest`
- `/api/health-metrics/user/:userId`
- `/api/analyze/openai`
- `/api/analyze/interpretation`
- `/api/consultation/transcribe`
- `/api/patient-record/analyze`
- `/api/patient-record/enhance`

### Documentos clínicos (prescrição, atestado, solicitações)

- `/api/prescriptions`
- `/api/prescriptions/:id`
- `/api/prescriptions/:id/finalize`
- `/api/prescriptions/:id/status`
- `/api/prescriptions/patient/:profileId`
- `/api/prescriptions/generate`
- `/api/certificates`
- `/api/certificates/:id/status`
- `/api/certificates/patient/:profileId`
- `/api/certificate-templates`
- `/api/certificate-templates/:id`
- `/api/exam-requests`
- `/api/exam-requests/:id`
- `/api/exam-requests/:id/status`
- `/api/exam-requests/patient/:profileId`
- `/api/exam-protocols`
- `/api/exam-protocols/:id`
- `/api/documents/prescription/pdf`
- `/api/documents/certificate/pdf`
- `/api/export-health-report`
- `/api/export-exam-report/:examId`
- `/api/tuss/search`

### Clínica, time e profissionais

- `/api/my-clinic`
- `/api/my-clinic/select`
- `/api/clinics`
- `/api/clinics/:id`
- `/api/clinics/:id/invite`
- `/api/clinics/:id/members`
- `/api/clinics/:clinicId/members/:userId`
- `/api/clinic-invitations/:token/accept`
- `/api/clinic-invitations/:token/reject`
- `/api/clinic-invitations/accept-code`
- `/api/my-invitations`
- `/api/clinic/invitations/:id`
- `/api/team/secretaries`
- `/api/team/secretaries/:id`
- `/api/doctors`
- `/api/doctors/:id`
- `/api/doctors/:id/set-default`

### Assinaturas, Stripe e limites

- `/api/subscription-plans`
- `/api/user-subscription`
- `/api/subscription/limits`
- `/api/subscription/can-upload/:profileId`
- `/api/create-payment-intent`
- `/api/create-subscription`
- `/api/create-billing-portal-session`
- `/api/activate-subscription`
- `/api/cancel-subscription`
- `/api/update-stripe-info`
- `/api/webhook`

### Admin, analytics, suporte e IA operacional

- `/api/analytics`
- `/api/admin/users`
- `/api/admin/users/:id`
- `/api/admin/users/:id/change-plan`
- `/api/admin/users/:id/usage`
- `/api/admin/usage-stats`
- `/api/admin/deleted-users`
- `/api/admin/deleted-users/:id`
- `/api/admin/bug-reports`
- `/api/admin/bug-reports/:id`
- `/api/admin/financial-kpi`
- `/api/admin/ai-costs`
- `/api/admin/storage/run-migration`
- `/api/bug-reports`
- `/api/support/articles`
- `/api/support/search`
- `/api/support/chat`
- `/api/vita-assist/chat`
- `/api/vita-assist/conversations`
- `/api/vita-assist/conversations/:id`
- `/api/vita-assist/conversations/:id/context`

### Utilitários e manutenção

- `/api/custom-medications`
- `/api/custom-medications/:id`
- `/api/custom-exams`
- `/api/custom-exams/:id`
- `/api/patients/bulk-import/extract`
- `/api/patients/bulk-import/confirm`
- `/api/my-usage`
- `/api/notifications`
- `/api/notifications/:id/read`
- `/api/notifications/read-all`
- `/api/run-migration`
- `/api/run-migration-internal`
- `/api/run-prescription-migration`

## Arquitetura (Resumo)

### Frontend (`client/`)

- SPA React com rotas por `wouter`
- Fetch/cache com `@tanstack/react-query`
- UI com Tailwind + componentes Radix/shadcn customizados
- Páginas pesadas carregadas com lazy loading (`lazyWithRetry`)
- Providers globais para auth, perfil ativo, upload manager, sidebar e tema
- `CommandPalette` e `OnboardingTour` montados globalmente na área autenticada

### Backend (`server/`)

- Express único servindo API + frontend (porta padrão `3000`)
- `setupAuth(app)` registra login/cadastro/sessão (Passport Local)
- `registerRoutes(app)` concentra rotas principais e monta módulos (`documents`, `security`, `patient`)
- Middleware de segurança, WAF e logging antes das rotas
- Tratamento especial de parser raw para Stripe webhook (`/api/webhook`)
- Multi-tenant com `ensureTenant` aplicado em `/api`

### Persistência (`shared/` + `server/storage.ts`)

- Schema Drizzle compartilhado em `shared/schema.ts`
- Camada `IStorage` centraliza operações de domínio
- Session store com `connect-pg-simple` (e fallback memory store disponível na camada)
- Entidades para clínica/equipe, pacientes, exames, documentos, IA, billing, suporte e segurança

## Principais Tabelas (Schema Drizzle)

Grupos principais (46 tabelas ao todo):

- **Usuário e clínica**: `users`, `profiles`, `clinics`, `clinic_memberships`, `clinic_invitations`, `team_members`
- **Exames e saúde**: `exams`, `exam_results`, `health_metrics`, `notifications`
- **Prontuário**: `diagnoses`, `medications`, `allergies`, `surgeries`, `evolutions`, `habits`, `triage_records`, `doctors`
- **Documentos**: `prescriptions`, `certificates`, `certificate_templates`, `exam_requests`, `exam_protocols`, `tuss_procedures`
- **Billing**: `subscription_plans`, `subscriptions`
- **IA e suporte**: `ai_conversations`, `ai_messages`, `ai_usage`, `ai_cache`, `ai_cost_logs`, `support_articles`, `support_tickets`, `support_messages`
- **Segurança/compliance**: `user_consents`, `audit_logs`, `storage_logs`, `data_deletion_requests`, `data_processing_records`, `security_incidents`, `deleted_users`
- **Customizações**: `custom_medications`, `custom_exams`, `specialty_templates`

## Pipeline de IA (Resumo prático)

O código atual usa IA em múltiplos fluxos, não apenas em exames.

- **Exames**: upload -> extração/normalização -> persistência -> insights/interpretação -> métricas -> visualização/relatório
- **Agenda**: comando textual + anexos -> proposta de agendamento/bloqueio -> confirmação do usuário
- **Consulta**: áudio -> transcrição -> estruturação de anamnese -> enriquecimento
- **Assistente clínico**: chat contextual com paciente/conversa persistida
- **Operação**: rastreamento de uso e custos de IA (`ai_usage`, `ai_cost_logs`, rotas admin)

## PWA e comportamento mobile

- `manifest.json` inicia em `/auth` (`start_url`)
- App em modo `standalone` (PWA) redireciona landing para auth
- `sw.js` faz cache de manifest/icons e respostas same-origin
- Estratégia para API é network-first com fallback offline básico
- Hooks e utilitários de PWA controlam status online/offline
- Hooks e utilitários de PWA controlam prompt de instalação
- Hooks e utilitários de PWA controlam atualização disponível
- Hooks e utilitários de PWA controlam mensagens do service worker
- Hooks e utilitários de PWA controlam background sync (quando suportado)

## Estrutura do Repositório

| Caminho | Conteúdo |
|---|---|
| `client/` | SPA React (web/PWA) |
| `server/` | API Express, auth, segurança, serviços IA, Stripe, email |
| `shared/` | Schema Drizzle e utilitários compartilhados |
| `migrations/` | Migrações do banco |
| `scripts/` | Scripts utilitários/operacionais |
| `docs/` | Documentação complementar |
| `video/` | Projeto Remotion para vídeos promocionais |
| `dist/` | Build gerado (frontend + bundle backend) |

## Como Rodar (Desenvolvimento)

### Pré-requisitos

- Node.js (recomendado LTS)
- npm
- PostgreSQL
- Conta/chave OpenAI para recursos de IA
- Conta Stripe (opcional, para billing)
- SMTP (opcional, para convites e recuperação de senha)

### Instalação

```bash
cd vitaview.ai
npm install
```

### Variáveis de ambiente

Crie e ajuste `.env` (não commitar segredos). As variáveis abaixo foram identificadas no código.

### Mínimas para subir o app base

| Variável | Uso |
|---|---|
| `DATABASE_URL` | Conexão PostgreSQL |
| `SESSION_SECRET` | Sessão/cookies (obrigatória em `setupAuth`) |
| `PORT` | Porta do servidor (default 3000 se ausente) |
| `NODE_ENV` | Ambiente (`development`/`production`) |

### IA (OpenAI)

| Variável | Uso |
|---|---|
| `OPENAI_API_KEY` | Recursos de IA (exames, transcrição, chat, etc.) |
| `OPENAI_GPT5_MODEL` | Override de modelo principal |
| `OPENAI_ANALYSIS_MODEL` | Modelo para análise |
| `OPENAI_FALLBACK_MODEL` | Fallback de modelo |
| `OPENAI_ANALYSIS_MAX_OUTPUT_TOKENS` | Limite de saída em análises |

### Stripe / Billing

| Variável | Uso |
|---|---|
| `STRIPE_SECRET_KEY` | Backend Stripe |
| `STRIPE_WEBHOOK_SECRET` | Validação do webhook |
| `APP_URL` | URLs de retorno (billing portal / subscription) |
| `VITE_STRIPE_PUBLIC_KEY` | Chave pública do Stripe no frontend |

### Email / Convites / Recuperação de senha

| Variável | Uso |
|---|---|
| `SMTP_HOST` | Servidor SMTP |
| `SMTP_PORT` | Porta SMTP |
| `SMTP_USER` | Usuário SMTP |
| `SMTP_PASS` | Senha SMTP |
| `SMTP_SECURE` | TLS/SSL SMTP |
| `EMAIL_FROM` | Remetente padrão |

### Armazenamento (S3 opcional)

| Variável | Uso |
|---|---|
| `AWS_ACCESS_KEY_ID` | Credencial AWS |
| `AWS_SECRET_ACCESS_KEY` | Credencial AWS |
| `AWS_REGION` | Região S3 |
| `AWS_S3_BUCKET` | Bucket S3 |
| `AWS_S3_BUCKET_NAME` | Bucket S3 (nome alternativo usado no código) |

### HTTPS / Segurança / Backup (opcional avançado)

| Variável | Uso |
|---|---|
| `HTTP_PORT` | Porta HTTP (config HTTPS) |
| `HTTPS_PORT` | Porta HTTPS |
| `SSL_CERT_PATH` | Certificado |
| `SSL_KEY_PATH` | Chave |
| `SSL_CHAIN_PATH` | Cadeia/intermediário |
| `SSL_DH_PATH` | Parâmetros DH |
| `DOMAIN` | Domínio em config de segurança |
| `LOG_LEVEL` | Nível de logs |
| `BACKUP_DIR` | Diretório de backup local |
| `OFFSITE_BACKUP_DIR` | Diretório de backup externo |
| `BACKUP_MASTER_KEY` | Chave do backup criptografado |
| `MASTER_KEY` | Chave mestre (módulos de segurança) |
| `MASTER_ENCRYPTION_KEY` | Chave de criptografia |
| `ENCRYPTION_SALT` | Salt de criptografia |
| `SALT_SEED` | Seed/salt adicional |

### Execução em desenvolvimento

```bash
npm run dev
```

O servidor unificado sobe na porta `3000` (default), servindo frontend e API.

## Scripts (raiz `vitaview.ai/`)

| Script | Descrição |
|---|---|
| `npm run dev` | Desenvolvimento (server + vite via integração do projeto) |
| `npm run build` | Build frontend + prerender landing + bundle backend |
| `npm run build:landing` | Apenas prerender da landing |
| `npm run start` | Executa build em produção |
| `npm run check` | TypeScript check |
| `npm run db:push` | Drizzle push schema |
| `npm run test` | Testes (Vitest) |
| `npm run test:ui` | UI do Vitest |
| `npm run test:coverage` | Cobertura |
| `npm run stripe:validate` | Validação de configuração Stripe |

## Módulo de Vídeo (Remotion)

O repositório também inclui `video/`, usado para assets de marketing e vídeos promocionais.

```bash
npm --prefix video install
npm --prefix video run start
npm --prefix video run build
```

## Observações Importantes de Operação

- O app usa **sessão server-side** (não é JWT puro).
- O backend aplica **parsing raw** em `/api/webhook` para compatibilidade com Stripe.
- O frontend força **tema claro** em rotas públicas (landing/auth) no `App.tsx`.
- No modo PWA standalone, a landing pública é evitada e o fluxo inicia em `/auth`.
- Há rotas de manutenção/migração expostas no código; em produção, o controle de acesso e permissões é essencial.

## Como manter este README atualizado (checklist rápido)

- Revisar rotas em `client/src/App.tsx`
- Revisar endpoints em `server/routes.ts`, `server/auth.ts` e `server/routes/*.ts`
- Revisar tabelas em `shared/schema.ts`
- Revisar scripts em `package.json` e `video/package.json`
- Revisar variáveis de ambiente por `process.env.*` e `import.meta.env.*`
- Atualizar contagens do inventário (rotas/endpoints/tabelas)

## Arquivos de referência (para manutenção)

- `client/src/App.tsx`
- `server/index.ts`
- `server/routes.ts`
- `server/auth.ts`
- `server/routes/patient.routes.ts`
- `server/routes/documents.ts`
- `server/routes/security.routes.ts`
- `shared/schema.ts`
- `package.json`
- `video/package.json`
