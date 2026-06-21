# Checkpoint: Shelter Verification Complete (2026-06-21)

**Main branch HEAD**: PR #212 (`SHELTER-VERIFY-WEB-001` + `SHELTER-VERIFY-MOBILE-001`) — `0bb885d`
**Tests**: 2031 passing (249 files)
**Validation**: typecheck ✅ · lint ✅ · test ✅ · build ✅
**Last audit**: `2026-06-21-sdd-audit-prs-209-212.md` — score 9/10, no open P1 findings

## What Is Complete

All work items from the `docs/work-tracks/remake-foundation.md` track are done.
Six tracks are complete:

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

**Track F — Shelter verification (PRs #211 + #212)**
- `SHELTER-VERIFY-001` (PR #211): `PATCH /shelters/:shelterId/verification`; `ShelterVerificationTargetStatus`
  (`pending_review | verified | rejected | suspended`); `canVerifyShelter` domain guard
  (admin-only: `actor.role === 'admin'`); shelter owner can only set `pending_review`;
  Supabase repository updates `verification_status`; route registered before profile matcher
  in `apps/workers/src/routes/shelters.ts`; `matchWorkerShelterVerificationId` matcher
- `SHELTER-VERIFY-WEB-001` (PR #212): `createWebShelterVerifyUi` with `getInitialState()` +
  `updateVerificationStatus()`; Web page at `/abrigos/:shelterId/verificar`; dual-role panel
  (shelter owner: submit for review; admin: verify/reject/suspend); PT-PT copy; `sanitizeReasons`
  on all failure branches
- `SHELTER-VERIFY-MOBILE-001` (PR #212): `createMobileShelterVerifyUi`; React Native screen
  at `abrigos/:shelterId/verificar`; `ScrollView` layout; teal/dark colour scheme;
  `mobileSupabaseClient` singleton; same PT-PT copy and sanitization as web boundary
- `createShelterVerificationClient` added to `@pic4paws/client`; `ShelterVerificationTargetStatus`
  and `UpdateVerificationClientResult` types exported

## Key Architecture Reminders

- Mobile Supabase: always use `mobileSupabaseClient` from `apps/mobile/src/supabase.ts` (singleton)
- Web middleware: `getUser()` not `getSession()` — server-validates JWT
- Payment state: always driven by verified server-side webhook — `paymentWebhookVerifier` intentionally unset by factory
- Ifthenpay: `PAYMENT_WEBHOOKS_ENABLED=true` + `PAYMENT_PRIMARY_PROVIDER=ifthenpay` + `IFTHENPAY_WEBHOOK_SECRET` required to enable
- `packages/config/dist/` is gitignored — run `npm run build -w packages/config` after changing `env.ts`
- Shelter verification route ordering: `matchWorkerShelterVerificationId` is checked before `matchWorkerShelterProfileId` in `apps/workers/src/routes/shelters.ts`
- `sanitizeReasons` must be applied to ALL failure branches (not just the generic fallback); unsafeReasonMarkers: `service-role`, `bearer `, `r2-secret`
- `canVerifyShelter` requires `actor.role === 'admin'` — shelter owners can only submit `pending_review`
- Run `graphify update .` after any code change

## Known Deferred Items

- Ifthenpay failed/cancelled callback states — no work item yet
- Full RNTI rendering integration test for mobile auth guard — logic tests cover all branches; rendered test deferred
- Eupago PSP verifier (`PaymentWebhookVerifier` for Eupago — POST + HMAC) — no work item yet
- Shelter verification entry-point navigation — no link from shelter management pages to `/verificar`
- Admin pending-shelters listing — no route for admins to discover shelters in `pending_review`

## Next Steps

Agree the next track with the user. Candidates:
- Eupago PSP verifier
- Shelter verification navigation (link from shelter edit page + admin listing)
- Another audit cycle
