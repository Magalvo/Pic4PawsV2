# Track H Complete — User Registration (PRs #229–#237)

Date: 2026-06-21
Tests: 2163 (258 files)
HEAD: ccc565a

Track H delivers end-to-end user account registration: worker route, client factory,
web and mobile product boundaries with pages/screens, Supabase repository implementation,
database RPC migration, and a best-effort auth rollback guard. Also includes the real
public landing page at `/`.

## Work items

- `USER-REGISTER-WORKER-001` (PR #229 batch): public `POST /users/register` route; no
  bearer token required; validates email/password/displayName/gdprConsentVersion; calls
  Supabase admin API (`auth.admin.createUser`) then `register_user` RPC; returns
  `201 created` | `409 email_already_registered` | `400 invalid_payload` | `501` repo
  not configured. Auth ladder: 405 → 400 → 501 → 409 → 201.

- `USER-REGISTER-DB-001` (PR #229 batch): `register_user` Supabase RPC migration;
  switched implementation from direct INSERT to admin API + RPC two-step pattern so
  the password never touches the DB layer.

- `USER-REGISTER-WEB-001` (PR #233): `createWebUserRegistrationUi` boundary +
  `/registar` Next.js page. States: idle/submitting/registered/failed. GDPR checkbox
  (`gdprConsentVersion: 'v1'` hardcoded). Links to `/entrar` and
  `/recuperar-palavra-passe` on `email_already_registered`. `sanitizeReasons` on
  generic failures.

- `USER-REGISTER-MOBILE-001` (PR #234): `createMobileUserRegistrationUi` boundary +
  `(auth)/registar.tsx` screen. Same state machine as web. `KeyboardAvoidingView` +
  `ScrollView` + `Pressable` GDPR checkbox (native). `router.replace('/(auth)/entrar')`
  on success.

- `WEB-LANDING-001` (PR #236): replaced dev status dashboard at `/` with a real server
  component landing page. Hero from `webFoundationContent`, two CTAs (Criar conta →
  /registar, Entrar → /entrar), three feature cards (adotantes / abrigos / padrinhos),
  privacy note. Updated `webFoundationContent.hero.eyebrow` and
  `primaryAction.href = '/registar'`.

- `USER-REGISTER-ROLLBACK-001` (PR #237): best-effort `auth.admin.deleteUser(authUserId)`
  called before re-throwing when the profile RPC fails. Swallows `deleteUser` errors so
  the original error is always surfaced. Not called on `createUser` failure or on success.

## Foundation content updates

- `webFoundationContent.hero.eyebrow`: `'Plataforma de adopção animal'`
- `webFoundationContent.primaryAction.href`: `'/registar'`
- `webFoundationContent.userRegistration` entry added (boundary content object)
- `mobileFoundationContent.userRegistration` entry added

## Production-readiness gaps closed

- User sign-up / account registration (was gap #1)
- Real home/landing page (was gap #2)

## Remaining production-readiness gaps

- GDPR legal pages — `/registar` links to Terms and Privacy pages that do not exist yet
- Payment provider env wiring — `paymentWebhookVerifier` null by factory default
- Push notification delivery — in-DB only, no APNs/FCM
- Mobile app store artifacts — EAS, icons, bundle IDs not set up
