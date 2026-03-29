ALTER TABLE subscription_plans
ADD COLUMN IF NOT EXISTS apple_product_id VARCHAR(150);

ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS app_store_transaction_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS app_store_original_transaction_id VARCHAR(100);
