# App Store IAP Setup

## Produtos de assinatura

Crie estes produtos de assinatura auto-renovável no App Store Connect com exatamente estes Product IDs:

- `br.com.lucascanova.vitaview.vita_pro.monthly`
- `br.com.lucascanova.vitaview.vita_pro.semiannual`
- `br.com.lucascanova.vitaview.vita_pro.annual`
- `br.com.lucascanova.vitaview.vita_team.monthly`
- `br.com.lucascanova.vitaview.vita_team.semiannual`
- `br.com.lucascanova.vitaview.vita_team.annual`
- `br.com.lucascanova.vitaview.vita_business.monthly`
- `br.com.lucascanova.vitaview.vita_business.semiannual`
- `br.com.lucascanova.vitaview.vita_business.annual`
- `br.com.lucascanova.vitaview.hospitais.monthly`

O plano gratuito não precisa de produto.

## Preços

Defina os preços de iOS já com o acréscimo de 30% em relação ao web.

## Backend

Configure estas variáveis no backend para permitir validação canônica com a Apple:

- `APPLE_APP_BUNDLE_ID=br.com.lucascanova.vitaview`
- `APPLE_APP_STORE_ISSUER_ID=<issuer id do App Store Connect API key>`
- `APPLE_APP_STORE_KEY_ID=<key id do App Store Connect API key>`
- `APPLE_APP_STORE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"`
- ou `APPLE_APP_STORE_PRIVATE_KEY_PATH=/caminho/para/AuthKey_XXXXXX.p8`

## Notificações server-to-server

Em App Store Connect, aponte App Store Server Notifications para:

- `https://vitaview.ai/api/app-store/notifications`

## Banco

Aplique a migration:

- `server/db/migrations/add_app_store_subscription_fields.sql`

## Checklist de validação

### Pré-requisitos

- Confirmar que a build iOS enviada para teste contém a implementação StoreKit 2 atual.
- Confirmar que os produtos de assinatura estão com status `Ready to Submit`, `Waiting for Review`, `Approved` ou disponível para sandbox no App Store Connect.
- Confirmar que o usuário de teste está em `Settings > App Store > Sandbox Account` no iPhone de teste.
- Confirmar que o backend de produção está com estas variáveis válidas:
  - `APPLE_APP_BUNDLE_ID`
  - `APPLE_APP_STORE_ISSUER_ID`
  - `APPLE_APP_STORE_KEY_ID`
  - `APPLE_APP_STORE_PRIVATE_KEY`
- Confirmar que a URL de notificações da Apple aponta para `https://vitaview.ai/api/app-store/notifications`.

### Teste de compra em Sandbox

1. Instalar a build via Xcode ou TestFlight em um iPhone.
2. Abrir o app com um usuário sem assinatura ativa.
3. Entrar na tela de assinatura.
4. Verificar se os planos exibem preço localizado do iOS, não valores do web.
5. Escolher um produto, iniciar a compra e concluir com a conta Sandbox Tester.
6. Confirmar no app:
   - compra concluída sem erro
   - acesso premium liberado imediatamente
   - plano correto marcado como ativo
7. Confirmar no backend:
   - criação ou atualização da assinatura do usuário
   - `appStoreTransactionId` preenchido
   - `appStoreOriginalTransactionId` preenchido
   - `provider` ou origem da assinatura compatível com App Store

### Teste de restore

1. Com o mesmo usuário Apple de sandbox, reinstalar o app ou usar outro device de teste.
2. Abrir a tela de assinatura.
3. Tocar em `Restaurar compras`.
4. Confirmar que o plano volta a ficar ativo sem nova cobrança.
5. Confirmar no backend que a assinatura continua vinculada ao mesmo `originalTransactionId`.

### Teste de foreground e sincronização

1. Comprar um plano e fechar o app.
2. Reabrir o app.
3. Confirmar que a verificação de entitlement ao iniciar mantém o acesso ativo.
4. Colocar o app em background e trazer ao foreground.
5. Confirmar que a sincronização roda novamente e não duplica assinatura.

### Teste de upgrade e downgrade

1. Comprar um plano menor, por exemplo `vita_pro.monthly`.
2. Depois trocar para um plano superior, por exemplo `vita_team.monthly`.
3. Confirmar que o app passa a respeitar o plano de maior nível.
4. Confirmar no backend que o plano efetivo foi atualizado.
5. Repetir o teste simulando downgrade e verificar se o app respeita o estado retornado pela Apple após a mudança de renovação.

### Teste de renovação e expiração em Sandbox

1. Comprar uma assinatura mensal em sandbox.
2. Aguardar os ciclos acelerados de renovação do ambiente sandbox.
3. Confirmar no backend o processamento de eventos equivalentes a:
   - `SUBSCRIBED`
   - `DID_RENEW`
4. Desativar a renovação da assinatura no gerenciamento de assinaturas sandbox ou aguardar a expiração.
5. Confirmar no backend o processamento de eventos equivalentes a:
   - `EXPIRED`
   - `DID_FAIL_TO_RENEW`, se ocorrer no fluxo de teste
6. Confirmar que o acesso premium é removido quando a assinatura não estiver mais ativa.

### Teste de refund

1. Usar o fluxo de sandbox da Apple para simular reembolso, se disponível para a conta de teste.
2. Confirmar recebimento e processamento do evento `REFUND`.
3. Confirmar que o acesso premium é revogado no backend e no app.

### Validação de notificações da Apple

- Verificar logs do backend após compra, renovação, expiração e restore.
- Confirmar que o endpoint `/api/app-store/notifications` recebe chamadas da Apple.
- Confirmar que notificações inválidas não ativam assinatura.
- Confirmar que a consulta canônica à App Store Server API resolve o status real da assinatura.

### Critérios para reenviar à Apple

- Usuário consegue assinar diretamente no app iOS.
- Usuário consegue restaurar compras.
- Usuário com assinatura ativa tem acesso premium.
- Usuário sem assinatura ativa não acessa conteúdo premium.
- Backend permanece como fonte de verdade para status da assinatura.
- Fluxos básicos testados em sandbox sem erro visível.
