#!/bin/bash

# Script to add dosage_unit column to medications table
# This script will execute the migration using the DATABASE_URL from .env

echo "🔄 Executando migração: adicionar coluna dosage_unit..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Erro: DATABASE_URL não está definida"
    echo "Por favor, configure a variável de ambiente DATABASE_URL"
    exit 1
fi

# Execute the migration
psql "$DATABASE_URL" << EOF
ALTER TABLE medications 
ADD COLUMN IF NOT EXISTS dosage_unit TEXT DEFAULT 'mg';

COMMENT ON COLUMN medications.dosage_unit IS 'Unit of measurement for dosage (mg, g, ml, mcg, UI, %, gotas, comprimido(s), cápsula(s))';
EOF

if [ $? -eq 0 ]; then
    echo "✅ Migração executada com sucesso!"
else
    echo "❌ Erro ao executar migração"
    exit 1
fi
