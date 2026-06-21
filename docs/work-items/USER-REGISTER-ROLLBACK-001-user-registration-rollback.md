# USER-REGISTER-ROLLBACK-001 — Auth User Rollback on Profile RPC Failure

## Goal

Fix the orphaned-auth-user risk in the two-step registration flow. If
`auth.admin.createUser()` succeeds but the `register_user` RPC then fails (e.g. DB
constraint, transient error), a best-effort `auth.admin.deleteUser(authUserId)` rollback
is attempted before re-throwing the original error. Without this, a user who hits a
transient failure is permanently stuck: subsequent retries return `email_already_registered`
even though no profile row was ever created.

## States

No new UI states. Change is confined to `apps/workers/src/user-register-supabase.ts`.

## Contract

`UserRegistrationSupabaseClientLike` gains `auth.admin.deleteUser`:

```ts
type UserRegistrationSupabaseClientLike = Pick<SupabaseClientLike, 'rpc'> & {
  auth: {
    admin: {
      createUser: (params: AdminCreateUserParams) => Promise<AdminCreateUserResult>;
      deleteUser: (id: string) => Promise<{ error: { message?: string } | null }>;
    };
  };
};
```

Rollback semantics:
- Called only when the profile RPC fails and `authUserId` is known.
- Best-effort: if `deleteUser` itself throws, the error is swallowed and the original
  profile error is still re-thrown.
- Not called when `createUser` fails (no auth user was created) or when `authUserId`
  is missing (no ID to delete).

## Dependencies

- `USER-REGISTER-WORKER-001` (merged, PR #229) — implementation being patched.

## Affected files

- `docs/work-items/USER-REGISTER-ROLLBACK-001-user-registration-rollback.md` (this file)
- `apps/workers/src/user-register-supabase.ts` (add deleteUser type + rollback)
- `tests/workers/user-register.test.ts` (add deleteUser mock + 3 new tests)

## Acceptance criteria

- `deleteUser(authUserId)` is called when the profile RPC fails
- The original `SupabaseUserRegistrationRepositoryError` is still thrown even if rollback also fails
- `deleteUser` is NOT called when `createUser` fails (step 1 failure)
- `deleteUser` is NOT called on a successful registration
