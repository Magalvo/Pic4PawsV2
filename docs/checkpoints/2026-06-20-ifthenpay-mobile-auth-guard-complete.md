# Checkpoint: Ifthenpay Webhook + Mobile Auth Guard Complete (2026-06-20)

**Main branch HEAD**: PR #205 (`MOBILE-ABRIGOS-PUBLIC-001`)
**Tests**: 1968 passing (244 files)
**Validation**: typecheck ✅ · lint ✅ · test ✅ · build ✅
**Last audit**: `2026-06-20-sdd-audit-prs-199-203.md` — score 9/10, no open P1 or P2 findings

## What Is Complete

All work items from the `docs/work-tracks/remake-foundation.md` track are done.
Three additional post-foundation tracks are also complete:

**Track A — Real UI screens, auth, and navigation (PRs #157–#203)**
- All screen work items for web and mobile wired into Expo Router and Next.js App Router
- `MOBILE-AUTH-P1-001`: shared `mobileSupabaseClient` singleton fixes auth-state propagation
- `WEB-MIDDLEWARE-P1-001`: middleware uses `getUser()` (server-validated JWT)
- `MOBILE-NAV-001`: Expo Router navigation shell with `(auth)` / `(app)/(tabs)` groups
- `WEB-NAV-001`: Next.js middleware auth guard with `isPublicRoute` and open-redirect protection

**Track B — Ifthenpay payment webhook verifier (PRs #201 + #202)**
- `IFTHENPAY-WEBHOOK-001`: official GET callback protocol, anti-phishing key, Zod schema
- MB WAY and Multibanco supported; entity+reference co-validation
- Anti-phishing key stripped from persisted payload
- End-to-end Worker composition test (`tests/workers/worker-ifthenpay-composition.test.ts`)
- Method enforcement: Ifthenpay=GET, Eupago/Stripe=POST; 405 on wrong method

**Track C — Mobile auth guard routing (PRs #203 + #205)**
- `MOBILE-AUTH-GUARD-001`: `computeAuthRedirect` extracted from `_layout.tsx` to `nav.ts`; 23 tests
- `MOBILE-ABRIGOS-PUBLIC-001`: `/abrigos` and `/abrigos/[shelterId]` added as public routes on mobile, matching web middleware parity; 4 additional tests

## Key Architecture Reminders

- Mobile Supabase: always use `mobileSupabaseClient` from `apps/mobile/src/supabase.ts` (singleton) — never `createClient()` inline
- Web middleware: `getUser()` not `getSession()` — server-validates JWT
- Payment state: always driven by verified server-side webhook — `paymentWebhookVerifier` intentionally unset by factory
- Ifthenpay: `PAYMENT_WEBHOOKS_ENABLED=true` + `PAYMENT_PRIMARY_PROVIDER=ifthenpay` + `IFTHENPAY_WEBHOOK_SECRET` required to enable
- `packages/config/dist/` is gitignored — run `npm run build -w packages/config` after changing `env.ts`
- Run `graphify update .` after any code change

## Known Deferred Items

- Ifthenpay failed/cancelled callback states — no work item yet; requires official provider evidence for failure notification protocol
- Full RNTI rendering integration test for mobile auth guard — `computeAuthRedirect` tests cover all logic branches; rendered component test deferred

## Next Steps

Agree the next track with the user. Candidates:
- Eupago PSP verifier (`PaymentWebhookVerifier` for Eupago — POST + HMAC)
- Password reset / forgot-password flow
- Shelter verification workflow (admin approves draft → verified)
