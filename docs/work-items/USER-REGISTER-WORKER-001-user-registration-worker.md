---
id: USER-REGISTER-WORKER-001
status: in-progress
---

# USER-REGISTER-WORKER-001 — User Registration Worker Route

## Goal

Add a public `POST /users/register` worker route that creates a Supabase auth user and
a matching `users` profile row atomically via the `register_user` database RPC function.
No bearer token is required — this is the entry point for new adopters signing up.

## States

No new UI states are introduced in this work item. The worker exposes a single endpoint;
boundary states will be defined in `USER-REGISTER-CLIENT-001` and subsequent work items.

## Contract

`POST /users/register` — public, no `Authorization` header required.

**Request body** (JSON):
```json
{
  "email": "utilizador@exemplo.pt",
  "password": "<senha-minimo-8-caracteres>",
  "displayName": "Maria Silva",
  "gdprConsentVersion": "v1"
}
```

**Responses:**
| Status | Body `status` | Condition |
|---|---|---|
| 201 | `created` | User and profile row created successfully |
| 400 | `invalid_payload` + `reasons[]` | Missing/invalid fields |
| 405 | `method_not_allowed` | Non-POST request |
| 409 | `email_already_registered` | Email already in use |
| 501 | `user_registration_repository_not_configured` | DI not wired |

**Validation reasons:**
`email_required`, `email_invalid`, `password_required`, `password_too_short`
(min 8 chars), `display_name_required`, `gdpr_consent_version_required`, `invalid_body`.

## Dependencies

- `SupabaseClientLike.rpc` — already in scope, no new client type extension required.
- Supabase database function `register_user(p_email, p_password, p_display_name,
  p_gdpr_consent_version, p_gdpr_consent_accepted_at)` must exist with `SECURITY DEFINER`
  so it can write to `auth.users`. Creating this function is out of scope for this
  work item (database migration tracked separately).

## Affected files

- `docs/work-items/USER-REGISTER-WORKER-001-user-registration-worker.md` ← this file
- `apps/workers/src/user-register.ts` — handler + repository interface + validation (new)
- `apps/workers/src/user-register-supabase.ts` — Supabase RPC implementation (new)
- `apps/workers/src/routes/users.ts` — route module (new)
- `apps/workers/src/dependencies.ts` — add `userRegistrationRepository` field and wiring
- `apps/workers/src/index.ts` — add `handleUsers` to `ROUTE_HANDLERS`
- `tests/workers/user-register.test.ts` — handler + Supabase implementation tests (new)

## Acceptance criteria

- [ ] `POST /users/register` with valid payload returns 201 `{ status: 'created' }`
- [ ] Non-POST method returns 405
- [ ] Missing or malformed payload fields return 400 with specific `reasons`
- [ ] Email already registered returns 409 `{ status: 'email_already_registered' }`
- [ ] Repository not wired returns 501
- [ ] No bearer token is checked or required
- [ ] `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build` all pass
