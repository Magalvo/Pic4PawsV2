# Handoff — Pic4Paws V2

Last updated: 2026-06-18  
main HEAD: `236d584` (PR #182 merged)  
Test suite: 1794 tests, 228 files — all green

---

## What was just completed

A full pass of screen wiring across mobile (Expo Router) and web (Next.js App Router). Every route listed below has a mobile `.tsx`, a web `page.tsx`, boundary-contract tests, and a work-item doc.

| Route | Mobile | Web |
|---|---|---|
| `/` | `app/index.tsx` | `app/page.tsx` |
| `/entrar` | `app/entrar.tsx` | `app/entrar/page.tsx` |
| `/animais` | `app/animais/index.tsx` | `app/animais/page.tsx` |
| `/animais/[petId]` | `app/animais/[petId]/index.tsx` | `app/animais/[petId]/page.tsx` |
| `/animais/[petId]/adotar` | `app/animais/[petId]/adotar.tsx` | `app/animais/[petId]/adotar/page.tsx` |
| `/animais/[petId]/historico` | `app/animais/[petId]/historico.tsx` | `app/animais/[petId]/historico/page.tsx` |
| `/abrigos` | `app/abrigos/index.tsx` | `app/abrigos/page.tsx` |
| `/abrigos/registar` | `app/abrigos/registar.tsx` | `app/abrigos/registar/page.tsx` |
| `/abrigos/[shelterId]` | `app/abrigos/[shelterId]/index.tsx` | `app/abrigos/[shelterId]/page.tsx` |
| `/abrigos/[shelterId]/editar` | `app/abrigos/[shelterId]/editar.tsx` | `app/abrigos/[shelterId]/editar/page.tsx` |
| `/abrigos/[shelterId]/eliminar` | `app/abrigos/[shelterId]/eliminar.tsx` | `app/abrigos/[shelterId]/eliminar/page.tsx` |
| `/abrigos/[shelterId]/financeiro` | `app/abrigos/[shelterId]/financeiro.tsx` | `app/abrigos/[shelterId]/financeiro/page.tsx` |
| `/abrigos/[shelterId]/membros` | `app/abrigos/[shelterId]/membros.tsx` | `app/abrigos/[shelterId]/membros/page.tsx` |
| `/abrigos/[shelterId]/animais` | `app/abrigos/[shelterId]/animais.tsx` | `app/abrigos/[shelterId]/animais/page.tsx` |
| `/abrigos/[shelterId]/candidaturas` | `app/abrigos/[shelterId]/candidaturas.tsx` | `app/abrigos/[shelterId]/candidaturas/page.tsx` |
| `/abrigos/[shelterId]/candidaturas/[applicationId]` | `app/abrigos/[shelterId]/candidaturas/[applicationId].tsx` | `app/abrigos/[shelterId]/candidaturas/[applicationId]/page.tsx` |
| `/abrigos/[shelterId]/doacoes` | `app/abrigos/[shelterId]/doacoes.tsx` | `app/abrigos/[shelterId]/doacoes/page.tsx` |
| `/abrigos/[shelterId]/patrocinios` | `app/abrigos/[shelterId]/patrocinios.tsx` | `app/abrigos/[shelterId]/patrocinios/page.tsx` |
| `/abrigos/[shelterId]/apadrinhar` | `app/abrigos/[shelterId]/apadrinhar.tsx` | `app/abrigos/[shelterId]/apadrinhar/page.tsx` |
| `/abrigos/[shelterId]/doar` | `app/abrigos/[shelterId]/doar.tsx` | `app/abrigos/[shelterId]/doar/page.tsx` |
| `/adocoes` | `app/adocoes/index.tsx` | `app/adocoes/page.tsx` |
| `/adocoes/[applicationId]` | `app/adocoes/[applicationId].tsx` | `app/adocoes/[applicationId]/page.tsx` |
| `/doacoes/[donationId]` | `app/doacoes/[donationId].tsx` | `app/doacoes/[donationId]/page.tsx` |
| `/patrocinios` | `app/patrocinios/index.tsx` | `app/patrocinios/page.tsx` |
| `/patrocinios/[sponsorshipId]` | `app/patrocinios/[sponsorshipId].tsx` | `app/patrocinios/[sponsorshipId]/page.tsx` |
| `/notificacoes` | `app/notificacoes/index.tsx` | `app/notificacoes/page.tsx` |
| `/notificacoes/preferencias` | `app/notificacoes/preferencias.tsx` | `app/notificacoes/preferencias/page.tsx` |

---

## What's next — Track D (pet management screens)

The UI modules exist in `apps/mobile/src/` and `apps/web/src/` but have no screens yet. These are shelter-manager flows for creating and publishing pets.

**Recommended order:**

### 1. PET-ARCHIVE-SCREEN-001 (simplest)
- UI modules: `pet-archive.ts` (mobile + web)
- Routes: `/animais/[petId]/arquivar`
- Pattern: single-action confirmation flow; IDLE constant; on success redirect to `/abrigos/[shelterId]/animais`
- Branch: `agent/PET-ARCHIVE-SCREEN-001`

### 2. PET-PUBLISH-SCREEN-001
- UI modules: `pet-publish.ts` (mobile + web)
- Routes: `/animais/[petId]/publicar`
- Pattern: same single-action flow as archive
- Branch: `agent/PET-PUBLISH-SCREEN-001`

### 3. PET-DRAFT-SCREENS-001 (most complex — do together)
- UI modules: `pet-draft.ts`, `pet-draft-save-flow.ts`, `pet-media-upload.ts`
- Routes: `/animais/novo` (create draft) + `/animais/[petId]/editar` (edit draft) + `/animais/[petId]/media` (upload media)
- These three are tightly coupled; tackle in one branch
- Branch: `agent/PET-DRAFT-SCREENS-001`

---

## Screen implementation pattern

### Mobile (`apps/mobile/app/<route>.tsx`)

```tsx
import { useState, useCallback } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { createClient } from '@supabase/supabase-js';
import { createXxxClient } from '@pic4paws/client';
import { createMobileXxxUi, type MobileXxxState } from '../../src/xxx';
import { workerUrl, supabaseUrl, supabaseAnonKey } from '../../src/env';

// For multi-step flows only:
const IDLE: MobileXxxIdleState = { state: 'idle', title: '...', ... };

export default function XxxScreen() {
  const { paramId } = useLocalSearchParams<{ paramId: string }>();
  const [viewModel, setViewModel] = useState<MobileXxxState | null>(null);

  const makeUi = useCallback(() => {
    const supabase = createClient(supabaseUrl(), supabaseAnonKey());
    const getAccessToken = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token ?? null;
    };
    return createMobileXxxUi({ xxxClient: createXxxClient({ workerBaseUrl: workerUrl(), ... getAccessToken, fetch: globalThis.fetch }) });
  }, []);

  // load on mount, render loading → forbidden → failed → loaded
}
```

Import depth from `apps/mobile/app/<route>.tsx` to `apps/mobile/src/`: always `../../src/` for top-level routes, `../../../src/` for one level of nesting, etc.

### Web (`apps/web/app/<route>/page.tsx`)

```tsx
'use client';
import { useState, useEffect, use } from 'react';
import { createSupabaseBrowserClient } from '../../src/supabase-browser'; // adjust depth
import { createXxxClient } from '@pic4paws/client';
import { createWebXxxUi } from '../../src/xxx';
import { workerUrl } from '../../src/env';

export default function XxxPage({ params }: { params: Promise<{ paramId: string }> }) {
  const { paramId } = use(params); // not useParams — use React's use()
  ...
}
```

Import depth rule: count directory levels from the page file back to `apps/web/`, then append `src/`.
- `app/notificacoes/page.tsx` → `../../src/` (2 levels)
- `app/notificacoes/preferencias/page.tsx` → `../../../src/` (3 levels)
- `app/animais/[petId]/historico/page.tsx` → `../../../../src/` (4 levels)

### Work-item doc (`docs/work-items/<ID>-screen.md`)

Required frontmatter + sections or `node scripts/check-work-items.mjs` will fail:

```markdown
---
id: XXX-SCREEN-001
title: ...
status: done
---

# Work-Item: XXX-SCREEN-001 — ...

## Goal
## States
## Affected Files
## Contract
## Completion Notes
```

---

## Known type gotchas (CI catches these, vitest does not)

Always run `npx tsc --noEmit -p tests/tsconfig.json` before pushing.

| Client type | Common mistake | Correct shape |
|---|---|---|
| `NotificationSummary` | `read: boolean` | `readAt: string \| null` |
| `ListNotificationsClientSuccess` | missing `unreadCount` | `{ ok, status: 'ok', notifications, total, unreadCount }` |
| `MarkNotificationReadClientSuccess` | `status: 'ok'` | `status: 'notification_marked_read'` |
| `LoadPetStatusHistoryClientSuccess` | missing `petId` | `{ ok, status: 'ok', petId, events }` |
| `SponsorshipClientInput` | missing `dataProcessingAccepted` | `dataProcessingAccepted: true` required |
| `SponsorshipClientSuccess` | `{ sponsorshipId, amountCents }` only | also needs `currency`, `recurringInterval`, `shelterId`, `createdAt` |
| `FinancialsClientSummary.sponsorships` | `monthlyTotalCents`, `byStatus` | `activeTotalCents`, `pausedCount`, `cancelledCount` — no `byStatus` |
| `DeleteShelterClientSuccess` | `status: 'ok'` | `status: 'deleted'` |
| `XxxForbiddenState` (pet-status-history) | `viewModel.message` | no `message` field — use hardcoded PT-PT string |

---

## Validation checklist before every commit

```sh
npx tsc --noEmit -p tests/tsconfig.json   # test mock types (CI runs this)
npx tsc --noEmit                           # from apps/mobile/ and apps/web/
npm run test                               # must stay at 1794 passing
node scripts/check-work-items.mjs          # SDD doc compliance
```
