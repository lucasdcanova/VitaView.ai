-- Adicionar as colunas stripe_customer_id e stripe_subscription_id à tabela users
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- Criar as tabelas de planos de assinatura e assinaturas se ainda não existirem
CREATE TABLE IF NOT EXISTS subscription_plans (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    max_profiles INTEGER NOT NULL,
    max_uploads_per_profile INTEGER NOT NULL,
    price INTEGER NOT NULL,
    interval VARCHAR(20) NOT NULL DEFAULT 'month',
    stripe_price_id VARCHAR(100),
    features JSON,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subscriptions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users (id),
    plan_id INTEGER REFERENCES subscription_plans (id),
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    current_period_start TIMESTAMP NOT NULL,
    current_period_end TIMESTAMP NOT NULL,
    stripe_customer_id VARCHAR(100),
    stripe_subscription_id VARCHAR(100),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    canceled_at TIMESTAMP,
    profiles_created INTEGER NOT NULL DEFAULT 0,
    uploads_count JSON DEFAULT '{}'
);