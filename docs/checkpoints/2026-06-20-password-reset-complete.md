# Checkpoint: Password Reset Complete (2026-06-20)

**Main branch HEAD**: PR #208 (`PASSWD-RESET-MOBILE-001`) — `9b7307f`
**Tests**: 1979 passing (246 files)
**Validation**: typecheck ✅ · lint ✅ · test ✅ · build ✅
**Last audit**: `2026-06-20-sdd-audit-prs-205-208.md` — score 9/10, no open P1 findings

## What Is Complete

All work items from the `docs/work-tracks/remake-foundation.md` track are done.
Five tracks are complete:

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
- Method enforcement: Ifthenpay=GET, Eupago/Stripe=POST; 405 on wrong method

**Track C — Mobile auth guard routing (PRs #203 + #205)**
- `MOBILE-AUTH-GUARD-001`: `computeAuthRedirect` extracted from `_layout.tsx` to `nav.ts`; 23 tests
- `MOBILE-ABRIGOS-PUBLIC-001`: `/abrigos` and `/abrigos/[shelterId]` added as public routes on
  mobile, matching web middleware parity; 7 tests

**Track E — Password reset (PRs #207 + #208)**
- `PASSWD-RESET-WEB-001`: `/recuperar-palavra-passe` (email request) and
  `/recuperar-palavra-passe/confirmar` (PKCE code exchange + new password form)
- `PASSWD-RESET-MOBILE-001`: `(auth)/recuperar-palavra-passe` screen (email request only;
  confirm step completes on web via email link)
- Both web routes public in middleware; mobile uses `mobileSupabaseClient` singleton

## Key Architecture Reminders

- Mobile Supabase: always use `mobileSupabaseClient` from `apps/mobile/src/supabase.ts` (singleton)
- Web middleware: `getUser()` not `getSession()` — server-validates JWT
- Payment state: always driven by verified server-side webhook — `paymentWebhookVerifier` intentionally unset by factory
- Ifthenpay: `PAYMENT_WEBHOOKS_ENABLED=true` + `PAYMENT_PRIMARY_PROVIDER=ifthenpay` + `IFTHENPAY_WEBHOOK_SECRET` required to enable
- `packages/config/dist/` is gitignored — run `npm run build -w packages/config` after changing `env.ts`
- Mobile password reset `redirectTo`: built from `EXPO_PUBLIC_WEB_BASE_URL ?? 'https://pic4paws.pt'`
- `WebPasswordConfirmViewModel` has no `updating` variant — page uses separate `submitting` boolean
- Run `graphify update .` after any code change

## Known Deferred Items

- Ifthenpay failed/cancelled callback states — no work item yet
- Full RNTI rendering integration test for mobile auth guard — logic tests cover all branches; rendered test deferred
- Eupago PSP verifier (`PaymentWebhookVerifier` for Eupago — POST + HMAC) — no work item yet

## Next Steps

Agree the next track with the user. Candidates:
- Eupago PSP verifier
- Shelter verification workflow (admin approves draft → verified)
- Pet feed filters enhancements (`PET-FEED-FILTERS-001` follow-on)
