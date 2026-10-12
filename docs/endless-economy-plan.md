# Endless solo / gems implementation notes

Status: draft. Do **not** enable real-money purchases or consume virtual currency until server validation and recovery are complete.

## Rules confirmed with product owner

- Endless solo uses 3 hearts, sequential questions, and measures solving efficiency.
- Each deliberate opened character costs one move. A zero-cell cascade costs only one move and grants **+3 points per extra automatically opened safe cell**.
- Mines reduce hearts; 0 hearts enters revival choice. A revival restores **2 hearts** and highlights one safe, still-closed tile green; it does not open that tile.
- Revivals 1–3: owners of the existing non-consumable remove-ads item receive free revival; others earn one from completed rewarded video. Web preview temporarily offers those 3 revivals free; it must not falsely claim that a reward video played.
- Revivals 4+: **3 gems each** for all users, including remove-ads purchasers.
- Safe-tile hint: **1 gem**, no heart recovery, only highlight.
- Gem pack: **10 gems for ¥200**, iOS consumable IAP; exact displayed price comes from StoreKit.
- No public leaderboard initially; result screen offers X sharing, including score, deliberate opening count, mine hits and revival count.
- Daily challenge may grant 1 gem on first valid completion for that local date after account verification. No unchecked client-side grants.

## Restore & authentication boundaries

Game Center is useful for GameKit achievements and identity; **it does not restore consumable IAP currency**. A signed Game Center player identity can optionally be verified by a backend and linked to a stable app account. The raw player identifier is not proof of ownership. Provide a way to recover/link an account; check Apple's policies and allow an alternative account recovery process.

**Supabase server must remain authoritative** for the gem balance, even after reinstall. Suggested tables:
- profiles (internal UUID, Game Center verified binding where available)
- wallet_ledger (user_id, delta, source, ref_key with uniqueness)
- purchase_transactions (StoreKit transaction ID unique, verified app bundle, product, environment, user)
- daily_reward_claims (user_id, challenge_id unique)
- gem_spends (idempotency key unique, reason, run/attempt ID)

Server-only trusted methods verify App Store transaction JWS, then append exactly one +10 credit ledger entry per verified transaction ID in the same database transaction. Client must not directly mutate wallet rows. Spend -1/-3 gems with an atomic balance check to prevent double spending and race conditions. Defer finishing the StoreKit consumable transaction until backend acknowledgment; retry verification safely. Refund/revoke handling requires reconciliation policy; don't silently lose already-earned app progress.

## App Store Connect steps before production

- Register a new consumable product, e.g. `com.naki0227.gojuonminesweeper.gems10`, price ¥200 if supported by the selected price tier.
- Configure a dedicated rewarded AdMob unit for iOS and test with Google's test IDs on test builds; do not grant gems/revival without EARNED_REWARD.
- Ensure in-app purchase reviewer can access the pack. Update IAP product description, privacy policy and support content.
- Apple offer codes for the consumable pack can be distributed individually as one-time campaign prizes; verify eligibility, offer limits, and server-side grant deduplication.
- On real native devices, validate purchases, redemptions, app relaunch and reinstall before enabling the purchase button.
- Keep this feature behind an unmerged PR until StoreKit, account linking, and backend reconciliation are proven.

## Work staged in this PR

Initial iteration intentionally contains only the playable core, reward-video integration, and safe tile display. The 1-gem hint and 3-gem paid revival are *not* wired into a wallet or a storefront yet; no fake spending or granting. Game Center integration is a separate implementation step.
