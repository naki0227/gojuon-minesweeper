# iOS Endless Gems — staged integration (not production ready)

This branch is **stacked on PR #23**, not on `main`. Keep both PRs as drafts until TestFlight and App Store setup have been verified.

## Account & recovery

- Endless and the gem storefront are **iOS-only**. The Web route redirects to the home page, and the Web home has no Endless button.
- Sign in with Apple (native Apple Authentication → Supabase `signInWithIdToken`) is required before gems can be purchased or spent.
- Supabase Auth user UUID is passed to StoreKit as `appAccountToken` and verified against Apple's server transaction.
- After reinstall, the same Apple sign-in retrieves the server wallet. **Game Center is not a wallet backup.** Anonymous online-play sessions are separate from the Apple login. Switching to an Apple session will replace an anonymous session.
- Do not expose service role or Apple API private key in the app bundle.
- This version does not migrate guest purchases because they are forbidden: sign in before checkout.

## App Store Connect / Apple Developer — required manually

1. Enable **Sign in with Apple** for `com.naki0227.gojuonminesweeper`; ensure EAS signing profile supports the capability. A new native build is required.
2. Under Supabase Authentication → Providers, enable Apple for **native** login and allow the bundle ID above. Verify the client ID and provider settings on an actual iPhone.
3. In App Store Connect, register consumable `com.naki0227.gojuonminesweeper.gems10` with Japanese pricing **¥200** (the UI uses StoreKit's localized price, never a hardcoded price).
4. Create an App Store Connect **In-App Purchase API key** (issuer ID, key ID, private .p8). Store these values **only as Supabase Edge Function secrets**:
   - `APPLE_IAP_ISSUER_ID`
   - `APPLE_IAP_KEY_ID`
   - `APPLE_IAP_PRIVATE_KEY` (the original PEM or its newline-escaped form)
5. Deploy migration `20261012203000_gem_wallet.sql` and the Edge Function `gem-wallet` through the manual `deploy-supabase` workflow *after this branch is approved and merged*. Deploy DB before the app.
6. Configure product metadata, the IAP review requirements, and TestFlight sandbox tester. Validate product visibility, actual price tier, StoreKit purchase callback, server verification, product delivery, relaunch, reinstall and duplicate transaction delivery.

## Server behavior

- `POST /functions/v1/gem-wallet`: `balance`, `verify`, `spend`. Requires a valid bearer JWT belonging to a Sign in with Apple user.
- The Edge Function obtains transaction details directly from the Apple App Store Server API, authenticating with a short-lived signed JWT. It validates bundle ID, product ID, purchase type, transaction ID, non-revoked status, Apple environment, and **appAccountToken == authenticated Supabase user UUID**.
- `credit_verified_gem_purchase` adds exactly 10 once per unique Apple transaction ID in one Postgres transaction.
- `spend_gems` takes a per-user wallet row lock, validates price 1 (hint) or 3 (revive), forbids negative balances, and deduplicates retries using an action ID.
- Only the Edge Function service role can execute the write RPCs. RLS lets clients read their own wallet and ledger but no direct modification.
- The app calls `finishTransaction(isConsumable: true)` **only after** backend confirmation; unfinished transactions can be retried on StoreKit delivery.
- No StoreKit `restorePurchases` for consumables: the server wallet is the source of truth.

## Release blockers / limitations

- This PR's CI and SQL tests don't exercise real Apple Sandbox or real iPhone credentials.
- App Store Server Notifications V2 / reconciliation for **refunds and revocations after fulfillment** must be added before production; a past successful payment is not proof that it was never later refunded.
- The game state is still client-local. A debit that succeeds while the response is lost is idempotent for the same action ID, but crash recovery of a partially fulfilled **hint/revive** should be tested and hardened before production.
- Verify Expo IAP's unfinished consumable replay on a real iPhone (network interruption, force quit and app update). Do not claim that finished consumables are automatically restored by StoreKit.
- Need actual iOS build and Apple capability check; the code is not remotely enabling purchases until the product and signing credentials are configured.
- If the native Apple login does not return a credential, the wallet is intentionally unavailable; do not create a fallback guest wallet.

## Test matrix

- [ ] Same transaction delivered twice → +10 only once
- [ ] Transaction reused under another user → refused
- [ ] Nonmatching appAccountToken → refused
- [ ] Insufficient funds and repeated spend action → safe
- [ ] 1 gem hint / 3 gem revival immediately reflects new balance
- [ ] New install + same Apple sign in → same balance
- [ ] Sign in with a different Apple Account → different wallet
- [ ] Interrupted purchase network + retry → never lost or duplicated
- [ ] Sandbox purchased consumable + restore via account, not StoreKit
- [ ] Refund / revoke reconciliation implemented
- [ ] No Endless or gem actions on mobile Web / Android

The existing reward-video and remove-ads IAP behavior is intentionally left unchanged.
