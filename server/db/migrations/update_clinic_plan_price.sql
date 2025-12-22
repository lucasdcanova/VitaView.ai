-- Migration to update Clínica Multiprofissional plan price from R$299 to R$499
-- and update features to match new implementation

UPDATE subscription_plans 
SET 
  price = 49900,
  features = '["Tudo do plano Profissional", "Até 5 profissionais inclusos", "Conta administradora", "Gerenciamento de equipe", "Relatórios consolidados"]'
WHERE name = 'Clínica Multiprofissional';

-- If the plan doesn't exist, insert it
INSERT INTO subscription_plans (name, description, max_profiles, max_uploads_per_profile, price, interval, features, is_active)
SELECT 
  'Clínica Multiprofissional',
  'Gestão completa para clínicas e consultórios',
  -1,
  -1,
  49900,
  'month',
  '["Tudo do plano Profissional", "Até 5 profissionais inclusos", "Conta administradora", "Gerenciamento de equipe", "Relatórios consolidados"]',
  true
WHERE NOT EXISTS (SELECT 1 FROM subscription_plans WHERE name = 'Clínica Multiprofissional');
