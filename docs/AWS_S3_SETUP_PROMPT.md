# Prompt para Configuração AWS S3 - VitaView.ai

Por favor, configure o Amazon S3 para o projeto VitaView.ai seguindo exatamente estas instruções:

## 1. Criar usuário IAM

Crie um novo usuário IAM com as seguintes configurações:
- Nome do usuário: `vitaview-s3-user`
- Tipo de acesso: Programmatic access (Access Key)

## 2. Criar política IAM customizada

Crie uma nova política com o nome `VitaViewS3Policy` usando este JSON:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:CreateBucket",
        "s3:ListBucket",
        "s3:GetBucketLocation",
        "s3:GetBucketVersioning",
        "s3:PutBucketVersioning",
        "s3:GetBucketEncryption",
        "s3:PutBucketEncryption",
        "s3:PutBucketPolicy",
        "s3:GetBucketPolicy",
        "s3:PutLifecycleConfiguration",
        "s3:GetLifecycleConfiguration"
      ],
      "Resource": "arn:aws:s3:::vitaview-sensitive-data"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:GetObjectVersion"
      ],
      "Resource": "arn:aws:s3:::vitaview-sensitive-data/*"
    }
  ]
}
```

Anexe esta política ao usuário `vitaview-s3-user`.

## 3. Criar o bucket S3

Crie um bucket S3 com estas configurações:
- Nome do bucket: `vitaview-sensitive-data`
- Região: `us-east-1` (US East - N. Virginia)
- Configurações obrigatórias:
  - ✅ Block ALL public access
  - ✅ Enable versioning
  - ✅ Enable default encryption com SSE-S3 (AES256)

## 4. Aplicar política de bucket

Após criar o bucket, aplique esta política de bucket (Bucket Policy):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "DenyInsecureConnections",
      "Effect": "Deny",
      "Principal": "*",
      "Action": "s3:*",
      "Resource": [
        "arn:aws:s3:::vitaview-sensitive-data/*",
        "arn:aws:s3:::vitaview-sensitive-data"
      ],
      "Condition": {
        "Bool": {
          "aws:SecureTransport": "false"
        }
      }
    },
    {
      "Sid": "DenyUnencryptedObjectUploads",
      "Effect": "Deny",
      "Principal": "*",
      "Action": "s3:PutObject",
      "Resource": "arn:aws:s3:::vitaview-sensitive-data/*",
      "Condition": {
        "StringNotEquals": {
          "s3:x-amz-server-side-encryption": "AES256"
        }
      }
    }
  ]
}
```

## 5. Configurar ciclo de vida

Configure as seguintes regras de lifecycle:
- Transição para STANDARD_IA após 90 dias
- Transição para GLACIER após 180 dias
- Expiração de objetos após 365 dias
- Abortar uploads incompletos após 7 dias

## 6. Informações necessárias

Após completar a configuração, forneça as seguintes informações:

```
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=vitaview-sensitive-data

Status de cada etapa:
- [ ] Usuário IAM criado
- [ ] Política IAM criada e anexada
- [ ] Bucket S3 criado
- [ ] Versionamento habilitado
- [ ] Criptografia padrão habilitada
- [ ] Política de bucket aplicada
- [ ] Regras de lifecycle configuradas
- [ ] Block public access habilitado

ARN do bucket criado: 
URL do bucket: 
```

## IMPORTANTE:
- Garanta que TODAS as configurações de segurança estejam ativas
- O bucket DEVE bloquear TODO acesso público
- A criptografia DEVE estar habilitada
- Guarde as credenciais com segurança - você não poderá ver a Secret Key novamente

## Comandos AWS CLI alternativos (se preferir):

```bash
# Criar bucket
aws s3api create-bucket --bucket vitaview-sensitive-data --region us-east-1

# Habilitar versionamento
aws s3api put-bucket-versioning --bucket vitaview-sensitive-data --versioning-configuration Status=Enabled

# Habilitar criptografia
aws s3api put-bucket-encryption --bucket vitaview-sensitive-data --server-side-encryption-configuration '{"Rules": [{"ApplyServerSideEncryptionByDefault": {"SSEAlgorithm": "AES256"}}]}'

# Bloquear acesso público
aws s3api put-public-access-block --bucket vitaview-sensitive-data --public-access-block-configuration "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"
```

Por favor, execute todas as etapas e retorne com as credenciais e confirmação de que tudo foi configurado corretamente.