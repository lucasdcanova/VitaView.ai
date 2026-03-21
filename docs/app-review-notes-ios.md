# App Review Notes

- Fixed login reliability on iPad/iOS. The login form now synchronizes browser-restored and iOS autofilled email/password values with the actual submit state before validation and submission, which prevents the `Entrar` action from appearing unresponsive.
- Removed non-IAP purchase paths from the native iOS app shell. Subscription purchase, upgrade, and billing-management actions are disabled in the iOS shell UI, and the related billing endpoints now reject native iOS app-shell requests.
- Web behavior is preserved outside the native iOS shell. Regular browser access to `https://vitaview.ai` still keeps the existing Stripe-based subscription flow.
