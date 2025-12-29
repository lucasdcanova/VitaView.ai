# Guia Rápido: Executar Migration de Triagem

## Opção 1: Usando npm script (Recomendado)

Se você tiver um script de migration configurado no package.json:

```bash
npm run db:migrate
```

## Opção 2: Usando psql diretamente

```bash
# Se você tiver PostgreSQL instalado localmente
psql -U seu_usuario -d nome_do_banco -f server/db/migrations/create_triage_table.sql
```

## Opção 3: Usando Drizzle Kit

Se você estiver usando Drizzle Kit para migrations:

```bash
npx drizzle-kit push:pg
```

## Opção 4: Copiar e colar SQL

1. Abra seu cliente de banco de dados (pgAdmin, DBeaver, etc.)
2. Conecte ao banco de dados
3. Abra o arquivo `server/db/migrations/create_triage_table.sql`
4. Copie todo o conteúdo
5. Execute no seu cliente SQL

## Verificar se a tabela foi criada

```sql
-- Execute esta query para verificar
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'triage_records';

-- Ou veja a estrutura completa
\d triage_records
```

## Após executar a migration

O sistema de triagem estará pronto para uso! Acesse `/agenda` e teste clicando em qualquer consulta.
