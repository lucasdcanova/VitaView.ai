# Configuração do Amazon S3 para VitaView.ai

## Visão Geral

A integração com Amazon S3 permite armazenar arquivos sensíveis dos usuários de forma segura e escalável. Os tipos de arquivos considerados sensíveis incluem:

- Prontuários médicos (medical-records)
- Prescrições (prescriptions)
- Resultados de laboratório (lab-results)
- Fotos de pacientes (patient-photos)
- Documentos de seguro (insurance-documents)
- Documentos pessoais (personal-documents)

## Configuração do Bucket S3

### 1. Criar o Bucket

```bash
aws s3 mb s3://vitaview-sensitive-data --region us-east-1
```

### 2. Aplicar Política de Segurança

Aplique a política de segurança do arquivo `docs/s3-bucket-policy.json`:

```bash
aws s3api put-bucket-policy --bucket vitaview-sensitive-data --policy file://docs/s3-bucket-policy.json
```

### 3. Habilitar Versionamento

```bash
aws s3api put-bucket-versioning --bucket vitaview-sensitive-data --versioning-configuration Status=Enabled
```

### 4. Configurar Criptografia

```bash
aws s3api put-bucket-encryption --bucket vitaview-sensitive-data --server-side-encryption-configuration '{
  "Rules": [{
    "ApplyServerSideEncryptionByDefault": {
      "SSEAlgorithm": "AES256"
    }
  }]
}'
```

### 5. Aplicar Política de Ciclo de Vida

```bash
aws s3api put-bucket-lifecycle-configuration --bucket vitaview-sensitive-data --lifecycle-configuration file://docs/s3-lifecycle-policy.json
```

## Variáveis de Ambiente

Adicione as seguintes variáveis ao seu arquivo `.env`:

```env
AWS_ACCESS_KEY_ID=sua-access-key-id
AWS_SECRET_ACCESS_KEY=sua-secret-access-key
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=vitaview-sensitive-data
```

## Permissões IAM

Crie um usuário IAM com as seguintes permissões mínimas:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:GetObjectVersion"
      ],
      "Resource": "arn:aws:s3:::vitaview-sensitive-data/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket",
        "s3:GetBucketLocation"
      ],
      "Resource": "arn:aws:s3:::vitaview-sensitive-data"
    }
  ]
}
```

## Uso da API

### Upload de Arquivo Sensível

```bash
POST /api/upload/sensitive
Content-Type: multipart/form-data

file: [arquivo]
fileType: "medical-records" | "prescriptions" | "lab-results" | etc.
```

### Obter URL Assinada

```bash
GET /api/files/sensitive/:key?expires=3600
```

### Deletar Arquivo

```bash
DELETE /api/files/sensitive/:key
```

## Segurança

- Todos os arquivos são criptografados com AES256 no servidor
- URLs assinadas expiram após 1 hora por padrão
- Apenas conexões HTTPS são permitidas
- Versionamento habilitado para recuperação de arquivos
- Logs de acesso habilitados para auditoria

## Manutenção

### Monitorar Uso

```bash
aws s3 ls s3://vitaview-sensitive-data --recursive --human-readable --summarize
```

### Verificar Custos

Use o AWS Cost Explorer para monitorar custos de armazenamento e transferência.

### Backup

Configure replicação cross-region para backup adicional:

```bash
aws s3api put-bucket-replication --bucket vitaview-sensitive-data --replication-configuration file://replication-config.json
```