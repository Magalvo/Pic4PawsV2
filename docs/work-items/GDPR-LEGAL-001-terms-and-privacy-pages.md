---
id: GDPR-LEGAL-001
status: done
---

# GDPR-LEGAL-001 — GDPR Legal Pages (Terms & Privacy)

## Goal

Create the missing `/termos` (Terms of Use) and `/privacidade` (Privacy Policy) static web pages required before go-live. The `/registar` GDPR consent checkbox mentions both pages but they do not exist. Also wire `/registar`, `/termos`, and `/privacidade` as public routes in the middleware so unauthenticated users can read them during sign-up.

No Worker route, client layer, or 4-layer SDD slice is needed — these are static server components with PT-PT copy.

## States

These pages have no interactive states — they are read-only server components. The only testable outcomes are:

| Concern | Assertion |
|---|---|
| `/termos` route | Accessible to unauthenticated users (middleware public) |
| `/privacidade` route | Accessible to unauthenticated users (middleware public) |
| `/registar` route | Accessible to unauthenticated users (middleware public) |
| `/termos` content | Has PT-PT title, sections for service identification, user obligations, data protection, governing law |
| `/privacidade` content | Has PT-PT title, sections for controller identity, data collected, legal basis, retention, rights |
| `/registar` page | GDPR checkbox text links "Termos de Utilização" to `/termos` and "Política de Privacidade" to `/privacidade` |

## Contract

```ts
type GdprLegalSection = {
  heading: string;
  body: string;
};

type GdprLegalPageContent = {
  locale: 'pt-PT';
  title: string;
  lastUpdated: string;
  sections: GdprLegalSection[];
};

export const termosContent: GdprLegalPageContent;
export const privacidadeContent: GdprLegalPageContent;
```

## Affected files

- `docs/work-items/GDPR-LEGAL-001-terms-and-privacy-pages.md` (this file)
- `apps/web/src/gdpr-legal.ts` (new — content module)
- `apps/web/app/termos/page.tsx` (new — static server component)
- `apps/web/app/privacidade/page.tsx` (new — static server component)
- `apps/web/middleware.ts` (update — add `/termos`, `/privacidade`, `/registar` as public routes)
- `apps/web/app/registar/page.tsx` (update — link GDPR checkbox text to the two pages)
- `tests/web/middleware.test.ts` (update — 3 new public-route pass-through tests)
- `tests/web/gdpr-legal-pages.test.ts` (new — content module tests)

## Acceptance criteria

- [x] `termosContent.locale` is `'pt-PT'`
- [x] `termosContent` has required sections: identification, obligations, data protection, governing law
- [x] `privacidadeContent.locale` is `'pt-PT'`
- [x] `privacidadeContent` has required sections: controller, data collected, legal basis, retention, rights
- [x] Unauthenticated request to `/termos` passes through middleware (not redirected)
- [x] Unauthenticated request to `/privacidade` passes through middleware (not redirected)
- [x] Unauthenticated request to `/registar` passes through middleware (not redirected)
- [x] `/registar` GDPR label includes href links to `/termos` and `/privacidade`
- [x] No mojibake in PT-PT copy
- [x] `npm run typecheck`, `lint`, `test`, `build` all pass
