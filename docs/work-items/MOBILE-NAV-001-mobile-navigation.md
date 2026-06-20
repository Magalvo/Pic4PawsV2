---
id: MOBILE-NAV-001
title: Mobile navigation — root layout, auth routing, tab bar
status: done
---

# Work-Item: MOBILE-NAV-001 — Mobile Navigation

## Goal

Give the mobile app a navigation shell: a root layout that checks the Supabase session
and routes the user to either the auth stack (`/entrar`) or the app stack (5-tab bar).
Unauthenticated access to any protected screen redirects to `/entrar?returnTo=<path>`.
After sign-in the user lands on their original destination (or `/animais` as fallback).

## Tab bar (5 tabs, in order)

| Tab | Label (PT-PT) | Root screen |
|---|---|---|
| 1 | Animais | `(tabs)/animais/index.tsx` |
| 2 | Adoções | `(tabs)/adocoes/index.tsx` |
| 3 | Patrocínios | `(tabs)/patrocinios/index.tsx` |
| 4 | Abrigos | `(tabs)/abrigos/index.tsx` |
| 5 | Notificações | `(tabs)/notificacoes/index.tsx` |

## Public screens (no auth required)

- `/entrar` — auth stack
- `/animais` — tab root (public browse)
- `/animais/[petId]` — public pet detail

All other screens require a valid in-memory session.

## States

The root layout tracks three states:

- `loading` — session check in flight; render `null` (or a splash) to avoid flicker
- `unauthenticated` — render only the `(auth)` segment; redirect any non-auth path
  to `/(auth)/entrar?returnTo=<current-path>`
- `authenticated` — render the `(app)` segment with tab bar

## Contract

### `apps/mobile/app/_layout.tsx` — Root layout

```ts
// On mount: call supabase.auth.getSession() to get initial state.
// Subscribe to supabase.auth.onAuthStateChange for live updates.
// Unsubscribe on unmount.
// Session is kept in component state (never AsyncStorage — persistSession: false).
// Renders <Slot /> while loading.
// Uses expo-router `useSegments` + `useRouter` to enforce routing:
//   - If unauthenticated and not in (auth) group → router.replace('/(auth)/entrar?returnTo=...')
//   - If authenticated and in (auth) group → router.replace(returnTo or '/(tabs)/animais')
// The supabase client is created once with { auth: { persistSession: false } }.
```

### `apps/mobile/app/(auth)/_layout.tsx`

Simple `<Stack screenOptions={{ headerShown: false }} />` — no session check needed
(root layout guards this already).

### `apps/mobile/app/(auth)/entrar.tsx` — moved from `app/entrar.tsx`

- Reads `returnTo` from `useLocalSearchParams()`.
- On `signed_in` result from `ui.signIn(...)`: calls
  `router.replace(validatedReturnTo ?? '/(tabs)/animais')`.
- Validation: must start with `/` and not be `/entrar`.
- Rest of the screen is unchanged from the existing implementation.

### `apps/mobile/app/(app)/_layout.tsx`

Simple `<Stack screenOptions={{ headerShown: false }} />`. The root layout already
enforces session; this layout exists so deeper screens (detail views, forms) are
stacked above the tab bar rather than replacing it.

### `apps/mobile/app/(app)/(tabs)/_layout.tsx`

```ts
// <Tabs> with 5 TabsTrigger entries (expo-router Tabs API):
//   animais, adocoes, patrocinios, abrigos, notificacoes
// Labels in PT-PT. Icons to be added in the UI polish track.
// tabBarStyle: visible on tab root screens only (default Expo Router Tabs behaviour).
```

### File moves (URL paths are unchanged — route groups are transparent)

| From | To | URL |
|---|---|---|
| `app/entrar.tsx` | `app/(auth)/entrar.tsx` | `/entrar` |
| `app/animais/index.tsx` | `app/(app)/(tabs)/animais/index.tsx` | `/animais` |
| `app/adocoes/index.tsx` | `app/(app)/(tabs)/adocoes/index.tsx` | `/adocoes` |
| `app/patrocinios/index.tsx` | `app/(app)/(tabs)/patrocinios/index.tsx` | `/patrocinios` |
| `app/abrigos/index.tsx` | `app/(app)/(tabs)/abrigos/index.tsx` | `/abrigos` |
| `app/notificacoes/index.tsx` | `app/(app)/(tabs)/notificacoes/index.tsx` | `/notificacoes` |

All other screens (`animais/[petId]/`, `abrigos/[shelterId]/`, etc.) remain in their
current locations. They are wrapped by the root `_layout.tsx` and are therefore
protected by the session guard.

### `apps/mobile/app/index.tsx`

Replace the existing dev foundation screen with a redirect to `/(tabs)/animais`.
Expo Router resolves `/` to `index.tsx`; the root layout's guard will redirect
unauthenticated users to `/entrar` before this screen ever renders.

## Affected Files

- `docs/work-items/MOBILE-NAV-001-mobile-navigation.md` (this file)
- `apps/mobile/app/_layout.tsx` — new root layout (session guard + routing)
- `apps/mobile/app/(auth)/_layout.tsx` — new auth stack layout
- `apps/mobile/app/(auth)/entrar.tsx` — moved from `app/entrar.tsx` + returnTo redirect
- `apps/mobile/app/(app)/_layout.tsx` — new app stack layout
- `apps/mobile/app/(app)/(tabs)/_layout.tsx` — new tab bar (5 tabs)
- `apps/mobile/app/(app)/(tabs)/animais/index.tsx` — moved from `app/animais/index.tsx`
- `apps/mobile/app/(app)/(tabs)/adocoes/index.tsx` — moved from `app/adocoes/index.tsx`
- `apps/mobile/app/(app)/(tabs)/patrocinios/index.tsx` — moved from `app/patrocinios/index.tsx`
- `apps/mobile/app/(app)/(tabs)/abrigos/index.tsx` — moved from `app/abrigos/index.tsx`
- `apps/mobile/app/(app)/(tabs)/notificacoes/index.tsx` — moved from `app/notificacoes/index.tsx`
- `apps/mobile/app/index.tsx` — replace with redirect to `/(tabs)/animais`
- `tests/mobile/auth-screen.test.ts` — extend with returnTo redirect assertion
