# iOS Endless Gems — staged integration (not production ready)

PRs #23 and #24 have been merged into `main`. The wallet database migration and `gem-wallet` Edge Function are deployed. **This is not approval to enable real purchases in a public release**: App Store Connect setup, Apple-provider configuration, TestFlight validation and the release blockers below remain.

## Account & recovery

- Endless and the gem storefront are **iOS-only**. The Web route redirects to the home page, and the Web home has no Endless button.
- Sign in with Apple (native Apple Authentication → Supabase `signInWithIdToken`) is required before gems can be purchased or spent.
- Supabase Auth user UUID is passed to StoreKit as `appAccountToken` and verified against Apple's server transaction.
- First successful Apple sign-in wallet fetch credits **3 welcome gems, once per Supabase Apple account**. The `balance` action calls a service-role-only, idempotent database RPC. Reauthentication, retries, reinstall or spending do not reissue the bonus.
- This is **not** automatic Apple linking of the anonymous online account: `signInWithIdToken` switches to the Apple session. Do not promise anonymous online room history transfers.
- After reinstall, the same Apple sign-in retrieves the server wallet. **Game Center is not a wallet backup.** Anonymous online-play sessions are separate from the Apple login. Switching to an Apple session will replace an anonymous session.
- Do not expose service role or Apple API private key in the app bundle.
- This version does not migrate guest purchases because they are forbidden: sign in before checkout.

## App Store Connect / Apple Developer — required manually

1. Enable **Sign in with Apple** for `com.naki0227.gojuonminesweeper`; ensure EAS signing profile supports the capability. A new native build is required.
2. Under Supabase Authentication → Providers, enable Apple for **native** login and allow the bundle ID above. Verify the client ID and provider settings on an actual iPhone.
3. In App Store Connect, register three consumables (the UI shows StoreKit's localized price; the discount label is fixed from the Japanese prices in `src/wallet/packs.ts`):
   - `com.naki0227.gojuonminesweeper.gems10` — 10 gems, ¥200
   - `com.naki0227.gojuonminesweeper.gems30` — 30 gems, ¥500 (17% off)
   - `com.naki0227.gojuonminesweeper.gems70` — 70 gems, ¥1,000 (29% off)
   The gem count per product is defined in SQL (`gem_pack_size`); a new pack needs a migration, the Edge Function list and `packs.ts`.
4. Create an App Store Connect **In-App Purchase API key** (issuer ID, key ID, private .p8). Store these values **only as Supabase Edge Function secrets**:
   - `APPLE_IAP_ISSUER_ID`
   - `APPLE_IAP_KEY_ID`
   - `APPLE_IAP_PRIVATE_KEY` (the original PEM or its newline-escaped form)
5. **Done:** migration `20261012115142_gem_wallet.sql` and Edge Function `gem-wallet` have been deployed via the manual `Deploy Supabase` workflow. Subsequent schema changes should use that workflow after merging to `main`.
6. Configure product metadata, the IAP review requirements, and TestFlight sandbox tester. Validate product visibility, actual price tier, StoreKit purchase callback, server verification, product delivery, relaunch, reinstall and duplicate transaction delivery.

## Authentication policy

- Keep **anonymous sign-in enabled** for online play and **Sign in with Apple** for iOS gems. Do not disable global signups because both features need to create users.
- The app does not use email/password sign-in, email OTP or magic links. Locally `[auth.email].enable_signup = false` blocks new email registrations, but **does not disable existing email sign-in or change hosted project settings**.
- Before release, open **Supabase Dashboard → Authentication → Sign In / Providers → Email** for project `afcrdwxwqdenvejogdre` and **disable the Email provider**. Keep Apple and anonymous sign-ins enabled. Verify each supported sign-in still works after the change. No current connected integration can mutate the hosted Auth provider settings.
- The password-leak-protection advisor is only applicable if email/password sign-in is used; closing the Email provider is the intended remediation for this app, rather than introducing password auth.

## Server behavior

- `POST /functions/v1/gem-wallet`: `balance`, `verify`, `spend`. Requires a valid bearer JWT belonging to a Sign in with Apple user.
- The Edge Function obtains transaction details directly from the Apple App Store Server API, authenticating with a short-lived signed JWT. It validates bundle ID, product ID, purchase type, transaction ID, non-revoked status, Apple environment, and **appAccountToken == authenticated Supabase user UUID**.
- `gem_credit_apple_purchase` adds the pack's gems (10/30/70) once per unique Apple transaction ID in one Postgres transaction.
- `gem_spend` takes a per-user wallet row lock, validates price 1 (hint) or 3 (revive), forbids negative balances, and deduplicates retries using an action ID.
- Only the Edge Function service role can execute the write RPCs. RLS lets clients read their own wallet and ledger but no direct modification.
- The app calls `finishTransaction(isConsumable: true)` **only after** backend confirmation; unfinished transactions can be retried on StoreKit delivery.
- No StoreKit `restorePurchases` for consumables: the server wallet is the source of truth.

## Release blockers / limitations

- This PR's CI and SQL tests don't exercise real Apple Sandbox or real iPhone credentials.
- **Refunds (implemented, needs setup):** set App Store Connect → App → App Information → App Store Server Notifications (Version 2, Production and Sandbox) to `https://<project-ref>.supabase.co/functions/v1/gem-wallet`. The function re-reads the transaction from Apple and calls `gem_revoke_apple_purchase`: up to 10 gems are taken back, never below zero; already-spent gems are written off. Test with App Store Server API "Request a Test Notification" and a Sandbox refund.
- **Account deletion (implemented):** the wallet panel's "アカウントを削除" deletes the Supabase user (wallet and ledger cascade; `gem_apple_purchases` rows stay with `user_id = null`). It asks Apple for a fresh authorization code and revokes the Sign in with Apple token when `APPLE_SIGNIN_TEAM_ID`, `APPLE_SIGNIN_KEY_ID`, `APPLE_SIGNIN_PRIVATE_KEY` (a key with "Sign in with Apple" enabled) are set as Edge Function secrets; without them deletion still works but the token is not revoked, which Apple's guidelines require.
- The game state is still client-local. A debit that succeeds while the response is lost is idempotent for the same action ID, but crash recovery of a partially fulfilled **hint/revive** should be tested and hardened before production.
- Verify Expo IAP's unfinished consumable replay on a real iPhone (network interruption, force quit and app update). Do not claim that finished consumables are automatically restored by StoreKit.
- Need actual iOS build and Apple capability check; the code is not remotely enabling purchases until the product and signing credentials are configured.
- If the native Apple login does not return a credential, the wallet is intentionally unavailable; do not create a fallback guest wallet.

## Support: gems spent but hint/revive not delivered

Policy: no automatic recovery; support restores the gems on inquiry. The wallet panel shows an お問い合わせID (first 8 hex characters of the user UUID, upper-cased).

```sql
-- 1. Find the account
select id, created_at from auth.users
where upper(replace(id::text, '-', '')) like 'ABCD1234%';
-- 2. Recent history (spends are safe_hint -1 / revive -3)
select created_at, delta, reason, source_key from public.gem_ledger
where user_id = '<uuid>' order by id desc limit 30;
-- 3. Give back, once per ticket (1..30 gems)
select public.gem_support_grant('<uuid>', 3, '20261013-01');
```

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
- [x] Refund / revoke reconciliation implemented (SQL-tested; Apple notification not yet tested)
- [ ] Sandbox refund notification takes back gems, floor 0
- [ ] Account deletion on device (with and without Sign in with Apple key)
- [ ] No Endless or gem actions on mobile Web / Android

The existing reward-video and remove-ads IAP behavior is intentionally left unchanged.
